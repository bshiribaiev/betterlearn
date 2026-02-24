import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { VocabularyService } from '../../services/vocabulary.service';
import { QuizQuestion } from '../../../quiz/models/quiz.model';

@Component({
  selector: 'app-term-quiz-session',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './term-quiz-session.component.html'
})
export class TermQuizSessionComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private vocabService = inject(VocabularyService);

  topicId = 0;
  topicName = '';
  date: string | null = null;
  groupLabel = '';
  questions: QuizQuestion[] = [];
  answers: number[] = [];
  submitting = false;

  ngOnInit() {
    this.topicId = Number(this.route.snapshot.paramMap.get('topicId'));
    const state = history.state;
    if (!state?.questions?.length) {
      this.router.navigate(['/quiz']);
      return;
    }
    this.questions = state.questions;
    this.topicName = state.topicName || '';
    this.date = state.date || null;
    this.groupLabel = state.groupLabel || '';
    this.answers = new Array(this.questions.length).fill(-1);
  }

  selectAnswer(questionIndex: number, optionIndex: number) {
    this.answers[questionIndex] = optionIndex;
  }

  get answeredCount(): number {
    return this.answers.filter(a => a >= 0).length;
  }

  get allAnswered(): boolean {
    return this.questions.length > 0 && this.answeredCount === this.questions.length;
  }

  get subtitle(): string {
    const parts = [this.topicName, this.groupLabel].filter(Boolean);
    return parts.join(' — ');
  }

  submitQuiz() {
    if (!this.allAnswered || this.submitting) return;
    this.submitting = true;

    this.vocabService.submitTermQuiz(this.topicId, this.date, this.questions, this.answers).subscribe({
      next: (result) => {
        this.router.navigate(['/quiz', this.topicId, 'terms', 'results'], {
          state: {
            questions: this.questions,
            answers: this.answers,
            result,
            topicName: this.topicName,
            groupLabel: this.groupLabel
          }
        });
      },
      error: () => this.submitting = false
    });
  }
}
