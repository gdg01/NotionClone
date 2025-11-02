// File: components/SubPagesListComponent.tsx (SOSTITUZIONE COMPLETA)

import React, { useMemo } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import type { Page } from '../App';
import { PageIcon } from './icons';

export const SubPagesListComponent: React.FC<NodeViewProps> = ({ editor }) => {
  // 1. Ottiene le opzioni (che passeremo in Editor.tsx)
  const { pages, currentPageId, onSelectPage, onOpenInSplitView } = editor.extensionManager.extensions.find(ext => ext.name === 'subPagesList')?.options || {
    pages: [] as Page[],
    currentPageId: null as string | null,
    onSelectPage: (id: string) => {},
    onOpenInSplitView: (id: string) => {}
  };

  // 2. Filtra le pagine per trovare solo i figli diretti
  const subPages = useMemo(() => {
    if (!currentPageId || pages.length === 0) return [];
    return pages
      .filter(p => p.parentId === currentPageId && !p.isArchived) // Trova figli non archiviati
      .sort((a, b) => a._creationTime - b._creationTime); // Ordina per data creazione
  }, [pages, currentPageId]);

  // 3. Gestore click (identico a quello dei PageLink)
  const handleClick = (e: React.MouseEvent, pageId: string) => {
    e.preventDefault();
    if (e.metaKey || e.ctrlKey) {
      onOpenInSplitView(pageId);
    } else {
      onSelectPage(pageId);
    }
  };

  // 4. Se non ci sono sottopagine, mostra un messaggio
  if (subPages.length === 0) {
    return (
      // --- MODIFICA QUI: Aggiunte classi 'group' e 'relative' ---
      <NodeViewWrapper as="div" className="sub-pages-list not-prose group relative" contentEditable={false}>
        <p className="text-notion-text-gray dark:text-notion-text-gray-dark italic">Nessuna sottopagina. Digita /page per crearne una.</p>
      </NodeViewWrapper>
    );
  }

  // 5. Renderizza l'elenco
  return (
    // --- MODIFICA QUI: Aggiunte classi 'group' e 'relative' ---
    <NodeViewWrapper as="div" className="sub-pages-list not-prose my-4 group relative" contentEditable={false}>
      <ul className="space-y-1 list-none p-0">
        {subPages.map(page => (
          <li key={page._id} className="flex">
            {/* Riusiamo lo stile 'page-link' che abbiamo già */}
            <a
              href={`#${page._id}`}
              onClick={(e) => handleClick(e, page._id)}
              className="page-link" 
              title={`${page.title || 'Untitled'} (Ctrl+Clic per aprire a lato)`}
            >
              {page.icon ? <span className="mr-1">{page.icon}</span> : <PageIcon className="w-4 h-4 mr-1 inline-block flex-shrink-0" />}
              <span className="truncate">{page.title || 'Untitled'}</span>
            </a>
          </li>
        ))}
      </ul>
    </NodeViewWrapper>
  );
};