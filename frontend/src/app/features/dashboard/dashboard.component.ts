import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Problem } from '../leetcode/models/problem.model';
import { QuizTopic } from '../quiz/models/quiz.model';
import { Word } from '../vocabulary/models/vocabulary.model';

interface DashboardData {
  dueCount: number;
  totalCount: number;
  masteredProblems: number;
  dueProblems: Problem[];
  quizDueCount: number;
  quizTotalCount: number;
  masteredTopics: number;
  dueTopics: QuizTopic[];
  vocabDueCount: number;
  vocabTotalCount: number;
  masteredWords: number;
  dueWords: Word[];
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
      <!-- Stats -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div class="bg-white border border-gray-100 rounded-xl p-5">
          <p class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">LeetCode Due</p>
          <p class="text-2xl font-semibold" [class]="data?.dueCount ? 'text-red-500' : 'text-gray-900'">{{ data?.dueCount ?? '-' }}</p>
        </div>
        <div class="bg-white border border-gray-100 rounded-xl p-5">
          <p class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Concepts Due</p>
          <p class="text-2xl font-semibold" [class]="data?.quizDueCount ? 'text-red-500' : 'text-gray-900'">{{ data?.quizDueCount ?? '-' }}</p>
        </div>
        <div class="bg-white border border-gray-100 rounded-xl p-5">
          <p class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Vocab Due</p>
          <p class="text-2xl font-semibold" [class]="data?.vocabDueCount ? 'text-red-500' : 'text-gray-900'">{{ data?.vocabDueCount ?? '-' }}</p>
        </div>
      </div>

      <!-- Due problems -->
      @if (data && data.dueProblems.length > 0) {
        <div class="mb-8">
          <h2 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">LeetCode — Needs Review</h2>
          <div class="space-y-2">
            @for (problem of data.dueProblems; track problem.id) {
              <div class="flex items-center justify-between py-3 px-4 bg-white border border-gray-100 rounded-xl">
                <div class="flex items-center gap-3 min-w-0">
                  <span class="text-sm font-medium text-gray-900 truncate">{{ problem.title }}</span>
                  <a [href]="problem.url" target="_blank" rel="noopener"
                     class="flex-shrink-0 text-gray-300 hover:text-blue-500 transition-colors">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                    </svg>
                  </a>
                </div>
                <a routerLink="/leetcode"
                   class="px-4 py-1.5 text-sm font-medium bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors">
                  Review
                </a>
              </div>
            }
          </div>
        </div>
      }

      <!-- Due topics -->
      @if (data && data.dueTopics.length > 0) {
        <div class="mb-8">
          <h2 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Concepts — Needs Review</h2>
          <div class="space-y-2">
            @for (topic of data.dueTopics; track topic.id) {
              <div class="flex items-center justify-between py-3 px-4 bg-white border border-gray-100 rounded-xl">
                <span class="text-sm font-medium text-gray-900 truncate">{{ topic.name }}</span>
                <a routerLink="/quiz"
                   class="px-4 py-1.5 text-sm font-medium bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors">
                  Study
                </a>
              </div>
            }
          </div>
        </div>
      }

      <!-- Due words -->
      @if (data && data.dueWords.length > 0) {
        <div class="mb-8">
          <h2 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Vocab — Needs Review</h2>
          <div class="space-y-2">
            @for (word of data.dueWords; track word.id) {
              <div class="flex items-center justify-between py-3 px-4 bg-white border border-gray-100 rounded-xl">
                <span class="text-sm font-medium text-gray-900 truncate">{{ word.word }}</span>
                <a routerLink="/vocabulary"
                   class="px-4 py-1.5 text-sm font-medium bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors">
                  Review
                </a>
              </div>
            }
          </div>
        </div>
      }

      @if (data && data.dueProblems.length === 0 && data.dueTopics.length === 0 && data.dueWords.length === 0) {
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
  data: DashboardData | null = null;
  loading = true;

  ngOnInit() {
    this.http.get<DashboardData>('/api/dashboard').subscribe(data => {
      this.data = data;
      this.loading = false;
    });
  }
}
