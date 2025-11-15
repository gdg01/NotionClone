// File: src/components/BreadcrumbNav.tsx (SOSTITUZIONE COMPLETA)

import React, { useMemo, useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom'; // Necessario per il Portal nel Drawer
import { UserButton } from '@clerk/clerk-react';
import type { Page } from '../App';
import { MenuIcon, ChevronRightIcon, SaveIcon, SearchIcon, LinkIcon } from './icons'; // Importa LinkIcon
import { PomodoroTimer } from './PomodoroTimer';
import { ShareMenu } from './ShareMenu';

// Importa i componenti per il Drawer
import { useMobileDrawerData } from '../context/MobileDrawerContext';
import { MobileDrawer } from './MobileDrawer';
import { TableOfContents } from './TableOfContents';
import { BacklinksList } from './BacklinksList';

export type SaveStatus = "Idle" | "Dirty" | "Saving" | "Saved";

// Interfaccia Props (invariata)
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
  isSplitView?: boolean;
}

// (Icona Spinner e CheckIcon rimangono invariate)
const SpinnerIcon = (props: { className?: string }) => (
  <svg className={`w-4 h-4 ${props.className || ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);
const CheckIcon = (props: { className?: string }) => (
  <svg className={`w-4 h-4 ${props.className || ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
  </svg>
);

// (SaveStatusIndicator - MODIFICATO z-index)
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

  useEffect(() => {
    if (status === 'Dirty') {
      setCountdown(15); 
      const timer = setInterval(() => {
        setCountdown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setCountdown(15);
    }
  }, [status, lastModified]);

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
          // --- MODIFICA QUI ---
          // Cambiato z-20 in z-50 per farlo apparire sopra la maggior parte
          // degli elementi della pagina (come la TOC sticky che potrebbe essere z-30 o z-40)
          className="absolute top-full right-0 mt-2 w-56 bg-notion-bg-dark border border-notion-border-dark rounded-md shadow-lg p-1 z-50"
          // --- FINE MODIFICA ---
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
  onOpenSpotlight,
  isSplitView = false
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

  const activePage = useMemo(
    () => pages.find((p: Page) => p._id === activePageId),
    [pages, activePageId]
  );
  
  const { headings, backlinks } = useMobileDrawerData();
  const [drawerContent, setDrawerContent] = useState<'toc' | 'backlinks' | null>(null);

  const hasHeadings = headings.length > 0;
  const hasBacklinks = backlinks.length > 0;

  return (
    <React.Fragment>
      <div 
        // --- MODIFICA QUI ---
        // Cambiato z-1000 (classe custom/non valida) in z-40 (classe standard
        // di Tailwind). Questo imposta la barra sopra la maggior parte del
        // contenuto, ma *sotto* i suoi stessi menu (che abbiamo impostato a z-50).
        className={`fixed top-0 left-0 right-0 z-40 flex items-center h-12 text-notion-text dark:text-notion-text-dark transition-all duration-300 ease-in-out bg-notion-bg dark:bg-notion-bg-dark`}
        // --- FINE MODIFICA ---
        style={{ 
          paddingLeft: isSidebarOpen ? 'calc(18rem + 1rem)' : '1rem',
          paddingRight: '1rem'
        }} 
      >
        {!isSidebarOpen && (
          <button 
            onClick={toggleSidebar} 
            className="p-2 mr-2 rounded-md hover:bg-notion-hover dark:hover:bg-notion-hover-dark transition-colors"
            aria-label="Open sidebar"
          >
            <MenuIcon className="w-5 h-5" />
          </button>
        )}

        {/* Navigazione Breadcrumb (invariata) */}
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

        {/* Controlli a destra */}
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
          
          {activePage && (
            <ShareMenu page={activePage} />
          )}
          
          <PomodoroTimer />

          {/* Pulsanti mobile (invariati) */}
          {hasHeadings && (
            <button
              onClick={() => setDrawerContent('toc')}
              className="flex-shrink-0 p-2 text-sm text-notion-text-gray dark:text-notion-text-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark rounded-md md:hidden"
              aria-label="Apri indice"
              title="Indice pagina"
            >
              <MenuIcon className="w-4 h-4" />
            </button>
          )}
          {hasBacklinks && (
            <button
              onClick={() => setDrawerContent('backlinks')}
              className="flex-shrink-0 p-2 text-sm text-notion-text-gray dark:text-notion-text-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark rounded-md md:hidden"
              aria-label="Apri backlinks"
              title="Backlinks"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
          )}

          <div className="flex-shrink-0">
            <UserButton afterSignOutUrl="/" />
          </div>

          {isSplitView && (
            <div className="w-8 flex-shrink-0" />
          )}

        </div>
      </div>

      {/* Drawer (invariato) */}
      <MobileDrawer
        isOpen={drawerContent !== null}
        onClose={() => setDrawerContent(null)}
        title={drawerContent === 'toc' ? 'Indice Pagina' : 'Backlinks'}
      >
        {drawerContent === 'toc' && (
          <TableOfContents
            headings={headings}
            pageId={activePageId!}
            isSplitView={false}
            mode="mobile" 
            onLinkClick={() => setDrawerContent(null)} 
          />
        )}
        {drawerContent === 'backlinks' && activePage && (
          <BacklinksList
            backlinks={backlinks}
            onSelectPage={(pageId) => {
              onSelectPage(pageId); 
              setDrawerContent(null); 
            }}
            onOpenInSplitView={() => {}} 
            isSidebarOpen={false}
            mode="mobile" 
          />
        )}
      </MobileDrawer>
    </React.Fragment>
  );
};