// File: extensions/FlashcardSyntax.ts (NUOVO FILE)

import { Extension, findChildren } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { debounce } from 'lodash';

// Definiamo il nostro pattern:
// Es. "Qual è la capitale della Francia? :: Parigi"
// Gruppo 1: Domanda (tutto prima di '::')
// Gruppo 2: Risposta (tutto dopo '::' fino alla fine della riga/paragrafo)
const FLASHCARD_REGEX = /^(.*?) \:\: (.*?)$/;

type UpsertFn = (data: { front: string, back: string, blockId: string }) => void;

export interface FlashcardSyntaxOptions {
  pageId: string;
  onUpsert: UpsertFn;
}

export const FlashcardSyntax = Extension.create<FlashcardSyntaxOptions>({
  name: 'flashcardSyntax',

  addOptions() {
    return {
      pageId: '',
      onUpsert: () => {},
    };
  },

  addProseMirrorPlugins() {
    const { onUpsert } = this.options;
    
    // Usiamo una funzione debounced per non sovraccaricare il backend
    const debouncedUpsert = debounce<UpsertFn>(onUpsert, 1000);

    return [
      new Plugin({
        key: new PluginKey('flashcardSyntax'),
        appendTransaction: (transactions, oldState, newState) => {
          // Se non ci sono stati cambiamenti, non fare nulla
          if (!transactions.some((tr) => tr.docChanged)) {
            return null;
          }

          // Trova i blocchi modificati
          const modifiedBlockIds = new Set<string>();
          transactions.forEach(tr => {
            if (!tr.docChanged) return;
            tr.steps.forEach(step => {
              (step as any).getMap().forEach((oldStart: number, oldEnd: number, newStart: number, newEnd: number) => {
                // Trova i nodi nel range modificato
                newState.doc.nodesBetween(newStart, newEnd, (node) => {
                  if (node.isTextblock && node.attrs.id) {
                    modifiedBlockIds.add(node.attrs.id);
                  }
                });
              });
            });
          });

          if (modifiedBlockIds.size === 0) {
            return null;
          }

          // Cerca i nodi per ID e controlla la sintassi
          modifiedBlockIds.forEach(blockId => {
            const nodesWithId = findChildren(newState.doc, node => node.attrs.id === blockId);
            const node = nodesWithId[0]?.node;

            if (node && node.isTextblock) {
              const text = node.textContent;
              const match = text.match(FLASHCARD_REGEX);

              if (match) {
                const [, front, back] = match;
                if (front.trim() && back.trim()) {
                  // Trovato! Chiama la mutazione debounced
                  debouncedUpsert({
                    front: front.trim(),
                    back: back.trim(),
                    blockId: blockId,
                  });
                }
              }
            }
          });

          return null; // Non modifichiamo la transazione
        },
      }),
    ];
  },
});