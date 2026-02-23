import { Component, HostListener, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VocabularyService } from '../../services/vocabulary.service';
import { Word, ReviewEntry } from '../../models/vocabulary.model';

@Component({
  selector: 'app-word-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './word-list.component.html'
})
export class WordListComponent implements OnInit {
  private vocabService = inject(VocabularyService);

  words: Word[] = [];
  loading = true;
  activeTab: 'due' | 'all' = 'due';
  showAddForm = false;
  ratingMenuWord: Word | null = null;
  addWord = '';
  addError = '';
  expandedWordId: number | null = null;
  reviewHistory: ReviewEntry[] = [];
  editWord = '';
  editDefinition = '';
  deletedWord: Word | null = null;
  private deleteTimer: any = null;

  ratingOptions = [
    { label: 'Again', quality: 1, color: 'text-red-500', desc: 'Forgot' },
    { label: 'Hard', quality: 2, color: 'text-orange-500', desc: 'Struggled' },
    { label: 'Good', quality: 3, color: 'text-blue-500', desc: 'Remembered' },
    { label: 'Easy', quality: 5, color: 'text-emerald-500', desc: 'No effort' },
  ];

  @HostListener('document:click')
  closeMenus() {
    this.ratingMenuWord = null;
    this.showAddForm = false;
  }

  ngOnInit() {
    this.loadWords();
  }

  loadWords() {
    this.vocabService.findAll().subscribe(words => {
      this.words = words;
      this.loading = false;
    });
  }

  get filteredWords(): Word[] {
    if (this.activeTab === 'due') return this.words.filter(w => this.isDue(w));
    return this.words;
  }

  get dueCount(): number {
    return this.words.filter(w => this.isDue(w)).length;
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

  nextReviewLabel(word: Word): string {
    if (word.status === 'new') return 'New';
    const days = this.daysUntilReview(word);
    if (days < 0) return `${Math.abs(days)}d overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  }

  nextReviewColor(word: Word): string {
    if (word.status === 'new') return 'text-gray-400';
    const days = this.daysUntilReview(word);
    if (days < 0) return 'text-red-500';
    if (days === 0) return 'text-blue-600';
    if (days === 1) return 'text-orange-500';
    if (days <= 3) return 'text-violet-500';
    return 'text-gray-500';
  }

  statusLabel(word: Word): string {
    return { 'new': 'New', 'learning': 'Learning', 'review': 'Review', 'mastered': 'Mastered' }[word.status] ?? 'New';
  }

  statusColor(word: Word): string {
    return {
      'new': 'text-gray-400',
      'learning': 'text-amber-500',
      'review': 'text-blue-500',
      'mastered': 'text-emerald-500'
    }[word.status] ?? 'text-gray-400';
  }

  toggleRatingMenu(word: Word) {
    event?.stopPropagation();
    this.ratingMenuWord = this.ratingMenuWord?.id === word.id ? null : word;
  }

  quickRate(word: Word, quality: number) {
    this.ratingMenuWord = null;
    this.vocabService.submitReview(word.id, quality).subscribe(() => {
      this.loadWords();
    });
  }

  deleteWord(word: Word) {
    this.words = this.words.filter(w => w.id !== word.id);
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

  toggleExpand(word: Word, event: Event) {
    event.stopPropagation();
    if (this.expandedWordId === word.id) {
      this.expandedWordId = null;
      return;
    }
    this.expandedWordId = word.id;
    this.editWord = word.word;
    this.editDefinition = word.definition ?? '';
    this.reviewHistory = [];
    this.vocabService.getHistory(word.id).subscribe(history => {
      this.reviewHistory = history;
    });
  }

  saveEdit(word: Word) {
    const updates: { word?: string; definition?: string } = {};
    if (this.editWord !== word.word) updates.word = this.editWord;
    if (this.editDefinition !== word.definition) updates.definition = this.editDefinition;
    if (!Object.keys(updates).length) return;

    this.vocabService.update(word.id, updates).subscribe(() => {
      this.loadWords();
    });
  }

  qualityLabel(quality: number): string {
    return { 1: 'Again', 2: 'Hard', 3: 'Good', 5: 'Easy' }[quality] ?? `Q${quality}`;
  }

  qualityColor(quality: number): string {
    return { 1: 'text-red-500', 2: 'text-orange-500', 3: 'text-blue-500', 5: 'text-emerald-500' }[quality] ?? 'text-gray-500';
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

    this.vocabService.create({ word: this.addWord.trim() }).subscribe({
      next: () => {
        this.showAddForm = false;
        this.addWord = '';
        this.loadWords();
      },
      error: (err) => this.addError = err.error?.detail || 'Failed to add word'
    });
  }
}
