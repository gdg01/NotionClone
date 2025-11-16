// File: components/TextSelectionMenu.tsx (SOSTITUZIONE DEFINITIVA)

import React from 'react';
import type { Editor } from '@tiptap/core';
import {
  BoldIcon,
  ItalicIcon,
  InlineCodeIcon,
  SparkleIcon,
  NewPageIcon,
  SparkleIcon as FlashcardIcon,
} from './icons';

// Icona per la matematica inline
const MathIcon = ({ className }: { className?: string }) => (
  <div
    className={`${className} flex items-center justify-center font-bold text-base`}
  >
    ∑
  </div>
);

interface TextSelectionMenuProps {
  editor: Editor;
  onOpenAiPanel: () => void;
  onCreatePageFromSelection: () => void;
  onOpenFlashcardCreator: () => void;
}

export const TextSelectionMenu: React.FC<TextSelectionMenuProps> = ({
  editor,
  onOpenAiPanel,
  onCreatePageFromSelection,
  onOpenFlashcardCreator,
}) => {
  const options = [
    {
      name: 'Bold',
      icon: BoldIcon,
      command: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive('bold'),
    },
    {
      name: 'Italic',
      icon: ItalicIcon,
      command: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive('italic'),
    },
    {
      name: 'Code',
      icon: InlineCodeIcon,
      command: () => editor.chain().focus().toggleCode().run(),
      isActive: editor.isActive('code'),
    },
    
    // --- INIZIO BLOCCO MODIFICATO ---
    {
      name: 'Inline Math',
      icon: MathIcon,
      command: () => {
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to, '');

        if (selectedText) {
          // --- NUOVO COMANDO ROBUSTO ---
          // Usiamo un comando di transazione di basso livello
          // per garantire la sostituzione dell'intervallo.
          editor
            .chain()
            .focus()
            .command(({ tr }) => {
              // 1. Crea il nodo
              const node = editor.schema.nodes.inlineMath.create({
                latex: selectedText,
              });
              
              // 2. Sostituisci l'intervallo [from, to] con il nuovo nodo
              tr.replaceRangeWith(from, to, node);
              
              // 3. (Opzionale) Posiziona il cursore dopo il nuovo nodo
              tr.setSelection(
                editor.state.selection.constructor.near(
                  tr.doc.resolve(from + node.nodeSize)
                )
              );
              
              return true;
            })
            .run();
          // --- FINE NUOVO COMANDO ---
            
        } else {
          // Inserisci un nodo vuoto (questo andava bene)
          editor
            .chain()
            .focus()
            .insertContent({
              type: 'inlineMath',
              attrs: { latex: '' },
            })
            .run();
        }
      },
      isActive: editor.isActive('inlineMath'),
    },
    // --- FINE BLOCCO MODIFICATO ---

    {
      name: 'Crea Pagina',
      icon: NewPageIcon,
      command: () => onCreatePageFromSelection(),
      isActive: false,
    },
    {
      name: 'Crea Flashcard (AI)',
      icon: FlashcardIcon,
      command: () => onOpenFlashcardCreator(),
      isActive: false,
    },
    {
      name: 'Ask AI',
      icon: SparkleIcon,
      command: () => onOpenAiPanel(),
      isActive: false,
    },
  ];

  return (
    <div className="flex items-center gap-0.5">
      {options.map((option) => (
        <button
          key={option.name}
          onClick={(e) => {
            e.preventDefault();
            option.command();
          }}
          className={`p-1.5 rounded-md transition-colors ${
            option.isActive
              ? 'bg-notion-active dark:bg-notion-active-dark text-notion-text dark:text-notion-text-dark'
              : 'hover:bg-notion-hover dark:hover:bg-notion-hover-dark text-notion-text-gray dark:text-notion-text-gray-dark'
          }`}
          aria-label={option.name}
          title={option.name}
        >
          <option.icon
            className={`w-4 h-4 ${
              option.name === 'Crea Flashcard (AI)' ? 'text-blue-500' : ''
            } ${
              option.name === 'Inline Math' && option.isActive
                ? 'text-red-500'
                : ''
            }`}
          />
        </button>
      ))}
    </div>
  );
};