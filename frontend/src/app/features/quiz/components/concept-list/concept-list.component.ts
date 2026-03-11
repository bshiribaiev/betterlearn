import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { QuizService } from '../../services/quiz.service';
import { QuizConcept, QuizTopic, FlashcardTerm } from '../../models/quiz.model';
import { cachedFetch } from '../../../../shared/services/cached-fetch';

@Component({
  selector: 'app-concept-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './concept-list.component.html'
})
export class ConceptListComponent implements OnInit {
  private quizService = inject(QuizService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  topicId = 0;
  topicName = '';
  textbookName: string | null = null;
  textbookUrl: string | null = null;
  editingTextbook = false;
  editTextbookName = '';
  editTextbookUrl = '';
  concepts: QuizConcept[] = [];
  loading = true;
  activeTab: 'all' | 'due' = 'all';
  generatingConceptId: number | null = null;
  reschedulingConceptId: number | null = null;
  deletedConcept: QuizConcept | null = null;
  private deleteTimer: any = null;

  ngOnInit() {
    this.topicId = Number(this.route.snapshot.paramMap.get('topicId'));
    this.topicName = history.state?.topicName || '';
    this.textbookName = history.state?.textbookName ?? null;
    this.textbookUrl = history.state?.textbookUrl ?? null;
    if (!this.topicName) {
      this.loadTopicMetadata();
    }
    this.loadConcepts();

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {
      const id = Number(this.route.snapshot.paramMap.get('topicId'));
      if (id === this.topicId) this.loadConcepts();
    });
  }

  private loadTopicMetadata() {
    this.quizService.findAllTopics().subscribe(topics => {
      const topic = topics.find(t => t.id === this.topicId);
      if (topic) {
        this.topicName = topic.name;
        this.textbookName = topic.textbookName;
        this.textbookUrl = topic.textbookUrl;
      }
    });
  }

  startEditTextbook() {
    this.editingTextbook = true;
    this.editTextbookName = this.textbookName || '';
    this.editTextbookUrl = this.textbookUrl || '';
  }

  cancelEditTextbook() {
    this.editingTextbook = false;
  }

  saveTextbook() {
    const name = this.editTextbookName.trim() || null;
    const url = this.editTextbookUrl.trim() || null;
    this.quizService.updateTopic(this.topicId, {
      name: this.topicName,
      textbookName: name,
      textbookUrl: url,
    }).subscribe(updated => {
      this.textbookName = updated.textbookName;
      this.textbookUrl = updated.textbookUrl;
      this.editingTextbook = false;
    });
  }

  loadConcepts() {
    cachedFetch(`concepts-${this.topicId}`, this.quizService.findConcepts(this.topicId), concepts => {
      this.concepts = concepts;
      this.loading = false;
    });
  }

  get filteredConcepts(): QuizConcept[] {
    const list = this.activeTab === 'due' ? this.concepts.filter(c => this.isDue(c)) : this.concepts;
    return [...list].sort((a, b) => {
      const aDue = this.isDue(a) ? 0 : 1;
      const bDue = this.isDue(b) ? 0 : 1;
      return aDue - bDue;
    });
  }

  isDue(concept: QuizConcept): boolean {
    return this.daysUntilReview(concept) <= 0;
  }

