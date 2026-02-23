import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { QuizService } from '../../services/quiz.service';
import { QuizQuestion } from '../../models/quiz.model';

@Component({
  selector: 'app-quiz-session',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quiz-session.component.html'
})
export class QuizSessionComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private quizService = inject(QuizService);

  topicId = 0;
  topicName = '';
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

  submitQuiz() {
    if (!this.allAnswered || this.submitting) return;
    this.submitting = true;

    this.quizService.submit(this.topicId, this.questions, this.answers).subscribe({
      next: (session) => {
        this.router.navigate(['/quiz', this.topicId, 'results'], {
          state: {
            questions: this.questions,
            answers: this.answers,
            session,
            topicName: this.topicName
          }
        });
      },
      error: () => this.submitting = false
    });
  }
}
