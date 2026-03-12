import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div style="min-height:100vh;display:flex;flex-direction:column" class="bg-white">
      <!-- Nav -->
      <nav class="border-b border-gray-100">
        <div class="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
        <span class="flex items-center gap-2 text-lg font-semibold text-gray-900 tracking-tight">
          <img src="favicon.svg" alt="" class="w-6 h-6">
          betterlearn
        </span>
        <a routerLink="/login"
           class="px-4 py-1.5 text-sm font-medium bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors">
          Sign In
        </a>
        </div>
      </nav>

      <main>
      <!-- Hero -->
      <section style="padding-top:5rem;padding-bottom:3rem" class="max-w-5xl mx-auto px-6 text-center">
        <h1 class="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight mb-4">
          Never forget what you learn
        </h1>
        <p style="margin-bottom:2.5rem" class="text-lg text-gray-500 max-w-2xl mx-auto">
          Take notes on any subject. AI generates quizzes and flashcards. Spaced repetition schedules your reviews.
        </p>
        <a routerLink="/login"
           class="px-6 py-3 text-sm font-medium bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors shadow-sm">
          Start Learning
        </a>
      </section>

      <!-- Dashboard mockup -->
      <section style="max-width:40rem;padding-bottom:3.5rem" class="mx-auto px-6">
        <div class="rounded-xl border border-gray-200 shadow-lg overflow-hidden bg-gray-50">
          <div class="p-5">
            <p style="margin-bottom:0.625rem" class="text-[9px] font-medium text-gray-400 uppercase tracking-wider">Due Today</p>
            <div class="space-y-1.5">
              <div style="display:grid;grid-template-columns:1fr 80px 56px;gap:0.75rem;align-items:center" class="py-2 px-3 bg-white rounded-lg border border-gray-100">
                <span class="text-[11px]"><span class="font-medium text-gray-900">System Design:</span> <span class="text-gray-400">Load Balancing</span></span>
                <span class="text-[10px] text-red-500">Due today</span>
                <span class="text-[8px] bg-teal-500 text-white rounded px-1.5 py-0.5 text-center font-medium">Review</span>
              </div>
              <div style="display:grid;grid-template-columns:1fr 80px 56px;gap:0.75rem;align-items:center" class="py-2 px-3 bg-white rounded-lg border border-gray-100">
                <span class="text-[11px]"><span class="font-medium text-gray-900">Databases:</span> <span class="text-gray-400">Indexing</span></span>
                <span class="text-[10px] text-red-500">Due today</span>
                <span class="text-[8px] bg-teal-500 text-white rounded px-1.5 py-0.5 text-center font-medium">Review</span>
              </div>
              <div style="display:grid;grid-template-columns:1fr 80px 56px;gap:0.75rem;align-items:center" class="py-2 px-3 bg-white rounded-lg border border-gray-100">
                <span class="text-[11px]"><span class="font-medium text-gray-900">Algorithms:</span> <span class="text-gray-400">Graph Traversal</span></span>
                <span class="text-[10px] text-gray-400">Tomorrow</span>
                <span class="text-[8px] bg-teal-500 text-white rounded px-1.5 py-0.5 text-center font-medium">Review</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features -->
      <section style="padding-bottom:3.5rem" class="max-w-5xl mx-auto px-6">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem" class="responsive-stack">
          <div class="p-5 rounded-xl border border-gray-100">
            <div style="width:2.25rem;height:2.25rem;margin-bottom:0.75rem" class="rounded-lg bg-sky-50 flex items-center justify-center">
              <svg class="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/>
              </svg>
            </div>
            <h3 class="text-sm font-semibold text-gray-900 mb-1">Frictionless Notes</h3>
            <p class="text-sm text-gray-500">Write notes with a clean editor. Add terms, upload PDFs, organize by subject.</p>
          </div>
          <div class="p-5 rounded-xl border border-gray-100">
            <div style="width:2.25rem;height:2.25rem;margin-bottom:0.75rem" class="rounded-lg bg-violet-50 flex items-center justify-center">
              <svg class="w-4 h-4 text-violet-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"/>
              </svg>
            </div>
            <h3 class="text-sm font-semibold text-gray-900 mb-1">AI Quizzes & Flashcards</h3>
            <p class="text-sm text-gray-500">AI reads your notes and generates quizzes and flashcards automatically.</p>
          </div>
          <div class="p-5 rounded-xl border border-gray-100">
            <div style="width:2.25rem;height:2.25rem;margin-bottom:0.75rem" class="rounded-lg bg-emerald-50 flex items-center justify-center">
              <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </div>
            <h3 class="text-sm font-semibold text-gray-900 mb-1">Spaced Repetition</h3>
            <p class="text-sm text-gray-500">SM-2 algorithm schedules reviews so you remember what you study long-term.</p>
          </div>
        </div>
      </section>

      </main>

      <!-- Footer -->
      <footer style="margin-top:auto" class="border-t border-gray-100 py-3">
        <p class="text-center text-sm text-gray-400">&copy; 2026 betterlearn</p>
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
