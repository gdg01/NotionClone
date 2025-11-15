// File: components/TextSelectionMenu.tsx (SOSTITUZIONE COMPLETA)

import React from 'react';
import type { Editor } from '@tiptap/core';
import { 
  BoldIcon, 
  ItalicIcon, 
  InlineCodeIcon, 
  SparkleIcon,
  NewPageIcon,
  SparkleIcon as FlashcardIcon // <-- 1. Riusiamo SparkleIcon
} from './icons'; 

interface TextSelectionMenuProps {
  editor: Editor;
  onOpenAiPanel: () => void;
  onCreatePageFromSelection: () => void;
  onOpenFlashcardCreator: () => void; // <-- 2. Aggiungi la nuova prop
}

export const TextSelectionMenu: React.FC<TextSelectionMenuProps> = ({ 
  editor, 
  onOpenAiPanel,
  onCreatePageFromSelection,
  onOpenFlashcardCreator // <-- 3. Ricevi la new prop
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
    {
      name: 'Crea Pagina',
      icon: NewPageIcon,
      command: () => onCreatePageFromSelection(),
      isActive: false,
    },
    // --- 4. AGGIUNGI IL NUOVO PULSANTE "CREA FLASHCARD" ---
    {
      name: 'Crea Flashcard (AI)',
      icon: FlashcardIcon,
      command: () => onOpenFlashcardCreator(), // Chiama la nuova prop
      isActive: false,
    },
    // --- FINE NUOVO PULSANTE ---
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
          className={`p-1.5 rounded-md ${
            option.isActive
              ? 'bg-notion-active dark:bg-notion-active-dark text-notion-text dark:text-notion-text-dark'
              : 'hover:bg-notion-hover dark:hover:bg-notion-hover-dark text-notion-text-gray dark:text-notion-text-gray-dark'
          }`}
          aria-label={option.name}
          title={option.name}
        >
          {/* 5. Aggiungi colore blu all'icona della flashcard */}
          <option.icon className={`w-4 h-4 ${option.name === 'Crea Flashcard (AI)' ? 'text-blue-500' : ''}`} />
        </button>
      ))}
    </div>
  );
};