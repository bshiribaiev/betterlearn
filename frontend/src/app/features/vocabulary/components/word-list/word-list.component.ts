import { Component, EventEmitter, HostListener, inject, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VocabularyService } from '../../services/vocabulary.service';
import { Word, WordGroup } from '../../models/vocabulary.model';
import { cachedFetch } from '../../../../shared/services/cached-fetch';

@Component({
  selector: 'app-word-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './word-list.component.html'
})
export class WordListComponent implements OnInit {
  private vocabService = inject(VocabularyService);
  private router = inject(Router);

  @Input() topicId!: number;
  @Input() topicName = '';
  @Input() showToolbar = true;
  @Output() loaded = new EventEmitter<void>();

  groups: WordGroup[] = [];
  loading = true;
  activeTab: 'due' | 'all' = 'due';
  expandedDate: string | null = null;
  generatingLabelDate: string | null = null;

  showAddForm = false;
  addWord = '';
  addError = '';

  deletedWord: Word | null = null;
  private deleteTimer: any = null;

  generatingQuizDate: string | null = null;
  confidenceMenuDate: string | null = null;

  ratingOptions = [
    { label: 'Bad', quality: 1, color: 'text-red-500' },
    { label: 'Good', quality: 3, color: 'text-amber-500' },
    { label: 'Great', quality: 5, color: 'text-emerald-500' },
  ];

  @HostListener('document:click')
  closeMenus() {
    this.showAddForm = false;
    this.confidenceMenuDate = null;
  }

  ngOnInit() {
    this.loadWords();
  }

  loadWords() {
    cachedFetch(`words-${this.topicId}`, this.vocabService.findByTopicGrouped(this.topicId), groups => {
      this.groups = groups;
      this.loading = false;
      this.loaded.emit();
      if (this.showToolbar && this.activeTab === 'due' && this.totalDueCount === 0) {
        this.activeTab = 'all';
      }
    });
  }

  get filteredGroups(): WordGroup[] {
    if (this.activeTab === 'due') {
      return this.groups
        .map(g => ({ ...g, words: g.words.filter(w => this.isDue(w)) }))
        .filter(g => g.words.length > 0);
    }
    return this.groups;
  }

  isDue(word: Word): boolean {
    return this.daysUntilReview(word) <= 0;
  }

