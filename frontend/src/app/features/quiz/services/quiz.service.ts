import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { QuizTopic, QuizQuestion, QuizSession } from '../models/quiz.model';

@Injectable({ providedIn: 'root' })
export class QuizService {
  private http = inject(HttpClient);
  private base = '/api/quiz/topics';

  findAll() {
    return this.http.get<QuizTopic[]>(this.base);
  }

  findDue() {
    return this.http.get<QuizTopic[]>(`${this.base}/due`);
  }

  create(name: string) {
    return this.http.post<QuizTopic>(this.base, { name });
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  generate(topicId: number, count = 5) {
    return this.http.post<{ questions: QuizQuestion[] }>(
      `${this.base}/${topicId}/generate?count=${count}`, {}
    );
  }

  submit(topicId: number, questions: QuizQuestion[], answers: number[]) {
    return this.http.post<QuizSession>(
      `${this.base}/${topicId}/submit`, { questions, answers }
    );
  }

  getSessions(topicId: number) {
    return this.http.get<QuizSession[]>(`${this.base}/${topicId}/sessions`);
  }
}
