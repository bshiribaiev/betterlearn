import { Component, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LeetcodeService } from '../../services/leetcode.service';

@Component({
  selector: 'app-problem-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './problem-form.component.html'
})
export class ProblemFormComponent {
  private fb = inject(FormBuilder);
  private leetcodeService = inject(LeetcodeService);

  saved = output<void>();
  cancelled = output<void>();

  form = this.fb.nonNullable.group({
    url: ['', [Validators.required]],
    title: [''],
    notes: ['']
  });

  error = '';

  submit() {
    if (this.form.invalid) return;
    this.error = '';

    const value = this.form.getRawValue();
    this.leetcodeService.create({
      url: value.url,
      title: value.title || undefined,
      notes: value.notes || undefined
    }).subscribe({
      next: () => this.saved.emit(),
      error: (err) => this.error = err.error?.detail || 'Failed to add problem'
    });
  }
}
