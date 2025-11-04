// components/TableOfContents.tsx (SOSTITUZIONE COMPLETA)

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { MenuIcon } from './icons'; // Importa la MenuIcon

interface Heading {
  id: string;
  level: number;
  text: string;
}

// --- 1. MODIFICA INTERFACCIA PROPS ---
interface TableOfContentsProps {
  headings: Heading[];
  pageId: string;
  isSplitView: boolean;
  mode: 'desktop' | 'mobile'; // Prop per la modalità
  onLinkClick?: () => void; // Per chiudere il drawer
}
// --- FINE 1. ---

export const TableOfContents: React.FC<TableOfContentsProps> = ({ 
  headings, 
  pageId,
  isSplitView,
  mode, // --- 2. RICEVI LE NUOVE PROP ---
  onLinkClick
}) => {
  // --- Ganci (Hooks) ---
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const headingEntriesRef = useRef(new Map<string, IntersectionObserverEntry>());

  // --- Logica IntersectionObserver ---
  useEffect(() => {
    
    // Non avviare l'observer se siamo in split view O in modalità mobile
    if (isSplitView || headings.length === 0 || mode === 'mobile') {
        return; // Esce dall'effetto
    }

    const observerCallback: IntersectionObserverCallback = (entries) => {
        entries.forEach(entry => {
            headingEntriesRef.current.set(entry.target.id, entry);
        });

        let currentBestId: string | null = null;
        let smallestTopValue = Infinity;

        headingEntriesRef.current.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.boundingClientRect.top < smallestTopValue) {
                    smallestTopValue = entry.boundingClientRect.top;
                    currentBestId = entry.target.id;
                }
            }
        });

        if (currentBestId) {
            setActiveHeadingId(currentBestId);
        }
    };

    const observerOptions: IntersectionObserverInit = {
      rootMargin: '-10% 0px -80% 0px',
      threshold: 0, 
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const elements = headings.map(h => document.getElementById(h.id)).filter(Boolean);
    elements.forEach((el) => el && observer.observe(el));

    return () => {
      elements.forEach((el) => el && observer.unobserve(el));
      headingEntriesRef.current.clear();
    };
  }, [headings, isSplitView, mode]); // <-- Aggiungi 'mode' alle dipendenze
  // --- FINE LOGICA ---

  const minLevel = useMemo(() => {
      if (headings.length === 0) {
          return 1;
      }
      return Math.min(...headings.map(h => h.level));
  }, [headings]);

  // --- 3. MODIFICA CONTROLLI DI USCITA ---
  // Se è desktop E valgono le vecchie condizioni, esci.
  if (mode === 'desktop' && (isSplitView || headings.length === 0)) {
    return null;
  }
  
  // Se è mobile E non ci sono headings, mostra un messaggio
  if (mode === 'mobile' && headings.length === 0) {
    return <p className="text-notion-text-gray dark:text-notion-text-gray-dark">Nessun titolo in questa pagina.</p>
  }
  // --- FINE 3. ---

  // Logica click (Modificata)
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      // In modalità mobile, l'editor non è scrollabile, quindi lo scroll non serve.
      // Su desktop, invece sì.
      if (mode === 'desktop') {
        element.scrollIntoView({
          block: 'start',
          behavior: 'auto'
        });
      }
      
      setActiveHeadingId(id);
      
      if (window.history.pushState) {
        window.history.pushState(null, '', `#${pageId}:${id}`);
      }
    }
    
    // Chiudi il drawer se siamo su mobile
    if (onLinkClick) {
      onLinkClick();
    }
  };
  
  // --- 4. CLASSI CSS DINAMICHE ---
  const wrapperClass = mode === 'desktop'
    ? "hidden md:block fixed top-16 right-4 z-10 w-64 "
    : "w-full"; // Stile semplice per il drawer
  // --- FINE 4. ---

  // JSX
  return (
    <div className={wrapperClass}>
        <div className="flex items-center text-sm text-notion-text dark:text-notion-text-dark pb-2" style={{ marginLeft: '-4px' }}>
          <MenuIcon className="w-5 h-5 mr-2" />
          On this page
        </div>

        <ul className="border-l border-notion-border dark:border-notion-border-dark">
            {headings.map((heading) => {
              // L'highlighting su mobile non è fondamentale, ma lo lasciamo
              const isActive = activeHeadingId === heading.id;
              return (
                <li key={heading.id} className="relative">
                    <a
                        href={`#${pageId}:${heading.id}`}
                        onClick={(e) => handleLinkClick(e, heading.id)}
                        className={`flex truncate text-sm p-1 rounded transition-colors ${
                            isActive
                            ? 'text-custom-coral' 
                            : 'text-notion-text dark:text-notion-text-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark'
                        }`}
                        style={{ paddingLeft: `${(heading.level - minLevel) * 16 + 8}px` }}
                    >
                        <span className="truncate">{heading.text}</span>
                    </a>
                    <div
                        className={`absolute -left-[1.5px] top-0 bottom-0 w-[1px] bg-custom-coral transition-opacity ${
                            isActive ? 'opacity-100' : 'opacity-0'
                        }`}
                    />
                </li>
              );
            })}
        </ul>
    </div>
  );
};