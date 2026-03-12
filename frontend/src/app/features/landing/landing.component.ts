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

      <main style="flex:1;display:flex;flex-direction:column;justify-content:center">
      <!-- Hero -->
      <section style="padding-top:5rem;padding-bottom:3rem" class="max-w-5xl mx-auto px-6 text-center">
        <h1 class="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight mb-4">
          Learn more by studying less
        </h1>
        <p style="margin-bottom:1.5rem" class="text-lg text-gray-500 max-w-2xl mx-auto">
          Accelerate your learning with AI-generated quizzes based on your notes and integrated spaced repetition reminders.
        </p>
        <a routerLink="/login"
           class="px-6 py-3 text-sm font-medium bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors shadow-sm">
          Start Learning
        </a>
      </section>

      <!-- App preview -->
      <section style="max-width:52rem;padding-bottom:2rem" class="mx-auto px-6">
        <div class="rounded-xl border border-gray-200 shadow-xl overflow-hidden bg-white">
          <!-- Fake app navbar -->
          <div style="padding:0.625rem 1.25rem" class="border-b border-gray-100 flex items-center justify-between">
            <div class="flex items-center gap-4">
              <span class="flex items-center gap-1.5 text-xs font-semibold text-gray-900">
                <img src="favicon.svg" alt="" class="w-4 h-4"> betterlearn
              </span>
              <div class="flex items-center gap-3">
                <span class="text-[10px] text-gray-400">Dashboard</span>
                <span style="background:#f0f9ff;color:#0284c7;padding:0.125rem 0.5rem;border-radius:0.375rem" class="text-[10px] font-medium">Subjects</span>
                <span class="text-[10px] text-gray-400">LeetCode</span>
              </div>
            </div>
            <span class="text-[10px] text-gray-300">Logout</span>
          </div>

          <!-- Three panels -->
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr" class="responsive-stack">
            <!-- Panel 1: Note -->
            <div style="padding:1.25rem" class="border-r border-gray-100">
              <div class="flex items-center gap-1.5 mb-3">
                <div style="width:1.25rem;height:1.25rem" class="rounded bg-sky-50 flex items-center justify-center">
                  <svg class="w-2.5 h-2.5 text-sky-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/>
                  </svg>
                </div>
                <span class="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Note</span>
              </div>
              <p style="margin-bottom:0.5rem" class="text-sm font-semibold text-gray-900">Load Balancing</p>
              <p style="line-height:1.5" class="text-xs text-gray-500">A load balancer distributes incoming traffic across multiple servers to ensure no single server is overwhelmed...</p>
              <div style="margin-top:0.75rem;padding:0.5rem 0.625rem;border-left:2px solid #d1d5db;background:#f9fafb;border-radius:0.375rem">
                <p class="text-[9px] font-medium text-gray-400 uppercase tracking-wider">Term</p>
                <p class="text-xs font-semibold text-gray-800">Round Robin</p>
                <p class="text-[11px] text-gray-500">Distributes requests sequentially across servers</p>
              </div>
            </div>

            <!-- Panel 2: AI Quiz -->
            <div style="padding:1.25rem" class="border-r border-gray-100">
              <div class="flex items-center gap-1.5 mb-3">
                <div style="width:1.25rem;height:1.25rem" class="rounded bg-violet-50 flex items-center justify-center">
                  <svg class="w-2.5 h-2.5 text-violet-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
                  </svg>
                </div>
                <span class="text-[10px] font-medium text-gray-400 uppercase tracking-wider">AI Quiz</span>
              </div>
              <p style="margin-bottom:0.75rem" class="text-xs font-medium text-gray-900">Which strategy distributes requests sequentially?</p>
              <div style="display:flex;flex-direction:column;gap:0.375rem">
                <div style="padding:0.4rem 0.625rem;border:1px solid #e5e7eb;border-radius:0.5rem" class="text-[11px] text-gray-600">Least Connections</div>
                <div style="padding:0.4rem 0.625rem;border:1px solid #0ea5e9;background:#f0f9ff;border-radius:0.5rem" class="text-[11px] text-sky-700 font-medium">Round Robin</div>
                <div style="padding:0.4rem 0.625rem;border:1px solid #e5e7eb;border-radius:0.5rem" class="text-[11px] text-gray-600">IP Hash</div>
                <div style="padding:0.4rem 0.625rem;border:1px solid #e5e7eb;border-radius:0.5rem" class="text-[11px] text-gray-600">Weighted Random</div>
              </div>
            </div>

            <!-- Panel 3: Spaced Repetition -->
            <div style="padding:1.25rem">
              <div class="flex items-center gap-1.5 mb-3">
                <div style="width:1.25rem;height:1.25rem" class="rounded bg-emerald-50 flex items-center justify-center">
                  <svg class="w-2.5 h-2.5 text-emerald-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                </div>
                <span class="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Schedule</span>
              </div>
              <div style="display:flex;flex-direction:column;gap:0.5rem">
                <div style="display:grid;grid-template-columns:1fr 70px;gap:0.5rem;align-items:center;padding:0.4rem 0.625rem;background:#f9fafb;border-radius:0.5rem">
                  <span class="text-[11px] font-medium text-gray-900">Load Balancing</span>
                  <span class="text-[10px] text-red-500 text-right">Due today</span>
                </div>
                <div style="display:grid;grid-template-columns:1fr 70px;gap:0.5rem;align-items:center;padding:0.4rem 0.625rem;background:#f9fafb;border-radius:0.5rem">
                  <span class="text-[11px] font-medium text-gray-900">Indexing</span>
                  <span class="text-[10px] text-red-500 text-right">Due today</span>
                </div>
                <div style="display:grid;grid-template-columns:1fr 70px;gap:0.5rem;align-items:center;padding:0.4rem 0.625rem;background:#f9fafb;border-radius:0.5rem">
                  <span class="text-[11px] font-medium text-gray-900">Graph Traversal</span>
                  <span class="text-[10px] text-gray-400 text-right">Tomorrow</span>
                </div>
                <div style="display:grid;grid-template-columns:1fr 70px;gap:0.5rem;align-items:center;padding:0.4rem 0.625rem;background:#f9fafb;border-radius:0.5rem">
                  <span class="text-[11px] font-medium text-gray-900">TCP vs UDP</span>
                  <span class="text-[10px] text-gray-400 text-right">In 5 days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features -->
      <section style="padding-bottom:2rem" class="max-w-5xl mx-auto px-6">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem" class="responsive-stack">
          <div style="padding:1.5rem" class="rounded-xl border border-gray-100">
            <div style="width:2.5rem;height:2.5rem;margin-bottom:1rem" class="rounded-lg bg-sky-50 flex items-center justify-center">
              <svg class="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/>
              </svg>
            </div>
            <h3 class="text-base font-semibold text-gray-900 mb-1">Frictionless Notes</h3>
            <p class="text-base text-gray-500">Write notes with a clean editor. Add terms, upload PDFs, organize by subject.</p>
          </div>
          <div style="padding:1.5rem" class="rounded-xl border border-gray-100">
            <div style="width:2.5rem;height:2.5rem;margin-bottom:1rem" class="rounded-lg bg-violet-50 flex items-center justify-center">
              <svg class="w-5 h-5 text-violet-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"/>
              </svg>
            </div>
            <h3 class="text-base font-semibold text-gray-900 mb-1">AI Quizzes & Flashcards</h3>
            <p class="text-base text-gray-500">AI reads your notes and generates quizzes and flashcards automatically.</p>
          </div>
          <div style="padding:1.5rem" class="rounded-xl border border-gray-100">
            <div style="width:2.5rem;height:2.5rem;margin-bottom:1rem" class="rounded-lg bg-emerald-50 flex items-center justify-center">
              <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </div>
            <h3 class="text-base font-semibold text-gray-900 mb-1">Spaced Repetition</h3>
            <p class="text-base text-gray-500">SM-2 algorithm schedules reviews so you remember what you study long-term.</p>
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
