// File: src/components/BreadcrumbNav.tsx (SOSTITUZIONE COMPLETA)

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { UserButton } from '@clerk/clerk-react';
import type { Page } from '../App';
import { MenuIcon, ChevronRightIcon, SaveIcon, SearchIcon } from './icons';
import { PomodoroTimer } from './PomodoroTimer'; // <-- IMPORTA IL NUOVO COMPONENTE

export type SaveStatus = "Idle" | "Dirty" | "Saving" | "Saved";

interface BreadcrumbNavProps {
  pages: Page[];
  activePageId: string | null;
  onSelectPage: (pageId: string) => void;
  onOpenInSplitView: (pageId: string) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  saveStatus: SaveStatus;
  lastSaveTime: Date | null;
  lastModified: number | null; 
  onSaveNow: () => void;
  onOpenSpotlight: () => void;
}

// Icona Spinner
const SpinnerIcon = (props: { className?: string }) => (
  <svg className={`w-4 h-4 ${props.className || ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// Icona Spunta (Check)
const CheckIcon = (props: { className?: string }) => (
  <svg className={`w-4 h-4 ${props.className || ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
  </svg>
);


const SaveStatusIndicator: React.FC<{ 
  status: SaveStatus;
  lastSaveTime: Date | null;
  lastModified: number | null; 
  onSaveNow: () => void; 
}> = ({ status, lastSaveTime, lastModified, onSaveNow }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Effetto per il conto alla rovescia
  useEffect(() => {
    if (status === 'Dirty') {
      setCountdown(15); // Resetta il countdown
      const timer = setInterval(() => {
        setCountdown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setCountdown(15);
    }
  }, [status, lastModified]);

  // Effetto per chiudere il menu cliccando all'esterno
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveNowClick = () => {
    onSaveNow();
    setIsMenuOpen(false);
  };

  const getIndicatorContent = () => {
    switch (status) {
      case 'Saving':
        return <><SpinnerIcon className="animate-spin" /> <span className="ml-2">Saving...</span></>;
      case 'Saved':
        return <><CheckIcon /> <span className="ml-2">Saved</span></>;
      case 'Dirty':
        return <><span className="ml-2">Save in {countdown}s</span></>;
      case 'Idle':
      default:
        return null; 
    }
  };

  const indicatorContent = getIndicatorContent();

  if (!indicatorContent) {
    return null;
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center text-sm text-notion-text-gray dark:text-notion-text-dark px-2 py-1 rounded-md hover:bg-notion-hover dark:hover:bg-notion-hover-dark transition-colors"
        aria-label="Open save status menu"
      >
        {indicatorContent}
      </button>

      {isMenuOpen && (
        <div
          ref={menuRef}
          className="absolute top-full right-0 mt-2 w-56 bg-notion-bg-dark border border-notion-border-dark rounded-md shadow-lg p-1 z-20"
        >
          <div className="flex flex-col">
            
            <div className="px-2 py-1 text-sm text-notion-text-gray-dark">
              Last save: {lastSaveTime ? lastSaveTime.toLocaleTimeString() : 'N/A'}
            </div>
            <div className="px-2 py-1 text-sm text-notion-text-gray-dark">
              Next: {status === 'Dirty' ? `in ${countdown}s` : 'Saved'}
            </div>

            <div className="border-t border-notion-border-dark my-1 mx-1"></div>

            <button
              onClick={handleSaveNowClick}
              className="flex items-center w-full text-left px-2 py-1 text-sm rounded text-notion-text-dark hover:bg-notion-hover-dark"
            >
              <SaveIcon className="w-4 h-4 mr-2" />
              Save Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({
  pages,
  activePageId,
  onSelectPage,
  onOpenInSplitView,
  isSidebarOpen,
  toggleSidebar,
  saveStatus,
  lastSaveTime,
  lastModified, 
  onSaveNow,
  onOpenSpotlight
}) => {

  const breadcrumbPath = useMemo(() => {
    const path: Page[] = [];
    if (!activePageId || !pages || pages.length === 0) return path;

    let currentPage = pages.find((p: Page) => p._id === activePageId);
    while (currentPage) {
      path.unshift(currentPage);
      currentPage = pages.find((p: Page) => p._id === currentPage.parentId);
    }
    return path;
  }, [pages, activePageId]);

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-10 flex items-center h-12 px-4 text-notion-text dark:text-notion-text-dark transition-all duration-300 ease-in-out`}
      style={{ paddingLeft: isSidebarOpen ? 'calc(18rem + 1rem)' : '1rem' }} 
    >
      {!isSidebarOpen && (
        <button 
          onClick={toggleSidebar} 
          className="p-2 -ml-2 mr-2 rounded-md hover:bg-notion-hover dark:hover:bg-notion-hover-dark transition-colors"
          aria-label="Open sidebar"
        >
          <MenuIcon className="w-5 h-5" />
        </button>
      )}

      <nav className="flex items-center truncate flex-1 min-w-0">
        {breadcrumbPath.map((page, index) => (
          <React.Fragment key={page._id}>
            <span
              className="truncate cursor-pointer max-w-48 text-sm p-1 rounded hover:bg-notion-hover dark:hover:bg-notion-hover-dark"
              onClick={(e: React.MouseEvent) => {
                if (e.metaKey || e.ctrlKey) {
                  onOpenInSplitView(page._id);
                } else {
                  onSelectPage(page._id);
                }
              }}
            >
              {page.icon ? <span className="mr-1">{page.icon}</span> : null}
              {page.title || 'Untitled'}
            </span>
            {index < breadcrumbPath.length - 1 && (
              <ChevronRightIcon className="w-4 h-4 mx-1 flex-shrink-0 text-notion-text-gray dark:text-notion-text-gray-dark" />
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* --- MODIFICA: Aggiunto PomodoroTimer --- */}
      <div className="flex items-center space-x-2 ml-auto pl-4">
        <button
          onClick={onOpenSpotlight}
          className="flex-shrink-0 p-2 text-sm text-notion-text-gray dark:text-notion-text-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark rounded-md"
          aria-label="Apri ricerca"
          title="Search (Ctrl+Space)"
        >
          <SearchIcon className="w-4 h-4" />
        </button>
        <SaveStatusIndicator 
          status={saveStatus}
          lastSaveTime={lastSaveTime}
          lastModified={lastModified} 
          onSaveNow={onSaveNow} 
        />
        <PomodoroTimer /> {/* <-- AGGIUNTO QUI */}

        <div className="flex-shrink-0">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
      {/* --- FINE MODIFICA --- */}
    </div>
  );
};