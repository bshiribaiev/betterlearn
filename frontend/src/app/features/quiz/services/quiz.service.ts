import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { QuizTopic, QuizConcept, QuizQuestion, QuizSession } from '../models/quiz.model';

@Injectable({ providedIn: 'root' })
export class QuizService {
  private http = inject(HttpClient);

  // --- Topics ---

  findAllTopics() {
    return this.http.get<QuizTopic[]>('/api/quiz/topics');
  }

  findDueTopics() {
    return this.http.get<QuizTopic[]>('/api/quiz/topics/due');
  }

  createTopic(name: string) {
    return this.http.post<QuizTopic>('/api/quiz/topics', { name });
  }

  deleteTopic(id: number) {
    return this.http.delete<void>(`/api/quiz/topics/${id}`);
  }

  // --- Concepts ---

  findConcepts(topicId: number) {
    return this.http.get<QuizConcept[]>(`/api/quiz/topics/${topicId}/concepts`);
  }

  createConcept(topicId: number, name: string) {
    return this.http.post<QuizConcept>(`/api/quiz/topics/${topicId}/concepts`, { name });
  }

  deleteConcept(id: number) {
    return this.http.delete<void>(`/api/quiz/concepts/${id}`);
  }

  generate(conceptId: number, count = 5) {
    return this.http.post<{ questions: QuizQuestion[] }>(
      `/api/quiz/concepts/${conceptId}/generate?count=${count}`, {}
    );
  }

  submit(conceptId: number, questions: QuizQuestion[], answers: number[]) {
    return this.http.post<QuizSession>(
      `/api/quiz/concepts/${conceptId}/submit`, { questions, answers }
    );
  }

  getSessions(conceptId: number) {
    return this.http.get<QuizSession[]>(`/api/quiz/concepts/${conceptId}/sessions`);
  }
}
