// File: src/components/BreadcrumbNav.tsx
// (SOSTITUZIONE COMPLETA - Con fix per nascondere i DB Container dalla Breadcrumb)

import React, { useMemo, useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { UserButton } from '@clerk/clerk-react';
import type { Page } from '../App';
import {
  MenuIcon,
  ChevronRightIcon,
  SaveIcon,
  SearchIcon,
  LinkIcon,
  ArrowLeftIcon,
  DotsHorizontalIcon,
} from './icons';
import { PomodoroTimer } from './PomodoroTimer';
import { ShareMenu } from './ShareMenu';

import { useMobileDrawerData } from '../context/MobileDrawerContext';
import { MobileDrawer } from './MobileDrawer';
import { TableOfContents } from './TableOfContents';
import { BacklinksList } from './BacklinksList';

export type SaveStatus = 'Idle' | 'Dirty' | 'Saving' | 'Saved';

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

// Icona Spinner (invariata)
const SpinnerIcon = (props: { className?: string }) => (
  <svg
    className={`w-4 h-4 ${props.className || ''}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);
// Icona Check (invariata)
const CheckIcon = (props: { className?: string }) => (
  <svg
    className={`w-4 h-4 ${props.className || ''}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M5 13l4 4L19 7"
    ></path>
  </svg>
);

// Componente indicatore stato salvataggio (invariato)
const SaveStatusIndicator: React.FC<{
  status: SaveStatus;
  lastSaveTime: Date | null;
  lastModified: number | null;
  onSaveNow: () => void;
  mode?: 'desktop' | 'mobile';
}> = ({ status, lastSaveTime, lastModified, onSaveNow, mode = 'desktop' }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (status === 'Dirty') {
      setCountdown(15);
      const timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
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
        return (
          <>
            <SpinnerIcon className="animate-spin" />
            <span className="ml-2 hidden sm:inline">Saving...</span>
          </>
        );
      case 'Saved':
        return (
          <>
            <CheckIcon />
            <span className="ml-2 hidden sm:inline">Saved</span>
          </>
        );
      case 'Dirty':
        return (
          <>
            <span className="ml-2 hidden sm:inline">Save in {countdown}s</span>
            <span className="sm:hidden">...</span>
          </>
        );
      case 'Idle':
      default:
        return null;
    }
  };

  const indicatorContent = getIndicatorContent();
  if (!indicatorContent) return null;

  if (mode === 'mobile') {
    return (
      <div className="w-full">
        <div className="px-2 py-1 text-sm text-notion-text-gray dark:text-notion-text-gray-dark">
          {status === 'Saved' &&
            `Last save: ${lastSaveTime ? lastSaveTime.toLocaleTimeString() : 'N/A'}`}
          {status === 'Dirty' && `Next save in ${countdown}s`}
          {status === 'Saving' && 'Saving...'}
        </div>
        <div className="border-t border-notion-border dark:border-notion-border-dark my-1 mx-1"></div>
        <button
          onClick={handleSaveNowClick}
          disabled={status !== 'Dirty'}
          className="flex items-center w-full text-left px-2 py-1 text-sm rounded text-notion-text dark:text-notion-text-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark disabled:opacity-50"
        >
          <SaveIcon className="w-4 h-4 mr-2" />
          Save Now
        </button>
      </div>
    );
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
          className="absolute top-full right-0 mt-2 w-56 bg-notion-bg-dark border border-notion-border-dark rounded-md shadow-lg p-1 z-50"
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
              disabled={status !== 'Dirty'}
              className="flex items-center w-full text-left px-2 py-1 text-sm rounded text-notion-text-dark hover:bg-notion-hover-dark disabled:opacity-50"
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

// --- COMPONENTE PRINCIPALE (MODIFICATO) ---
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
  isSplitView = false,
}) => {
  
  // --- MODIFICA CHIAVE: Logica di salto per i DB Inline ---
  const breadcrumbPath = useMemo(() => {
    const path: Page[] = [];
    if (!activePageId || !pages || pages.length === 0) return path;
    
    let currentPage = pages.find((p: Page) => p._id === activePageId);
    
    while (currentPage) {
      // 1. Controlliamo se abbiamo già aggiunto un figlio al percorso (l'elemento path[0])
      const childPage = path[0]; 

      // 2. Determiniamo se la 'currentPage' è un contenitore DB che deve essere nascosto.
      // Un DB Container ha un figlio (la riga) che punta al genitore tramite 'dbViewId'.
      const isHiddenDbContainer = childPage && childPage.dbViewId === currentPage._id;

      // 3. Aggiungi al percorso SOLO se NON è un contenitore DB nascosto
      if (!isHiddenDbContainer) {
        path.unshift(currentPage);
      }

      // 4. Risali al genitore
      currentPage = pages.find((p: Page) => p._id === currentPage.parentId);
    }
    return path;
  }, [pages, activePageId]);
  // --- FINE MODIFICA ---

  const activePage = useMemo(
    () => pages.find((p: Page) => p._id === activePageId),
    [pages, activePageId]
  );

  // Logica pulsante indietro (Mobile)
  const parentPage = useMemo(() => {
    if (!activePage?.parentId) return null;
    return pages.find((p: Page) => p._id === activePage.parentId);
  }, [pages, activePage]);

  const handleGoBack = () => {
    if (parentPage) {
      onSelectPage(parentPage._id);
    }
  };

  // Drawer Mobile
  const { headings, backlinks } = useMobileDrawerData();
  const [drawerContent, setDrawerContent] = useState<
    'toc' | 'backlinks' | 'more' | null
  >(null);

  const hasHeadings = headings.length > 0;
  const hasBacklinks = backlinks.length > 0;

  const getDrawerTitle = () => {
    if (drawerContent === 'toc') return 'Indice Pagina';
    if (drawerContent === 'backlinks') return 'Backlinks';
    if (drawerContent === 'more') return 'Altre Opzioni';
    return '';
  };

  return (
    <React.Fragment>
      <div
        className={`fixed top-0 left-0 right-0 z-40 flex items-center h-12 text-notion-text dark:text-notion-text-dark transition-all duration-300 ease-in-out bg-notion-bg dark:bg-notion-bg-dark`}
        style={{
          paddingLeft: isSidebarOpen ? 'calc(18rem + 1rem)' : '1rem',
          paddingRight: '1rem',
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

        {/* VISTA DESKTOP */}
        <nav className="hidden md:flex items-center truncate flex-1 min-w-0">
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

        {/* Controlli a destra (Desktop) */}
        <div className="hidden md:flex items-center space-x-2 ml-auto pl-4">
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
            mode="desktop"
          />

          {activePage && <ShareMenu page={activePage} />}

          <PomodoroTimer />

          <div className="flex-shrink-0">
            <UserButton afterSignOutUrl="/" />
          </div>

          {isSplitView && <div className="w-8 flex-shrink-0" />}
        </div>

        {/* VISTA MOBILE */}
        <div className="flex md:hidden items-center justify-between flex-1 min-w-0">
          <button
            onClick={handleGoBack}
            disabled={!parentPage}
            className="p-2 rounded-md hover:bg-notion-hover dark:hover:bg-notion-hover-dark disabled:opacity-30"
            aria-label="Pagina precedente"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>

          <span className="truncate font-semibold text-sm px-2">
            {activePage?.icon ? (
              <span className="mr-1">{activePage.icon}</span>
            ) : null}
            {activePage?.title || 'Untitled'}
          </span>

          <div className="flex-1" />

          <button
            onClick={onOpenSpotlight}
            className="p-2 rounded-md hover:bg-notion-hover dark:hover:bg-notion-hover-dark"
            aria-label="Apri ricerca"
          >
            <SearchIcon className="w-5 h-5" />
          </button>

          {hasHeadings && (
            <button
              onClick={() => setDrawerContent('toc')}
              className="p-2 rounded-md hover:bg-notion-hover dark:hover:bg-notion-hover-dark"
              aria-label="Apri indice"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
          )}

          {hasBacklinks && (
            <button
              onClick={() => setDrawerContent('backlinks')}
              className="p-2 rounded-md hover:bg-notion-hover dark:hover:bg-notion-hover-dark"
              aria-label="Apri backlinks"
            >
              <LinkIcon className="w-5 h-5" />
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setDrawerContent('more')}
              className="p-2 rounded-md hover:bg-notion-hover dark:hover:bg-notion-hover-dark"
              aria-label="Altre opzioni"
            >
              <DotsHorizontalIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <MobileDrawer
        isOpen={drawerContent !== null}
        onClose={() => setDrawerContent(null)}
        title={getDrawerTitle()}
      >
        {drawerContent === 'toc' && activePageId && (
          <TableOfContents
            headings={headings}
            pageId={activePageId}
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
        {drawerContent === 'more' && activePage && (
          <div className="flex flex-col space-y-2">
            <div className="p-2">
              <UserButton afterSignOutUrl="/" />
            </div>
            <div className="border-t border-notion-border dark:border-notion-border-dark my-1"></div>
            <ShareMenu page={activePage} />
            <div className="border-t border-notion-border dark:border-notion-border-dark my-1"></div>
            <PomodoroTimer />
            <div className="border-t border-notion-border dark:border-notion-border-dark my-1"></div>
            <SaveStatusIndicator
              status={saveStatus}
              lastSaveTime={lastSaveTime}
              lastModified={lastModified}
              onSaveNow={onSaveNow}
              mode="mobile"
            />
          </div>
        )}
      </MobileDrawer>
    </React.Fragment>
  );
};