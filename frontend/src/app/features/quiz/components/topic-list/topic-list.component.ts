import { Component, HostListener, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { QuizService } from '../../services/quiz.service';
import { QuizTopic, QuizSession } from '../../models/quiz.model';

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
  activeTab: 'due' | 'all' = 'due';
  showAddForm = false;
  addName = '';
  addError = '';
  expandedTopicId: number | null = null;
  sessionHistory: QuizSession[] = [];
  generatingTopicId: number | null = null;
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
    this.quizService.findAll().subscribe(topics => {
      this.topics = topics;
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
    if (days === 0) return 'text-blue-600';
    if (days === 1) return 'text-orange-500';
    if (days <= 3) return 'text-violet-500';
    return 'text-gray-500';
  }

  statusLabel(topic: QuizTopic): string {
    return { 'new': 'New', 'learning': 'Learning', 'review': 'Review', 'mastered': 'Mastered' }[topic.status] ?? 'New';
  }

  statusColor(topic: QuizTopic): string {
    return {
      'new': 'text-gray-400',
      'learning': 'text-amber-500',
      'review': 'text-blue-500',
      'mastered': 'text-emerald-500'
    }[topic.status] ?? 'text-gray-400';
  }

  toggleExpand(topic: QuizTopic, event: Event) {
    event.stopPropagation();
    if (this.expandedTopicId === topic.id) {
      this.expandedTopicId = null;
      return;
    }
    this.expandedTopicId = topic.id;
    this.sessionHistory = [];
    this.quizService.getSessions(topic.id).subscribe(sessions => {
      this.sessionHistory = sessions;
    });
  }

  generateQuiz(topic: QuizTopic, event: Event) {
    event.stopPropagation();
    this.generatingTopicId = topic.id;
    this.quizService.generate(topic.id).subscribe({
      next: (res) => {
        this.generatingTopicId = null;
        this.router.navigate(['/quiz', topic.id, 'session'], {
          state: { questions: res.questions, topicName: topic.name }
        });
      },
      error: () => this.generatingTopicId = null
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
    this.quizService.delete(this.deletedTopic.id).subscribe();
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

    this.quizService.create(this.addName.trim()).subscribe({
      next: () => {
        this.showAddForm = false;
        this.addName = '';
        this.loadTopics();
      },
      error: (err) => this.addError = err.error?.detail || 'Failed to add topic'
    });
  }

  qualityLabel(quality: number): string {
    return { 0: 'Fail', 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Great', 5: 'Perfect' }[quality] ?? `Q${quality}`;
  }

  qualityColor(quality: number): string {
    if (quality <= 1) return 'text-red-500';
    if (quality <= 2) return 'text-orange-500';
    if (quality <= 3) return 'text-blue-500';
    return 'text-emerald-500';
  }
}
