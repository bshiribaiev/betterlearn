import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';

export interface ChatAskResponse {
  term: string;
  definition: string;
}

export interface ChatTerm {
  term: string;
  definition: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);

  // Signals to open the chat widget from anywhere
  readonly openChat$ = new Subject<void>();
  // Emits terms when saved to the active note (so note editor can insert them)
  readonly insertTermsInNote$ = new Subject<ChatTerm[]>();

  requestOpen() {
    this.openChat$.next();
  }

  emitTermsForNote(terms: ChatTerm[]) {
    this.insertTermsInNote$.next(terms);
  }

  ask(question: string) {
    return this.http.post<ChatAskResponse>('/api/quiz/chat/ask', { question });
  }

  saveTerms(conceptId: number | null, topicId: number | null, terms: ChatTerm[]) {
    return this.http.post<void>('/api/quiz/chat/save', { conceptId, topicId, terms });
  }
}
