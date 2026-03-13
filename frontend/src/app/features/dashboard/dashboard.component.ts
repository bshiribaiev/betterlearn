import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Problem } from '../leetcode/models/problem.model';
import { QuizTopic, QuizConcept, FlashcardTerm } from '../quiz/models/quiz.model';
import { QuizService } from '../quiz/services/quiz.service';
import { cachedFetch } from '../../shared/services/cached-fetch';

interface DashboardData {
  dueCount: number;
  totalCount: number;
  masteredProblems: number;
  dueProblems: Problem[];
  topicsDueCount: number;
  topicsTotalCount: number;
  masteredTopicItems: number;
  dueConcepts: QuizConcept[];
  dueTermGroups: any[];
  recentConcepts: QuizConcept[];
}

interface DueItem {
  type: 'concept' | 'leetcode';
  id: number;
  label: string;
  sublabel: string;
  nextReview: string;
  url?: string;
  concept?: QuizConcept;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-5xl mx-auto px-6 py-8">
      <h1 class="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>

      <!-- Capture area -->
      <div (click)="quickNote()"
           class="mb-8 flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors group">
        @if (creatingQuickNote) {
          <svg class="w-5 h-5 text-gray-300 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <span class="text-sm text-gray-400">Creating note...</span>
        } @else {
          <svg class="w-5 h-5 text-gray-300 group-hover:text-sky-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"/>
          </svg>
          <span class="text-sm text-gray-400 group-hover:text-gray-500 transition-colors">New note</span>
        }
      </div>

      @if (loading) {
        <div class="text-center py-16"><span class="text-gray-400 text-sm">Loading...</span></div>
      } @else {

      <!-- Recent notes -->
      @if (data && data.recentConcepts && data.recentConcepts.length > 0) {
        <div class="mb-8">
          <h2 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Recent Notes</h2>
          <div class="space-y-2">
            @for (concept of data.recentConcepts; track concept.id) {
              <a [routerLink]="['/quiz', concept.topicId, 'notes', concept.id]"
                 [state]="{ from: 'dashboard', topicName: concept.topicName }"
                 class="flex items-center gap-3 py-3 px-4 bg-white border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition-all">
                <svg class="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>
                </svg>
                <span class="text-sm font-medium text-gray-500">{{ concept.topicName }}</span>
                <span class="text-sm text-gray-300">/</span>
                <span class="text-sm text-gray-700">{{ concept.name }}</span>
              </a>
            }
          </div>
        </div>
      }

      <!-- Needs Review (combined) -->
      @if (dueItems.length > 0) {
        <div class="mb-8">
          <h2 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Needs Review</h2>
          <div class="space-y-2">
            @for (item of dueItems; track item.type + item.id) {
              <div class="grid grid-cols-[1fr_100px_80px] responsive-due-row gap-4 items-center py-3 px-4 bg-white border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition-all">
                <div class="min-w-0">
                  @if (item.type === 'leetcode') {
                    <a [href]="item.url" target="_blank" rel="noopener"
                       class="flex items-center gap-2 min-w-0 hover:text-sky-600 transition-colors cursor-pointer">
                      <span class="text-base font-medium text-gray-900 truncate">
                        <span class="text-amber-500">LeetCode:</span> {{ item.sublabel }}
                      </span>
                      <span class="flex-shrink-0 text-gray-300">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                        </svg>
                      </span>
                    </a>
                  } @else {
                    <a [routerLink]="['/quiz', item.concept!.topicId, 'notes', item.id]"
                       [state]="{ from: 'dashboard', topicName: item.label }"
                       class="min-w-0 hover:text-sky-600 transition-colors cursor-pointer">
                      <span class="text-base font-medium text-gray-900">{{ item.label }}:</span>
                      <span class="text-base text-gray-400 ml-1">{{ item.sublabel }}</span>
                    </a>
                  }
                </div>
                <span [class]="'text-sm responsive-due-label ' + dueColor(item.nextReview)">{{ dueLabel(item.nextReview) }}</span>
                @if (item.type === 'leetcode') {
                  <a routerLink="/leetcode"
                     class="justify-self-end px-4 py-1.5 text-sm font-medium bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors">
                    Review
                  </a>
                } @else {
                  <button (click)="reviewConcept(item.concept!)"
                          [disabled]="generatingNoteId === item.id"
                          [class]="'justify-self-end px-4 py-1.5 text-sm font-medium rounded-lg transition-all cursor-pointer ' + (generatingNoteId === item.id ? 'bg-gray-100 text-gray-400' : 'bg-teal-500 text-white hover:bg-teal-600')">
                    @if (generatingNoteId === item.id) {
                      <svg class="w-4 h-4 animate-spin inline-block" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                    } @else {
                      Review
                    }
                  </button>
                }
              </div>
            }
          </div>
        </div>
      }

      @if (dueItems.length === 0) {
        <div class="text-center py-12">
          <p class="text-gray-400 text-sm">Nothing due today. Nice work!</p>
        </div>
      }
      }
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private quizService = inject(QuizService);

