import { Component, inject, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { QuizService } from '../../services/quiz.service';
import { QuizConcept } from '../../models/quiz.model';
import { Subject, debounceTime } from 'rxjs';

@Component({
  selector: 'app-note-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-3xl mx-auto px-6 py-8">
      <div class="flex items-center gap-3 mb-8">
        <a [routerLink]="['/quiz', topicId, 'concepts']"
           class="p-2 rounded-lg text-gray-300 hover:text-sky-600 hover:bg-sky-50 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </a>
        <span class="text-sm text-gray-400">{{ topicName }}</span>
        @if (saving) {
          <span class="text-xs text-gray-400 ml-auto">Saving...</span>
        } @else if (saved) {
          <span class="text-xs text-gray-400 ml-auto">Saved</span>
        }
      </div>

      <input #titleInput
             type="text"
             [(ngModel)]="title"
             (ngModelChange)="onTitleChange()"
             (keydown.enter)="focusContent()"
             placeholder="Untitled"
             class="w-full text-3xl font-semibold text-gray-900 placeholder-gray-300 border-none outline-none mb-4" />

      <textarea #contentInput
                [(ngModel)]="content"
                (ngModelChange)="onContentChange()"
                placeholder="Start typing your notes..."
                class="w-full text-base text-gray-700 placeholder-gray-300 border-none outline-none resize-none leading-relaxed"
                rows="20"></textarea>
    </div>
  `
})
export class NoteEditorComponent implements OnInit, OnDestroy, AfterViewInit {
  private quizService = inject(QuizService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  @ViewChild('titleInput') titleInput!: ElementRef<HTMLInputElement>;
  @ViewChild('contentInput') contentInput!: ElementRef<HTMLTextAreaElement>;

  topicId = 0;
  topicName = '';
  conceptId: number | null = null;
  title = '';
  content = '';
  saving = false;
  saved = false;

  private save$ = new Subject<void>();
  private created = false;

  ngOnInit() {
    this.topicId = Number(this.route.snapshot.paramMap.get('topicId'));
    this.conceptId = this.route.snapshot.paramMap.has('conceptId')
      ? Number(this.route.snapshot.paramMap.get('conceptId'))
      : null;
    this.topicName = history.state?.topicName || '';

    if (this.conceptId) {
      this.created = true;
      const concept: QuizConcept | undefined = history.state?.concept;
      if (concept) {
        this.title = concept.name;
        this.content = concept.content || '';
      } else {
        this.quizService.findConcepts(this.topicId).subscribe(concepts => {
          const c = concepts.find(x => x.id === this.conceptId);
          if (c) {
            this.title = c.name;
            this.content = c.content || '';
          }
        });
      }
    }

    if (!this.topicName) {
      this.quizService.findAllTopics().subscribe(topics => {
        this.topicName = topics.find(t => t.id === this.topicId)?.name || 'Topic';
      });
    }

    this.save$.pipe(debounceTime(600)).subscribe(() => this.persist());
  }

  ngAfterViewInit() {
    if (!this.conceptId) {
      this.titleInput.nativeElement.focus();
    } else {
      this.contentInput.nativeElement.focus();
    }
  }

  ngOnDestroy() {
    this.save$.complete();
    this.persist();
  }

  focusContent() {
    this.contentInput.nativeElement.focus();
  }

  onTitleChange() {
    this.save$.next();
  }

  onContentChange() {
    this.save$.next();
  }

  private persist() {
    const name = this.title.trim();
    if (!name) return;

    this.saving = true;
    this.saved = false;

    if (!this.created) {
      this.created = true;
      this.quizService.createConcept(this.topicId, {
        name,
        content: this.content || undefined
      }).subscribe({
        next: (concept) => {
          this.conceptId = concept.id;
          this.saving = false;
          this.saved = true;
        },
        error: () => {
          this.saving = false;
          this.created = false;
        }
      });
    } else if (this.conceptId) {
      this.quizService.updateConcept(this.conceptId, {
        name,
        content: this.content || null
      }).subscribe({
        next: () => {
          this.saving = false;
          this.saved = true;
        },
        error: () => this.saving = false
      });
    }
  }
}
