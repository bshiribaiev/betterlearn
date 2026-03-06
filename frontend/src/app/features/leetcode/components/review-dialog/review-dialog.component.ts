import { Component, inject, input, output } from '@angular/core';
import { Problem } from '../../models/problem.model';
import { LeetcodeService } from '../../services/leetcode.service';

@Component({
  selector: 'app-review-dialog',
  standalone: true,
  templateUrl: './review-dialog.component.html'
})
export class ReviewDialogComponent {
  private leetcodeService = inject(LeetcodeService);

  problem = input.required<Problem>();
  reviewed = output<void>();
  cancelled = output<void>();

  submitting = false;

  buttons = [
    { label: 'Bad', quality: 1, color: 'bg-red-50 text-red-600 hover:bg-red-100 border-red-100' },
    { label: 'Good', quality: 3, color: 'bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-100' },
    { label: 'Great', quality: 5, color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100' },
  ];

  submit(quality: number) {
    this.submitting = true;
    this.leetcodeService.submitReview(this.problem().id, quality).subscribe({
      next: () => this.reviewed.emit(),
      error: () => this.submitting = false
    });
  }
}
