import { Component, inject, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { QuizService } from '../../services/quiz.service';
import { QuizConcept, QuizTopic } from '../../models/quiz.model';
import { ChatService } from '../../../../shared/services/chat.service';
import { Subject, Subscription, debounceTime } from 'rxjs';
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
import { MathBlock } from './math-block.extension';

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
  {
    label: 'Math', icon: '∑',
    action: (editor) => editor.commands.insertContent({ type: 'mathBlock', attrs: { formula: '' } })
  },
];

@Component({
  selector: 'app-note-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TiptapEditorDirective],
  templateUrl: './note-editor.component.html'
})
export class NoteEditorComponent implements OnInit, OnDestroy, AfterViewInit {
  private quizService = inject(QuizService);
  private chatService = inject(ChatService);
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
  private insertTermsSub?: Subscription;

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
        MathBlock,
        PdfAttachment,
        this.createTabIndentExtension(),
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

    this.insertTermsSub = this.chatService.insertTermsInNote$.subscribe(terms => {
      this.insertDefinitionsFromChat(terms);
    });
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
    this.insertTermsSub?.unsubscribe();
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

  private insertDefinitionsFromChat(terms: { term: string; definition: string }[]) {
    if (terms.length === 0) return;
    this.editor.chain().focus('end').insertContent([
      { type: 'paragraph', content: [{ type: 'text', text: 'Definitions', marks: [{ type: 'bold' }] }] },
      {
        type: 'bulletList',
        content: terms.map(t => ({
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: `${t.term}: ${t.definition}` }] }]
        }))
      },
    ]).run();
    this.save$.next();
  }

  private createTabIndentExtension(): Extension {
    return Extension.create({
      name: 'tabIndent',
      addKeyboardShortcuts() {
        return {
          Tab: () => {
            if (this.editor.isActive('listItem')) {
              return this.editor.commands.sinkListItem('listItem');
            }
            if (this.editor.isActive('codeBlock')) {
              return false;
            }
            return this.editor.chain().insertContent('    ').run();
          },
          'Shift-Tab': () => {
            if (this.editor.isActive('listItem')) {
              return this.editor.commands.liftListItem('listItem');
            }
            return false;
          },
          Backspace: () => {
            if (this.editor.isActive('listItem') || this.editor.isActive('codeBlock')) {
              return false;
            }
            const { state } = this.editor;
            const { from, empty } = state.selection;
            if (!empty) return false;
            const textBefore = state.doc.textBetween(Math.max(0, from - 4), from);
            if (textBefore === '    ') {
              return this.editor.chain().deleteRange({ from: from - 4, to: from }).run();
            }
            return false;
          },
        };
      },
    });
  }

  private createSlashCommandExtension(): Extension {
    const component = this;
    const allCommands: SlashCommandItem[] = [
      ...SLASH_COMMANDS,
      {
        label: 'Chat', icon: '✦',
        action: () => component.chatService.requestOpen()
      },
    ];

    return Extension.create({
      name: 'slashCommands',
      addProseMirrorPlugins() {
        return [
          Suggestion<SlashCommandItem>({
            editor: this.editor,
            char: '/',
            items: ({ query }) => {
              if (!query) return allCommands;
              const q = query.toLowerCase();
              return allCommands.filter(c => c.label.toLowerCase().includes(q));
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

    const nodes = json.content;
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      // Only extract from bullet lists preceded by a bold "Definitions" header
      if (node.type === 'bulletList' && node.content && this.isDefinitionsHeader(nodes[i - 1])) {
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

  private isDefinitionsHeader(node: any): boolean {
    if (!node || node.type !== 'paragraph') return false;
    const text = this.extractTextFromNode(node).trim().toLowerCase();
    if (text !== 'definitions') return false;
    return node.content?.[0]?.marks?.some((m: any) => m.type === 'bold') ?? false;
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
