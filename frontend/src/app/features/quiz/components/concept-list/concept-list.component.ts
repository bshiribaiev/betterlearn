import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { QuizService } from '../../services/quiz.service';
import { QuizConcept, QuizTopic, FlashcardTerm } from '../../models/quiz.model';

@Component({
  selector: 'app-concept-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './concept-list.component.html'
})
export class ConceptListComponent implements OnInit {
  private quizService = inject(QuizService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  topicId = 0;
  topicName = '';
  textbookName: string | null = null;
  textbookUrl: string | null = null;
  editingTextbook = false;
  editTextbookName = '';
  editTextbookUrl = '';
  concepts: QuizConcept[] = [];
  loading = true;
  activeTab: 'all' | 'due' = 'all';
  generatingConceptId: number | null = null;
  deletedConcept: QuizConcept | null = null;
  private deleteTimer: any = null;

  ngOnInit() {
    this.topicId = Number(this.route.snapshot.paramMap.get('topicId'));
    this.topicName = history.state?.topicName || '';
    this.textbookName = history.state?.textbookName ?? null;
    this.textbookUrl = history.state?.textbookUrl ?? null;
    if (!this.topicName) {
      this.loadTopicMetadata();
    }
    this.loadConcepts();

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {
      const id = Number(this.route.snapshot.paramMap.get('topicId'));
      if (id === this.topicId) this.loadConcepts();
    });
  }

  private loadTopicMetadata() {
    this.quizService.findAllTopics().subscribe(topics => {
      const topic = topics.find(t => t.id === this.topicId);
      if (topic) {
        this.topicName = topic.name;
        this.textbookName = topic.textbookName;
        this.textbookUrl = topic.textbookUrl;
      }
    });
  }

  startEditTextbook() {
    this.editingTextbook = true;
    this.editTextbookName = this.textbookName || '';
    this.editTextbookUrl = this.textbookUrl || '';
  }

  cancelEditTextbook() {
    this.editingTextbook = false;
  }

  saveTextbook() {
    const name = this.editTextbookName.trim() || null;
    const url = this.editTextbookUrl.trim() || null;
    this.quizService.updateTopic(this.topicId, {
      name: this.topicName,
      textbookName: name,
      textbookUrl: url,
    }).subscribe(updated => {
      this.textbookName = updated.textbookName;
      this.textbookUrl = updated.textbookUrl;
      this.editingTextbook = false;
    });
  }

  loadConcepts() {
    this.quizService.findConcepts(this.topicId).subscribe(concepts => {
      this.concepts = concepts;
      this.loading = false;
    });
  }

  get filteredConcepts(): QuizConcept[] {
    const list = this.activeTab === 'due' ? this.concepts.filter(c => this.isDue(c)) : this.concepts;
    return [...list].sort((a, b) => {
      const aDue = this.isDue(a) ? 0 : 1;
      const bDue = this.isDue(b) ? 0 : 1;
      return aDue - bDue;
    });
  }

  isDue(concept: QuizConcept): boolean {
    return this.daysUntilReview(concept) <= 0;
  }

  daysUntilReview(concept: QuizConcept): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const review = new Date(concept.nextReview + 'T00:00:00');
    return Math.round((review.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  nextReviewLabel(concept: QuizConcept): string {
    const days = this.daysUntilReview(concept);
    if (days < 0) return `${Math.abs(days)}d overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  }

  nextReviewColor(concept: QuizConcept): string {
    const days = this.daysUntilReview(concept);
    if (days <= 0) return 'text-red-500';
    return 'text-gray-500';
  }

  statusLabel(concept: QuizConcept): string {
    return { 'new': 'New', 'learning': 'Low', 'review': 'Medium', 'mastered': 'High' }[concept.status] ?? 'New';
  }

  statusColor(concept: QuizConcept): string {
    return {
      'new': 'text-gray-400',
      'learning': 'text-red-500',
      'review': 'text-amber-500',
      'mastered': 'text-emerald-500'
    }[concept.status] ?? 'text-gray-400';
  }

  setTab(tab: 'due' | 'all') {
    this.activeTab = tab;
  }

  generateQuiz(concept: QuizConcept, event: Event) {
    event.stopPropagation();
    this.generatingConceptId = concept.id;
    this.quizService.generate(concept.id).subscribe({
      next: (res) => {
        this.generatingConceptId = null;
        this.router.navigate(['/quiz', 'concepts', concept.id, 'session'], {
          state: { questions: res.questions, topicName: this.topicName, conceptName: concept.name }
        });
      },
      error: () => this.generatingConceptId = null
    });
  }

  hasTerms(concept: QuizConcept): boolean {
    if (!concept.terms) return false;
    try {
      const terms: FlashcardTerm[] = JSON.parse(concept.terms);
      return terms.length > 0;
    } catch {
      return false;
    }
  }

  startFlashcards(concept: QuizConcept, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/quiz', 'concepts', concept.id, 'flashcards'], {
      state: {
        terms: JSON.parse(concept.terms!),
        topicName: this.topicName,
        conceptName: concept.name,
        topicId: this.topicId,
      }
    });
  }

  deleteConcept(concept: QuizConcept, event: Event) {
    event.stopPropagation();
    this.concepts = this.concepts.filter(c => c.id !== concept.id);
    this.deletedConcept = concept;
    clearTimeout(this.deleteTimer);
    this.deleteTimer = setTimeout(() => this.confirmDelete(), 4000);
  }

  undoDelete() {
    clearTimeout(this.deleteTimer);
    if (this.deletedConcept) {
      this.loadConcepts();
      this.deletedConcept = null;
    }
  }

  private confirmDelete() {
    if (!this.deletedConcept) return;
    this.quizService.deleteConcept(this.deletedConcept.id).subscribe();
    this.deletedConcept = null;
  }
}
