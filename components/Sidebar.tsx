// File: src/components/Sidebar.tsx
// (SOSTITUZIONE COMPLETA - Con fix colori testo drawer mobile)

import React, { useState, useRef, useEffect } from 'react';
import type { Page } from '../App';
import {
  AddPageIcon,
  PageIcon,
  TrashIcon,
  ChevronRightIcon,
  MenuIcon,
  SunIcon,
  MoonIcon,
  ChevronDoubleLeftIcon,
  GlobeIcon,
  FilterIcon,
  CheckSquareIcon,
  PinIcon,
  PinOffIcon,
  SparkleIcon,
  DotsHorizontalIcon,
} from './icons';
import { EmojiPicker } from './EmojiPicker';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Doc } from '../convex/_generated/dataModel';
import { MobileDrawer } from './MobileDrawer';

// Tipo (invariato)
type PageWithChildren = Page & { hasChildren: boolean; isPinned?: boolean };

// --- Interfaccia props per Sidebar (invariata) ---
interface SidebarProps {
  onAddPage: (parentId: string | null) => void;
  onDeletePage: (pageId: string) => void;
  onSelectPage: (pageId: string) => void;
  onOpenInSplitView: (pageId: string) => void;
  onUpdatePage: (
    pageId: string,
    updates: Partial<Omit<Page, '_id' | 'userId' | '_creationTime'>>
  ) => void;
  activePageId: string | null;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  theme: string;
  toggleTheme: () => void;
  onOpenGraphView: () => void;
  onOpenFlowView: (pageId: string) => void;
  onOpenFlowAndEditor: (pageId: string) => void;
  onOpenTasksView: () => void;
  onOpenFlashcards: () => void;
}

// --- Interfaccia props per PageItem (invariata) ---
interface PageItemProps {
  page: PageWithChildren;
  level: number;
  onAddPage: (parentId: string | null) => void;
  onDeletePage: (pageId: string) => void;
  onSelectPage: (pageId: string) => void;
  onOpenInSplitView: (pageId: string) => void;
  onUpdatePage: (
    pageId: string,
    updates: Partial<Omit<Page, '_id' | 'userId' | '_creationTime'>>
  ) => void;
  activePageId: string | null;
  onOpenFlowView: (pageId: string) => void;
  onOpenFlowAndEditor: (pageId: string) => void;
  onOpenMobileDrawer: (page: PageWithChildren) => void;
}

