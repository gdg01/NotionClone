// File: components/HorizontalRuleComponent.tsx (NUOVO FILE)

import React from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { BlockActions } from './BlockActions';

export const HorizontalRuleComponent: React.FC<NodeViewProps> = ({ editor, getPos }) => {
  // Otteniamo il pageId per le BlockActions, come negli altri componenti
  const { currentPageId } = editor.extensionManager.extensions.find(ext => ext.name === 'pageLink')?.options || { currentPageId: null };
  const pageId = currentPageId;

  return (
    // Usiamo 'block-wrapper' per coerenza con BlockWrapperComponent
    <NodeViewWrapper 
      className="block-wrapper group relative" 
      data-type="horizontal-rule"
    >
      {/* Ora anche i divider avranno le BlockActions! */}
      <BlockActions editor={editor} pos={getPos()} pageId={pageId} />
      
      {/* Questo è il divider vero e proprio. 
          Lo rendiamo non editabile per evitare conflitti. */}
      <hr 
        contentEditable={false} 
        className="my-4 border-notion-border dark:border-notion-border-dark" 
      />
      
      {/* NodeViewContent non è necessario qui perché 
          un <hr> non può contenere altri blocchi o testo */}
    </NodeViewWrapper>
  );
};