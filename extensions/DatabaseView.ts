// NUOVO FILE: extensions/DatabaseView.ts

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { DatabaseViewComponents } from '../components/DBview/DatabaseViewComponents';
// Importeremo questo componente nel prossimo step

export type DbColumnType = 'core' | 'text' | 'number' | 'select' | 'multi-select';

export type SelectOption = {
  id: string;      // ID univoco per l'opzione (es. 'opt_123')
  name: string;    // Testo visibile (es. "In Corso")
  color: string; // Nome colore da lib/TG.ts (es. 'blue')
};

export type DbColumn = {
  id: string;               // ID univoco per la colonna (es. 'prop_456')
  title: string;          // Nome visualizzato (es. "Stato")
  type: DbColumnType;
  options?: SelectOption[]; // Array di opzioni SOLO per select/multi-select
};

export const DatabaseView = Node.create({
  name: 'databaseView',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      id: {
        default: null, // ID univoco del blocco, fornito da Tiptap/UniqueID
      },
      columns: {

      },
    };
  },
  
  // Passiamo le funzioni di navigazione al componente React
  addOptions() {
    return {
      onSelectPage: (id: string) => {},
      onOpenInSplitView: (id: string) => {},
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="database-view"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    // Usiamo un tag 'div' che possiamo stilizzare con Grid
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'database-view' }), 0];
  },

  addNodeView() {
    // Nota il nome: DatabaseViewComponents.tsx
    return ReactNodeViewRenderer(DatabaseViewComponents);
  },
});