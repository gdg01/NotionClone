// --- MODIFICA 1: Rimuoviamo 'textInputRegex' e importiamo 'InputRule' ---
import { Node, mergeAttributes, InputRule } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
// Importiamo il componente View
import { InlineFlashcardView } from '../components/InlineFlashcardView' 

// La regex rimane la stessa:
// (1) Cattura tutto il testo prima di ":: " (la domanda)
// (2) Cattura il trigger ":: " (con lo spazio)
const FLASHCARD_INPUT_REGEX = /(.*)(::\s)$/

export interface InlineFlashcardOptions {
  HTMLAttributes: Record<string, any>
  pageId: string | null // Opzione per passare il pageId
}

// Dichiariamo il tipo
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    inlineFlashcard: {
      setInlineFlashcard: (attributes: {
        question: string
        answer?: string
      }) => ReturnType
    }
  }
}

export const InlineFlashcard = Node.create<InlineFlashcardOptions>({
  name: 'inlineFlashcard',
  group: 'inline',
  inline: true,
  atom: true, // Fondamentale: lo tratta come un blocco unico e indivisibile
  selectable: true,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      pageId: null, // Lo inietteremo da Editor.tsx
    }
  },

  addAttributes() {
    return {
      // L'ID univoco del blocco, fornito da Tiptap/extension-unique-id
      id: { default: null },
      question: { default: null, parseHTML: (el) => el.getAttribute('data-question') },
      answer: { default: null, parseHTML: (el) => el.getAttribute('data-answer') },
      flashcardId: { default: null, parseHTML: (el) => el.getAttribute('data-flashcard-id') },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-type="inline-flashcard"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'inline-flashcard',
      }),
    ]
  },

  // Collega questo nodo al suo componente React
  addNodeView() {
    return ReactNodeViewRenderer(InlineFlashcardView)
  },

  // --- MODIFICA 2: Riscriviamo 'addInputRules' con la classe base 'InputRule' ---
  addInputRules() {
    return [
      // Creiamo un'istanza di InputRule
      new InputRule({
        // La regex da cercare
        find: FLASHCARD_INPUT_REGEX,
        
        // Il gestore che esegue la logica
        handler: ({ state, range, match }) => {
          const { tr } = state
          
          // Estraiamo la domanda (gruppo 1 della regex)
          const question = match[1]?.trim()

          // Se la domanda è vuota, non fare nulla
          if (!question) return 

          // Gli attributi per il nostro nuovo nodo
          const attributes = { 
            question: question,
            answer: null // La risposta è null, il che attiverà l'overlay
          }

          // --- INIZIO CORREZIONE ---

          // 1. Crea l'istanza del nodo usando lo schema
          const node = state.schema.nodes[this.name].create(attributes);

          // 2. Sostituisci il range del testo (Domanda :: ) con il nuovo nodo.
          // Questo fa sia la cancellazione che l'inserimento.
          tr.replaceRangeWith(range.from, range.to, node);
          
          // --- FINE CORREZIONE ---
        },
      }),
    ]
  },
})