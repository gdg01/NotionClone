// extensions/InlineMath.ts (CON LOG)

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { InlineMathView } from '../components/InlineMathView';

// --- LOG 1 ---
// Questo apparirà nella console del browser *al caricamento* se il file è importato.
console.log('[InlineMath] Estensione caricata.');

export const InlineMath = Node.create({
  name: 'inlineMath',
  group: 'inline',
  inline: true,
  selectable: true,
  
  // --- 1. DEVE ESSERE ATOMICO ---
  atom: true,
  
  // --- 2. NON DEVE AVERE CONTENUTO ---
  // Questa è la proprietà che (insieme a un refresh della cache)
  // risolverà il tuo bug. Dice a Tiptap: "questo nodo è VUOTO".
  content: '', 
  
  // --- LOG 2 ---
  // Questo log apparirà al caricamento, confermando che l'oggetto
  // di configurazione viene letto da Tiptap.
  onCreate() {
    console.log('[InlineMath] Estensione Tiptap CREATA (atom: true, content: "")');
  },

  addAttributes() {
    return {
      latex: {
        default: '',
        parseHTML: element => element.getAttribute('data-latex'),
        renderHTML: attributes => ({ 'data-latex': attributes.latex }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="inline-math"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    // Non ci deve essere uno '0' (content hole) qui
    return [
      'span',
      mergeAttributes(HTMLAttributes, { 'data-type': 'inline-math' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(InlineMathView);
  },
});