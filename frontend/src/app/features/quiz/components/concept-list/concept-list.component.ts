import { Component, HostListener, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { QuizService } from '../../services/quiz.service';
import { QuizConcept, QuizSession } from '../../models/quiz.model';

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
  concepts: QuizConcept[] = [];
  loading = true;
  activeTab: 'due' | 'all' = 'due';
  showAddForm = false;
  addName = '';
  addError = '';
  expandedConceptId: number | null = null;
  sessionHistory: QuizSession[] = [];
  generatingConceptId: number | null = null;
  deletedConcept: QuizConcept | null = null;
  private deleteTimer: any = null;

  @HostListener('document:click')
  closeMenus() {
    this.showAddForm = false;
  }

  ngOnInit() {
    this.topicId = Number(this.route.snapshot.paramMap.get('topicId'));
    this.topicName = history.state?.topicName || '';
    this.loadConcepts();
  }

  loadConcepts() {
    this.quizService.findConcepts(this.topicId).subscribe(concepts => {
      this.concepts = concepts;
      this.loading = false;
    });
  }

  get filteredConcepts(): QuizConcept[] {
    if (this.activeTab === 'due') return this.concepts.filter(c => this.isDue(c));
    return this.concepts;
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
    if (concept.status === 'new') return 'New';
    const days = this.daysUntilReview(concept);
    if (days < 0) return `${Math.abs(days)}d overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  }

  nextReviewColor(concept: QuizConcept): string {
    if (concept.status === 'new') return 'text-gray-400';
    const days = this.daysUntilReview(concept);
    if (days < 0) return 'text-red-500';
    if (days === 0) return 'text-blue-600';
    if (days === 1) return 'text-orange-500';
    if (days <= 3) return 'text-violet-500';
    return 'text-gray-500';
  }

  statusLabel(concept: QuizConcept): string {
    return { 'new': 'New', 'learning': 'Learning', 'review': 'Review', 'mastered': 'Mastered' }[concept.status] ?? 'New';
  }

  statusColor(concept: QuizConcept): string {
    return {
      'new': 'text-gray-400',
      'learning': 'text-amber-500',
      'review': 'text-blue-500',
      'mastered': 'text-emerald-500'
    }[concept.status] ?? 'text-gray-400';
  }

  toggleExpand(concept: QuizConcept, event: Event) {
    event.stopPropagation();
    if (this.expandedConceptId === concept.id) {
      this.expandedConceptId = null;
      return;
    }
    this.expandedConceptId = concept.id;
    this.sessionHistory = [];
    this.quizService.getSessions(concept.id).subscribe(sessions => {
      this.sessionHistory = sessions;
    });
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

  toggleAddForm(event: Event) {
    event.stopPropagation();
    this.showAddForm = !this.showAddForm;
    this.addName = '';
    this.addError = '';
  }

  submitConcept(event: Event) {
    event.preventDefault();
    if (!this.addName.trim()) return;
    this.addError = '';

    this.quizService.createConcept(this.topicId, this.addName.trim()).subscribe({
      next: () => {
        this.showAddForm = false;
        this.addName = '';
        this.loadConcepts();
      },
      error: (err) => this.addError = err.error?.detail || 'Failed to add concept'
    });
  }

  qualityLabel(quality: number): string {
    return { 0: 'Fail', 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Great', 5: 'Perfect' }[quality] ?? `Q${quality}`;
  }

  qualityColor(quality: number): string {
    if (quality <= 1) return 'text-red-500';
    if (quality <= 2) return 'text-orange-500';
    if (quality <= 3) return 'text-blue-500';
    return 'text-emerald-500';
  }
}
