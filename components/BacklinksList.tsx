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

// --- 1. MODIFICA INTERFACCIA PROPS ---
interface BacklinksListProps {
  backlinks: EnrichedBacklink[];
  onSelectPage: (pageId: string) => void;
  onOpenInSplitView: (pageId: string) => void;
  isSidebarOpen: boolean; 
  mode: 'desktop' | 'mobile'; // Prop per la modalità
}
// --- FINE 1. ---

export const BacklinksList: React.FC<BacklinksListProps> = ({ 
  backlinks, 
  onSelectPage, 
  onOpenInSplitView,
  isSidebarOpen,
  mode // --- 2. RICEVI PROP ---
}) => {
  
  // --- 3. MODIFICA CONTROLLI DI USCITA ---
  // Se è desktop E non ci sono backlinks, esci.
  if (mode === 'desktop' && backlinks.length === 0) {
    return null; 
  }
  // Se è mobile E non ci sono backlinks, mostra un messaggio.
  if (mode === 'mobile' && backlinks.length === 0) {
    return <p className="text-notion-text-gray dark:text-notion-text-gray-dark">Nessun backlink trovato per questa pagina.</p>
  }
  // --- FINE 3. ---

  const handleClick = (e: React.MouseEvent, pageId: string) => {
    e.preventDefault();
    // Su mobile, disabilitiamo lo split view e facciamo solo navigazione
    if (mode === 'mobile' || (!e.metaKey && !e.ctrlKey)) {
      onSelectPage(pageId);
    } else {
      onOpenInSplitView(pageId);
    }
  };

  const leftPosition = isSidebarOpen ? 'calc(18rem + 1rem)' : '1rem';

  // --- 4. CLASSI CSS DINAMICHE ---
  const wrapperClass = mode === 'desktop'
    ? "hidden md:block fixed bottom-16 z-10 w-64 transition-all duration-300 ease-in-out"
    : "w-full"; // Stile semplice per il drawer
  // --- FINE 4. ---

  return (
    <div 
      className={wrapperClass}
      style={mode === 'desktop' ? { left: leftPosition } : {}} // Applica stile 'left' solo su desktop
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
                className={`flex items-center text-sm p-1 rounded transition-colors text-notion-text dark:text-notion-text-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark`}
                style={{ paddingLeft: '8px' }}
                title={mode === 'desktop' ? `"${link.snippet}..." (Ctrl+Clic per aprire a lato)` : `"${link.snippet}...`}
              >
                {/* Icona */}
                {link.sourcePageIcon ? (
                  <span className="mr-3 flex-shrink-0">{link.sourcePageIcon}</span>
                ) : (
                  <PageIcon className="w-4 h-4 mr-3 flex-shrink-0" />
                )}
                
                {/* Blocco Testo (2 Righe) */}
                <div className="min-w-0">
                  {/* Riga 1: Titolo */}
                  <span className="block truncate font-medium text-sm">
                    {link.sourcePageTitle}
                  </span>
                  {/* Riga 2: Snippet */}
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