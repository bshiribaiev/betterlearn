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

  quality = 0;
  termCount = 0;
  topicName = '';
  conceptName = '';
  topicId = 0;

  get subtitle(): string {
    return [this.topicName, this.conceptName].filter(Boolean).join(' — ');
  }

  get ratingLabel(): string {
    return { 1: 'Again', 2: 'Hard', 3: 'Good', 5: 'Easy' }[this.quality] ?? 'Rated';
  }

  get ratingColor(): string {
    return {
      1: 'text-red-500',
      2: 'text-orange-500',
      3: 'text-sky-500',
      5: 'text-emerald-500',
    }[this.quality] ?? 'text-gray-500';
  }

  ngOnInit() {
    const state = history.state;
    if (!state?.quality) {
      this.router.navigate(['/quiz']);
      return;
    }
    this.quality = state.quality;
    this.termCount = state.termCount || 0;
    this.topicName = state.topicName || '';
    this.conceptName = state.conceptName || '';
    this.topicId = state.topicId || 0;
  }
}
