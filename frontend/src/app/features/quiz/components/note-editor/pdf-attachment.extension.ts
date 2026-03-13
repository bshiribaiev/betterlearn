import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pdfAttachment: {
      insertPdfAttachment: (filename: string) => ReturnType;
    };
  }
}

export const PdfAttachment = Node.create({
  name: 'pdfAttachment',
  group: 'block',
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      filename: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="pdf-attachment"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, {
      'data-type': 'pdf-attachment',
      'data-filename': HTMLAttributes['filename'] || '',
    })];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('div');
      dom.classList.add('pdf-attachment-block');
      dom.contentEditable = 'false';

      // Header bar (entire header is drag handle)
      const header = document.createElement('div');
      header.classList.add('pdf-attachment-header');
      header.dataset['dragHandle'] = '';

      const left = document.createElement('div');
      left.style.cssText = 'display:flex;align-items:center;gap:0.5rem;min-width:0';

      // Drag handle
      const dragHandle = document.createElement('div');
      dragHandle.classList.add('pdf-attachment-drag');
      dragHandle.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
        <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
        <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
      </svg>`;

      const icon = document.createElement('div');
      icon.classList.add('pdf-attachment-icon');
      icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
      </svg>`;

      const name = document.createElement('span');
      name.classList.add('pdf-attachment-name');
      name.textContent = node.attrs['filename'] || 'PDF';

      left.appendChild(dragHandle);
      left.appendChild(icon);
      left.appendChild(name);

      const right = document.createElement('div');
      right.style.cssText = 'display:flex;align-items:center;gap:0.25rem;flex-shrink:0';

      // Expand (fullscreen) button
      const expandBtn = document.createElement('button');
      expandBtn.classList.add('pdf-attachment-action');
      expandBtn.title = 'Full screen';
      expandBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4"/>
      </svg>`;
      expandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dom.dispatchEvent(new CustomEvent('pdf-fullscreen', { bubbles: true }));
      });

      // Toggle button
      const toggleBtn = document.createElement('button');
      toggleBtn.classList.add('pdf-attachment-action');
      toggleBtn.title = 'Collapse';
      toggleBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
      </svg>`;

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.classList.add('pdf-attachment-delete');
      deleteBtn.innerHTML = '&times;';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Dispatch before removing node — once detached, event won't bubble
        editor.view.dom.dispatchEvent(new CustomEvent('pdf-remove', { bubbles: true }));
      });

      right.appendChild(expandBtn);
      right.appendChild(toggleBtn);
      right.appendChild(deleteBtn);
      header.appendChild(left);
      header.appendChild(right);

      // Preview container (iframe)
      const preview = document.createElement('div');
      preview.classList.add('pdf-attachment-preview');

      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'width:100%;height:100%;border:none';
      preview.appendChild(iframe);

      dom.appendChild(header);
      dom.appendChild(preview);

      // State
      let expanded = true;
      let loaded = false;

      const collapse = () => {
        expanded = false;
        preview.style.display = 'none';
        toggleBtn.style.transform = 'rotate(-90deg)';
        toggleBtn.title = 'Expand';
      };

      const expand = () => {
        expanded = true;
        preview.style.display = 'block';
        toggleBtn.style.transform = 'rotate(0deg)';
        toggleBtn.title = 'Collapse';
        if (!loaded) {
          dom.dispatchEvent(new CustomEvent('pdf-load', { bubbles: true, detail: { iframe } }));
          loaded = true;
        }
      };

      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        expanded ? collapse() : expand();
      });

      header.addEventListener('click', (e) => {
        e.stopPropagation();
        expanded ? collapse() : expand();
      });

      // Start expanded — request PDF load
      requestAnimationFrame(() => {
        dom.dispatchEvent(new CustomEvent('pdf-load', { bubbles: true, detail: { iframe } }));
        loaded = true;
      });

      return {
        dom,
        stopEvent: (event: Event) => !event.type.startsWith('drag') && event.type !== 'drop',
        ignoreMutation: () => true,
      };
    };
  },

  addCommands() {
    return {
      insertPdfAttachment: (filename: string) => ({ commands }) => {
        return commands.insertContent([
          { type: this.name, attrs: { filename } },
          { type: 'paragraph' },
        ]);
      },
    };
  },
});
