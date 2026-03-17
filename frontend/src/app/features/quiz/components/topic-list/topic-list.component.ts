import { Component, HostListener, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { QuizService } from '../../services/quiz.service';
import { QuizTopic } from '../../models/quiz.model';
import { SearchInputComponent } from '../../../../shared/components/search-input/search-input.component';
import { matchesSearch } from '../../../../shared/utils/search-filter';
import { cachedFetch } from '../../../../shared/services/cached-fetch';

@Component({
  selector: 'app-topic-list',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchInputComponent],
  templateUrl: './topic-list.component.html'
})
export class TopicListComponent implements OnInit, OnDestroy {
  private quizService = inject(QuizService);
  private router = inject(Router);

  topics: QuizTopic[] = [];
  loading = true;
  activeTab: 'all' | 'due' = 'all';
  searchQuery = '';
  showAddForm = false;
  addName = '';
  addError = '';
  deletedTopic: QuizTopic | null = null;
  private deleteTimer: any = null;
  editingTopicId: number | null = null;
  editingName = '';
  creatingQuickNote = false;
  private quickNoteTopic: QuizTopic | null = null;
  private quickNoteCounter = 0;

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
    this.quizService.findOrCreateQuickNotes().subscribe(topic => {
      this.quickNoteTopic = topic;
    });
  }

  quickNote() {
    if (this.creatingQuickNote) return;
    this.creatingQuickNote = true;

    const create = (topic: QuizTopic) => {
      const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      this.quickNoteCounter++;
      const name = `Note ${this.quickNoteCounter} - ${today}`;
      this.quizService.createConcept(topic.id, { name }).subscribe({
        next: (concept) => {
          this.creatingQuickNote = false;
          this.router.navigate(['/quiz', topic.id, 'notes', concept.id], {
            state: { topicName: topic.name }
          });
        },
        error: () => this.creatingQuickNote = false
      });
    };

    if (this.quickNoteTopic) {
      create(this.quickNoteTopic);
    } else {
      this.quizService.findOrCreateQuickNotes().subscribe({
        next: (topic) => {
          this.quickNoteTopic = topic;
          create(topic);
        },
        error: () => this.creatingQuickNote = false
      });
    }
  }

  get filteredTopics(): QuizTopic[] {
    const tabbed = this.activeTab === 'due' ? this.topics.filter(t => this.isDue(t)) : this.topics;
    const list = tabbed.filter(t => matchesSearch(this.searchQuery, t.name, t.textbookName));
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
    if (days === 0) return 'Today';
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

  ngOnDestroy() {
    this.confirmDelete();
  }

  deleteTopic(topic: QuizTopic, event: Event) {
    event.stopPropagation();
    this.confirmDelete();
    this.topics = this.topics.filter(t => t.id !== topic.id);
    this.deletedTopic = topic;
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
