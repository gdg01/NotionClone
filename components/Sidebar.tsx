// File: src/components/Sidebar.tsx 
// (SOSTITUZIONE COMPLETA - Con sezioni Pinned/Private e logica Pin)

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
  CheckSquareIcon,
  PinIcon,
  PinOffIcon,
  SparkleIcon // <-- 1. IMPORTA NUOVA ICONA (è in icons.tsx)
} from './icons';
import { EmojiPicker } from './EmojiPicker';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Doc } from '../convex/_generated/dataModel';

// Il tipo ora include 'isPinned' (anche se Page già lo aveva)
type PageWithChildren = Page & { hasChildren: boolean; isPinned?: boolean };

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
  onOpenFlowAndEditor: (pageId: string) => void;
  onOpenTasksView: () => void;
  onOpenFlashcards: () => void; // <-- 2. AGGIUNGI NUOVA PROP
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
}

// --- Componente PageItem (Invariato) ---
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
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const iconRef = useRef<HTMLButtonElement>(null);

  const isActive = page._id === activePageId;
  const hasChildren = page.hasChildren;
  
  const childPagesData = useQuery(
    api.pages.getSidebar,
    isExpanded && hasChildren ? { parentPage: page._id } : 'skip'
  );
  
  const pinnedChildPages = childPagesData?.pinned;
  const privateChildPages = childPagesData?.private;

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
        
        <div className="flex items-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
           <button
            onClick={handleTogglePin}
            className="p-1 rounded hover:bg-notion-active dark:hover:bg-notion-active-dark"
            title={page.isPinned ? "Sblocca pagina" : "Fissa pagina"}
          >
            {page.isPinned ? (
               <PinOffIcon className="w-3.5 h-3.5 text-blue-500" />
            ) : (
               <PinIcon className="w-3.5 h-3.5 text-notion-text-gray dark:text-notion-text-gray-dark" />
            )}
          </button>
          
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

      {isExpanded && (childPagesData === undefined) && (
        <div
          style={{ paddingLeft: `${(level + 1) * 16 + 4}px` }}
          className="text-xs text-notion-text-gray dark:text-notion-text-gray-dark py-1"
        >
          Loading...
        </div>
      )}
      
      {isExpanded && childPagesData && (
        <>
          {pinnedChildPages && pinnedChildPages.map((child) => (
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
            />
          ))}
          {privateChildPages && privateChildPages.map((child) => (
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
            />
          ))}
        </>
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
  onOpenFlowAndEditor,
  onOpenTasksView,
  onOpenFlashcards, // <-- 3. Ricevi la prop
}) => {

  const topLevelPagesData = useQuery(api.pages.getSidebar, {
    parentPage: undefined,
  });

  const pinnedPages = topLevelPagesData?.pinned;
  const privatePages = topLevelPagesData?.private;

  return (
    <>
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
          {topLevelPagesData === undefined && (
            <div className="text-xs text-notion-text-gray dark:text-notion-text-gray-dark p-2">
              Loading pages...
            </div>
          )}

          {pinnedPages && pinnedPages.length > 0 && (
            <div className="mt-2">
              <div className="sidebar-section-header">
                Fissate
              </div>
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
                />
              ))}
            </div>
          )}
          
          {privatePages && (
             <div className="mt-2">
              <div className="sidebar-section-header">
                Private
              </div>
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
                />
              ))}
            </div>
          )}
        </nav>
        
        {/* --- INIZIO MODIFICA FOOTER --- */}
        <div className="p-2 border-t border-notion-border dark:border-notion-border-dark">
          {/* Pulsanti Azione Principali */}
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
          
          {/* Pulsanti Viste App (Riorganizzati) */}
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
              onClick={onOpenFlashcards} // <-- 4. USA LA NUOVA PROP
              className="flex-1 flex flex-col items-center p-2 text-xs text-notion-text-gray dark:text-notion-text-gray-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark rounded"
              aria-label="Open Flashcards"
              title="Flashcards"
            >
              <SparkleIcon className="w-4 h-4 mb-1 text-blue-500" /> {/* Icona per Study */}
              Study
            </button>
          </div>
        </div>
        {/* --- FINE MODIFICA FOOTER --- */}
      </aside>
    </>
  );
};