// --- Componente PageItem (invariato) ---
const PageItem: React.FC<PageItemProps> = ({
  page,
  level,
  onAddPage,
  onDeletePage,
  onSelectPage,
  onOpenInSplitView,
  onUpdatePage,
  activePageId,
  onOpenFlowView,
  onOpenFlowAndEditor,
  onOpenMobileDrawer,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const iconRef = useRef<HTMLButtonElement>(null);

  const isActive = page._id === activePageId;
  const hasChildren = page.hasChildren;

  const childPagesData = useQuery(
    api.pages.getSidebar,
    isExpanded && hasChildren ? { parentPage: page._id } : 'skip'
  );

  const pinnedChildPages = childPagesData?.pinned;
  const privateChildPages = childPagesData?.private;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPickerOpen(true);
  };

  const handlePageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (e.metaKey || e.ctrlKey) {
      onOpenInSplitView(page._id);
    } else {
      onSelectPage(page._id);
    }
  };

  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdatePage(page._id, { isPinned: !page.isPinned });
  };

  return (
    <div>
      <div
        className={`group flex items-center justify-between py-1 pr-2 rounded cursor-pointer ${
          isActive
            ? 'bg-notion-active dark:bg-notion-active-dark'
            : 'hover:bg-notion-hover dark:hover:bg-notion-hover-dark'
        }`}
        style={{ paddingLeft: `${level * 16 + 4}px` }}
      >
        <div
          className="flex items-center flex-grow min-w-0"
          onClick={handlePageClick}
        >
          {hasChildren ? (
            <ChevronRightIcon
              className={`w-4 h-4 mr-1 text-notion-text-gray dark:text-notion-text-gray-dark flex-shrink-0 transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            />
          ) : (
            <div className="w-4 h-4 mr-1 flex-shrink-0" />
          )}

          <div className="relative">
            <button
              ref={iconRef}
              onClick={handleIconClick}
              className="flex items-center justify-center w-4 h-4 mr-2 text-notion-text-gray dark:text-notion-text-gray-dark flex-shrink-0 rounded hover:bg-notion-active dark:hover:bg-notion-active-dark"
            >
              {page.icon ? (
                <span className="text-sm">{page.icon}</span>
              ) : (
                <PageIcon className="w-full h-full" />
              )}
            </button>
            {isPickerOpen && (
              <EmojiPicker
                onSelect={(emoji) => {
                  onUpdatePage(page._id, { icon: emoji });
                  setIsPickerOpen(false);
                }}
                onClose={() => setIsPickerOpen(false)}
              />
            )}
          </div>
          <span className="truncate flex-grow">{page.title || 'Untitled'}</span>
        </div>

        <div className="relative flex-shrink-0">
          <button
            ref={menuButtonRef}
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen((prev) => !prev);
            }}
            className="hidden md:flex flex-shrink-0 p-1 rounded hover:bg-notion-active dark:hover:bg-notion-active-dark opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Opzioni pagina"
          >
            <DotsHorizontalIcon className="w-4 h-4 text-notion-text-gray dark:text-notion-text-gray-dark" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenMobileDrawer(page);
            }}
            className="flex md:hidden flex-shrink-0 p-1 rounded hover:bg-notion-active dark:hover:bg-notion-active-dark"
            aria-label="Opzioni pagina"
          >
            <DotsHorizontalIcon className="w-4 h-4 text-notion-text-gray dark:text-notion-text-gray-dark" />
          </button>

          {isMenuOpen && (
            <div
              ref={menuRef}
              className="absolute top-full right-0 mt-1 w-52 bg-notion-sidebar dark:bg-notion-sidebar-dark border border-notion-border dark:border-notion-border-dark rounded-md shadow-lg p-1 z-30"
            >
              <button
                onClick={(e) => {
                  handleTogglePin(e);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center text-left px-2 py-1.5 text-sm rounded hover:bg-notion-hover dark:hover:bg-notion-hover-dark"
              >
                {page.isPinned ? (
                  <PinOffIcon className="w-3.5 h-3.5 mr-2 text-blue-500" />
                ) : (
                  <PinIcon className="w-3.5 h-3.5 mr-2" />
                )}
                {page.isPinned ? 'Sblocca dalla cima' : 'Fissa in cima'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddPage(page._id);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center text-left px-2 py-1.5 text-sm rounded hover:bg-notion-hover dark:hover:bg-notion-hover-dark"
              >
                <AddPageIcon className="w-3.5 h-3.5 mr-2" />
                Aggiungi sottopagina
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenFlowView(page._id);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center text-left px-2 py-1.5 text-sm rounded hover:bg-notion-hover dark:hover:bg-notion-hover-dark"
              >
                <FilterIcon className="w-3.5 h-3.5 mr-2" />
                Visualizza flusso
              </button>
              <div className="border-t border-notion-border dark:border-notion-border-dark my-1 mx-1"></div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePage(page._id);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center text-left px-2 py-1.5 text-sm rounded text-red-500 hover:bg-notion-hover dark:hover:bg-notion-hover-dark"
              >
                <TrashIcon className="w-3.5 h-3.5 mr-2" />
                Elimina pagina
              </button>
            </div>
          )}
        </div>
      </div>

      {isExpanded && childPagesData === undefined && (
        <div
          style={{ paddingLeft: `${(level + 1) * 16 + 4}px` }}
          className="text-xs text-notion-text-gray dark:text-notion-text-gray-dark py-1"
        >
          Loading...
        </div>
      )}

      {isExpanded && childPagesData && (
        <>
          {pinnedChildPages &&
            pinnedChildPages.map((child) => (
              <PageItem
                key={child._id}
                page={child}
                level={level + 1}
                onAddPage={onAddPage}
                onDeletePage={onDeletePage}
                onSelectPage={onSelectPage}
                onOpenInSplitView={onOpenInSplitView}
                onUpdatePage={onUpdatePage}
                activePageId={activePageId}
                onOpenFlowView={onOpenFlowView}
                onOpenFlowAndEditor={onOpenFlowAndEditor}
                onOpenMobileDrawer={onOpenMobileDrawer}
              />
            ))}
          {privateChildPages &&
            privateChildPages.map((child) => (
              <PageItem
                key={child._id}
                page={child}
                level={level + 1}
                onAddPage={onAddPage}
                onDeletePage={onDeletePage}
                onSelectPage={onSelectPage}
                onOpenInSplitView={onOpenInSplitView}
                onUpdatePage={onUpdatePage}
                activePageId={activePageId}
                onOpenFlowView={onOpenFlowView}
                onOpenFlowAndEditor={onOpenFlowAndEditor}
                onOpenMobileDrawer={onOpenMobileDrawer}
              />
            ))}
        </>
      )}
    </div>
  );
};

// --- Componente Sidebar Principale (invariato tranne il contenuto del drawer) ---
export const Sidebar: React.FC<SidebarProps> = ({
  onAddPage,
  onDeletePage,
  onSelectPage,
  onOpenInSplitView,
  onUpdatePage,
  activePageId,
  isOpen,
  setIsOpen,
  theme,
  toggleTheme,
  onOpenGraphView,
  onOpenFlowView,
  onOpenFlowAndEditor,
  onOpenTasksView,
  onOpenFlashcards,
}) => {
  const topLevelPagesData = useQuery(api.pages.getSidebar, {
    parentPage: undefined,
  });

  const pinnedPages = topLevelPagesData?.pinned;
  const privatePages = topLevelPagesData?.private;

  const [drawerPage, setDrawerPage] = useState<PageWithChildren | null>(null);

  const handleCloseDrawer = () => {
    setDrawerPage(null);
  };

  return (
    <>
      <aside
        className={`fixed top-0 left-0 h-full bg-notion-sidebar dark:bg-notion-sidebar-dark border-r border-notion-border dark:border-notion-border-dark flex flex-col z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } w-full md:w-72 transition-colors duration-200`}
      >
        <div className="p-4 flex items-center justify-between">
          <h1 className="text-lg font-bold">Notion Clone</h1>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded text-notion-text-gray dark:text-notion-text-gray-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark"
            aria-label="Close sidebar"
          >
            <ChevronDoubleLeftIcon className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-2 overflow-y-auto">
          {topLevelPagesData === undefined && (
            <div className="text-xs text-notion-text-gray dark:text-notion-text-gray-dark p-2">
              Loading pages...
            </div>
          )}

          {pinnedPages && pinnedPages.length > 0 && (
            <div className="mt-2">
              <div className="sidebar-section-header">Fissate</div>
              {pinnedPages.map((page) => (
                <PageItem
                  key={page._id}
                  page={page}
                  level={0}
                  onAddPage={onAddPage}
                  onDeletePage={onDeletePage}
                  onSelectPage={onSelectPage}
                  onOpenInSplitView={onOpenInSplitView}
                  onUpdatePage={onUpdatePage}
                  activePageId={activePageId}
                  onOpenFlowView={onOpenFlowView}
                  onOpenFlowAndEditor={onOpenFlowAndEditor}
                  onOpenMobileDrawer={setDrawerPage}
                />
              ))}
            </div>
          )}

          {privatePages && (
            <div className="mt-2">
              <div className="sidebar-section-header">Private</div>
              {privatePages.length === 0 && pinnedPages?.length === 0 && (
                <div className="text-xs text-notion-text-gray dark:text-notion-text-gray-dark p-2">
                  Nessuna pagina.
                </div>
              )}
              {privatePages.map((page) => (
                <PageItem
                  key={page._id}
                  page={page}
                  level={0}
                  onAddPage={onAddPage}
                  onDeletePage={onDeletePage}
                  onSelectPage={onSelectPage}
                  onOpenInSplitView={onOpenInSplitView}
                  onUpdatePage={onUpdatePage}
                  activePageId={activePageId}
                  onOpenFlowView={onOpenFlowView}
                  onOpenFlowAndEditor={onOpenFlowAndEditor}
                  onOpenMobileDrawer={setDrawerPage}
                />
              ))}
            </div>
          )}
        </nav>

        <div className="p-2 border-t border-notion-border dark:border-notion-border-dark">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onAddPage(null)}
              className="w-full flex items-center py-2 px-2 text-sm text-notion-text-gray dark:text-notion-text-gray-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark rounded"
            >
              <AddPageIcon className="w-4 h-4 mr-2" />
              Add a new page
            </button>
            <button
              onClick={toggleTheme}
              className="flex-shrink-0 p-2 text-sm text-notion-text-gray dark:text-notion-text-gray-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark rounded"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <MoonIcon className="w-4 h-4" />
              ) : (
                <SunIcon className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="mt-1 flex items-center justify-around">
            <button
              onClick={onOpenGraphView}
              className="flex-1 flex flex-col items-center p-2 text-xs text-notion-text-gray dark:text-notion-text-gray-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark rounded"
              aria-label="Open Graph View"
              title="Graph View"
            >
              <GlobeIcon className="w-4 h-4 mb-1" />
              Graph
            </button>
            <button
              onClick={onOpenTasksView}
              className="flex-1 flex flex-col items-center p-2 text-xs text-notion-text-gray dark:text-notion-text-gray-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark rounded"
              aria-label="Open Tasks View"
              title="Tasks View"
            >
              <CheckSquareIcon className="w-4 h-4 mb-1" />
              Tasks
            </button>
            <button
              onClick={onOpenFlashcards}
              className="flex-1 flex flex-col items-center p-2 text-xs text-notion-text-gray dark:text-notion-text-gray-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark rounded"
              aria-label="Open Flashcards"
              title="Flashcards"
            >
              <SparkleIcon className="w-4 h-4 mb-1 text-blue-500" />{' '}
              {/* Icona per Study */}
              Study
            </button>
          </div>
        </div>
      </aside>

      {/* --- Contenuto del Drawer (MODIFICATO) --- */}
      <MobileDrawer
        isOpen={drawerPage !== null}
        onClose={handleCloseDrawer}
        title={`Opzioni per "${drawerPage?.title || 'Untitled'}"`}
      >
        {drawerPage && (
          <div className="flex flex-col space-y-1 p-2">
            {/* Pulsante Fissa/Sblocca (stile mobile) */}
            <button
              onClick={(e) => {
                onUpdatePage(drawerPage._id, {
                  isPinned: !drawerPage.isPinned,
                });
                handleCloseDrawer();
              }}
              // --- MODIFICA QUI ---
              className="w-full flex items-center text-left px-2 py-3 text-base rounded text-notion-text dark:text-notion-text-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark"
              // --- FINE MODIFICA ---
            >
              {drawerPage.isPinned ? (
                <PinOffIcon className="w-5 h-5 mr-3 text-blue-500" />
              ) : (
                <PinIcon className="w-5 h-5 mr-3" />
              )}
              {drawerPage.isPinned ? 'Sblocca dalla cima' : 'Fissa in cima'}
            </button>

            {/* Pulsante Aggiungi Sottopagina (stile mobile) */}
            <button
              onClick={(e) => {
                onAddPage(drawerPage._id);
                handleCloseDrawer();
              }}
              // --- MODIFICA QUI ---
              className="w-full flex items-center text-left px-2 py-3 text-base rounded text-notion-text dark:text-notion-text-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark"
              // --- FINE MODIFICA ---
            >
              <AddPageIcon className="w-5 h-5 mr-3" />
              Aggiungi sottopagina
            </button>

            {/* Pulsante Visualizza Flusso (stile mobile) */}
            <button
              onClick={(e) => {
                onOpenFlowView(drawerPage._id);
                handleCloseDrawer();
              }}
              // --- MODIFICA QUI ---
              className="w-full flex items-center text-left px-2 py-3 text-base rounded text-notion-text dark:text-notion-text-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark"
              // --- FINE MODIFICA ---
            >
              <FilterIcon className="w-5 h-5 mr-3" />
              Visualizza flusso
            </button>

            {/* Separatore */}
            <div className="border-t border-notion-border dark:border-notion-border-dark my-1 mx-1"></div>

            {/* Pulsante Elimina (stile mobile) - Invariato */}
            <button
              onClick={(e) => {
                onDeletePage(drawerPage._id);
                handleCloseDrawer();
              }}
              className="w-full flex items-center text-left px-2 py-3 text-base rounded text-red-500 hover:bg-notion-hover dark:hover:bg-notion-hover-dark"
            >
              <TrashIcon className="w-5 h-5 mr-3" />
              Elimina pagina
            </button>
          </div>
        )}
      </MobileDrawer>
      {/* --- FINE SPOSTAMENTO DRAWER --- */}
    </>
  );
};