import React, { useMemo } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import type { Page } from '../App';

export const BreadcrumbComponent: React.FC<NodeViewProps> = ({ editor }) => {
  const { pages, currentPageId, onSelectPage } = editor.extensionManager.extensions.find(ext => ext.name === 'breadcrumb')?.options || { pages: [], currentPageId: null, onSelectPage: () => {} };

  const breadcrumbPath = useMemo(() => {
    const path: Page[] = [];
    // MODIFICA: Cerca la pagina usando p._id invece di p.id
    let currentPage = pages.find((p: Page) => p._id === currentPageId);
    while (currentPage) {
      path.unshift(currentPage);
      // MODIFICA: Cerca la pagina genitore usando p._id invece di p.id
      currentPage = pages.find((p: Page) => p._id === currentPage.parentId);
    }
    return path;
  }, [pages, currentPageId]);

  if (breadcrumbPath.length < 1) {
    return null; 
  }

  return (
    <NodeViewWrapper as="div" className="breadcrumb-container not-prose" contentEditable={false}>
      {breadcrumbPath.map((page, index) => (
        // MODIFICA: Usa page._id come chiave
        <React.Fragment key={page._id}>
          <span
            className="breadcrumb-item"
            onClick={(e) => {
                e.preventDefault();
                // MODIFICA: Passa page._id invece di page.id
                onSelectPage(page._id);
            }}
          >
            {page.icon && <span className="mr-1 text-base">{page.icon}</span>}
            {page.title || 'Untitled'}
          </span>
          {index < breadcrumbPath.length - 1 && (
            <span className="breadcrumb-separator">/</span>
          )}
        </React.Fragment>
      ))}
    </NodeViewWrapper>
  );
};