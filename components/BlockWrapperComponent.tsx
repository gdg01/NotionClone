// File: src/components/BlockWrapperComponent.tsx (SOSTITUZIONE COMPLETA)

import React from 'react';
import { NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react';
import { BlockActions } from './BlockActions';

export const BlockWrapperComponent: React.FC<NodeViewProps> = (props) => {

  // --- Gestione codeBlock (invariata) ---
  if (props.node.type.name === 'codeBlock') {
    return (
      <NodeViewWrapper as="pre" className="block-wrapper group relative code-block-wrapper">
        <NodeViewContent as="code" id={props.node.attrs.id} />
      </NodeViewWrapper>
    );
  }

  // --- LOGICA ESISTENTE ---
  const Tag = props.node.type.name === 'heading'
    ? `h${props.node.attrs.level}`
    : 'p';
    
  // --- 1. MODIFICA: ESTRAI onOpenAiPanel ---
  const { currentPageId, onOpenAiPanel } = props.editor.extensionManager.extensions.find(ext => ext.name === 'pageLink')?.options || { 
    currentPageId: null,
    onOpenAiPanel: () => {} // Fornisci un default
  };
  const pageId = currentPageId;
  // --- FINE MODIFICA ---


  // --- Logica getPos() (invariata) ---
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

  // --- LOGICA PLACEHOLDER (invariata) ---
  const isEmpty = props.node.content.size === 0;
  const { selection } = props.editor.state;
  const isFocused = props.editor.isFocused && 
                    selection.empty && 
                    selection.$from.parent === props.node;
  
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
        // --- 2. MODIFICA: PASSA LA PROP ---
        <BlockActions
          editor={props.editor}
          pos={currentPos}
          pageId={pageId}
          onOpenAiPanel={onOpenAiPanel} // <-- PROP PASSATA
        />
        // --- FINE MODIFICA ---
      )}
      <NodeViewContent as={Tag} {...contentAttrs} />
    </NodeViewWrapper>
  );
};