import { Node, mergeAttributes } from '@tiptap/core';
import katex from 'katex';

export const MathBlock = Node.create({
  name: 'mathBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      formula: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="math-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'math-block' })];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('div');
      dom.classList.add('math-block');

      const inputRow = document.createElement('div');
      inputRow.classList.add('math-input-row');

      const sigmaIcon = document.createElement('span');
      sigmaIcon.classList.add('math-sigma');
      sigmaIcon.textContent = '∑';

      const input = document.createElement('input');
      input.classList.add('math-input');
      input.type = 'text';
      input.placeholder = 'LaTeX, e.g. \\frac{a}{b}';
      input.value = node.attrs['formula'] || '';

      const preview = document.createElement('div');
      preview.classList.add('math-preview');

      const renderPreview = () => {
        const formula = input.value.trim();
        if (!formula) {
          preview.innerHTML = '<span class="math-empty">Preview</span>';
          return;
        }
        try {
          preview.innerHTML = katex.renderToString(formula, {
            displayMode: true,
            throwOnError: false,
          });
        } catch {
          preview.textContent = formula;
        }
      };

      const syncFormula = () => {
        if (typeof getPos !== 'function') return;
        editor.view.dispatch(
          editor.view.state.tr.setNodeMarkup(getPos(), undefined, {
            ...node.attrs,
            formula: input.value.trim(),
          })
        );
        renderPreview();
      };

      input.addEventListener('input', () => renderPreview());
      input.addEventListener('blur', syncFormula);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === 'Escape') {
          syncFormula();
          input.blur();
          editor.commands.focus();
        }
        e.stopPropagation();
      });

      inputRow.appendChild(sigmaIcon);
      inputRow.appendChild(input);
      dom.appendChild(inputRow);
      dom.appendChild(preview);

      if (node.attrs['formula']) {
        renderPreview();
      }

      requestAnimationFrame(() => {
        if (!node.attrs['formula']) input.focus();
      });

      return {
        dom,
        stopEvent: () => true,
        ignoreMutation: () => true,
      };
    };
  },
});
