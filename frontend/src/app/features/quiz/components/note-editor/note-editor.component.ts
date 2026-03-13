import { Component, inject, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { QuizService } from '../../services/quiz.service';
import { QuizConcept, QuizTopic } from '../../models/quiz.model';
import { Subject, debounceTime } from 'rxjs';
import { Editor, Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import Placeholder from '@tiptap/extension-placeholder';
import TiptapImage from '@tiptap/extension-image';
import { Plugin } from '@tiptap/pm/state';
import { TiptapEditorDirective } from 'ngx-tiptap';
import Suggestion, { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion';
import { TermBlock } from './term-block.extension';
import { PdfAttachment } from './pdf-attachment.extension';

interface SlashCommandItem {
  label: string;
  icon: string;
  action: (editor: Editor) => void;
}

const SLASH_COMMANDS: SlashCommandItem[] = [
  {
    label: 'Heading 1', icon: 'H1',
    action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run()
  },
  {
    label: 'Heading 2', icon: 'H2',
    action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run()
  },
  {
    label: 'Heading 3', icon: 'H3',
    action: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run()
  },
  {
    label: 'Bullet List', icon: '•',
    action: (editor) => editor.chain().focus().toggleBulletList().run()
  },
  {
    label: 'Numbered List', icon: '1.',
    action: (editor) => editor.chain().focus().toggleOrderedList().run()
  },
  {
    label: 'Code Block', icon: '<>',
    action: (editor) => editor.chain().focus().toggleCodeBlock().run()
  },
  {
    label: 'Quote', icon: '"',
    action: (editor) => editor.chain().focus().toggleBlockquote().run()
  },
  {
    label: 'Divider', icon: '—',
    action: (editor) => editor.chain().focus().setHorizontalRule().run()
  },
  {
    label: 'Term', icon: 'Tt',
    action: (editor) => {
      editor.chain().focus().insertContent([
        { type: 'paragraph', content: [{ type: 'text', text: 'Definitions', marks: [{ type: 'bold' }] }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }] },
      ]).run();
    }
  },
];

@Component({
  selector: 'app-note-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TiptapEditorDirective],
  template: `
    <div class="max-w-3xl mx-auto px-6 py-8"
         (dragover)="onDragOver($event)"
         (dragleave)="onDragLeave($event)"
         (drop)="onDrop($event)">

      <div class="flex items-center gap-3 mb-8">
        <button (click)="goBack()"
           class="p-2 rounded-lg text-gray-300 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <a [routerLink]="['/quiz', topicId, 'concepts']"
           class="text-sm text-gray-400 hover:text-sky-600 transition-colors">{{ topicName }}</a>
        <div class="ml-auto flex items-center gap-2">
          <!-- PDF upload trigger -->
          <input #pdfInput type="file" accept=".pdf" class="hidden" (change)="onPdfSelected($event)" />
          <button (click)="pdfInput.click()"
                  [disabled]="uploadingPdf"
                  class="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  [title]="pdfFilename ? 'Replace PDF' : 'Upload PDF'">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
            </svg>
          </button>

          <button (click)="openMoveModal()" title="Move to subject"
                  class="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
            </svg>
          </button>

          <div class="relative">
            <button (click)="fontMenuOpen = !fontMenuOpen; $event.stopPropagation()"
                    class="w-7 h-7 flex items-center justify-center rounded text-sm font-medium text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">A</button>
            @if (fontMenuOpen) {
              <div class="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50"
                   (click)="$event.stopPropagation()">
                <label class="text-xs text-gray-500 mb-2 block">Font size</label>
                <input #fontInput type="number" min="9" max="15" step="1"
                       [placeholder]="fontSizeDisplay"
                       (change)="onFontSizeInput($event); fontMenuOpen = false"
                       (keydown.enter)="onFontSizeInput($event); fontMenuOpen = false"
                       class="w-16 text-center text-sm text-gray-700 border border-gray-200 rounded-md px-2 py-1 focus:border-sky-400 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
              </div>
            }
          </div>
          @if (saving) {
            <span class="text-xs text-gray-400">Saving...</span>
          } @else if (saved) {
            <span class="text-xs text-gray-400">Saved</span>
          }
        </div>
      </div>

      <input #titleInput
             type="text"
             [(ngModel)]="title"
             (ngModelChange)="onTitleChange()"
             (keydown.enter)="focusEditor()"
             placeholder="Untitled"
             class="w-full text-3xl font-semibold text-gray-900 placeholder-gray-300 border-none outline-none mb-4" />

      @if (uploadingPdf) {
        <div class="flex items-center gap-3 px-4 py-3 mb-4 bg-sky-50 border border-sky-200 rounded-xl">
          <svg class="w-5 h-5 animate-spin text-sky-500 flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <span class="text-sm font-medium text-sky-700">Uploading PDF...</span>
        </div>
      }

      <div class="relative tiptap-wrapper">
        @if (draggingOver) {
          <div class="absolute inset-0 z-40 bg-sky-50/80 border-2 border-dashed border-sky-400 rounded-2xl flex items-center justify-center pointer-events-none">
            <div class="text-center">
              <svg class="w-10 h-10 text-sky-400 mx-auto mb-2" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1"/>
              </svg>
              <span class="text-sm font-medium text-sky-600">Drop file to attach</span>
            </div>
          </div>
        }
        <tiptap-editor [editor]="editor" (ngModelChange)="onContentChange()" [(ngModel)]="editorContent" outputFormat="html"></tiptap-editor>

        @if (slashMenuVisible && filteredCommands.length > 0) {
          <div class="absolute z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-56"
               [style.top.px]="slashMenuTop"
               [style.left.px]="slashMenuLeft"
               (mousedown)="$event.preventDefault()">
            @for (cmd of filteredCommands; track cmd.label; let i = $index) {
              <button (click)="executeSlashCommand(i)"
                      [class]="'w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors ' + (i === slashSelectedIndex ? 'bg-sky-50 text-sky-700' : 'text-gray-700 hover:bg-gray-50')">
                <span [class]="'w-7 h-7 flex items-center justify-center rounded-md text-xs font-semibold ' + (i === slashSelectedIndex ? 'bg-sky-100 text-sky-600' : 'bg-gray-100 text-gray-500')">
                  {{ cmd.icon }}
                </span>
                <span>{{ cmd.label }}</span>
              </button>
            }
          </div>
        }
      </div>
    </div>

    <!-- PDF preview modal -->
    @if (pdfPreviewUrl) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
           (click)="closePdfPreview()">
        <div class="bg-white rounded-2xl shadow-2xl w-[90vw] h-[90vh] max-w-5xl flex flex-col overflow-hidden"
             (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <span class="text-sm font-medium text-gray-700 truncate">{{ pdfFilename }}</span>
            <div class="flex items-center gap-2">
              <button (click)="downloadPdf()"
                      class="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                Download
              </button>
              <button (click)="closePdfPreview()"
                      class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="flex-1 overflow-hidden">
            <iframe [src]="pdfPreviewUrl" class="w-full h-full border-none"></iframe>
          </div>
        </div>
      </div>
    }

    <!-- Image lightbox -->
    @if (imagePreviewSrc) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
           (click)="imagePreviewSrc = null">
        <img [src]="imagePreviewSrc"
             class="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
             (click)="$event.stopPropagation()" />
      </div>
    }

    <!-- Delete toast -->
    @if (deletedAttachment) {
      <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-gray-900 text-white text-sm rounded-xl shadow-lg">
        <span>Deleted "{{ deletedAttachment.name }}"</span>
        <button (click)="undoDeleteAttachment()"
                class="font-semibold text-sky-400 hover:text-sky-300 transition-colors cursor-pointer">
          Undo
        </button>
      </div>
    }

    <!-- Move to subject modal -->
    @if (showMoveModal) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
           (click)="skipMove()">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
             (click)="$event.stopPropagation()">
          <div class="px-5 pt-5 pb-3">
            <h3 class="text-lg font-semibold text-gray-900">Move to subject</h3>
            <p class="text-sm text-gray-400 mt-1">Which subject does this note belong to?</p>
          </div>
          <div class="max-h-64 overflow-y-auto px-3 pb-2">
            @for (topic of moveTopics; track topic.id) {
              <button (click)="moveToTopic(topic)"
                      [class]="'w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ' +
                        (topic.name === 'Quick Notes' ? 'text-gray-400 hover:bg-gray-50' : 'text-gray-700 hover:bg-sky-50 hover:text-sky-700')">
                {{ topic.name }}
              </button>
            }
          </div>
          <div class="px-5 py-3 border-t border-gray-100 flex justify-between items-center">
            <button (click)="skipMove()"
                    class="text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
              Keep in {{ topicName }}
            </button>
            <button (click)="createAndMove()"
                    class="text-sm font-medium text-sky-500 hover:text-sky-600 transition-colors cursor-pointer">
              New subject
            </button>
          </div>
        </div>
      </div>
    }

    <!-- New subject input modal -->
    @if (showNewSubjectInput) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
           (click)="showNewSubjectInput = false; showMoveModal = true">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-5"
             (click)="$event.stopPropagation()">
          <h3 class="text-lg font-semibold text-gray-900 mb-3">New subject</h3>
          <form (submit)="submitNewSubject($event)">
            <input #newSubjectInput type="text" [(ngModel)]="newSubjectName" name="name"
                   placeholder="Subject name"
                   class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-sky-400" />
            <div class="flex justify-end gap-2 mt-4">
              <button type="button" (click)="showNewSubjectInput = false; showMoveModal = true"
                      class="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer">Cancel</button>
              <button type="submit"
                      class="px-4 py-2 text-sm font-medium bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors cursor-pointer">Create & Move</button>
            </div>
          </form>
        </div>
      </div>
    }
  `
})
export class NoteEditorComponent implements OnInit, OnDestroy, AfterViewInit {
  private quizService = inject(QuizService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  @ViewChild('titleInput') titleInput!: ElementRef<HTMLInputElement>;

  topicId = 0;
  topicName = '';
  backRoute: string[] = [];
  conceptId: number | null = null;
  title = '';
  editorContent = '';
  saving = false;
  saved = false;
  pdfFilename: string | null = null;
  uploadingPdf = false;
  pdfPreviewUrl: SafeResourceUrl | null = null;
  imagePreviewSrc: string | null = null;
  draggingOver = false;
  deletedAttachment: { type: 'pdf' | 'image'; name: string } | null = null;
  private deleteTimer: any = null;

  // Move-to-subject modal
  showMoveModal = false;
  showNewSubjectInput = false;
  newSubjectName = '';
  moveTopics: QuizTopic[] = [];

  // Slash menu state (driven by suggestion plugin callbacks)
  slashMenuVisible = false;
  slashMenuTop = 0;
  slashMenuLeft = 0;
  slashSelectedIndex = 0;
  filteredCommands: SlashCommandItem[] = [];
  private slashCommandFn: ((props: SlashCommandItem) => void) | null = null;

  fontSize = 1.1; // rem
  fontMenuOpen = false;
  get fontSizeDisplay(): number { return Math.round(this.fontSize * 10); }

  @HostListener('document:click')
  closeFontMenu() { this.fontMenuOpen = false; }
  private static readonly FONT_SIZE_KEY = 'editor-font-size';
  private static readonly FONT_SIZE_MIN = 0.9;
  private static readonly FONT_SIZE_MAX = 1.5;

  editor!: Editor;
  private save$ = new Subject<void>();
  private created = false;

  ngOnInit() {
    const stored = localStorage.getItem(NoteEditorComponent.FONT_SIZE_KEY);
    if (stored) this.fontSize = parseFloat(stored);
    this.applyFontSize();

    this.topicId = Number(this.route.snapshot.paramMap.get('topicId'));
    this.conceptId = this.route.snapshot.paramMap.has('conceptId')
      ? Number(this.route.snapshot.paramMap.get('conceptId'))
      : null;
    this.topicName = history.state?.topicName || '';
    this.backRoute = history.state?.from === 'dashboard'
      ? ['/dashboard']
      : ['/quiz', String(this.topicId), 'concepts'];

    this.editor = new Editor({
      editorProps: {
        scrollThreshold: 100,
        scrollMargin: 100,
      },
      extensions: [
        StarterKit.configure({
          bulletList: false,
          orderedList: false,
          dropcursor: { color: '#0ea5e9', width: 3 },
        }),
        BulletList.extend({ addInputRules() { return []; } }),
        OrderedList.extend({ addInputRules() { return []; } }),
        Placeholder.configure({ placeholder: 'Type / for commands...' }),
        TiptapImage.configure({ inline: false, allowBase64: false }).extend({
          addNodeView() {
            return ({ node }) => {
              const wrapper = document.createElement('div');
              wrapper.classList.add('editor-image-wrapper');
              wrapper.contentEditable = 'false';

              const img = document.createElement('img');
              img.src = node.attrs['src'];
              if (node.attrs['alt']) img.alt = node.attrs['alt'];
              if (node.attrs['title']) img.title = node.attrs['title'];

              const zoom = document.createElement('div');
              zoom.classList.add('editor-image-zoom');
              zoom.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                <path d="M11 8v6M8 11h6"/>
              </svg>`;

              wrapper.appendChild(img);
              wrapper.appendChild(zoom);

              return { dom: wrapper, stopEvent: () => false };
            };
          },
        }),
        TermBlock,
        PdfAttachment,
        this.createSlashCommandExtension(),
        this.createImagePasteExtension(),
      ],
    });

    // Listen for custom events from PDF attachment node
    this.editor.view.dom.addEventListener('pdf-load', ((e: CustomEvent) => {
      this.loadPdfIntoIframe(e.detail.iframe);
    }) as EventListener);
    this.editor.view.dom.addEventListener('pdf-fullscreen', () => this.openPdfPreview());
    this.editor.view.dom.addEventListener('pdf-remove', () => this.removePdf());

    // Click image to open lightbox
    this.editor.view.dom.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' && target.closest('.ProseMirror')) {
        this.imagePreviewSrc = (target as HTMLImageElement).src;
      }
    });

    if (this.conceptId) {
      this.created = true;
      const concept: QuizConcept | undefined = history.state?.concept;
      if (concept) {
        this.title = concept.name;
        this.pdfFilename = concept.pdfFilename;
        this.loadContent(concept.content || '');
      } else {
        this.quizService.findConcepts(this.topicId).subscribe(concepts => {
          const c = concepts.find(x => x.id === this.conceptId);
          if (c) {
            this.title = c.name;
            this.pdfFilename = c.pdfFilename;
            this.loadContent(c.content || '');
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
      this.editor.commands.focus();
    }
  }

  ngOnDestroy() {
    clearTimeout(this.deleteTimer);
    this.save$.complete();
    this.persist();
    this.editor.destroy();
  }

  focusEditor() {
    this.editor.commands.focus();
  }

  onTitleChange() {
    this.save$.next();
  }

  onContentChange() {
    this.save$.next();
  }

  onFontSizeInput(event: Event) {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    if (isNaN(value)) return;
    this.fontSize = Math.min(Math.max(value / 10, NoteEditorComponent.FONT_SIZE_MIN), NoteEditorComponent.FONT_SIZE_MAX);
    localStorage.setItem(NoteEditorComponent.FONT_SIZE_KEY, String(this.fontSize));
    this.applyFontSize();
  }

  onPdfSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = '';

    if (!this.conceptId) {
      // Auto-save note first, then upload
      this.persistSync(() => this.doUploadPdf(file));
      return;
    }
    this.doUploadPdf(file);
  }

  private doUploadPdf(file: File) {
    if (!this.conceptId) return;
    this.uploadingPdf = true;
    this.quizService.uploadPdf(this.conceptId, file).subscribe({
      next: (concept) => {
        this.pdfFilename = concept.pdfFilename;
        this.uploadingPdf = false;
        // Remove any existing pdf attachment node first
        this.removeExistingPdfNode();
        // Insert at cursor position
        this.editor.chain().focus().insertPdfAttachment(concept.pdfFilename!).run();
      },
      error: () => this.uploadingPdf = false,
    });
  }

  private removeExistingPdfNode() {
    const { doc, tr } = this.editor.state;
    doc.descendants((node, pos): boolean => {
      if (node.type.name === 'pdfAttachment') {
        tr.delete(pos, pos + node.nodeSize);
        return false;
      }
      return true;
    });
    if (tr.docChanged) {
      this.editor.view.dispatch(tr);
    }
  }

  removePdf() {
    if (!this.conceptId || !this.pdfFilename) return;
    const filename = this.pdfFilename;
    this.removeExistingPdfNode();
    this.pdfFilename = null;

    this.showDeleteToast({ type: 'pdf', name: filename }, () => {
      this.quizService.removePdf(this.conceptId!).subscribe();
    }, () => {
      this.pdfFilename = filename;
      this.editor.chain().focus().insertPdfAttachment(filename).run();
      // Reload PDF into the new iframe
      setTimeout(() => {
        const iframe = this.editor.view.dom.querySelector('.pdf-attachment-preview iframe') as HTMLIFrameElement;
        if (iframe) this.loadPdfIntoIframe(iframe);
      }, 100);
    });
  }

  private showDeleteToast(item: { type: 'pdf' | 'image'; name: string }, onConfirm: () => void, onUndo: () => void) {
    clearTimeout(this.deleteTimer);
    this.deletedAttachment = item;
    this.deleteTimer = setTimeout(() => {
      this.deletedAttachment = null;
      onConfirm();
    }, 4000);

    this._undoAction = onUndo;
  }

  private _undoAction: (() => void) | null = null;

  undoDeleteAttachment() {
    clearTimeout(this.deleteTimer);
    this.deletedAttachment = null;
    this._undoAction?.();
    this._undoAction = null;
  }

  downloadPdf() {
    if (!this.conceptId) return;
    this.quizService.downloadPdf(this.conceptId).subscribe(res => {
      const blob = res.body;
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = this.pdfFilename || 'document.pdf';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  openPdfPreview() {
    if (!this.conceptId) return;
    this.quizService.downloadPdf(this.conceptId).subscribe(res => {
      const blob = res.body;
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      this.pdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    });
  }

  private loadPdfIntoIframe(iframe: HTMLIFrameElement) {
    if (!this.conceptId) return;
    this.quizService.downloadPdf(this.conceptId).subscribe(res => {
      const blob = res.body;
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      iframe.src = url;
    });
  }

  closePdfPreview() {
    this.pdfPreviewUrl = null;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.types.includes('Files')) {
      this.draggingOver = true;
    }
  }

  onDragLeave(event: DragEvent) {
    const related = event.relatedTarget as Node | null;
    const container = (event.currentTarget as HTMLElement);
    if (!related || !container.contains(related)) {
      this.draggingOver = false;
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.draggingOver = false;
    const file = event.dataTransfer?.files[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      if (!this.conceptId) {
        this.persistSync(() => this.doUploadPdf(file));
        return;
      }
      this.doUploadPdf(file);
    } else if (file.type.startsWith('image/')) {
      if (!this.conceptId) {
        this.persistSync(() => this.doUploadImage(file));
        return;
      }
      this.doUploadImage(file);
    }
  }

  doUploadImage(file: File) {
    if (!this.conceptId) return;
    this.quizService.uploadImage(this.conceptId, file).subscribe({
      next: ({ url }) => {
        this.editor.chain().focus()
          .setImage({ src: url })
          .createParagraphNear()
          .run();
      },
    });
  }

  private persistSync(callback: () => void) {
    const name = this.title.trim();
    if (!name) return;

    const content = this.editor.getHTML();
    const htmlContent = content === '<p></p>' ? null : content;
    const terms = this.extractTerms();
    const termsJson = terms.length > 0 ? JSON.stringify(terms) : null;

    if (!this.created) {
      this.created = true;
      this.quizService.createConcept(this.topicId, {
        name,
        content: htmlContent || undefined,
        terms: termsJson || undefined
      }).subscribe({
        next: (concept) => {
          this.conceptId = concept.id;
          this.saving = false;
          this.saved = true;
          callback();
        },
        error: () => {
          this.saving = false;
          this.created = false;
        }
      });
    } else {
      callback();
    }
  }

  private applyFontSize() {
    document.documentElement.style.setProperty('--editor-font-size', `${this.fontSize}rem`);
  }

  executeSlashCommand(index: number) {
    const cmd = this.filteredCommands[index];
    if (this.slashCommandFn && cmd) {
      this.slashCommandFn(cmd);
    }
  }

  private loadContent(content: string) {
    this.editorContent = content;
    this.editor.commands.setContent(content);
  }

  private createSlashCommandExtension(): Extension {
    const component = this;

    return Extension.create({
      name: 'slashCommands',
      addProseMirrorPlugins() {
        return [
          Suggestion<SlashCommandItem>({
            editor: this.editor,
            char: '/',
            startOfLine: true,
            items: ({ query }) => {
              if (!query) return SLASH_COMMANDS;
              const q = query.toLowerCase();
              return SLASH_COMMANDS.filter(c => c.label.toLowerCase().includes(q));
            },
            command: ({ editor, range, props }: { editor: Editor; range: any; props: any }) => {
              editor.chain().focus().deleteRange(range).run();
              props.action(editor);
            },
            render: () => {
              return {
                onStart: (props: SuggestionProps<SlashCommandItem>) => {
                  component.filteredCommands = props.items;
                  component.slashSelectedIndex = 0;
                  component.slashCommandFn = props.command as (props: SlashCommandItem) => void;
                  component.positionSlashMenu(props);
                  component.slashMenuVisible = true;
                },
                onUpdate: (props: SuggestionProps<SlashCommandItem>) => {
                  component.filteredCommands = props.items;
                  component.slashSelectedIndex = 0;
                  component.slashCommandFn = props.command as (props: SlashCommandItem) => void;
                  component.positionSlashMenu(props);
                  if (props.items.length === 0) {
                    component.slashMenuVisible = false;
                  }
                },
                onKeyDown: (props: SuggestionKeyDownProps) => {
                  const { event } = props;
                  if (event.key === 'ArrowDown') {
                    component.slashSelectedIndex = Math.min(
                      component.slashSelectedIndex + 1,
                      component.filteredCommands.length - 1
                    );
                    return true;
                  }
                  if (event.key === 'ArrowUp') {
                    component.slashSelectedIndex = Math.max(component.slashSelectedIndex - 1, 0);
                    return true;
                  }
                  if (event.key === 'Enter') {
                    component.executeSlashCommand(component.slashSelectedIndex);
                    return true;
                  }
                  if (event.key === 'Escape') {
                    component.slashMenuVisible = false;
                    return true;
                  }
                  return false;
                },
                onExit: () => {
                  component.slashMenuVisible = false;
                  component.slashCommandFn = null;
                },
              };
            },
          }),
        ];
      },
    });
  }

  private createImagePasteExtension(): Extension {
    const component = this;
    return Extension.create({
      name: 'imagePaste',
      addProseMirrorPlugins() {
        return [
          new Plugin({
            props: {
              handlePaste(_view, event) {
                const files = Array.from(event.clipboardData?.files || []);
                const image = files.find(f => f.type.startsWith('image/'));
                if (!image) return false;
                event.preventDefault();
                if (!component.conceptId) {
                  component.persistSync(() => component.doUploadImage(image));
                } else {
                  component.doUploadImage(image);
                }
                return true;
              },
            },
          }),
        ];
      },
    });
  }

  private positionSlashMenu(props: SuggestionProps<SlashCommandItem>) {
    const rect = props.clientRect?.();
    if (!rect) return;
    const wrapperEl = this.editor.view.dom.closest('.tiptap-wrapper');
    if (!wrapperEl) return;
    const wrapperRect = wrapperEl.getBoundingClientRect();
    this.slashMenuTop = rect.bottom - wrapperRect.top + 4;
    this.slashMenuLeft = rect.left - wrapperRect.left;
  }

  private extractTerms(): { term: string; definition: string }[] {
    const terms: { term: string; definition: string }[] = [];
    const json = this.editor.getJSON();
    if (!json.content) return terms;

    for (const node of json.content) {
      // Bullet list items with "term: definition" or "term - definition"
      if (node.type === 'bulletList' && node.content) {
        for (const li of node.content) {
          const text = this.extractTextFromNode(li);
          const colonIdx = text.indexOf(':');
          const dashIdx = text.indexOf(' - ');
          let sepIdx = -1;
          let sepLen = 1;
          if (colonIdx > 0 && (dashIdx < 0 || colonIdx <= dashIdx)) {
            sepIdx = colonIdx; sepLen = 1;
          } else if (dashIdx > 0) {
            sepIdx = dashIdx; sepLen = 3;
          }
          if (sepIdx > 0) {
            const term = text.substring(0, sepIdx).trim();
            const definition = text.substring(sepIdx + sepLen).trim();
            if (term) terms.push({ term, definition });
          }
        }
      }

      // Legacy: support old termBlock nodes
      if (node.type === 'termBlock') {
        const t = (node.attrs?.['term'] || '').trim();
        const d = node.attrs?.['definition'] || '';
        if (t) terms.push({ term: t, definition: d });
      }
    }
    return terms;
  }

  private extractTextFromNode(node: any): string {
    if (node.text) return node.text;
    if (!node.content) return '';
    return node.content.map((child: any) => this.extractTextFromNode(child)).join('');
  }

  // Move to subject
  private navigateAfterMove = false;

  goBack() {
    this.router.navigate(this.backRoute);
  }

  openMoveModal() {
    if (!this.conceptId) return;
    this.navigateAfterMove = false;
    this.fetchAndShowMoveModal();
  }

  private fetchAndShowMoveModal() {
    this.quizService.findAllTopics().subscribe(topics => {
      this.moveTopics = topics.filter(t => t.id !== this.topicId);
      this.showMoveModal = true;
    });
  }

  private afterMove() {
    if (this.navigateAfterMove) {
      this.router.navigate(this.backRoute);
    }
  }

  moveToTopic(topic: QuizTopic) {
    this.showMoveModal = false;
    if (!this.conceptId) return;
    this.quizService.moveConcept(this.conceptId, topic.id).subscribe({
      next: (updated) => {
        this.topicId = topic.id;
        this.topicName = topic.name;
        this.backRoute = ['/quiz', String(topic.id), 'concepts'];
        this.afterMove();
      },
      error: () => this.afterMove()
    });
  }

  skipMove() {
    this.showMoveModal = false;
    if (this.navigateAfterMove) {
      this.router.navigate(this.backRoute);
    }
  }

  createAndMove() {
    this.showMoveModal = false;
    this.showNewSubjectInput = true;
    this.newSubjectName = '';
  }

  submitNewSubject(event: Event) {
    event.preventDefault();
    const name = this.newSubjectName.trim();
    if (!name || !this.conceptId) return;
    this.showNewSubjectInput = false;
    this.quizService.createTopic(name).subscribe({
      next: (topic) => {
        this.quizService.moveConcept(this.conceptId!, topic.id).subscribe({
          next: () => {
            this.topicId = topic.id;
            this.topicName = topic.name;
            this.backRoute = ['/quiz', String(topic.id), 'concepts'];
            this.afterMove();
          },
          error: () => this.afterMove()
        });
      },
      error: () => this.afterMove()
    });
  }

  private persist() {
    const name = this.title.trim();
    if (!name) return;

    const content = this.editor.getHTML();
    const htmlContent = content === '<p></p>' ? null : content;
    const terms = this.extractTerms();
    const termsJson = terms.length > 0 ? JSON.stringify(terms) : null;

    this.saving = true;
    this.saved = false;

    if (!this.created) {
      this.created = true;
      this.quizService.createConcept(this.topicId, {
        name,
        content: htmlContent || undefined,
        terms: termsJson || undefined
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
        content: htmlContent,
        terms: termsJson
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
