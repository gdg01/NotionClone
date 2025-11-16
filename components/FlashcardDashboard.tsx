// File: components/FlashcardDashboard.tsx (MODIFICATO)

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { DeckSummary } from '../convex/flashcards';
import { ArrowLeftIcon, PageIcon } from './icons'; 
import { DeckFolderIcon } from './DeckFolderIcon';

// ... (FlashcardDashboardProps e FOLDER_COLORS invariati) ...
interface FlashcardDashboardProps {
  onStartReview: (deckId: string, type: 'page' | 'tag') => void;
  onClose: () => void;
  onSelectPage: (pageId: string) => void;
}

const FOLDER_COLORS = [
  'text-red-500',
  'text-purple-500',
  'text-orange-500',
  'text-yellow-500',
  'text-green-500',
  'text-teal-500',
  'text-blue-600',
  'text-indigo-500',
];
// --- Componente DeckFolder (Modificato) ---

interface DeckFolderProps {
  summary: DeckSummary;
  onStartReview: (deckId: string, type: 'page' | 'tag') => void;
  onSelectPage: (pageId: string) => void; 
  color: string;
}

const DeckFolder: React.FC<DeckFolderProps> = ({
  summary,
  onStartReview,
  color,
}) => {
  const { deckId, deckName, deckIcon, type, counts } = summary;
  const hasDueCards = counts.due > 0;

  const handleStudyClick = () => {
    if (hasDueCards) {
      onStartReview(deckId, type);
    }
  };

  return (
    <button
      onClick={handleStudyClick}
      disabled={!hasDueCards}
      // MODIFICA: Cambiato 'h-40' in 'aspect-square' per proporzioni corrette
      className={`relative w-full aspect-square text-left 
                  transition-all hover:-translate-y-1 
                  disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0
                  focus:outline-none focus:ring-2 focus:ring-blue-500 
                  focus:ring-offset-2 focus:ring-offset-notion-bg-dark
                  flex flex-col items-start justify-between p-4
                 `}
    >
      {/* Icona SVG come sfondo (Invariato) */}
      <DeckFolderIcon
        className="absolute inset-0 w-full h-full z-0 
                   drop-shadow-lg group-hover:drop-shadow-xl transition-all"
        tabClassName={color} 
        bodyClassName="text-notion-sidebar dark:text-notion-sidebar-dark"
      />

      {/* Contenuto (z-10, sopra lo sfondo) (Invariato) */}
      <div className="relative z-10 flex flex-col items-start text-left">
        <span className="text-3xl mb-2">{deckIcon}</span>
        <h3 className="font-semibold text-lg truncate text-notion-text dark:text-notion-text-dark">
          {deckName}
        </h3>
      </div>

      {/* Statistiche (z-10, sopra lo sfondo) (Invariato) */}
      <div className="relative z-10 text-left">
        <div
          className="text-2xl font-bold text-notion-text dark:text-notion-text-dark"
          title="Carte Scadute (da rivedere)"
        >
          {counts.due}
        </div>
        <div className="text-xs text-notion-text dark:text-notion-text-dark opacity-70">
          {counts.new} Nuove / {counts.learning} In Appr.
        </div>
      </div>
    </button>
  );
};


// --- Dashboard Principale (invariato) ---
export const FlashcardDashboard: React.FC<FlashcardDashboardProps> = ({
  onStartReview,
  onClose,
  onSelectPage,
}) => {
  // ... (logica e render invariati)
  const summaries = useQuery(api.flashcards.getDeckSummaries);

  return (
    <div className="h-full w-full relative bg-notion-bg dark:bg-notion-bg-dark flex flex-col text-notion-text dark:text-notion-text-dark">
      
      {/* Header (invariato) */}
      <div className="p-4 z-10 flex items-center justify-between  border-notion-border dark:border-notion-border-dark bg-notion-bg dark:bg-notion-bg-dark">
        <button
          onClick={onClose}
          className="p-2 rounded-md hover:bg-notion-hover dark:hover:bg-notion-hover-dark flex items-center"
          title="Torna all'editor"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Indietro
        </button>
        <h2 className="text-lg font-bold">Mazzi di Flashcard</h2>
        <div className="w-24"></div>
      </div>

      {/* Contenuto / Griglia (invariato) */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        
        {summaries === undefined && (
          <p className="text-center text-notion-text-gray dark:text-notion-text-gray-dark">
            Caricamento statistiche...
          </p>
        )}
        {summaries && summaries.length === 0 && (
          <p className="text-center text-notion-text-gray dark:text-notion-text-gray-dark">
            Nessuna flashcard trovata. Inizia a crearne qualcuna selezionando del testo!
          </p>
        )}

        {summaries && summaries.length > 0 && (
          <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {summaries.map((summary, index) => (
              <DeckFolder
                key={summary.deckId}
                summary={summary}
                onStartReview={onStartReview}
                onSelectPage={onSelectPage} 
                color={FOLDER_COLORS[index % FOLDER_COLORS.length]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};