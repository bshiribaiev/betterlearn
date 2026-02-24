import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-white flex flex-col">
      <!-- Nav -->
      <nav class="border-b border-gray-100">
        <div class="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <span class="text-lg font-semibold text-gray-900 tracking-tight">betterlearn</span>
        <a routerLink="/login"
           class="px-4 py-2 text-sm font-medium bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors">
          Sign In
        </a>
        </div>
      </nav>

      <main>
      <!-- Hero -->
      <section class="max-w-5xl mx-auto px-6 pt-28 pb-12 text-center">
        <h1 class="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight mb-4">
          Learn smarter, not harder
        </h1>
        <p class="text-lg text-gray-500 max-w-2xl mx-auto mb-8">
          Improve your learning with spaced repetition, LeetCode tracking, AI-generated flashcards, and more.
        </p>
        <a routerLink="/login"
           class="px-6 py-3 text-sm font-medium bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors shadow-sm">
          Start Learning
        </a>
      </section>

      <!-- Screenshot mockup -->
      <section class="max-w-4xl mx-auto px-6 pb-10">
        <div class="rounded-xl border border-gray-200 shadow-lg overflow-hidden bg-gray-50">
          <!-- Fake app content -->
          <div class="p-6">
            <!-- Navbar -->
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center gap-6">
                <span class="text-sm font-semibold text-gray-900">betterlearn</span>
                <div class="flex items-center gap-1">
                  <span class="px-2 py-1 text-[10px] text-gray-400 rounded">Dashboard</span>
                  <span class="px-2 py-1 text-[10px] text-gray-400 rounded">Subjects</span>
                  <span class="px-2 py-1 text-[10px] bg-gray-100 text-gray-700 rounded font-medium">LeetCode</span>
                </div>
              </div>
              <span class="text-[10px] text-gray-300">Logout</span>
            </div>

            <!-- Toolbar -->
            <div class="flex items-center justify-between mb-4">
              <div class="flex gap-1">
                <span class="px-2 py-1 text-[10px] bg-sky-50 text-sky-600 rounded font-medium">Due</span>
                <span class="px-2 py-1 text-[10px] text-gray-400 rounded">All</span>
              </div>
              <span class="px-2.5 py-1 text-[10px] bg-sky-500 text-white rounded font-medium">+ Add Problem</span>
            </div>

            <!-- Table header -->
            <div class="grid grid-cols-[1fr_70px_80px_60px] gap-3 items-center py-2 border-b border-gray-200">
              <span class="text-[9px] font-medium text-gray-400 uppercase tracking-wider">Problem</span>
              <span class="text-[9px] font-medium text-gray-400 uppercase tracking-wider">Confidence</span>
              <span class="text-[9px] font-medium text-gray-400 uppercase tracking-wider">Next Review</span>
              <span></span>
            </div>

            <!-- Rows -->
            <div class="grid grid-cols-[1fr_70px_80px_60px] gap-3 items-center py-2.5 border-b border-gray-200">
              <span class="text-[11px] font-medium text-gray-900">Two Sum</span>
              <span class="text-[11px] font-medium text-emerald-500">High</span>
              <span class="text-[11px] font-medium text-gray-500">In 12 days</span>
              <span class="text-[9px] bg-teal-500 text-white rounded px-2 py-0.5 text-center font-medium">Review</span>
            </div>
            <div class="grid grid-cols-[1fr_70px_80px_60px] gap-3 items-center py-2.5 border-b border-gray-200">
              <span class="text-[11px] font-medium text-gray-900">Binary Search</span>
              <span class="text-[11px] font-medium text-amber-500">Medium</span>
              <span class="text-[11px] font-medium text-red-500">2d overdue</span>
              <span class="text-[9px] bg-teal-500 text-white rounded px-2 py-0.5 text-center font-medium">Review</span>
            </div>
            <div class="grid grid-cols-[1fr_70px_80px_60px] gap-3 items-center py-2.5 border-b border-gray-200">
              <span class="text-[11px] font-medium text-gray-900">Merge Intervals</span>
              <span class="text-[11px] font-medium text-red-500">Low</span>
              <span class="text-[11px] font-medium text-sky-500">Due today</span>
              <span class="text-[9px] bg-teal-500 text-white rounded px-2 py-0.5 text-center font-medium">Review</span>
            </div>
            <div class="grid grid-cols-[1fr_70px_80px_60px] gap-3 items-center py-2.5 border-b border-gray-200">
              <span class="text-[11px] font-medium text-gray-900">LRU Cache</span>
              <span class="text-[11px] font-medium text-amber-500">Medium</span>
              <span class="text-[11px] font-medium text-orange-500">Tomorrow</span>
              <span class="text-[9px] bg-teal-500 text-white rounded px-2 py-0.5 text-center font-medium">Review</span>
            </div>
            <div class="grid grid-cols-[1fr_70px_80px_60px] gap-3 items-center py-2.5">
              <span class="text-[11px] font-medium text-gray-900">Valid Parentheses</span>
              <span class="text-[11px] font-medium text-emerald-500">High</span>
              <span class="text-[11px] font-medium text-violet-500">In 3 days</span>
              <span class="text-[9px] bg-teal-500 text-white rounded px-2 py-0.5 text-center font-medium">Review</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Features -->
      <section class="max-w-5xl mx-auto px-6 pb-10">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div class="p-6 rounded-xl border border-gray-100">
            <div class="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mb-4">
              <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 class="text-base font-semibold text-gray-900 mb-2">Spaced Repetition</h3>
            <p class="text-base text-gray-500">SM-2 algorithm schedules reviews at the optimal time for long-term retention.</p>
          </div>
          <div class="p-6 rounded-xl border border-gray-100">
            <div class="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center mb-4">
              <svg class="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
            </div>
            <h3 class="text-base font-semibold text-gray-900 mb-2">AI-Generated Quizzes</h3>
            <p class="text-base text-gray-500">Generate multiple-choice quizzes on any subject using AI.</p>
          </div>
          <div class="p-6 rounded-xl border border-gray-100">
            <div class="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center mb-4">
              <svg class="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
              </svg>
            </div>
            <h3 class="text-base font-semibold text-gray-900 mb-2">LeetCode Tracker</h3>
            <p class="text-base text-gray-500">Track problems, review with spaced repetition, and never forget a solution.</p>
          </div>
        </div>
      </section>

      </main>

      <!-- Footer -->
      <footer class="mt-auto border-t border-gray-100 py-6">
        <p class="text-center text-sm text-gray-400">&copy; 2026 betterlearn. All rights reserved.</p>
      </footer>
    </div>
  `
})
export class LandingComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    this.auth.isLoggedIn$.subscribe(loggedIn => {
      if (loggedIn) this.router.navigate(['/dashboard']);
    });
  }
}
