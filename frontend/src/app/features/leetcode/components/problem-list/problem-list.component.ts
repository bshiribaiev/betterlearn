import { Component, HostListener, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeetcodeService } from '../../services/leetcode.service';
import { Problem, ReviewEntry } from '../../models/problem.model';
import { ReviewDialogComponent } from '../review-dialog/review-dialog.component';
import { cachedFetch } from '../../../../shared/services/cached-fetch';

@Component({
  selector: 'app-problem-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReviewDialogComponent],
  templateUrl: './problem-list.component.html'
})
export class ProblemListComponent implements OnInit, OnDestroy {
  private leetcodeService = inject(LeetcodeService);

  problems: Problem[] = [];
  loading = true;
  activeTab: 'all' | 'due' = 'all';
  showAddForm = false;
  reviewingProblem: Problem | null = null;
  confidenceMenuProblem: Problem | null = null;
  addUrl = '';
  addConfidence = 'average';
  addError = '';
  expandedProblemId: number | null = null;
  reviewHistory: ReviewEntry[] = [];
  editTitle = '';
  editNotes = '';
  deletedProblem: Problem | null = null;
  private deleteTimer: any = null;
  reschedulingProblemId: number | null = null;
  calendarYear = 0;
  calendarMonth = 0;
  calendarSelectedDate = '';
  calendarDays: ({ day: number; date: string; isToday: boolean; isSelected: boolean; inMonth: boolean } | null)[] = [];

  ratingOptions = [
    { label: 'Bad', quality: 1, color: 'text-red-500' },
    { label: 'Good', quality: 3, color: 'text-amber-500' },
    { label: 'Great', quality: 5, color: 'text-emerald-500' },
  ];

  @HostListener('document:click')
  closeMenus() {
    this.confidenceMenuProblem = null;
    this.showAddForm = false;
    this.reschedulingProblemId = null;
  }

  ngOnInit() {
    this.loadProblems();
  }

  loadProblems() {
    cachedFetch('leetcode-problems', this.leetcodeService.findAll(), problems => {
      this.problems = problems;
      this.loading = false;
    });
  }

  get filteredProblems(): Problem[] {
    const list = this.activeTab === 'due' ? this.problems.filter(p => this.isDue(p)) : this.problems;
    return [...list].sort((a, b) => {
      const aDue = this.isDue(a) ? 0 : 1;
      const bDue = this.isDue(b) ? 0 : 1;
      return aDue - bDue;
    });
  }

  get dueCount(): number {
    return this.problems.filter(p => this.isDue(p)).length;
  }

  isDue(problem: Problem): boolean {
    return this.daysUntilReview(problem) <= 0;
  }

  daysUntilReview(problem: Problem): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const review = new Date(problem.nextReview + 'T00:00:00');
    return Math.round((review.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  nextReviewLabel(problem: Problem): string {
    if (problem.status === 'new') return 'New';
    const days = this.daysUntilReview(problem);
    if (days === 0) return 'Due today';
    if (days === 1) return 'Tomorrow';
    const date = new Date(problem.nextReview + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  nextReviewColor(problem: Problem): string {
    if (problem.status === 'new') return 'text-gray-400';
    const days = this.daysUntilReview(problem);
    if (days <= 0) return 'text-red-500';
    return 'text-gray-500';
  }

  confidenceLabel(problem: Problem): string {
    return {
      'none': 'New',
      'low': 'Bad',
      'average': 'Good',
      'high': 'Great'
    }[problem.confidence] ?? 'New';
  }

  confidenceColor(problem: Problem): string {
    return {
      'none': 'text-gray-400',
      'low': 'text-red-500',
      'average': 'text-amber-500',
      'high': 'text-emerald-500'
    }[problem.confidence] ?? 'text-gray-400';
  }

  toggleConfidenceMenu(problem: Problem) {
    event?.stopPropagation();
    this.confidenceMenuProblem = this.confidenceMenuProblem?.id === problem.id ? null : problem;
  }

  quickRate(problem: Problem, quality: number) {
    this.confidenceMenuProblem = null;
    this.leetcodeService.submitReview(problem.id, quality).subscribe(() => {
      this.loadProblems();
    });
  }

  deleteProblem(problem: Problem) {
    this.confirmDelete();
    this.problems = this.problems.filter(p => p.id !== problem.id);
    this.deletedProblem = problem;
    this.deleteTimer = setTimeout(() => this.confirmDelete(), 4000);
  }

  undoDelete() {
    clearTimeout(this.deleteTimer);
    if (this.deletedProblem) {
      this.loadProblems();
      this.deletedProblem = null;
    }
  }

  private confirmDelete() {
    if (!this.deletedProblem) return;
    this.leetcodeService.delete(this.deletedProblem.id).subscribe();
    this.deletedProblem = null;
  }

  toggleExpand(problem: Problem, event: Event) {
    event.stopPropagation();
    if (this.expandedProblemId === problem.id) {
      this.expandedProblemId = null;
      return;
    }
    this.expandedProblemId = problem.id;
    this.editTitle = problem.title;
    this.editNotes = problem.notes ?? '';
    this.reviewHistory = [];
    this.leetcodeService.getHistory(problem.id).subscribe(history => {
      this.reviewHistory = history;
    });
  }

  saveEdit(problem: Problem) {
    const updates: { title?: string; notes?: string } = {};
    if (this.editTitle !== problem.title) updates.title = this.editTitle;
    if (this.editNotes !== (problem.notes ?? '')) updates.notes = this.editNotes;
    if (!Object.keys(updates).length) return;

    this.leetcodeService.update(problem.id, updates).subscribe(() => {
      this.loadProblems();
    });
  }

  qualityLabel(quality: number): string {
    return { 1: 'Bad', 3: 'Good', 5: 'Great' }[quality] ?? `Q${quality}`;
  }

  qualityColor(quality: number): string {
    return { 1: 'text-red-500', 3: 'text-amber-500', 5: 'text-emerald-500' }[quality] ?? 'text-gray-500';
  }

  openAndReview(problem: Problem) {
    window.open(problem.url, '_blank');
    this.reviewingProblem = problem;
  }

  toggleAddForm(event: Event) {
    event.stopPropagation();
    this.showAddForm = !this.showAddForm;
    this.addUrl = '';
    this.addConfidence = 'average';
    this.addError = '';
  }

  submitUrl(event: Event) {
    event.preventDefault();
    if (!this.addUrl.trim()) return;
    this.addError = '';

    this.leetcodeService.create({ url: this.addUrl.trim(), confidence: this.addConfidence }).subscribe({
      next: () => {
        this.showAddForm = false;
        this.addUrl = '';
        this.loadProblems();
      },
      error: (err) => this.addError = err.error?.detail || 'Failed to add problem'
    });
  }

  get calendarMonthLabel(): string {
    return new Date(this.calendarYear, this.calendarMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  startReschedule(problem: Problem, event: Event) {
    event.stopPropagation();
    this.reschedulingProblemId = problem.id;
    this.calendarSelectedDate = problem.nextReview;
    const d = new Date(problem.nextReview + 'T00:00:00');
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

  selectCalendarDay(problem: Problem, date: string) {
    this.reschedulingProblemId = null;
    if (date === problem.nextReview) return;
    this.leetcodeService.reschedule(problem.id, date).subscribe(updated => {
      const idx = this.problems.findIndex(p => p.id === problem.id);
      if (idx !== -1) this.problems[idx] = updated;
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

  ngOnDestroy() {
    this.confirmDelete();
  }

  onReviewSubmitted() {
    this.reviewingProblem = null;
    this.loadProblems();
  }
}