  daysUntilReview(concept: QuizConcept): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const review = new Date(concept.nextReview + 'T00:00:00');
    return Math.round((review.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  lastReviewedLabel(concept: QuizConcept): string {
    if (!concept.lastReviewed) return '—';
    const date = new Date(concept.lastReviewed + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Math.round((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  nextReviewLabel(concept: QuizConcept): string {
    const days = this.daysUntilReview(concept);
    if (days === 0) return 'Due today';
    if (days === 1) return 'Tomorrow';
    const date = new Date(concept.nextReview + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  nextReviewColor(concept: QuizConcept): string {
    const days = this.daysUntilReview(concept);
    if (days <= 0) return 'text-red-500';
    return 'text-gray-500';
  }

  statusLabel(concept: QuizConcept): string {
    return { 'new': 'New', 'learning': 'Learning', 'review': 'Review', 'mastered': 'Mastered' }[concept.status] ?? 'New';
  }

  statusColor(concept: QuizConcept): string {
    return {
      'new': 'text-gray-400',
      'learning': 'text-sky-500',
      'review': 'text-amber-500',
      'mastered': 'text-emerald-500'
    }[concept.status] ?? 'text-gray-400';
  }

  setTab(tab: 'due' | 'all') {
    this.activeTab = tab;
  }

  generateQuiz(concept: QuizConcept, event: Event) {
    event.stopPropagation();
    this.generatingConceptId = concept.id;
    this.quizService.generate(concept.id).subscribe({
      next: (res) => {
        this.generatingConceptId = null;
        this.router.navigate(['/quiz', 'concepts', concept.id, 'session'], {
          state: { questions: res.questions, topicName: this.topicName, conceptName: concept.name, topicId: this.topicId }
        });
      },
      error: () => this.generatingConceptId = null
    });
  }

  hasTerms(concept: QuizConcept): boolean {
    if (!concept.terms) return false;
    try {
      const terms: FlashcardTerm[] = JSON.parse(concept.terms);
      return terms.length > 0;
    } catch {
      return false;
    }
  }

  startFlashcards(concept: QuizConcept, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/quiz', 'concepts', concept.id, 'flashcards'], {
      state: {
        terms: JSON.parse(concept.terms!),
        topicName: this.topicName,
        conceptName: concept.name,
        topicId: this.topicId,
      }
    });
  }

  // Calendar state
  calendarYear = 0;
  calendarMonth = 0;
  calendarSelectedDate = '';
  calendarDays: ({ day: number; date: string; isToday: boolean; isSelected: boolean; inMonth: boolean } | null)[] = [];

  get calendarMonthLabel(): string {
    return new Date(this.calendarYear, this.calendarMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  @HostListener('document:click')
  closeCalendar() {
    this.reschedulingConceptId = null;
  }

  startReschedule(concept: QuizConcept, event: Event) {
    event.stopPropagation();
    this.reschedulingConceptId = concept.id;
    this.calendarSelectedDate = concept.nextReview;
    const d = new Date(concept.nextReview + 'T00:00:00');
    this.calendarYear = d.getFullYear();
    this.calendarMonth = d.getMonth();
    this.buildCalendar();
  }

  calendarPrevMonth() {
    this.calendarMonth--;
    if (this.calendarMonth < 0) { this.calendarMonth = 11; this.calendarYear--; }
    this.buildCalendar();
  }

  calendarNextMonth() {
    this.calendarMonth++;
    if (this.calendarMonth > 11) { this.calendarMonth = 0; this.calendarYear++; }
    this.buildCalendar();
  }

  selectCalendarDay(concept: QuizConcept, date: string) {
    this.reschedulingConceptId = null;
    if (date === concept.nextReview) return;
    this.quizService.rescheduleConcept(concept.id, date).subscribe(updated => {
      const idx = this.concepts.findIndex(c => c.id === concept.id);
      if (idx !== -1) this.concepts[idx] = updated;
    });
  }

  todayString(): string {
    return new Date().toISOString().slice(0, 10);
  }

  tomorrowString(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  private buildCalendar() {
    const firstDay = new Date(this.calendarYear, this.calendarMonth, 1).getDay();
    const daysInMonth = new Date(this.calendarYear, this.calendarMonth + 1, 0).getDate();
    const daysInPrev = new Date(this.calendarYear, this.calendarMonth, 0).getDate();
    const today = this.todayString();
    const cells: typeof this.calendarDays = [];

    for (let i = 0; i < firstDay; i++) {
      const day = daysInPrev - firstDay + 1 + i;
      const m = this.calendarMonth - 1;
      const y = m < 0 ? this.calendarYear - 1 : this.calendarYear;
      const date = `${y}-${String((m + 12) % 12 + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({ day, date, isToday: date === today, isSelected: date === this.calendarSelectedDate, inMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${this.calendarYear}-${String(this.calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, date, isToday: date === today, isSelected: date === this.calendarSelectedDate, inMonth: true });
    }
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const m = this.calendarMonth + 1;
        const y = m > 11 ? this.calendarYear + 1 : this.calendarYear;
        const date = `${y}-${String(m % 12 + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        cells.push({ day: d, date, isToday: date === today, isSelected: date === this.calendarSelectedDate, inMonth: false });
      }
    }
    this.calendarDays = cells;
  }

  deleteConcept(concept: QuizConcept, event: Event) {
    event.stopPropagation();
    this.concepts = this.concepts.filter(c => c.id !== concept.id);
    this.deletedConcept = concept;
    clearTimeout(this.deleteTimer);
    this.deleteTimer = setTimeout(() => this.confirmDelete(), 4000);
  }

  undoDelete() {
    clearTimeout(this.deleteTimer);
    if (this.deletedConcept) {
      this.loadConcepts();
      this.deletedConcept = null;
    }
  }

  private confirmDelete() {
    if (!this.deletedConcept) return;
    this.quizService.deleteConcept(this.deletedConcept.id).subscribe();
    this.deletedConcept = null;
  }
}
