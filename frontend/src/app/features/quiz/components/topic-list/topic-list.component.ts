import { Component, HostListener, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { QuizService } from '../../services/quiz.service';
import { QuizTopic } from '../../models/quiz.model';
import { cachedFetch } from '../../../../shared/services/cached-fetch';

@Component({
  selector: 'app-topic-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './topic-list.component.html'
})
export class TopicListComponent implements OnInit {
  private quizService = inject(QuizService);
  private router = inject(Router);

  topics: QuizTopic[] = [];
  loading = true;
  activeTab: 'all' | 'due' = 'all';
  showAddForm = false;
  addName = '';
  addError = '';
  deletedTopic: QuizTopic | null = null;
  private deleteTimer: any = null;
  editingTopicId: number | null = null;
  editingName = '';

  @HostListener('document:click')
  closeMenus() {
    this.showAddForm = false;
  }

  ngOnInit() {
    this.loadTopics();
  }

  loadTopics() {
    cachedFetch('quiz-topics', this.quizService.findAllTopics(), topics => {
      this.topics = topics;
      this.loading = false;
    });
  }

  get filteredTopics(): QuizTopic[] {
    const list = this.activeTab === 'due' ? this.topics.filter(t => this.isDue(t)) : this.topics;
    return [...list].sort((a, b) => {
      const aDue = this.isDue(a) ? 0 : 1;
      const bDue = this.isDue(b) ? 0 : 1;
      return aDue - bDue;
    });
  }

  get dueCount(): number {
    return this.topics.filter(t => this.isDue(t)).length;
  }

  isDue(topic: QuizTopic): boolean {
    return this.daysUntilReview(topic) <= 0;
  }

  daysUntilReview(topic: QuizTopic): number {
    const dateStr = topic.earliestDueDate || topic.nextReview;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const review = new Date(dateStr + 'T00:00:00');
    return Math.round((review.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  nextReviewLabel(topic: QuizTopic): string {
    if (!topic.earliestDueDate) return 'Empty';
    const days = this.daysUntilReview(topic);
    if (days < 0) return `${Math.abs(days)}d overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  }

  nextReviewColor(topic: QuizTopic): string {
    if (!topic.earliestDueDate) return 'text-gray-400';
    const days = this.daysUntilReview(topic);
    if (days <= 0) return 'text-red-500';
    return 'text-gray-500';
  }

  openTopic(topic: QuizTopic) {
    this.router.navigate(['/quiz', topic.id, 'concepts'], {
      state: { topicName: topic.name, textbookName: topic.textbookName, textbookUrl: topic.textbookUrl }
    });
  }

  deleteTopic(topic: QuizTopic, event: Event) {
    event.stopPropagation();
    this.topics = this.topics.filter(t => t.id !== topic.id);
    this.deletedTopic = topic;
    clearTimeout(this.deleteTimer);
    this.deleteTimer = setTimeout(() => this.confirmDelete(), 4000);
  }

  undoDelete() {
    clearTimeout(this.deleteTimer);
    if (this.deletedTopic) {
      this.loadTopics();
      this.deletedTopic = null;
    }
  }

  private confirmDelete() {
    if (!this.deletedTopic) return;
    this.quizService.deleteTopic(this.deletedTopic.id).subscribe();
    this.deletedTopic = null;
  }

  startRename(topic: QuizTopic, event: Event) {
    event.stopPropagation();
    this.editingTopicId = topic.id;
    this.editingName = topic.name;
  }

  submitRename(topic: QuizTopic) {
    const name = this.editingName.trim();
    if (!name || name === topic.name) {
      this.editingTopicId = null;
      return;
    }
    this.quizService.updateTopic(topic.id, { name }).subscribe({
      next: (updated) => {
        topic.name = updated.name;
        this.editingTopicId = null;
      },
      error: () => this.editingTopicId = null
    });
  }

  cancelRename() {
    this.editingTopicId = null;
  }

  toggleAddForm(event: Event) {
    event.stopPropagation();
    this.showAddForm = !this.showAddForm;
    this.addName = '';
    this.addError = '';
  }

  submitTopic(event: Event) {
    event.preventDefault();
    if (!this.addName.trim()) return;
    this.addError = '';

    this.quizService.createTopic(this.addName.trim()).subscribe({
      next: () => {
        this.showAddForm = false;
        this.addName = '';
        this.loadTopics();
      },
      error: (err) => this.addError = err.error?.detail || 'Failed to add topic'
    });
  }
}
