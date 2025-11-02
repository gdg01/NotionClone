// File: components/SpotlightSearch.tsx (Corretto e Pulito)

import React, { useState, useEffect, useRef } from 'react';
import { useAction } from 'convex/react';
import { api } from '../convex/_generated/api';
import { SearchIcon, XIcon, RefreshCwIcon, FileTextIcon, GlobeIcon, SplitIcon } from './icons';

// --- Tipi di Dati (Invariati) ---
interface InternalResult {
  _id: string; // pageId
  blockId: string;
  score: number;
  textPreview: string;
  pageTitle: string;
  pageIcon?: string;
}
interface ExternalResult {
  url: string;
  source_title: string;
  snippet: string;
}
interface SearchResponse {
  combinedSummary: string;
  internalSummary: string;
  externalSummary: string;
  internal: InternalResult[];
  external: ExternalResult[];
}

// --- Props (Invariate) ---
interface SpotlightSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBlock: (pageId: string, blockId: string) => void;
  onOpenInSplitView: (pageId: string, blockId: string | null) => void;
}

type ActiveView = 'internal' | 'external' | 'combined';


export const SpotlightSearch: React.FC<SpotlightSearchProps> = ({
  isOpen,
  onClose,
  onSelectBlock,
  onOpenInSplitView,
}) => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('internal');

  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const performSearch = useAction(api.search.performContextualSearch);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const searchQuery = query.trim();
    if (searchQuery.length < 3) {
      setResults(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setResults(null); // Resetta
    try {
      const response: SearchResponse = await performSearch({ query: searchQuery });
      setResults(response);

      if (response.internal.length > 0) {
        setActiveView('internal');
      } else if (response.external.length > 0) {
        setActiveView('external');
      } else {
        setActiveView('internal');
      }

    } catch (err) {
      console.error("Errore nella ricerca contestuale:", err);
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    if (results) { setResults(null); } // Nasconde i risultati se l'utente digita
    if (isLoading) { setIsLoading(false); }
  };

  const handleResultClick = (result: InternalResult) => {
    onSelectBlock(result._id, result.blockId);
    onClose();
  };
  const handleSplitViewClick = (result: InternalResult) => {
    onOpenInSplitView(result._id, result.blockId);
    onClose();
  };

  // --- Gestione Eventi (Invariata) ---
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery(""); setResults(null); setIsLoading(false);
      setActiveView('internal');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') { onClose(); } };
    const handleClickOutside = (e: MouseEvent) => {
        if (panelRef.current && !panelRef.current.contains(e.target as Node)) { onClose(); }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);


  if (!isOpen) return null;


  // --- Helper di rendering (Definiti *dentro* il componente) ---

  const renderSummary = (title: string, text: string) => {
    if (!text) return null;
    return (
      <div>
        <h3 className="text-xs font-semibold uppercase text-notion-text-gray dark:text-notion-text-gray-dark mb-2 px-2">{title}</h3>
        <p className="text-sm p-3 bg-notion-hover dark:bg-notion-hover-dark rounded-md whitespace-pre-wrap">{text}</p>
      </div>
    );
  };

  const renderInternalSources = (sources: InternalResult[]) => {
    if (sources.length === 0) return null;
    return (
      <div>
        <h3 className="text-xs font-semibold uppercase text-notion-text-gray dark:text-notion-text-gray-dark mb-2 px-2">Nelle tue note</h3>
        <ul className="space-y-1">
          {sources.map((res) => (
            <li key={res._id + res.blockId} className="flex items-center justify-between w-full rounded-md hover:bg-notion-active dark:hover:bg-notion-active-dark group">
              <button onClick={() => handleResultClick(res)} className="flex-grow text-left flex items-start p-2 min-w-0">
                <span className="mr-2 text-lg pt-0.5">{res.pageIcon || <FileTextIcon className="w-5 h-5"/>}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{res.pageTitle}</p>
                  <p className="text-xs text-notion-text-gray dark:text-notion-text-gray-dark truncate">{res.textPreview}</p>
                </div>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleSplitViewClick(res); }}
                className="p-2 mr-1 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-notion-hover dark:hover:bg-notion-hover-dark flex-shrink-0"
                aria-label="Apri in vista divisa"
              >
                <SplitIcon className="w-4 h-4 text-notion-text-gray dark:text-notion-text-gray-dark" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderExternalSources = (sources: ExternalResult[]) => {
    if (sources.length === 0) return null;
    return (
      <div>
        <h3 className="text-xs font-semibold uppercase text-notion-text-gray dark:text-notion-text-gray-dark mb-2 px-2">Dal Web</h3>
        <ul className="space-y-1">
          {sources.map((res, index) => (
            <li key={index}>
              <a href={res.url} target="_blank" rel="noopener noreferrer" className="w-full text-left flex items-start p-2 rounded-md hover:bg-notion-active dark:hover:bg-notion-active-dark">
                <GlobeIcon className="w-4 h-4 mr-3 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate text-blue-600 dark:text-blue-400">{res.source_title}</p>
                  <p className="text-xs text-notion-text-gray dark:text-notion-text-gray-dark line-clamp-2">{res.snippet}</p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Logica per i Tab
  const hasInternal = results && results.internal.length > 0;
  const hasExternal = results && results.external.length > 0;
  const showTabs = hasInternal && hasExternal;
  
  let finalView = activeView;
  if (!showTabs && results) {
    finalView = hasInternal ? 'internal' : 'external';
  }


  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm transition-opacity duration-100">
      
      <div 
        ref={panelRef}
        className="w-full max-w-2xl bg-notion-bg dark:bg-notion-bg-dark rounded-lg shadow-2xl border border-notion-border dark:border-notion-border-dark"
      >
        <form onSubmit={handleSearchSubmit}>
          <div className={`flex items-center p-3 ${ (results) ? 'border-b border-notion-border dark:border-notion-border-dark' : '' }`}>
            {isLoading ? (
              <RefreshCwIcon className="w-5 h-5 mr-3 text-notion-text-gray dark:text-notion-text-gray-dark animate-spin" />
            ) : (
              <SearchIcon className="w-5 h-5 mr-3 text-notion-text-gray dark:text-notion-text-gray-dark" />
            )}
            <input
              ref={inputRef} type="text" value={query} onChange={handleQueryChange}
              placeholder="Cerca per contesto... (Premi Invio per cercare)"
              className="w-full text-lg bg-transparent focus:outline-none placeholder-notion-text-gray/70 dark:placeholder-notion-text-gray-dark/70"
            />
            <button onClick={onClose} type="button" className="p-1 rounded hover:bg-notion-hover dark:hover:bg-notion-hover-dark" aria-label="Chiudi">
              <XIcon className="w-5 h-5 text-notion-text-gray dark:text-notion-text-gray-dark" />
            </button>
          </div>
        </form>

        {/* --- MODIFICA CHIAVE --- */}
        {/* L'intera area dei risultati ora appare solo se 'results' esiste e 'isLoading' è falso */}
        {results && !isLoading && (
          <div className="max-h-[55vh] overflow-y-auto p-3">
            
            {/* Messaggio "Nessun risultato" */}
            {!hasInternal && !hasExternal && (
               <p className="text-center text-notion-text-gray dark:text-notion-text-gray-dark p-4">
                  Nessun risultato trovato per "{query}".
               </p>
            )}

            {/* Tab (Appaiono solo se !isLoading, results esiste, e showTabs è true) */}
            {showTabs && (
              <div className="flex items-center p-2 border-b border-notion-border dark:border-notion-border-dark">
                <button
                  onClick={() => setActiveView('internal')}
                  className={`px-3 py-1 text-sm rounded-md ${activeView === 'internal' ? 'bg-notion-active dark:bg-notion-active-dark' : 'hover:bg-notion-hover dark:hover:bg-notion-hover-dark'}`}
                >
                  Le mie note
                </button>
                <button
                  onClick={() => setActiveView('external')}
                  className={`px-3 py-1 text-sm rounded-md ${activeView === 'external' ? 'bg-notion-active dark:bg-notion-active-dark' : 'hover:bg-notion-hover dark:hover:bg-notion-hover-dark'}`}
                >
                  Dal Web
                </button>
                <button
                  onClick={() => setActiveView('combined')}
                  className={`px-3 py-1 text-sm rounded-md ${activeView === 'combined' ? 'bg-notion-active dark:bg-notion-active-dark' : 'hover:bg-notion-hover dark:hover:bg-notion-hover-dark'}`}
                >
                  Mix
                </button>
              </div>
            )}

            {/* Contenuto dei Risultati */}
            <div className={`space-y-4 ${showTabs ? 'pt-2' : ''}`}>
              
              {finalView === 'internal' && (
                <>
                  {renderSummary("Sintesi (dalle tue Note)", results.internalSummary)}
                  {renderInternalSources(results.internal)}
                </>
              )}

              {finalView === 'external' && (
                <>
                  {renderSummary("Sintesi (dal Web)", results.externalSummary)}
                  {renderExternalSources(results.external)}
                </>
              )}

              {finalView === 'combined' && (
                <>
                  {renderSummary("Risposta AI (Completa)", results.combinedSummary)}
                  {renderInternalSources(results.internal)}
                  {renderExternalSources(results.external)}
                </>
              )}

            </div>
          </div>
        )}
        {/* --- FINE Area Risultati --- */}

      </div>
    </div>
  );
};