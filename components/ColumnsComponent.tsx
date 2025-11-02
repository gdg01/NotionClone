// File: components/ColumnsComponent.tsx (SOSTITUZIONE COMPLETA)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react';
import { BlockActions } from './BlockActions';

export const ColumnsComponent: React.FC<NodeViewProps> = ({ node, updateAttributes, getPos, editor }) => {
  // Stato locale per la larghezza (aggiornato in tempo reale durante il drag)
  const [localWidth, setLocalWidth] = useState<string | null>(node.attrs.col1Width);
  const [isDragging, setIsDragging] = useState(false);
  
  // Riferimento al div .columns-content per misurare la larghezza totale
  const contentRef = useRef<HTMLDivElement>(null); 

  // Ottiene il pageId per il componente BlockActions
  const { currentPageId } = editor.extensionManager.extensions.find(ext => ext.name === 'pageLink')?.options || { currentPageId: null };
  const pageId = currentPageId;

  // Sincronizza lo stato locale se gli attributi del nodo cambiano dall'esterno
  useEffect(() => {
    setLocalWidth(node.attrs.col1Width);
  }, [node.attrs.col1Width]);

  // Logica di MouseDown: avvia il drag
  const handleMouseDown = useCallback((downEvent: React.MouseEvent) => {
    downEvent.preventDefault();
    downEvent.stopPropagation();
    setIsDragging(true);

    const contentDiv = contentRef.current;
    if (!contentDiv) return;

    // Trova la prima colonna per ottenere la larghezza iniziale
    const col1 = contentDiv.querySelector<HTMLElement>('[data-type="column"]:first-child');
    if (!col1) return;

    const startX = downEvent.clientX;
    const startWidth = col1.offsetWidth;
    const totalWidth = contentDiv.offsetWidth;
    const minWidth = 100; // Impostiamo una larghezza minima di 100px

    // Logica di MouseMove: calcola e applica la nuova larghezza
    const handleMouseMove = (moveEvent: MouseEvent) => {
      // Usiamo requestAnimationFrame per non sovraccaricare il browser
      requestAnimationFrame(() => {
        const deltaX = moveEvent.clientX - startX;
        let newWidthPx = startWidth + deltaX;
        const maxWidth = totalWidth - minWidth;
        
        // Applica i limiti min/max
        newWidthPx = Math.max(minWidth, Math.min(newWidthPx, maxWidth));
        
        const newWidthPercent = (newWidthPx / totalWidth) * 100;
        // Aggiorna lo stato locale (questo aggiorna la UI in tempo reale)
        setLocalWidth(`${newWidthPercent}%`);
      });
    };

    // Logica di MouseUp: ferma il drag e salva l'attributo
    const handleMouseUp = (upEvent: MouseEvent) => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Calcola il valore finale un'ultima volta
      const deltaX = upEvent.clientX - startX;
      let newWidthPx = startWidth + deltaX;
      const maxWidth = totalWidth - minWidth;
      newWidthPx = Math.max(minWidth, Math.min(newWidthPx, maxWidth));
      const newWidthPercent = (newWidthPx / totalWidth) * 100;
      
      // Salva il valore finale negli attributi del nodo Tiptap
      updateAttributes({ col1Width: `${newWidthPercent}%` });
    };

    // Aggiungi i listener globali
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

  }, [updateAttributes]); // Dipende solo da updateAttributes

  // Stile per il grid container
  const gridStyle = {
    gridTemplateColumns: localWidth ? `${localWidth} 1fr` : '1fr 1fr',
  };
  
  // Stile per posizionare l'handle (2px è metà della larghezza di 4px)
  const handleStyle = {
    left: localWidth ? `calc(${localWidth} - 2px)` : 'calc(50% - 2px)',
  };

  return (
    // --- MODIFICA: Wrapper esterno per BlockActions ---
    <NodeViewWrapper 
      className="columns-node-wrapper group relative"
    >
      {/* BlockActions si posiziona relative a questo wrapper */}
      <BlockActions editor={editor} pos={getPos()} pageId={pageId} />
      
      {/* --- MODIFICA: Div interno per il layout grid --- */}
      <div
        ref={contentRef} // Usiamo il ref su questo div
        className="columns-content" // Nuova classe per il grid
        style={gridStyle}
      >
        {/* 'contents' fa sì che i figli di NodeViewContent (le colonne) 
            diventino gli item diretti del grid '.columns-content' */}
        <NodeViewContent className="contents" />
        
        {/* L'handle è ora posizionato 'absolute' rispetto a '.columns-content' */}
        <div 
          className={`column-resize-handle ${isDragging ? 'is-dragging' : ''}`}
          style={handleStyle}
          onMouseDown={handleMouseDown}
          contentEditable={false} // Impedisce la scrittura
          draggable={false} // Impedisce il drag HTML
        />
      </div>
    </NodeViewWrapper>
  );
};