import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { QuizService } from '../../services/quiz.service';
import { FlashcardTerm } from '../../models/quiz.model';

@Component({
  selector: 'app-flashcard-session',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './flashcard-session.component.html'
})
export class FlashcardSessionComponent implements OnInit {
  private router = inject(Router);
  private quizService = inject(QuizService);

  terms: FlashcardTerm[] = [];
  currentIndex = 0;
  revealed = false;
  submitting = false;
  correctCount = 0;

  topicName = '';
  conceptName = '';
  conceptId = 0;
  topicId = 0;

  get subtitle(): string {
    return [this.topicName, this.conceptName].filter(Boolean).join(' — ');
  }

  ngOnInit() {
    const state = history.state;
    if (!state?.terms?.length) {
      this.router.navigate(['/quiz']);
      return;
    }
    this.topicName = state.topicName || '';
    this.conceptName = state.conceptName || '';
    this.topicId = state.topicId || 0;
    this.conceptId = Number(this.router.url.match(/concepts\/(\d+)/)?.[1] || 0);

    // Shuffle terms
    this.terms = [...state.terms].sort(() => Math.random() - 0.5);
  }

  reveal() {
    this.revealed = true;
  }

  markAndAdvance(correct: boolean) {
    if (correct) this.correctCount++;

    if (this.currentIndex < this.terms.length - 1) {
      this.currentIndex++;
      this.revealed = false;
    } else {
      this.submitResults();
    }
  }

  private submitResults() {
    this.submitting = true;
    const score = this.correctCount / this.terms.length;
    const quality = score >= 0.9 ? 5 : score >= 0.7 ? 3 : score >= 0.5 ? 2 : 1;

    this.quizService.submitFlashcardReview(this.conceptId, quality).subscribe({
      next: () => {
        this.router.navigate(['/quiz', 'concepts', this.conceptId, 'flashcard-results'], {
          state: {
            correctCount: this.correctCount,
            termCount: this.terms.length,
            topicName: this.topicName,
            conceptName: this.conceptName,
            topicId: this.topicId,
          }
        });
      },
      error: () => this.submitting = false
    });
  }
}