  daysUntilReview(word: Word): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const review = new Date(word.nextReview + 'T00:00:00');
    return Math.round((review.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  groupDisplayName(group: WordGroup): string {
    const date = this.formatDate(group.addedDate);
    if (group.label) return `${date} — ${group.label}`;
    return date;
  }

  groupConfidenceLabel(group: WordGroup): string {
    const statusRank: Record<string, number> = { 'new': 0, 'learning': 1, 'review': 2, 'mastered': 3 };
    const avg = group.words.reduce((sum, w) => sum + (statusRank[w.status] ?? 0), 0) / group.words.length;
    if (avg >= 2.5) return 'Great';
    if (avg >= 1.5) return 'Good';
    if (avg >= 0.5) return 'Bad';
    return 'New';
  }

  groupConfidenceColor(group: WordGroup): string {
    const label = this.groupConfidenceLabel(group);
    return {
      'New': 'text-gray-400',
      'Bad': 'text-red-500',
      'Good': 'text-amber-500',
      'Great': 'text-emerald-500'
    }[label] ?? 'text-gray-400';
  }

  groupNextReviewLabel(group: WordGroup): string {
    const earliestDate = group.words.reduce((min, w) =>
      w.nextReview < min ? w.nextReview : min, group.words[0].nextReview);
    const d = new Date(earliestDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d.getTime() <= today.getTime()) return 'Today';
    const tmr = new Date(today); tmr.setDate(tmr.getDate() + 1);
    if (d.getTime() === tmr.getTime()) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  groupNextReviewColor(group: WordGroup): string {
    if (group.dueCount > 0) return 'text-red-500';
    return 'text-gray-500';
  }

  toggleGroup(group: WordGroup) {
    if (this.expandedDate === group.addedDate) {
      this.expandedDate = null;
      return;
    }
    this.expandedDate = group.addedDate;
    if (!group.label && group.words.length >= 2) {
      this.generateLabel(group);
    }
  }

  generateLabel(group: WordGroup) {
    this.generatingLabelDate = group.addedDate;
    this.vocabService.generateGroupLabel(this.topicId, group.addedDate).subscribe({
      next: (res) => {
        group.label = res.label;
        this.generatingLabelDate = null;
      },
      error: () => this.generatingLabelDate = null
    });
  }

  startQuiz(group: WordGroup, event: Event) {
    event.stopPropagation();
    this.generatingQuizDate = group.addedDate;
    this.vocabService.generateTermQuiz(this.topicId, group.addedDate).subscribe({
      next: (res) => {
        this.generatingQuizDate = null;
        this.router.navigate(['/quiz', this.topicId, 'terms', 'session'], {
          state: {
            questions: res.questions,
            topicId: this.topicId,
            topicName: this.topicName,
            date: group.addedDate,
            groupLabel: group.label || this.formatDate(group.addedDate)
          }
        });
      },
      error: () => this.generatingQuizDate = null
    });
  }

  startQuizAll(event: Event) {
    event.stopPropagation();
    this.generatingQuizDate = '__all__';
    this.vocabService.generateTermQuiz(this.topicId, null).subscribe({
      next: (res) => {
        this.generatingQuizDate = null;
        this.router.navigate(['/quiz', this.topicId, 'terms', 'session'], {
          state: {
            questions: res.questions,
            topicId: this.topicId,
            topicName: this.topicName,
            date: null,
            groupLabel: 'All Due'
          }
        });
      },
      error: () => this.generatingQuizDate = null
    });
  }

  toggleConfidenceMenu(group: WordGroup, event: Event) {
    event.stopPropagation();
    this.confidenceMenuDate = this.confidenceMenuDate === group.addedDate ? null : group.addedDate;
  }

  rateGroup(group: WordGroup, quality: number, event: Event) {
    event.stopPropagation();
    this.confidenceMenuDate = null;
    const wordIds = group.words.map(w => w.id);
    let completed = 0;
    for (const id of wordIds) {
      this.vocabService.submitReview(id, quality).subscribe(() => {
        completed++;
        if (completed === wordIds.length) this.loadWords();
      });
    }
  }

  deleteWord(word: Word, event: Event) {
    event.stopPropagation();
    for (const group of this.groups) {
      group.words = group.words.filter(w => w.id !== word.id);
    }
    this.groups = this.groups.filter(g => g.words.length > 0);
    this.deletedWord = word;
    clearTimeout(this.deleteTimer);
    this.deleteTimer = setTimeout(() => this.confirmDelete(), 4000);
  }

  undoDelete() {
    clearTimeout(this.deleteTimer);
    if (this.deletedWord) {
      this.loadWords();
      this.deletedWord = null;
    }
  }

  private confirmDelete() {
    if (!this.deletedWord) return;
    this.vocabService.delete(this.deletedWord.id).subscribe();
    this.deletedWord = null;
  }

  toggleAddForm(event: Event) {
    event.stopPropagation();
    this.showAddForm = !this.showAddForm;
    this.addWord = '';
    this.addError = '';
  }

  submitWord(event: Event) {
    event.preventDefault();
    if (!this.addWord.trim()) return;
    this.addError = '';

    this.vocabService.create(this.topicId, { word: this.addWord.trim() }).subscribe({
      next: () => {
        this.showAddForm = false;
        this.addWord = '';
        this.loadWords();
      },
      error: (err) => this.addError = err.error?.detail || 'Failed to add word'
    });
  }

  get totalDueCount(): number {
    return this.groups.reduce((sum, g) => sum + g.dueCount, 0);
  }
}
