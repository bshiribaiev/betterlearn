import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { QuizQuestion } from '../../../quiz/models/quiz.model';
import { TermQuizResult } from '../../services/vocabulary.service';

@Component({
  selector: 'app-term-quiz-results',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './term-quiz-results.component.html'
})
export class TermQuizResultsComponent implements OnInit {
  private router = inject(Router);

  topicName = '';
  groupLabel = '';
  questions: QuizQuestion[] = [];
  answers: number[] = [];
  result: TermQuizResult | null = null;

  ngOnInit() {
    const state = history.state;
    if (!state?.result) {
      this.router.navigate(['/quiz']);
      return;
    }
    this.questions = state.questions;
    this.answers = state.answers;
    this.result = state.result;
    this.topicName = state.topicName || '';
    this.groupLabel = state.groupLabel || '';
  }

  get subtitle(): string {
    const parts = [this.topicName, this.groupLabel].filter(Boolean);
    return parts.join(' — ');
  }

  get scorePercent(): number {
    if (!this.result) return 0;
    return Math.round(100 * this.result.correctAnswers / this.result.totalQuestions);
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
