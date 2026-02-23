import { Component, HostListener, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VocabularyService } from '../../services/vocabulary.service';
import { Word } from '../../models/vocabulary.model';

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
  addWord = '';
  addError = '';
  revealedWordId: number | null = null;
  editingDefinition = false;
  editDefinitionValue = '';
  deletedWord: Word | null = null;
  private deleteTimer: any = null;

  ratingOptions = [
    { label: 'Low', quality: 1, color: 'bg-red-50 text-red-500 hover:bg-red-100', menuColor: 'text-red-500' },
    { label: 'Medium', quality: 3, color: 'bg-amber-50 text-amber-500 hover:bg-amber-100', menuColor: 'text-amber-500' },
    { label: 'High', quality: 5, color: 'bg-emerald-50 text-emerald-500 hover:bg-emerald-100', menuColor: 'text-emerald-500' },
  ];
  ratingMenuWordId: number | null = null;

  @HostListener('document:click')
  closeMenus() {
    this.showAddForm = false;
    this.ratingMenuWordId = null;
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
    if (days === 0) return 'text-sky-500';
    if (days === 1) return 'text-orange-500';
    if (days <= 3) return 'text-violet-500';
    return 'text-gray-500';
  }

  statusLabel(word: Word): string {
    return { 'new': 'New', 'learning': 'Low', 'review': 'Medium', 'mastered': 'High' }[word.status] ?? 'New';
  }

  statusColor(word: Word): string {
    return {
      'new': 'text-gray-400',
      'learning': 'text-red-500',
      'review': 'text-amber-500',
      'mastered': 'text-emerald-500'
    }[word.status] ?? 'text-gray-400';
  }

  toggleRatingMenu(word: Word, event: Event) {
    event.stopPropagation();
    this.ratingMenuWordId = this.ratingMenuWordId === word.id ? null : word.id;
  }

  quickRate(word: Word, quality: number) {
    this.ratingMenuWordId = null;
    this.vocabService.submitReview(word.id, quality).subscribe(() => {
      this.loadWords();
    });
  }

  toggleReveal(word: Word) {
    if (this.revealedWordId === word.id) {
      this.revealedWordId = null;
      this.editingDefinition = false;
    } else {
      this.revealedWordId = word.id;
      this.editingDefinition = false;
    }
  }

  startEditDefinition(word: Word) {
    this.editDefinitionValue = word.definition ?? '';
    this.editingDefinition = true;
  }

  saveDefinition(word: Word) {
    const value = this.editDefinitionValue.trim();
    if (!value) return;
    this.vocabService.update(word.id, { definition: value }).subscribe(updated => {
      word.definition = updated.definition;
      this.editingDefinition = false;
    });
  }

  rate(word: Word, quality: number) {
    this.revealedWordId = null;
    this.editingDefinition = false;
    this.vocabService.submitReview(word.id, quality).subscribe(updated => {
      this.words = this.words.map(w => w.id === word.id ? updated : w);
    });
  }

  deleteWord(word: Word, event: Event) {
    event.stopPropagation();
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
