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
      dom.classList.add('pdf-attachment');
      dom.contentEditable = 'false';

      // Icon
      const icon = document.createElement('div');
      icon.classList.add('pdf-attachment-icon');
      icon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
      </svg>`;

      // Filename
      const name = document.createElement('span');
      name.classList.add('pdf-attachment-name');
      name.textContent = node.attrs['filename'] || 'PDF';

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.classList.add('pdf-attachment-delete');
      deleteBtn.innerHTML = '&times;';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof getPos === 'function') {
          const pos = getPos();
          editor.view.dispatch(editor.view.state.tr.delete(pos, pos + node.nodeSize));
          editor.commands.focus();
        }
        // Dispatch custom event so the component can clear the PDF from backend
        dom.dispatchEvent(new CustomEvent('pdf-remove', { bubbles: true }));
      });

      // Click to preview
      dom.addEventListener('click', () => {
        dom.dispatchEvent(new CustomEvent('pdf-preview', { bubbles: true }));
      });

      dom.appendChild(icon);
      dom.appendChild(name);
      dom.appendChild(deleteBtn);

      return {
        dom,
        stopEvent: () => true,
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
