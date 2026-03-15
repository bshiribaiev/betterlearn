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

  conceptId = 0;
  topicId = 0;
  topicName = '';
  conceptName = '';
  questions: QuizQuestion[] = [];
  answers: number[] = [];
  currentIndex = 0;
  questionCount = 5;
  generating = true;
  submitting = false;

  // Support legacy flow (pre-loaded questions from state)
  private legacyMode = false;

  ngOnInit() {
    this.conceptId = Number(this.route.snapshot.paramMap.get('conceptId'));
    const state = history.state;
    this.topicId = state?.topicId || 0;
    this.topicName = state?.topicName || '';
    this.conceptName = state?.conceptName || '';

    if (state?.questions?.length) {
      // Legacy: questions already loaded (from cached quiz or old flow)
      this.legacyMode = true;
      this.questions = state.questions;
      this.questionCount = this.questions.length;
      this.answers = new Array(this.questionCount).fill(-1);
      this.generating = false;
    } else if (state?.questionCount) {
      this.questionCount = state.questionCount;
      this.startPipeline();
    } else {
      this.router.navigate(['/quiz']);
    }
  }

  private startPipeline() {
    this.generateNext(0, []);
  }

  private generateNext(index: number, previousQuestions: string[]) {
    if (index >= this.questionCount) {
      this.generating = false;
      return;
    }

    this.quizService.generateOne(this.conceptId, previousQuestions).subscribe({
      next: (question) => {
        this.questions.push(question);
        this.answers.push(-1);
        if (index + 1 >= this.questionCount) {
          this.generating = false;
        } else {
          this.generateNext(index + 1, [...previousQuestions, question.question]);
        }
      },
      error: () => {
        // Stop pipeline on error, work with what we have
        this.questionCount = this.questions.length;
        this.generating = false;
      }
    });
  }

  get currentQuestion(): QuizQuestion | null {
    return this.questions[this.currentIndex] ?? null;
  }

  get isLastQuestion(): boolean {
    return this.currentIndex === this.questionCount - 1;
  }

  get nextReady(): boolean {
    return this.currentIndex + 1 < this.questions.length;
  }

  get currentAnswered(): boolean {
    return this.answers[this.currentIndex] >= 0;
  }

  selectAnswer(optionIndex: number) {
    this.answers[this.currentIndex] = optionIndex;
  }

  next() {
    if (this.currentAnswered && this.nextReady) {
      this.currentIndex++;
    }
  }

  get subtitle(): string {
    const parts = [this.topicName, this.conceptName].filter(Boolean);
    return parts.join(' — ');
  }

  get allAnswered(): boolean {
    return this.questions.length === this.questionCount
      && this.answers.every(a => a >= 0);
  }

  submitQuiz() {
    if (!this.allAnswered || this.submitting) return;
    this.submitting = true;

    this.quizService.submit(this.conceptId, this.questions, this.answers).subscribe({
      next: (session) => {
        this.router.navigate(['/quiz', 'concepts', this.conceptId, 'results'], {
          state: {
            questions: this.questions,
            answers: this.answers,
            session,
            topicId: this.topicId,
            topicName: this.topicName,
            conceptName: this.conceptName
          }
        });
      },
      error: () => this.submitting = false
    });
  }
}
