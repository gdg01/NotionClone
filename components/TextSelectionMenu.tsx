// File: components/TextSelectionMenu.tsx (Modificato)

import React from 'react';
import type { Editor } from '@tiptap/core';
import { 
  BoldIcon, 
  ItalicIcon, 
  InlineCodeIcon, 
  SparkleIcon,
  NewPageIcon // <-- 1. Importa la nuova icona
} from './icons'; 

interface TextSelectionMenuProps {
  editor: Editor;
  onOpenAiPanel: () => void;
  onCreatePageFromSelection: () => void; // <-- 2. Aggiungi la nuova prop
}

export const TextSelectionMenu: React.FC<TextSelectionMenuProps> = ({ 
  editor, 
  onOpenAiPanel,
  onCreatePageFromSelection // <-- 3. Ricevi la nuova prop
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
    // --- 4. AGGIUNGI IL NUOVO PULSANTE "CREA PAGINA" ---
    {
      name: 'Crea Pagina',
      icon: NewPageIcon,
      command: () => onCreatePageFromSelection(), // Chiama la prop
      isActive: false,
    },
    // --- FINE NUOVO PULSANTE ---
    {
      name: 'Ask AI', // Ho rinominato 'In-depth' in 'Ask AI' per coerenza
      icon: SparkleIcon,
      command: () => onOpenAiPanel(),
      isActive: false,
    },
  ];

  return (
    // Il wrapper ora ha 'flex' per allineare i pulsanti
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
          <option.icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
};