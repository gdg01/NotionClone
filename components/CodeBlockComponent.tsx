// File: components/CodeBlockComponent.tsx (SOSTITUZIONE COMPLETA)

import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react';
import { ChevronDownIcon } from './icons';
import { BlockActions } from './BlockActions'; // <-- MODIFICA: Importa BlockActions

export const CodeBlockComponent: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  editor, // <-- MODIFICA: Aggiungi 'editor'
  getPos, // <-- MODIFICA: Aggiungi 'getPos'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { value: 'auto', label: 'Auto' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'c', label: 'C' },
    { value: 'x86asm', label: 'Assembly' },
    // Aggiungi altre lingue se necessario
  ];

  const currentLanguage =
    languages.find((l) => l.value === (node.attrs.language || 'auto')) ||
    languages[0];

  const handleSelect = (langValue: string) => {
    updateAttributes({ language: langValue });
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // <-- MODIFICA: Aggiungi questa logica per ottenere il pageId
  const { currentPageId } =
    editor.extensionManager.extensions.find((ext) => ext.name === 'pageLink')
      ?.options || { currentPageId: null };
  const pageId = currentPageId;
  // --- FINE MODIFICA ---

  return (
    <NodeViewWrapper className="relative group not-prose">
      {/* Aggiunto il componente BlockActions */}
      <BlockActions editor={editor} pos={getPos()} pageId={pageId} />

      <div
        ref={dropdownRef}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity z-10"
        contentEditable={false}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center text-xs bg-notion-hover dark:bg-notion-hover-dark text-notion-text dark:text-notion-text-dark border border-notion-border dark:border-notion-border-dark rounded px-2 py-1 transition-colors"
          aria-label="Select language"
        >
          {currentLanguage.label}
          <ChevronDownIcon className="w-3.5 h-3.5 ml-1 text-notion-text-gray dark:text-notion-text-gray-dark" />
        </button>
        {isOpen && (
          <div className="absolute top-full right-0 mt-1 w-36 bg-notion-sidebar dark:bg-notion-sidebar-dark border border-notion-border dark:border-notion-border-dark rounded-md shadow-lg z-10 py-1">
            {languages.map((lang) => (
              <button
                key={lang.value}
                onClick={() => handleSelect(lang.value)}
                className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-notion-hover dark:hover:bg-notion-hover-dark transition-colors ${
                  lang.value === currentLanguage.value
                    ? 'bg-notion-active dark:bg-notion-active-dark font-medium'
                    : ''
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {/* Ensure pre and code have appropriate classes if not handled by Tiptap/lowlight */}
      <pre className="rounded-md bg-[#f6f8fa] dark:bg-[#2b2b2b] p-4 overflow-x-auto">
        <code data-language={node.attrs.language || 'plaintext'}>
          <NodeViewContent />
        </code>
      </pre>
    </NodeViewWrapper>
  );
};