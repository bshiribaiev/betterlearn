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
  template: `
    @if (isLoggedIn) {
      <!-- Anchor container aligned to max-w-5xl -->
      <div class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl px-6 pointer-events-none z-50">
      <!-- Bubble -->
      @if (!open) {
        <button (click)="open = true"
                class="absolute bottom-6 right-6 pointer-events-auto w-12 h-12 rounded-full bg-sky-500 hover:bg-sky-600 shadow-lg text-white flex items-center justify-center transition-colors cursor-pointer">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"/>
          </svg>
        </button>
      }

      <!-- Panel -->
      @if (open && !showSaveModal) {
        <div class="absolute bottom-6 right-6 pointer-events-auto w-80 h-[28rem] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col">
          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div>
              <span class="text-sm font-semibold text-gray-800">Learn anything</span>
              <span class="block text-xs text-gray-400">{{ contextLabel }}</span>
            </div>
            <button (click)="closeChat()" class="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Messages -->
          <div #messagesContainer class="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            @if (messages.length === 0) {
              <div class="text-center py-8">
                <p class="text-sm text-gray-400">Ask a question to get started</p>
              </div>
            }
            @for (msg of messages; track $index) {
              <div [class]="msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'">
                <div [class]="msg.role === 'user'
                  ? 'bg-sky-50 text-gray-800 rounded-2xl rounded-br-md px-3 py-2 text-sm max-w-[85%]'
                  : 'bg-gray-50 text-gray-700 rounded-2xl rounded-bl-md px-3 py-2 text-sm max-w-[85%]'">
                  {{ msg.text }}
                </div>
              </div>
            }
            @if (loading) {
              <div class="flex justify-start">
                <div class="bg-gray-50 rounded-2xl rounded-bl-md px-4 py-3">
                  <div class="flex gap-1">
                    <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
                    <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
                    <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Input -->
          <div class="px-3 py-3 border-t border-gray-100">
            <div class="flex gap-2">
              <input type="text"
                     [(ngModel)]="input"
                     (keydown.enter)="send()"
                     placeholder="Ask a question..."
                     [disabled]="loading"
                     class="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-400 disabled:opacity-50" />
              <button (click)="send()"
                      [disabled]="!input.trim() || loading"
                      class="p-2 rounded-xl bg-sky-500 text-white hover:bg-sky-600 transition-colors disabled:opacity-30 disabled:cursor-default cursor-pointer">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      }
      </div>

      <!-- Save panel (replaces chat panel inline) -->
      @if (showSaveModal) {
        <div class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl px-6 pointer-events-none z-50">
          <div class="absolute bottom-6 right-6 pointer-events-auto w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[28rem]">
            <div class="px-4 pt-4 pb-2">
              <h3 class="text-sm font-semibold text-gray-800">Save as flashcards?</h3>
              <p class="text-xs text-gray-400 mt-0.5">Select which terms to keep</p>
            </div>

            <!-- Term checklist -->
            <div class="flex-1 overflow-y-auto px-4 space-y-2">
              @for (item of collected; track $index) {
                <label class="flex items-start gap-2 cursor-pointer py-1">
                  <input type="checkbox" [(ngModel)]="item.selected"
                         class="mt-0.5 rounded border-gray-300 text-sky-500 focus:ring-sky-400" />
                  <div class="min-w-0">
                    <span class="text-sm font-medium text-gray-800">{{ item.term }}</span>
                    <span class="block text-xs text-gray-400 truncate">{{ item.definition }}</span>
                  </div>
                </label>
              }
            </div>

            <!-- Destination -->
            <div class="px-4 py-3 border-t border-gray-100">
              <label class="block text-xs font-medium text-gray-500 mb-1.5">Save to</label>
              <div class="flex flex-col gap-1">
                @if (conceptId) {
                  <button (click)="saveTarget = 'note'"
                          [class]="'text-left px-3 py-1.5 rounded-lg text-sm transition-colors ' + (saveTarget === 'note' ? 'bg-sky-50 text-sky-700 font-medium' : 'text-gray-600 hover:bg-gray-50')">
                    This note
                  </button>
                }
                <button (click)="saveTarget = 'general'"
                        [class]="'text-left px-3 py-1.5 rounded-lg text-sm transition-colors ' + (saveTarget === 'general' ? 'bg-sky-50 text-sky-700 font-medium' : 'text-gray-600 hover:bg-gray-50')">
                  General (Q&A)
                </button>
                @if (topics.length > 0) {
                  <select [(ngModel)]="selectedTopicId" (ngModelChange)="saveTarget = 'subject'"
                          class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-sky-400 cursor-pointer">
                    <option [ngValue]="null" disabled>Choose a subject...</option>
                    @for (topic of topics; track topic.id) {
                      <option [ngValue]="topic.id">{{ topic.name }}</option>
                    }
                  </select>
                }
              </div>
            </div>

            <!-- Actions -->
            <div class="px-4 py-3 border-t border-gray-100 flex justify-between">
              <button (click)="discard()"
                      class="text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                Discard
              </button>
              <button (click)="save()"
                      [disabled]="saving || selectedCount === 0"
                      class="text-sm font-medium bg-sky-500 text-white px-4 py-1.5 rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-30 cursor-pointer">
                {{ saving ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </div>
        </div>
      }
    }
  `
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
