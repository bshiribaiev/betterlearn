import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface ChatAskResponse {
  term: string;
  definition: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);

  ask(question: string) {
    return this.http.post<ChatAskResponse>('/api/quiz/chat/ask', { question });
  }

  saveTerms(conceptId: number | null, topicId: number | null, terms: { term: string; definition: string }[]) {
    return this.http.post<void>('/api/quiz/chat/save', { conceptId, topicId, terms });
  }
}
