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
        <span class="flex items-center gap-2 text-lg font-semibold text-gray-900 tracking-tight">
          <img src="favicon.svg" alt="" class="w-6 h-6">
          betterlearn
        </span>
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
                <span class="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                  <img src="favicon.svg" alt="" class="w-4 h-4">
                  betterlearn
                </span>
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
              <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </div>
            <h3 class="text-base font-semibold text-gray-900 mb-2">Spaced Repetition</h3>
            <p class="text-base text-gray-500">SM-2 algorithm schedules reviews at the optimal time for long-term retention.</p>
          </div>
          <div class="p-6 rounded-xl border border-gray-100">
            <div class="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center mb-4">
              <svg class="w-5 h-5 text-violet-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"/>
              </svg>
            </div>
            <h3 class="text-base font-semibold text-gray-900 mb-2">AI-Generated Quizzes</h3>
            <p class="text-base text-gray-500">Generate multiple-choice quizzes on any subject using AI.</p>
          </div>
          <div class="p-6 rounded-xl border border-gray-100">
            <div class="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center mb-4">
              <svg class="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/>
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
