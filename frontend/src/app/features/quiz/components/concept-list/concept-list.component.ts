import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { QuizService } from '../../services/quiz.service';
import { QuizConcept } from '../../models/quiz.model';

@Component({
  selector: 'app-concept-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
  generatingConceptId: number | null = null;
  deletedConcept: QuizConcept | null = null;
  private deleteTimer: any = null;

  ngOnInit() {
    this.topicId = Number(this.route.snapshot.paramMap.get('topicId'));
    this.topicName = history.state?.topicName || '';
    if (!this.topicName) {
      this.quizService.findAllTopics().subscribe(topics => {
        this.topicName = topics.find(t => t.id === this.topicId)?.name || 'Topic';
      });
    }
    this.loadConcepts();
  }

  loadConcepts() {
    this.quizService.findConcepts(this.topicId).subscribe(concepts => {
      this.concepts = concepts;
      this.loading = false;
      if (this.activeTab === 'due' && this.filteredConcepts.length === 0) {
        this.activeTab = 'all';
      }
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
