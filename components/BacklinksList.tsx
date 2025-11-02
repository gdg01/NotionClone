// components/BacklinksList.tsx (SOSTITUZIONE COMPLETA)

import React from 'react';
import type { Doc } from '../convex/_generated/dataModel';
import { PageIcon, LinkIcon } from './icons';

export type EnrichedBacklink = {
  _id: Doc<"backlinks">['_id'];
  sourcePageId: Doc<"pages">['_id'];
  sourcePageTitle: string;
  sourcePageIcon: string | undefined;
  snippet: string;
};

interface BacklinksListProps {
  backlinks: EnrichedBacklink[];
  onSelectPage: (pageId: string) => void;
  onOpenInSplitView: (pageId: string) => void;
  isSidebarOpen: boolean; // <-- AGGIUNTA NUOVA PROP
}

export const BacklinksList: React.FC<BacklinksListProps> = ({ 
  backlinks, 
  onSelectPage, 
  onOpenInSplitView,
  isSidebarOpen // <-- RICEVUTA NUOVA PROP
}) => {
  if (backlinks.length === 0) {
    return null; 
  }

  const handleClick = (e: React.MouseEvent, pageId: string) => {
    e.preventDefault();
    if (e.metaKey || e.ctrlKey) {
      onOpenInSplitView(pageId);
    } else {
      onSelectPage(pageId);
    }
  };

  // Larghezza sidebar = w-72 = 18rem
  // Padding desiderato = 1rem (come 'left-4')
  const leftPosition = isSidebarOpen ? 'calc(18rem + 1rem)' : '1rem';

  return (
    <div 
      className="hidden md:block fixed bottom-16 z-10 w-64 transition-all duration-300 ease-in-out"
      style={{
        left: leftPosition, // <-- Stile dinamico per 'left'
      }}
    >
        <div className="flex items-center text-sm text-notion-text dark:text-notion-text-dark pb-2" >
          BackLinks
        </div>

        <ul className="space-y-1 max-h-[30vh] overflow-y-auto">
          {backlinks.map((link) => (
            <li key={link._id} className="relative">
              <a
                href={`#${link.sourcePageId}`}
                onClick={(e) => handleClick(e, link.sourcePageId)}
                // MODIFICA: Trasformato in 'flex' e rimosso 'truncate'
                className={`flex items-center text-sm p-1 rounded transition-colors text-notion-text dark:text-notion-text-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark`}
                style={{ paddingLeft: '8px' }}
                title={`"${link.snippet}..."`}
              >
                {/* --- COLONNA 1: ICONA --- */}
                {link.sourcePageIcon ? (
                  <span className="mr-3 flex-shrink-0">{link.sourcePageIcon}</span>
                ) : (
                  <PageIcon className="w-4 h-4 mr-3 flex-shrink-0" />
                )}
                
                {/* --- COLONNA 2: BLOCCO TESTO (2 Righe) --- */}
                {/* min-w-0 è necessario per far funzionare 'truncate' dentro un flexbox */}
                <div className="min-w-0">
                  {/* Riga 1: Titolo */}
                  <span className="block truncate font-medium text-sm">
                    {link.sourcePageTitle}
                  </span>
                  {/* Riga 2: Snippet (rimosso pl-6) */}
                  <p className="text-xs text-notion-text-gray dark:text-notion-text-gray-dark italic truncate">
                    "...{link.snippet}..."
                  </p>
                </div>
              </a>
            </li>
          ))}
        </ul>
    </div>
  );
};