import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Word, WordCreate, ReviewEntry } from '../models/vocabulary.model';

@Injectable({ providedIn: 'root' })
export class VocabularyService {
  private http = inject(HttpClient);
  private base = '/api/vocabulary';

  findAll() {
    return this.http.get<Word[]>(this.base);
  }

  findDue() {
    return this.http.get<Word[]>(`${this.base}/due`);
  }

  create(request: WordCreate) {
    return this.http.post<Word>(this.base, request);
  }

  update(id: number, data: { word?: string; definition?: string }) {
    return this.http.put<Word>(`${this.base}/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  submitReview(id: number, quality: number) {
    return this.http.post<Word>(`${this.base}/${id}/review`, { quality });
  }

  getHistory(id: number) {
    return this.http.get<ReviewEntry[]>(`${this.base}/${id}/history`);
  }
}
