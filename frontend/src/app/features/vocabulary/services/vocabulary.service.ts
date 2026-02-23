import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Word, WordCreate, ReviewEntry } from '../models/vocabulary.model';

@Injectable({ providedIn: 'root' })
export class VocabularyService {
  private http = inject(HttpClient);

  findByTopic(topicId: number) {
    return this.http.get<Word[]>(`/api/quiz/topics/${topicId}/words`);
  }

  create(topicId: number, request: WordCreate) {
    return this.http.post<Word>(`/api/quiz/topics/${topicId}/words`, request);
  }

  update(id: number, data: { word?: string; definition?: string }) {
    return this.http.put<Word>(`/api/quiz/words/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete<void>(`/api/quiz/words/${id}`);
  }

  submitReview(id: number, quality: number) {
    return this.http.post<Word>(`/api/quiz/words/${id}/review`, { quality });
  }

  getHistory(id: number) {
    return this.http.get<ReviewEntry[]>(`/api/quiz/words/${id}/history`);
  }
}
