import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { QuizQuestion, QuizSession } from '../../models/quiz.model';

@Component({
  selector: 'app-quiz-results',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './quiz-results.component.html'
})
export class QuizResultsComponent implements OnInit {
  private router = inject(Router);

  topicId = 0;
  topicName = '';
  conceptName = '';
  questions: QuizQuestion[] = [];
  answers: number[] = [];
  session: QuizSession | null = null;

  ngOnInit() {
    const state = history.state;
    if (!state?.session) {
      this.router.navigate(['/quiz']);
      return;
    }
    this.questions = state.questions;
    this.answers = state.answers;
    this.session = state.session;
    this.topicId = state.topicId || 0;
    this.topicName = state.topicName || '';
    this.conceptName = state.conceptName || '';
  }

  get subtitle(): string {
    const parts = [this.topicName, this.conceptName].filter(Boolean);
    return parts.join(' — ');
  }

  get scorePercent(): number {
    if (!this.session) return 0;
    return Math.round(100 * this.session.correctAnswers / this.session.totalQuestions);
  }

  isCorrect(index: number): boolean {
    return this.answers[index] === this.questions[index].correctIndex;
  }

  scoreColor(): string {
    const pct = this.scorePercent;
    if (pct >= 80) return 'text-emerald-500';
    if (pct >= 60) return 'text-blue-500';
    if (pct >= 40) return 'text-orange-500';
    return 'text-red-500';
  }
}
