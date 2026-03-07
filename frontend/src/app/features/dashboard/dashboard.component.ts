import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Problem } from '../leetcode/models/problem.model';
import { QuizConcept, FlashcardTerm } from '../quiz/models/quiz.model';
import { QuizService } from '../quiz/services/quiz.service';

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
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-5xl mx-auto px-6 py-8">
      <h1 class="text-2xl font-semibold text-gray-900 mb-8">Dashboard</h1>

      @if (loading) {
        <div class="text-center py-16"><span class="text-gray-400 text-sm">Loading...</span></div>
      } @else {
      <!-- Navigation cards -->
      <div class="grid grid-cols-2 gap-5 mb-8">
        <a routerLink="/quiz"
           class="flex items-center gap-5 p-6 bg-white border border-gray-100 rounded-xl hover:border-sky-200 hover:shadow-md transition-all group">
          <div class="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center group-hover:bg-sky-100 transition-colors">
            <svg class="w-6 h-6 text-sky-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"/>
            </svg>
          </div>
          <div>
            <p class="text-lg font-semibold text-gray-900">Subjects</p>
            <p class="text-base text-gray-400">Topics, notes & quizzes</p>
          </div>
        </a>
        <a routerLink="/leetcode"
           class="flex items-center gap-5 p-6 bg-white border border-gray-100 rounded-xl hover:border-amber-200 hover:shadow-md transition-all group">
          <div class="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
            <svg class="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/>
            </svg>
          </div>
          <div>
            <p class="text-lg font-semibold text-gray-900">LeetCode</p>
            <p class="text-base text-gray-400">Problems & reviews</p>
          </div>
        </a>
      </div>

      <!-- Due problems -->
      @if (data && data.dueProblems.length > 0) {
        <div class="mb-8">
          <h2 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">LeetCode — Needs Review</h2>
          <div class="space-y-2">
            @for (problem of data.dueProblems; track problem.id) {
              <div class="grid grid-cols-[1fr_100px_80px] gap-4 items-center py-3 px-4 bg-white border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition-all">
                <div class="min-w-0">
                  <a [href]="problem.url" target="_blank" rel="noopener"
                     class="flex items-center gap-2 min-w-0 hover:text-sky-600 transition-colors cursor-pointer">
                    <span class="text-base font-medium text-gray-900 truncate">{{ problem.title }}</span>
                    <span class="flex-shrink-0 text-gray-300">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                      </svg>
                    </span>
                  </a>
                </div>
                <span [class]="'text-sm ' + dueColor(problem.nextReview)">{{ dueLabel(problem.nextReview) }}</span>
                <a routerLink="/leetcode"
                   class="justify-self-end px-4 py-1.5 text-sm font-medium bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors">
                  Review
                </a>
              </div>
            }
          </div>
        </div>
      }

      <!-- Due notes -->
      @if (data && data.dueConcepts.length > 0) {
        <div class="mb-8">
          <h2 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Notes — Needs Review</h2>
          <div class="space-y-2">
            @for (concept of data.dueConcepts; track concept.id) {
              <div class="grid grid-cols-[1fr_100px_80px] gap-4 items-center py-3 px-4 bg-white border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition-all">
                <div class="min-w-0">
                  <a [routerLink]="['/quiz', concept.topicId, 'notes', concept.id]"
                     [state]="{ from: 'dashboard', topicName: concept.topicName }"
                     class="min-w-0 hover:text-sky-600 transition-colors cursor-pointer">
                    <span class="text-base font-medium text-gray-900">{{ concept.topicName }}:</span>
                    <span class="text-base text-gray-400 ml-1">{{ concept.name }}</span>
                  </a>
                </div>
                <span [class]="'text-sm ' + dueColor(concept.nextReview)">{{ dueLabel(concept.nextReview) }}</span>
                <button (click)="reviewConcept(concept)"
                        [disabled]="generatingNoteId === concept.id"
                        [class]="'justify-self-end px-4 py-1.5 text-sm font-medium rounded-lg transition-all cursor-pointer ' + (generatingNoteId === concept.id ? 'bg-gray-100 text-gray-400' : 'bg-teal-500 text-white hover:bg-teal-600')">
                  @if (generatingNoteId === concept.id) {
                    <svg class="w-4 h-4 animate-spin inline-block" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                  } @else {
                    Review
                  }
                </button>
              </div>
            }
          </div>
        </div>
      }

      @if (data && data.dueProblems.length === 0 && data.dueConcepts.length === 0) {
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
  loading = true;
  generatingNoteId: number | null = null;

  ngOnInit() {
    this.loadData();
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && event.urlAfterRedirects === '/dashboard') {
        this.loadData();
      }
    });
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

  private loadData() {
    this.loading = true;
    this.http.get<DashboardData>('/api/dashboard').subscribe(data => {
      this.data = data;
      this.loading = false;
    });
  }
}
