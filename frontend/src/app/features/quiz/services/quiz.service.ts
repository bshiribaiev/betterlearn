import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { QuizTopic, QuizConcept, QuizQuestion, QuizSession } from '../models/quiz.model';

@Injectable({ providedIn: 'root' })
export class QuizService {
  private http = inject(HttpClient);

  // Topics
  findAllTopics() {
    return this.http.get<QuizTopic[]>('/api/quiz/topics');
  }

  findDueTopics() {
    return this.http.get<QuizTopic[]>('/api/quiz/topics/due');
  }

  createTopic(name: string) {
    return this.http.post<QuizTopic>('/api/quiz/topics', { name });
  }

  updateTopic(id: number, body: { name: string; textbookName?: string | null; textbookUrl?: string | null }) {
    return this.http.put<QuizTopic>(`/api/quiz/topics/${id}`, body);
  }

  deleteTopic(id: number) {
    return this.http.delete<void>(`/api/quiz/topics/${id}`);
  }

  findOrCreateQuickNotes() {
    return this.http.post<QuizTopic>('/api/quiz/topics/quick-notes', {});
  }

  // Concepts
  findAllConcepts() {
    return this.http.get<QuizConcept[]>('/api/quiz/concepts');
  }

  findConcepts(topicId: number) {
    return this.http.get<QuizConcept[]>(`/api/quiz/topics/${topicId}/concepts`);
  }

  createConcept(topicId: number, body: { name: string; content?: string; terms?: string | null }) {
    return this.http.post<QuizConcept>(`/api/quiz/topics/${topicId}/concepts`, body);
  }

  updateConcept(id: number, body: { name: string; content?: string | null; terms?: string | null }) {
    return this.http.put<QuizConcept>(`/api/quiz/concepts/${id}`, body);
  }

  moveConcept(id: number, topicId: number) {
    return this.http.patch<QuizConcept>(`/api/quiz/concepts/${id}/move`, { topicId });
  }

  deleteConcept(id: number) {
    return this.http.delete<void>(`/api/quiz/concepts/${id}`);
  }

  rescheduleConcept(id: number, nextReview: string) {
    return this.http.patch<QuizConcept>(`/api/quiz/concepts/${id}/reschedule`, { nextReview });
  }

  uploadPdf(conceptId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<QuizConcept>(`/api/quiz/concepts/${conceptId}/pdf`, formData);
  }

  removePdf(conceptId: number) {
    return this.http.delete<void>(`/api/quiz/concepts/${conceptId}/pdf`);
  }

  downloadPdf(conceptId: number) {
    return this.http.get(`/api/quiz/concepts/${conceptId}/pdf`, { responseType: 'blob', observe: 'response' });
  }

  uploadImage(conceptId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`/api/quiz/concepts/${conceptId}/images`, formData);
  }

  generate(conceptId: number, count = 5) {
    return this.http.post<{ questions: QuizQuestion[] }>(
      `/api/quiz/concepts/${conceptId}/generate?count=${count}`, {}
    );
  }

  generateOne(conceptId: number, previousQuestions: string[]) {
    return this.http.post<QuizQuestion>(
      `/api/quiz/concepts/${conceptId}/generate-one`, { previousQuestions }
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

  submitFlashcardReview(conceptId: number, quality: number) {
    return this.http.post<QuizSession>(`/api/quiz/concepts/${conceptId}/flashcard-review`, { quality });
  }
}
