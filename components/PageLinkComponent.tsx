// components/PageLinkComponent.tsx (SOSTITUZIONE COMPLETA)

import React from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import type { Page } from '../App';
import { PageIcon, LinkIcon } from './icons';

export const PageLinkComponent: React.FC<NodeViewProps> = ({ node, editor }) => {
  // 1. Le opzioni rimangono invariate
  const { getPageById, onSelectPage, onOpenInSplitView } = editor.extensionManager.extensions.find(ext => ext.name === 'pageLink')?.options || { 
    getPageById: (id: string) => undefined as Page | undefined, 
    onSelectPage: () => {},
    onOpenInSplitView: () => {}
  };

  // 2. Leggiamo sia pageId che il nuovo attributo title
  const pageId = node.attrs.pageId;
  const fallbackTitle = node.attrs.title || 'Untitled'; // Titolo di fallback

  // 3. Gestione link non valido (senza pageId)
  if (!pageId) {
     return (
       <NodeViewWrapper as="span" className="page-link-missing not-prose opacity-70" contentEditable={false}>
        <LinkIcon className="w-4 h-4 mr-1 inline-block flex-shrink-0 text-red-500" />
        <span className="truncate text-red-500 line-through">Link non valido</span>
      </NodeViewWrapper>
     );
  }

  // 4. Tentiamo di prendere i dati aggiornati
  const pageData = getPageById(pageId); 
  // pageData sarà `undefined` per una frazione di secondo, poi la query si aggiorna

  // 5. Gestione click (usa pageId per robustezza)
  const handleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (!pageId) return;
    
    // Controlla se Ctrl (Windows/Linux) o Meta (Cmd su Mac) è premuto
    const isSplitViewRequest = e.metaKey || e.ctrlKey;

    if (isSplitViewRequest && onOpenInSplitView) {
      onOpenInSplitView(pageId);
    } else if (onSelectPage) {
      onSelectPage(pageId);
    }
  };

  // 6. Logica di rendering con Fallback
  // Se pageData è disponibile (dopo l'aggiornamento della query), usa quello.
  // Altrimenti, usa i dati di fallback (icona generica, titolo di fallback).
  const displayIcon = pageData?.icon;
  const displayTitle = pageData?.title || fallbackTitle; 

  // NON mostriamo più "Pagina non trovata". Mostriamo il link
  // con il titolo di fallback, che si aggiornerà da solo.
  
  return (
    <NodeViewWrapper
      as="span"
      role="link"
      tabIndex={0}
      className="page-link not-prose"
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter') handleClick(e); }}
      contentEditable={false}
      draggable="true"
      data-drag-handle
      title={`${displayTitle} (Ctrl+Clic per aprire a lato)`}
    >
      {/* Mostra l'icona vera se c'è, altrimenti quella di default */}
      {displayIcon ? <span className="mr-1">{displayIcon}</span> : <PageIcon className="w-4 h-4 mr-1 inline-block flex-shrink-0" />}
      <span className="truncate">{displayTitle}</span>
    </NodeViewWrapper>
  );
};