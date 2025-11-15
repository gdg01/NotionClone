// File: components/FlashcardDashboard.tsx (NUOVO FILE)

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { DeckSummary } from '../convex/flashcards';
import { ArrowLeftIcon, PageIcon } from './icons';

interface FlashcardDashboardProps {
  onStartReview: (deckId: string, type: 'page' | 'tag') => void;
  onClose: () => void;
  onSelectPage: (pageId: string) => void;
}

const DeckRow: React.FC<{
  summary: DeckSummary;
  onStartReview: (deckId: string, type: 'page' | 'tag') => void;
  onSelectPage: (pageId: string) => void;
}> = ({ summary, onStartReview, onSelectPage }) => {
  const { deckId, deckName, deckIcon, type, counts } = summary;
  const hasDueCards = counts.due > 0;

  return (
    <div className="flex items-center justify-between p-4 bg-notion-bg dark:bg-notion-bg-dark border border-notion-border dark:border-notion-border-dark rounded-lg shadow-sm">
      <div className="flex-1 min-w-0">
        <a
          onClick={(e) => {
            e.preventDefault();
            if (type === 'page') onSelectPage(deckId);
          }}
          href={`#${deckId}`}
          className="flex items-center gap-2 mb-2 group"
          title={type === 'page' ? "Vai alla pagina" : "Mazzo Tag"}
        >
          <span className="text-xl">{deckIcon}</span>
          <span className="text-lg font-semibold truncate group-hover:underline">{deckName}</span>
        </a>
        <div className="flex items-center gap-4 text-sm text-notion-text-gray dark:text-notion-text-gray-dark">
          <div title="Da Rivedere (Scadute)">
            <span className="font-bold text-blue-500">{counts.due}</span> Scadute
          </div>
          <div title="Nuove">
            <span className="font-bold text-green-500">{counts.new}</span> Nuove
          </div>
          <div title="In Apprendimento">
            <span className="font-bold text-orange-500">{counts.learning}</span> In Appr.
          </div>
          <div title="Mature">
            <span className="font-bold text-gray-400">{counts.review}</span> Mature
          </div>
        </div>
      </div>
      <button
        onClick={() => onStartReview(deckId, type)}
        disabled={!hasDueCards}
        className="px-4 py-2 rounded-md font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
      >
        Studia ({counts.due})
      </button>
    </div>
  );
};

export const FlashcardDashboard: React.FC<FlashcardDashboardProps> = ({
  onStartReview,
  onClose,
  onSelectPage,
}) => {
  const summaries = useQuery(api.flashcards.getDeckSummaries);

  return (
    <div className="h-full w-full relative bg-notion-sidebar dark:bg-notion-sidebar-dark flex flex-col text-notion-text dark:text-notion-text-dark">
      
      {/* Header */}
      <div className="p-4 z-10 flex items-center justify-between border-b border-notion-border dark:border-notion-border-dark bg-notion-bg dark:bg-notion-bg-dark">
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

      {/* Contenuto */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-4">
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

          {summaries && summaries.map(summary => (
            <DeckRow
              key={summary.deckId}
              summary={summary}
              onStartReview={onStartReview}
              onSelectPage={onSelectPage}
            />
          ))}
        </div>
      </div>
    </div>
  );
};