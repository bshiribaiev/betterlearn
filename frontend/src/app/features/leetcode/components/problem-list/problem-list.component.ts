import { Component, HostListener, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeetcodeService } from '../../services/leetcode.service';
import { Problem, ReviewEntry } from '../../models/problem.model';
import { ReviewDialogComponent } from '../review-dialog/review-dialog.component';

@Component({
  selector: 'app-problem-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReviewDialogComponent],
  templateUrl: './problem-list.component.html'
})
export class ProblemListComponent implements OnInit {
  private leetcodeService = inject(LeetcodeService);

  problems: Problem[] = [];
  loading = true;
  activeTab: 'due' | 'all' = 'due';
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

  ratingOptions = [
    { label: 'Again', quality: 1, color: 'text-red-500', desc: 'Forgot' },
    { label: 'Hard', quality: 2, color: 'text-orange-500', desc: 'Struggled' },
    { label: 'Good', quality: 3, color: 'text-blue-500', desc: 'Got it' },
    { label: 'Easy', quality: 5, color: 'text-emerald-500', desc: 'No effort' },
  ];

  @HostListener('document:click')
  closeMenus() {
    this.confidenceMenuProblem = null;
    this.showAddForm = false;
  }

  ngOnInit() {
    this.loadProblems();
  }

  loadProblems() {
    this.leetcodeService.findAll().subscribe(problems => {
      this.problems = problems;
      this.loading = false;
    });
  }

  get filteredProblems(): Problem[] {
    if (this.activeTab === 'due') return this.problems.filter(p => this.isDue(p));
    return this.problems;
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
    if (days < 0) return `${Math.abs(days)}d overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  }

  nextReviewColor(problem: Problem): string {
    if (problem.status === 'new') return 'text-gray-400';
    const days = this.daysUntilReview(problem);
    if (days < 0) return 'text-red-500';
    if (days === 0) return 'text-blue-600';
    if (days === 1) return 'text-orange-500';
    if (days <= 3) return 'text-violet-500';
    return 'text-gray-500';
  }

  confidenceLabel(problem: Problem): string {
    return {
      'none': 'New',
      'low': 'Low',
      'average': 'Average',
      'high': 'High'
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
    this.problems = this.problems.filter(p => p.id !== problem.id);
    this.deletedProblem = problem;
    clearTimeout(this.deleteTimer);
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
    return { 1: 'Again', 2: 'Hard', 3: 'Good', 5: 'Easy' }[quality] ?? `Q${quality}`;
  }

  qualityColor(quality: number): string {
    return { 1: 'text-red-500', 2: 'text-orange-500', 3: 'text-blue-500', 5: 'text-emerald-500' }[quality] ?? 'text-gray-500';
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

  onReviewSubmitted() {
    this.reviewingProblem = null;
    this.loadProblems();
  }
}
