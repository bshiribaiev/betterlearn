import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Problem, ProblemCreate, ReviewEntry } from '../models/problem.model';

@Injectable({ providedIn: 'root' })
export class LeetcodeService {
  private http = inject(HttpClient);
  private base = '/api/leetcode';

  findAll() {
    return this.http.get<Problem[]>(this.base);
  }

  findDue() {
    return this.http.get<Problem[]>(`${this.base}/due`);
  }

  create(request: ProblemCreate) {
    return this.http.post<Problem>(this.base, request);
  }

  update(id: number, data: { title?: string; notes?: string }) {
    return this.http.put<Problem>(`${this.base}/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  reschedule(id: number, nextReview: string) {
    return this.http.patch<Problem>(`${this.base}/${id}/reschedule`, { nextReview });
  }

  submitReview(id: number, quality: number) {
    return this.http.post<Problem>(`${this.base}/${id}/review`, { quality });
  }

  getHistory(id: number) {
    return this.http.get<ReviewEntry[]>(`${this.base}/${id}/history`);
  }
}
