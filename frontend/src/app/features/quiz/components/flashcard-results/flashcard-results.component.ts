import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-flashcard-results',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './flashcard-results.component.html'
})
export class FlashcardResultsComponent implements OnInit {
  private router = inject(Router);

  correctCount = 0;
  termCount = 0;
  topicName = '';
  conceptName = '';
  topicId = 0;

  get subtitle(): string {
    return [this.topicName, this.conceptName].filter(Boolean).join(' — ');
  }

  get scorePercent(): number {
    return this.termCount > 0 ? Math.round((this.correctCount / this.termCount) * 100) : 0;
  }

  get scoreColor(): string {
    const pct = this.scorePercent;
    if (pct >= 90) return 'text-emerald-500';
    if (pct >= 70) return 'text-sky-500';
    if (pct >= 50) return 'text-amber-500';
    return 'text-red-500';
  }

  ngOnInit() {
    const state = history.state;
    if (state?.correctCount == null) {
      this.router.navigate(['/quiz']);
      return;
    }
    this.correctCount = state.correctCount;
    this.termCount = state.termCount || 0;
    this.topicName = state.topicName || '';
    this.conceptName = state.conceptName || '';
    this.topicId = state.topicId || 0;
  }
}
