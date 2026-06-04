import { Component, inject, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../../core/services/auth.service';
import { QuizService } from '../../../features/quiz/services/quiz.service';
import { QuizTopic } from '../../../features/quiz/models/quiz.model';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface CollectedTerm {
  term: string;
  definition: string;
  selected: boolean;
}

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-widget.component.html'
})
export class ChatWidgetComponent implements OnInit, OnDestroy {
  private chatService = inject(ChatService);
  private authService = inject(AuthService);
  private quizService = inject(QuizService);
  private router = inject(Router);
  private routerSub?: Subscription;
  private authSub?: Subscription;

  @ViewChild('messagesContainer') messagesContainer?: ElementRef;

  isLoggedIn = false;
  open = false;
  messages: ChatMessage[] = [];
  collected: CollectedTerm[] = [];
  input = '';
  loading = false;

  showSaveModal = false;
  saveTarget: 'note' | 'subject' | 'general' = 'general';
  selectedTopicId: number | null = null;
  topics: QuizTopic[] = [];
  saving = false;

  conceptId: number | null = null;

  private openSub?: Subscription;

  ngOnInit() {
    this.authSub = this.authService.isLoggedIn$.subscribe(v => this.isLoggedIn = v);
    this.routerSub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => this.updateContext());
    this.updateContext();
    this.openSub = this.chatService.openChat$.subscribe(() => {
      this.open = true;
      this.showSaveModal = false;
    });
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
    this.authSub?.unsubscribe();
    this.openSub?.unsubscribe();
  }

  get contextLabel(): string {
    return this.conceptId ? 'In this note' : 'General';
  }

  get selectedCount(): number {
    return this.collected.filter(t => t.selected).length;
  }

  send() {
    const q = this.input.trim();
    if (!q || this.loading) return;
    this.input = '';
    this.messages.push({ role: 'user', text: q });
    this.loading = true;
    this.scrollToBottom();

    this.chatService.ask(q).subscribe({
      next: (res) => {
        this.messages.push({ role: 'assistant', text: res.definition });
        this.collected.push({ term: res.term, definition: res.definition, selected: true });
        this.loading = false;
        this.scrollToBottom();
      },
      error: () => {
        this.messages.push({ role: 'assistant', text: 'Failed to get answer. Try again.' });
        this.loading = false;
        this.scrollToBottom();
      }
    });
  }

  closeChat() {
    if (this.collected.length > 0) {
      this.open = false;
      this.showSaveModal = true;
      this.saveTarget = this.conceptId ? 'note' : 'general';
      this.quizService.findAllTopics().subscribe(t => this.topics = t);
    } else {
      this.open = false;
      this.clearChat();
    }
  }

  save() {
    const terms = this.collected
      .filter(t => t.selected)
      .map(t => ({ term: t.term, definition: t.definition }));
    if (terms.length === 0) return;

    this.saving = true;
    let conceptId: number | null = null;
    let topicId: number | null = null;

    if (this.saveTarget === 'note') {
      conceptId = this.conceptId;
      this.chatService.emitTermsForNote(terms);
    } else if (this.saveTarget === 'subject') {
      topicId = this.selectedTopicId;
    }

    this.chatService.saveTerms(conceptId, topicId, terms).subscribe({
      next: () => {
        this.saving = false;
        this.showSaveModal = false;
        this.clearChat();
      },
      error: () => {
        this.saving = false;
      }
    });
  }

  discard() {
    this.showSaveModal = false;
    this.clearChat();
  }

  private clearChat() {
    this.messages = [];
    this.collected = [];
  }

  private updateContext() {
    const match = this.router.url.match(/\/quiz\/\d+\/notes\/(\d+)/);
    this.conceptId = match ? Number(match[1]) : null;
  }

  private scrollToBottom() {
    setTimeout(() => {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
}
