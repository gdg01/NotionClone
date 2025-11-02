// File: src/components/BlockWrapperComponent.tsx (SOSTITUZIONE COMPLETA)

import React from 'react';
import { NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react';
import { BlockActions } from './BlockActions';

export const BlockWrapperComponent: React.FC<NodeViewProps> = (props) => {

  // --- MODIFICA: Gestione specifica per codeBlock ---
  // Questo componente è progettato per 'paragraph' e 'heading'.
  // Se riceve un 'codeBlock', significa che è stato registrato
  // erroneamente per quel tipo di nodo. Lo gestiamo in modo
  // sicuro per evitare l'errore, omettendo BlockActions
  // e usando i tag corretti (<pre> e <code>).

  if (props.node.type.name === 'codeBlock') {
    return (
      <NodeViewWrapper as="pre" className="block-wrapper group relative code-block-wrapper">
        {/* NON renderizziamo BlockActions per i codeBlock */}
        <NodeViewContent as="code" id={props.node.attrs.id} />
      </NodeViewWrapper>
    );
  }
  // --- FINE MODIFICA ---


  // --- LOGICA ESISTENTE (invariata) PER PARAGRAPH E HEADING ---

  // Determina se il contenuto deve essere <p>, <h1>, <h2>, etc.
  const Tag = props.node.type.name === 'heading'
    ? `h${props.node.attrs.level}`
    : 'p';
    
  const { currentPageId } = props.editor.extensionManager.extensions.find(ext => ext.name === 'pageLink')?.options || { currentPageId: null };
  const pageId = currentPageId;

  // --- Logica di getPos() resa sicura ---
  let currentPos: number | undefined;
  try {
    currentPos = props.getPos();
  } catch (e) {
    console.warn("Error calling getPos() in BlockWrapperComponent:", e);
    return (
      <NodeViewWrapper className="block-wrapper group relative">
        <NodeViewContent 
            as={Tag} 
            id={props.node.attrs.id}
        />
      </NodeViewWrapper>
    );
  }
  // --- FINE MODIFICA ---


  // --- LOGICA PLACEHOLDER E FOCUS ---
  
  // 1. Determina se il nodo è vuoto
  const isEmpty = props.node.content.size === 0;

  // 2. Logica di Focus (invariata)
  const { selection } = props.editor.state;
  const isFocused = props.editor.isFocused && 
                    selection.empty && 
                    selection.$from.parent === props.node;

  // 3. Calcola il testo del placeholder e decidi se mostrarlo
  let placeholder: string | null = null;
  let showPlaceholder = false;

  if (isEmpty) {
    if (props.node.type.name === 'heading') {
      
      placeholder = `Heading ${props.node.attrs.level}`;
      showPlaceholder = true;
    
    } else if (props.node.type.name === 'paragraph') {
      
      let parentType = null;
      let parentChildCount = 1;

      if (typeof currentPos === 'number') {
          try {
            const resolvedPos = props.editor.state.doc.resolve(currentPos);
            const parent = resolvedPos.parent;
            parentType = parent.type.name;
            parentChildCount = parent.childCount;
          } catch (e) {
            console.warn("Could not resolve node position for placeholder.", e);
          }
      }

      if (parentType === 'callout') {
        placeholder = 'Jot down a thought...';
      } else if (parentType === 'column' && parentChildCount === 1) {
        placeholder = "Type '/' for commands...";
      } else {
        placeholder = "Type '/' for commands, or start writing...";
      }
      
      showPlaceholder = isFocused;
    }
  }

  // 4. Costruisci gli attributi da passare a NodeViewContent
  const contentAttrs: { [key: string]: string } = {};

  if (props.node.attrs.id) {
      contentAttrs['id'] = props.node.attrs.id;
  }
  if (placeholder && showPlaceholder) {
    contentAttrs['class'] = 'is-empty';
    contentAttrs['data-placeholder'] = placeholder;
  }
  // --- FINE LOGICA PLACEHOLDER ---

  return (
    <NodeViewWrapper className="block-wrapper group relative">
      {typeof currentPos === 'number' && (
        <BlockActions
          editor={props.editor}
          pos={currentPos}
          pageId={pageId}
        />
      )}
      <NodeViewContent as={Tag} {...contentAttrs} />
    </NodeViewWrapper>
  );
};