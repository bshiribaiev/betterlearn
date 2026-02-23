import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LeetcodeService } from '../../services/leetcode.service';
import { Problem } from '../../models/problem.model';
import { ProblemFormComponent } from '../problem-form/problem-form.component';
import { ReviewDialogComponent } from '../review-dialog/review-dialog.component';

@Component({
  selector: 'app-problem-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ProblemFormComponent, ReviewDialogComponent],
  templateUrl: './problem-list.component.html'
})
export class ProblemListComponent implements OnInit {
  private leetcodeService = inject(LeetcodeService);

  problems: Problem[] = [];
  showAddForm = false;
  reviewingProblem: Problem | null = null;
  filterStatus = '';

  ngOnInit() {
    this.loadProblems();
  }

  loadProblems() {
    this.leetcodeService.findAll().subscribe(problems => {
      this.problems = problems;
    });
  }

  get filteredProblems(): Problem[] {
    if (!this.filterStatus) return this.problems;
    return this.problems.filter(p => p.status === this.filterStatus);
  }

  isDue(problem: Problem): boolean {
    return new Date(problem.nextReview) <= new Date();
  }

  daysUntilReview(problem: Problem): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const review = new Date(problem.nextReview);
    review.setHours(0, 0, 0, 0);
    return Math.ceil((review.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  reviewLabel(problem: Problem): string {
    const days = this.daysUntilReview(problem);
    if (days < 0) return `Overdue by ${Math.abs(days)}d`;
    if (days === 0) return 'Due today';
    return `In ${days}d`;
  }

  onProblemAdded() {
    this.showAddForm = false;
    this.loadProblems();
  }

  onReviewSubmitted() {
    this.reviewingProblem = null;
    this.loadProblems();
  }

  deleteProblem(problem: Problem) {
    if (!confirm(`Delete "${problem.title}"?`)) return;
    this.leetcodeService.delete(problem.id).subscribe(() => this.loadProblems());
  }

  statusColor(status: string): string {
    return {
      'new': 'bg-gray-100 text-gray-600',
      'learning': 'bg-amber-50 text-amber-700',
      'review': 'bg-blue-50 text-blue-700',
      'mastered': 'bg-emerald-50 text-emerald-700'
    }[status] ?? 'bg-gray-100 text-gray-600';
  }
}
