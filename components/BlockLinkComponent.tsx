// components/BlockLinkComponent.tsx (SOSTITUZIONE COMPLETA)

import React, { useMemo } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { LinkIcon } from './icons';

// Log di debug a livello di modulo (invariato)
console.log("--- DEBUG [MODULE]: File components/BlockLinkComponent.tsx caricato ---");

export const BlockLinkComponent: React.FC<NodeViewProps> = ({ node, editor }) => {
  console.log("--- DEBUG [RENDER]: Render BlockLinkComponent ---"); 
  
  const { 
    pageTitles, 
    blockPreviews, 
    onSelectBlock,
    onOpenInSplitView 
  } = editor.extensionManager.extensions.find(ext => ext.name === 'blockLink')?.options || {};
  
  // --- MODIFICA: Estrai il customAlias ---
  const { pageId, blockId, customAlias } = node.attrs;

  console.log(`DEBUG [RENDER]: Props: pageId: ${pageId}, blockId: ${blockId}, customAlias: ${customAlias}`);

  // --- MODIFICA: Aggiorna useMemo per dare priorità a customAlias ---
  const linkAlias = useMemo(() => {
    // 1. Se customAlias esiste, usalo subito.
    if (customAlias) {
      console.log(`DEBUG [RENDER]: Trovato customAlias: "${customAlias}"`);
      return customAlias;
    }
    
    // 2. Altrimenti, usa la logica di fallback (quella precedente)
    console.log("DEBUG [RENDER]: customAlias non trovato, calcolo alias automatico...");
    if (!pageId || !blockId || !pageTitles || !blockPreviews) {
        console.warn("DEBUG [RENDER]: Dati mancanti per alias automatico");
        return 'Link non valido';
    }
    
    const pageTitle = pageTitles.get(pageId) || 'Pagina non trovata';
    const blockPreview = blockPreviews.get(blockId) || '...';
    
    console.log(`DEBUG [RENDER]: pageTitle: "${pageTitle}", blockPreview: "${blockPreview}"`);
    
    return `${pageTitle} / ${blockPreview}`;

  }, [pageId, blockId, customAlias, pageTitles, blockPreviews]); // <-- Aggiungi customAlias alle dipendenze
  
  // --- FINE MODIFICA ---

  console.log(`DEBUG [RENDER]: linkAlias finale: "${linkAlias}"`);

  const handleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (!pageId || !blockId) return;

    const isSplitViewRequest = e.metaKey || e.ctrlKey;

    if (isSplitViewRequest && onOpenInSplitView) {
      onOpenInSplitView(pageId, blockId);
    } else if (onSelectBlock) {
      onSelectBlock(pageId, blockId);
    }
  };

  return (
    <NodeViewWrapper
      as="span"
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter') handleClick(e); }}
      className="page-link not-prose"
      role="link"
      tabIndex={0}
      title={`Clic: naviga. Ctrl/Cmd+Clic: apri a lato.\n${linkAlias}`}
      contentEditable={false}
      draggable="true"
      data-drag-handle
    >
      <LinkIcon className="w-4 h-4 mr-1 inline-block flex-shrink-0" />
      <span className="truncate">{linkAlias}</span>
    </NodeViewWrapper>
  );
};