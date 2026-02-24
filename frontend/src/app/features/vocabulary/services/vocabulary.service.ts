import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Word, WordCreate, WordGroup, ReviewEntry } from '../models/vocabulary.model';
import { QuizQuestion } from '../../quiz/models/quiz.model';

export interface TermQuizResult {
  totalQuestions: number;
  correctAnswers: number;
  quality: number;
}

@Injectable({ providedIn: 'root' })
export class VocabularyService {
  private http = inject(HttpClient);

  findByTopic(topicId: number) {
    return this.http.get<Word[]>(`/api/quiz/topics/${topicId}/words`);
  }

  findByTopicGrouped(topicId: number) {
    return this.http.get<WordGroup[]>(`/api/quiz/topics/${topicId}/words/grouped`);
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

  generateGroupLabel(topicId: number, date: string) {
    return this.http.post<{ label: string }>(`/api/quiz/topics/${topicId}/words/groups/${date}/label`, {});
  }

  generateTermQuiz(topicId: number, date: string | null, count?: number) {
    const parts: string[] = [];
    if (date) parts.push(`date=${date}`);
    if (count) parts.push(`count=${count}`);
    const params = parts.length ? `?${parts.join('&')}` : '';
    return this.http.post<{ questions: QuizQuestion[] }>(
      `/api/quiz/topics/${topicId}/words/quiz/generate${params}`, {}
    );
  }

  submitTermQuiz(topicId: number, date: string | null, questions: QuizQuestion[], answers: number[]) {
    const params = date ? `?date=${date}` : '';
    return this.http.post<TermQuizResult>(
      `/api/quiz/topics/${topicId}/words/quiz/submit${params}`, { questions, answers }
    );
  }
}
