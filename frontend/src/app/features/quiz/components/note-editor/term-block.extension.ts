import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    termBlock: {
      insertTermBlock: () => ReturnType;
    };
  }
}

export const TermBlock = Node.create({
  name: 'termBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      term: { default: '' },
      definition: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="term-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, {
      'data-type': 'term-block',
      'data-term': HTMLAttributes['term'] || '',
      'data-definition': HTMLAttributes['definition'] || '',
    })];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('div');
      dom.classList.add('term-block');
      dom.contentEditable = 'false';

      const header = document.createElement('div');
      header.classList.add('term-block-header');

      const label = document.createElement('div');
      label.classList.add('term-block-label');
      label.textContent = 'Term';

      const deleteBtn = document.createElement('button');
      deleteBtn.classList.add('term-block-delete');
      deleteBtn.innerHTML = '&times;';
      deleteBtn.addEventListener('click', () => {
        if (typeof getPos === 'function') {
          const pos = getPos();
          editor.view.dispatch(editor.view.state.tr.delete(pos, pos + node.nodeSize));
          editor.commands.focus();
        }
      });

      header.appendChild(label);
      header.appendChild(deleteBtn);

      const termInput = document.createElement('div');
      termInput.classList.add('term-block-term');
      termInput.contentEditable = 'true';
      termInput.setAttribute('data-placeholder', 'Term name...');
      termInput.textContent = node.attrs['term'] || '';

      const defInput = document.createElement('div');
      defInput.classList.add('term-block-definition');
      defInput.contentEditable = 'true';
      defInput.setAttribute('data-placeholder', 'Definition...');
      defInput.textContent = node.attrs['definition'] || '';

      const syncAttrs = () => {
        if (typeof getPos !== 'function') return;
        const newTerm = termInput.textContent || '';
        const newDef = defInput.textContent || '';
        if (newTerm === node.attrs['term'] && newDef === node.attrs['definition']) return;
        editor.view.dispatch(
          editor.view.state.tr.setNodeMarkup(getPos(), undefined, {
            ...node.attrs,
            term: newTerm,
            definition: newDef,
          })
        );
      };

      termInput.addEventListener('blur', syncAttrs);
      defInput.addEventListener('blur', syncAttrs);

      const deleteBlock = () => {
        if (typeof getPos === 'function') {
          const pos = getPos();
          editor.view.dispatch(editor.view.state.tr.delete(pos, pos + node.nodeSize));
          editor.commands.focus();
        }
      };

      // Prevent ProseMirror from capturing keypresses; backspace on empty removes block
      termInput.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Backspace' && !termInput.textContent) {
          e.preventDefault();
          deleteBlock();
          return;
        }
        e.stopPropagation();
      });
      defInput.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Backspace' && !defInput.textContent) {
          e.preventDefault();
          deleteBlock();
          return;
        }
        e.stopPropagation();
      });

      dom.appendChild(header);
      dom.appendChild(termInput);
      dom.appendChild(defInput);

      // Auto-focus term field on insert
      requestAnimationFrame(() => termInput.focus());

      return {
        dom,
        stopEvent: () => true,
        ignoreMutation: () => true,
      };
    };
  },

  addCommands() {
    return {
      insertTermBlock: () => ({ commands }) => {
        return commands.insertContent({ type: this.name, attrs: { term: '', definition: '' } });
      },
    };
  },
});
