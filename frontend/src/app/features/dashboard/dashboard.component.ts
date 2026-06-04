import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Problem } from '../leetcode/models/problem.model';
import { QuizTopic, QuizConcept, FlashcardTerm } from '../quiz/models/quiz.model';
import { QuizService } from '../quiz/services/quiz.service';
import { SearchInputComponent } from '../../shared/components/search-input/search-input.component';
import { matchesSearch } from '../../shared/utils/search-filter';
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
  imports: [CommonModule, RouterLink, SearchInputComponent],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private quizService = inject(QuizService);

  data: DashboardData | null = null;
  dueItems: DueItem[] = [];
  loading = true;
  generatingNoteId: number | null = null;
  reviewExpanded = false;
  searchQuery = '';
  creatingQuickNote = false;
  private quickNotesTopic: QuizTopic | null = null;
  private quickNoteCounter = 0;

  // All items for search
  allConcepts: QuizConcept[] = [];
  allProblems: Problem[] = [];

  ngOnInit() {
    this.loadData();
    this.loadSearchData();
    this.quizService.findOrCreateQuickNotes().subscribe({
      next: (topic) => this.quickNotesTopic = topic
    });
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && event.urlAfterRedirects === '/dashboard') {
        this.loadData();
        this.loadSearchData();
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

    this.router.navigate(['/quiz', 'concepts', concept.id, 'session'], {
      state: { questionCount: concept.questionCount || 5, conceptName: concept.name, topicName: concept.topicName, topicId: concept.topicId }
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

  get filteredRecentConcepts(): QuizConcept[] {
    if (!this.data?.recentConcepts) return [];
    return this.data.recentConcepts;
  }

  get filteredDueItems(): DueItem[] {
    return this.dueItems;
  }

  get dueNotes(): DueItem[] {
    return this.filteredDueItems.filter(i => i.type === 'concept');
  }

  get dueLeetcode(): DueItem[] {
    return this.filteredDueItems.filter(i => i.type === 'leetcode');
  }

  get searchResultNotes(): QuizConcept[] {
    if (!this.searchQuery) return [];
    return this.allConcepts.filter(c => matchesSearch(this.searchQuery, c.name, c.topicName));
  }

  get searchResultProblems(): Problem[] {
    if (!this.searchQuery) return [];
    return this.allProblems.filter(p => matchesSearch(this.searchQuery, p.title));
  }

  dueLabel(nextReview: string): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const review = new Date(nextReview + 'T00:00:00');
    const days = Math.round((review.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
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

  private loadSearchData() {
    this.quizService.findAllConcepts().subscribe(c => this.allConcepts = c);
    this.http.get<Problem[]>('/api/leetcode').subscribe(p => this.allProblems = p);
  }
}
