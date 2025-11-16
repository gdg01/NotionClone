// components/InlineMathView.tsx (CON LOG E STILE TAILWIND CORRETTO)

import React, { useEffect, useRef, useState } from 'react';
import katex from 'katex';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';

export const InlineMathView: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
}) => {
  // --- LOG 1: IL PIÙ IMPORTANTE ---
  // Mostra *tutte* le props che Tiptap passa al componente.
  // Se il bug è attivo, vedrai un 'node.content' o 'node.children'
  // che contiene il testo non formattato.
  console.log('[InlineMathView] Render Props:', { node, updateAttributes });

  const katexRef = useRef<HTMLSpanElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(node.attrs.latex);
  const latexCode = node.attrs.latex || '';

  useEffect(() => {
    if (katexRef.current && !isEditing) {
      try {
        // --- LOG 2 ---
        console.log(`[InlineMathView] KaTeX Render: "${latexCode}"`);
        katex.render(latexCode, katexRef.current, {
          throwOnError: false,
          displayMode: false,
        });
      } catch (error) {
        console.error(error);
        katexRef.current.textContent = `Errore LaTeX: ${latexCode}`;
      }
    }
  }, [latexCode, isEditing]);

  const handleSave = () => {
    // --- LOG 4 ---
    console.log(`[InlineMathView] Salvataggio: "${editText}"`);
    updateAttributes({ latex: editText });
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') e.preventDefault(), handleSave();
    if (e.key === 'Escape') e.preventDefault(), setIsEditing(false), setEditText(node.attrs.latex);
  };

  return (
    <NodeViewWrapper
      as="span"
      className={`relative inline-block cursor-pointer px-1 rounded transition-colors text-red-500 dark:text-red-400 hover:bg-notion-hover dark:hover:bg-notion-hover-dark ${
        isEditing ? 'bg-notion-hover dark:bg-notion-hover-dark' : ''
      }`}
      onClick={(e) => {
        if (!isEditing) {
          // --- LOG 3 ---
          console.log('[InlineMathView] Click per Modifica');
          e.preventDefault();
          setIsEditing(true);
        }
      }}
    >
      {isEditing ? (
        // --- UI DI MODIFICA (POP-OVER) ---
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 z-10 mb-1 flex items-center gap-1 p-1 bg-white dark:bg-notion-sidebar-dark border border-notion-border dark:border-notion-border-dark rounded-lg shadow-lg"
          contentEditable={false}
          onClick={(e) => e.stopPropagation()} // Impedisce al click di chiudere
        >
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="px-2 py-0.5 text-sm font-mono w-48 bg-white dark:bg-notion-bg-dark text-notion-text dark:text-notion-text-dark border border-notion-border dark:border-notion-border-dark rounded-md outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={(e) => {
              e.stopPropagation(); // Impedisce al click di propagare
              handleSave();
            }}
            className="px-3 py-0.5 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Save
          </button>
        </div>
      ) : null}
      
      {/* Questo span è il target per KaTeX. 
        DEVE essere presente sempre, anche durante l'editing 
        (anche se vuoto), per "occupare lo spazio".
      */}
      <span
        ref={katexRef}
        className="inline-block"
        contentEditable={false}
      />
      {/*
        SE IL BUG PERSISTE: Il testo non formattato viene
        renderizzato da Tiptap *QUI*, come "figlio"
        di NodeViewWrapper, subito dopo lo span qui sopra.
      */}
    </NodeViewWrapper>
  );
};