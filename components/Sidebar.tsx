// File: src/components/Sidebar.tsx (Modificato)

import React, { useState, useRef } from 'react';
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
} from './icons';
import { EmojiPicker } from './EmojiPicker';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

type PageWithChildren = Page & { hasChildren: boolean };

// --- Interfaccia props per Sidebar (MODIFICATA) ---
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
  onOpenFlowAndEditor: (pageId: string) => void; // <-- 1. AGGIUNGI LA NUOVA PROP
}

// --- Interfaccia props per PageItem (MODIFICATA) ---
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
  onOpenFlowAndEditor: (pageId: string) => void; // <-- 2. AGGIUNGI LA NUOVA PROP
}

// --- Componente PageItem (MODIFICATO) ---
const PageItem: React.FC<PageItemProps> = ({
  page,
  level,
  onAddPage,
  onDeletePage,
  onSelectPage,
  onOpenInSplitView, // Questa prop non è più usata per Ctrl+Click, ma la lasciamo per ora
  onUpdatePage,
  activePageId,
  onOpenFlowView,
  onOpenFlowAndEditor, // <-- 3. RICEVI LA NUOVA PROP
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const iconRef = useRef<HTMLButtonElement>(null);

  const isActive = page._id === activePageId;
  const hasChildren = page.hasChildren;
  const childPages = useQuery(
    api.pages.getSidebar,
    isExpanded && hasChildren ? { parentPage: page._id } : 'skip'
  );

  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPickerOpen(true);
  };

// --- 4. MODIFICA CHIAVE QUI ---
  const handlePageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (e.metaKey || e.ctrlKey) {
      // Chiama la nuova funzione "combo" <- Commento originale
      // onOpenFlowAndEditor(page._id);     <- QUESTA È LA RIGA DA CAMBIARE

      // --- MODIFICA ---
      // Chiama la funzione per aprire in split view
      onOpenInSplitView(page._id);
      // --- FINE MODIFICA ---

    } else {
      // Comportamento normale
      onSelectPage(page._id);
    }
  };
  // --- FINE MODIFICA ---

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
          onClick={handlePageClick} // <-- Ora usa la logica aggiornata
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

          {/* ... (logica icona e titolo invariata) ... */}
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
        <div className="flex items-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* ... (pulsanti flow, trash, add invariati) ... */}
           <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenFlowView(page._id);
            }}
            className="p-1 rounded hover:bg-notion-active dark:hover:bg-notion-active-dark"
            title="Visualizza flusso"
          >
            <FilterIcon className="w-3.5 h-3.5 text-notion-text-gray dark:text-notion-text-gray-dark" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeletePage(page._id);
            }}
            className="p-1 rounded hover:bg-notion-active dark:hover:bg-notion-active-dark"
          >
            <TrashIcon className="w-3.5 h-3.5 text-notion-text-gray dark:text-notion-text-gray-dark" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddPage(page._id);
            }}
            className="p-1 rounded hover:bg-notion-active dark:hover:bg-notion-active-dark"
          >
            <AddPageIcon className="w-3.5 h-3.5 text-notion-text-gray dark:text-notion-text-gray-dark" />
          </button>
        </div>
      </div>

      {/* ... (logica childPages invariata) ... */}
      {isExpanded && childPages && (
        <div>
          {childPages.map((child) => (
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
              onOpenFlowAndEditor={onOpenFlowAndEditor} // <-- 5. PASSA LA PROP AI FIGLI
            />
          ))}
        </div>
      )}
      {isExpanded && hasChildren && childPages === undefined && (
        <div
          style={{ paddingLeft: `${(level + 1) * 16 + 4}px` }}
          className="text-xs text-notion-text-gray dark:text-notion-text-gray-dark py-1"
        >
          Loading...
        </div>
      )}
    </div>
  );
};

// --- Componente Sidebar Principale (MODIFICATO) ---
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
  onOpenFlowAndEditor, // <-- 6. RICEVI LA PROP DA APP.TSX
}) => {
  const topLevelPages = useQuery(api.pages.getSidebar, {
    parentPage: undefined,
  });

  return (
    <>
      {/* ... (pulsante apri/chiudi e header invariati) ... */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-4 left-4 z-30 p-2 rounded-md bg-white/50 dark:bg-black/50 backdrop-blur-sm hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors ${
          isOpen ? 'hidden' : 'block'
        }`}
        aria-label="Open sidebar"
      >
        <MenuIcon className="w-6 h-6" />
      </button>
      <aside
        className={`fixed top-0 left-0 h-full bg-notion-sidebar dark:bg-notion-sidebar-dark border-r border-notion-border dark:border-notion-border-dark flex flex-col z-20 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } w-64 md:w-72 transition-colors duration-200`}
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
          {topLevelPages === undefined && (
            <div className="text-xs text-notion-text-gray dark:text-notion-text-gray-dark p-2">
              Loading pages...
            </div>
          )}
          {topLevelPages &&
            topLevelPages.map((page) => (
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
                onOpenFlowAndEditor={onOpenFlowAndEditor} // <-- 7. PASSA LA PROP AL PRIMO LIVELLO
              />
            ))}
        </nav>
        {/* ... (footer e pulsanti add, graph, theme invariati) ... */}
         <div className="p-2 border-t border-notion-border dark:border-notion-border-dark flex items-center space-x-2">
          <button
            onClick={() => onAddPage(null)}
            className="w-full flex items-center py-2 px-2 text-sm text-notion-text-gray dark:text-notion-text-gray-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark rounded"
          >
            <AddPageIcon className="w-4 h-4 mr-2" />
            Add a new page
          </button>
          <button
            onClick={onOpenGraphView}
            className="flex-shrink-0 p-2 text-sm text-notion-text-gray dark:text-notion-text-gray-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark rounded"
            aria-label="Open Graph View"
            title="Graph View"
          >
            <GlobeIcon className="w-4 h-4" />
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
      </aside>
    </>
  );
};