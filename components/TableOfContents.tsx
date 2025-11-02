// components/TableOfContents.tsx (SOSTITUZIONE COMPLETA - CON FIX)

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { MenuIcon } from './icons'; // Importa la MenuIcon

interface Heading {
  id: string;
  level: number;
  text: string;
}

interface TableOfContentsProps {
  headings: Heading[];
  pageId: string;
  isSplitView: boolean; // Prop (corretta)
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ 
  headings, 
  pageId,
  isSplitView // Prop (corretta)
}) => {
  // --- Ganci (Hooks) ---
  // Devono essere chiamati tutti incondizionatamente all'inizio.
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const headingEntriesRef = useRef(new Map<string, IntersectionObserverEntry>());

  // --- Logica IntersectionObserver ---
  useEffect(() => {
    
    // --- MODIFICA 1: Aggiunto controllo qui ---
    // Se siamo in split view o non ci sono titoli, 
    // non avviare l'observer.
    if (isSplitView || headings.length === 0) {
        return; // Esce dall'effetto
    }
    // --- FINE MODIFICA 1 ---

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
  }, [headings, isSplitView]); // <-- MODIFICA 2: Aggiunta 'isSplitView' alle dipendenze
  // --- FINE LOGICA ---


  // --- MODIFICA 3: Spostati i controlli di uscita QUI ---
  // Ora che tutti gli hook sono stati chiamati, possiamo 
  // uscire in sicurezza.
  if (isSplitView) {
    return null;
  }
  if (headings.length === 0) {
    return null;
  }
  // --- FINE MODIFICA 3 ---


  // Logica click (invariata)
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        block: 'start',
        behavior: 'auto'
      });
      
      if (window.history.pushState) {
        window.history.pushState(null, '', `#${pageId}:${id}`);
      }
    }
  };

  // JSX (invariato)
  return (
    <div 
      className="hidden md:block fixed top-16 right-4 z-10 w-64 "
    >
        <div className="flex items-center text-sm text-notion-text dark:text-notion-text-dark pb-2" style={{ marginLeft: '-4px' }}>
          <MenuIcon className="w-5 h-5 mr-2" />
          On this page
        </div>

        <ul className="border-l  border-notion-border dark:border-notion-border-dark">
            {headings.map((heading) => {
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
                        style={{ paddingLeft: `${(heading.level - 1) * 16 + 8}px` }}
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