import { Component, inject, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { QuizService } from '../../services/quiz.service';
import { QuizConcept } from '../../models/quiz.model';
import { Subject, debounceTime } from 'rxjs';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { TiptapEditorDirective } from 'ngx-tiptap';
import { Extension } from '@tiptap/core';
import Suggestion, { SuggestionOptions, SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion';

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
];

@Component({
  selector: 'app-note-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TiptapEditorDirective],
  template: `
    <div class="max-w-3xl mx-auto px-6 py-8">
      <div class="flex items-center gap-3 mb-8">
        <a [routerLink]="['/quiz', topicId, 'concepts']"
           class="p-2 rounded-lg text-gray-300 hover:text-sky-600 hover:bg-sky-50 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </a>
        <a [routerLink]="['/quiz', topicId, 'concepts']"
           class="text-sm text-gray-400 hover:text-sky-600 transition-colors">{{ topicName }}</a>
        <div class="ml-auto flex items-center gap-2">
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

      <div class="relative tiptap-wrapper">
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
  `
})
export class NoteEditorComponent implements OnInit, OnDestroy, AfterViewInit {
  private quizService = inject(QuizService);
  private route = inject(ActivatedRoute);

  @ViewChild('titleInput') titleInput!: ElementRef<HTMLInputElement>;

  topicId = 0;
  topicName = '';
  conceptId: number | null = null;
  title = '';
  editorContent = '';
  saving = false;
  saved = false;

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

    this.editor = new Editor({
      extensions: [
        StarterKit,
        Placeholder.configure({ placeholder: 'Type / for commands...' }),
        this.createSlashCommandExtension(),
      ],
    });

    if (this.conceptId) {
      this.created = true;
      const concept: QuizConcept | undefined = history.state?.concept;
      if (concept) {
        this.title = concept.name;
        this.loadContent(concept.content || '');
      } else {
        this.quizService.findConcepts(this.topicId).subscribe(concepts => {
          const c = concepts.find(x => x.id === this.conceptId);
          if (c) {
            this.title = c.name;
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

  private positionSlashMenu(props: SuggestionProps<SlashCommandItem>) {
    const rect = props.clientRect?.();
    if (!rect) return;
    const wrapperEl = this.editor.view.dom.closest('.tiptap-wrapper');
    if (!wrapperEl) return;
    const wrapperRect = wrapperEl.getBoundingClientRect();
    this.slashMenuTop = rect.bottom - wrapperRect.top + 4;
    this.slashMenuLeft = rect.left - wrapperRect.left;
  }

  private persist() {
    const name = this.title.trim();
    if (!name) return;

    const content = this.editor.getHTML();
    // Don't save empty editor content
    const htmlContent = content === '<p></p>' ? null : content;

    this.saving = true;
    this.saved = false;

    if (!this.created) {
      this.created = true;
      this.quizService.createConcept(this.topicId, {
        name,
        content: htmlContent || undefined
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
        content: htmlContent
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
