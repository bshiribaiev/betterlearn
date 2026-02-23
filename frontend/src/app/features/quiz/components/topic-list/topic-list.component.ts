import { Component, HostListener, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { QuizService } from '../../services/quiz.service';
import { QuizTopic } from '../../models/quiz.model';

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
  activeTab: 'due' | 'all' = 'due';
  showAddForm = false;
  addName = '';
  addError = '';
  deletedTopic: QuizTopic | null = null;
  private deleteTimer: any = null;

  @HostListener('document:click')
  closeMenus() {
    this.showAddForm = false;
  }

  ngOnInit() {
    this.loadTopics();
  }

  loadTopics() {
    this.quizService.findAllTopics().subscribe(topics => {
      this.topics = topics;
      this.loading = false;
    });
  }

  get filteredTopics(): QuizTopic[] {
    if (this.activeTab === 'due') return this.topics.filter(t => this.isDue(t));
    return this.topics;
  }

  get dueCount(): number {
    return this.topics.filter(t => this.isDue(t)).length;
  }

  isDue(topic: QuizTopic): boolean {
    return this.daysUntilReview(topic) <= 0;
  }

  daysUntilReview(topic: QuizTopic): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const review = new Date(topic.nextReview + 'T00:00:00');
    return Math.round((review.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  nextReviewLabel(topic: QuizTopic): string {
    if (topic.status === 'new') return 'New';
    const days = this.daysUntilReview(topic);
    if (days < 0) return `${Math.abs(days)}d overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  }

  nextReviewColor(topic: QuizTopic): string {
    if (topic.status === 'new') return 'text-gray-400';
    const days = this.daysUntilReview(topic);
    if (days < 0) return 'text-red-500';
    if (days === 0) return 'text-sky-500';
    if (days === 1) return 'text-orange-500';
    if (days <= 3) return 'text-violet-500';
    return 'text-gray-500';
  }

  statusLabel(topic: QuizTopic): string {
    return { 'new': 'New', 'learning': 'Low', 'review': 'Medium', 'mastered': 'High' }[topic.status] ?? 'New';
  }

  statusColor(topic: QuizTopic): string {
    return {
      'new': 'text-gray-400',
      'learning': 'text-red-500',
      'review': 'text-amber-500',
      'mastered': 'text-emerald-500'
    }[topic.status] ?? 'text-gray-400';
  }

  openTopic(topic: QuizTopic) {
    this.router.navigate(['/quiz', topic.id, 'concepts'], {
      state: { topicName: topic.name }
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