  data: DashboardData | null = null;
  dueItems: DueItem[] = [];
  loading = true;
  generatingNoteId: number | null = null;
  creatingQuickNote = false;
  private quickNotesTopic: QuizTopic | null = null;
  private quickNoteCounter = 0;

  ngOnInit() {
    this.loadData();
    this.quizService.findOrCreateQuickNotes().subscribe({
      next: (topic) => this.quickNotesTopic = topic
    });
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && event.urlAfterRedirects === '/dashboard') {
        this.loadData();
      }
    });
  }

  quickNote() {
    if (this.creatingQuickNote) return;
    this.creatingQuickNote = true;
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    this.quickNoteCounter++;
    const name = `Note ${this.quickNoteCounter} - ${today}`;

    const createAndNavigate = (topic: QuizTopic) => {
      this.quizService.createConcept(topic.id, { name }).subscribe({
        next: (concept) => {
          this.creatingQuickNote = false;
          this.router.navigate(['/quiz', topic.id, 'notes', concept.id], {
            state: { from: 'dashboard', topicName: topic.name }
          });
        },
        error: () => this.creatingQuickNote = false
      });
    };

    if (this.quickNotesTopic) {
      createAndNavigate(this.quickNotesTopic);
    } else {
      this.quizService.findOrCreateQuickNotes().subscribe({
        next: (topic) => {
          this.quickNotesTopic = topic;
          createAndNavigate(topic);
        },
        error: () => this.creatingQuickNote = false
      });
    }
  }

  reviewConcept(concept: QuizConcept) {
    if (this.hasTerms(concept)) {
      const terms: FlashcardTerm[] = JSON.parse(concept.terms!);
      this.router.navigate(['/quiz', 'concepts', concept.id, 'flashcards'], {
        state: { terms, topicName: concept.topicName, conceptName: concept.name, topicId: concept.topicId }
      });
      return;
    }

    this.generatingNoteId = concept.id;
    this.quizService.generate(concept.id).subscribe({
      next: (res) => {
        this.generatingNoteId = null;
        this.router.navigate(['/quiz', 'concepts', concept.id, 'session'], {
          state: { questions: res.questions, conceptName: concept.name }
        });
      },
      error: () => this.generatingNoteId = null
    });
  }

  private hasTerms(concept: QuizConcept): boolean {
    if (!concept.terms) return false;
    try {
      const terms: FlashcardTerm[] = JSON.parse(concept.terms);
      return terms.length > 0;
    } catch {
      return false;
    }
  }

  dueLabel(nextReview: string): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const review = new Date(nextReview + 'T00:00:00');
    const days = Math.round((review.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    const dateStr = review.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return 'Due ' + dateStr;
  }

  dueColor(nextReview: string): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const review = new Date(nextReview + 'T00:00:00');
    const days = Math.round((review.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'text-red-500';
    return 'text-gray-400';
  }

  private initQuickNoteCounter() {
    if (!this.data?.recentConcepts) return;
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    this.quickNoteCounter = this.data.recentConcepts.filter(c =>
      c.topicName === 'Quick Notes' && c.name.includes(today)
    ).length;
  }

  private buildDueItems() {
    if (!this.data) return;

    const items: DueItem[] = [];

    for (const p of this.data.dueProblems) {
      items.push({ type: 'leetcode', id: p.id, label: 'LeetCode', sublabel: p.title, nextReview: p.nextReview, url: p.url });
    }
    for (const c of this.data.dueConcepts) {
      items.push({ type: 'concept', id: c.id, label: c.topicName, sublabel: c.name, nextReview: c.nextReview, concept: c });
    }

    items.sort((a, b) => a.nextReview.localeCompare(b.nextReview));
    this.dueItems = items;
  }

  private loadData() {
    cachedFetch('dashboard', this.http.get<DashboardData>('/api/dashboard'), data => {
      this.data = data;
      this.buildDueItems();
      this.initQuickNoteCounter();
      this.loading = false;
    });
  }
}
