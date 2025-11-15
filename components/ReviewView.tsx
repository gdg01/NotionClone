// File: components/ReviewView.tsx (NUOVO FILE)

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Doc } from '../convex/_generated/dataModel';
import { ArrowLeftIcon, EditIcon, LinkIcon, SaveIcon } from './icons';

interface ReviewViewProps {
  deckId: string;
  deckType: 'page' | 'tag';
  onClose: () => void;
  onOpenInSplitView: (pageId: string, blockId: string | null) => void;
}

export const ReviewView: React.FC<ReviewViewProps> = ({
  deckId,
  deckType,
  onClose,
  onOpenInSplitView,
}) => {
  // 1. Ottieni solo le carte scadute
  const dueCards = useQuery(api.flashcards.listDueCards, { deckId, deckType });
  const reviewCard = useMutation(api.flashcards.reviewCard);
  const updateCard = useMutation(api.flashcards.update);

  // 2. Stato locale
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isAnswerShown, setIsAnswerShown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const currentCard = useMemo(() => {
    if (!dueCards || dueCards.length === 0) return null;
    return dueCards[currentCardIndex % dueCards.length];
  }, [dueCards, currentCardIndex]);

  // Stato per l'editing
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");

  // 3. Resetta quando il mazzo cambia o finisce
  useEffect(() => {
    setCurrentCardIndex(0);
    setIsAnswerShown(false);
  }, [deckId]);
  
  // 4. Sincronizza l'editor quando si apre
  useEffect(() => {
    if (currentCard) {
      setEditFront(currentCard.front);
      setEditBack(currentCard.back);
    }
  }, [currentCard, isEditing]);

  const handleNextCard = () => {
    setIsAnswerShown(false);
    setIsEditing(false);
    // Nota: Non incrementiamo l'indice. La lista `dueCards`
    // si restringerà automaticamente grazie a Convex.
    // Se la lista è ancora piena, l'indice 0 mostrerà la prossima carta.
    // Se l'indice è fuori range, il memo lo riporterà a 0.
    if (dueCards && currentCardIndex >= dueCards.length - 1) {
      setCurrentCardIndex(0);
    }
  };

  const handleReview = async (rating: 0 | 1 | 2 | 3) => {
    if (!currentCard) return;
    try {
      await reviewCard({ cardId: currentCard._id, rating });
      // La reattività di Convex farà il resto.
      handleNextCard();
    } catch (e) {
      console.error("Errore durante la revisione:", e);
    }
  };
  
  const handleSaveEdit = async () => {
    if (!currentCard) return;
    await updateCard({ cardId: currentCard._id, front: editFront, back: editBack });
    setIsEditing(false);
  };

  const handleShowContext = () => {
    if (!currentCard || !currentCard.sourceBlockId) return;
    onOpenInSplitView(currentCard.sourcePageId, currentCard.sourceBlockId);
  };

  // --- Render ---

  if (dueCards === undefined) {
    return <div className="h-full w-full flex items-center justify-center">Caricamento...</div>;
  }

  if (!currentCard) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-center p-8">
        <h2 className="text-2xl font-bold mb-4">Mazzo Completato! 🎉</h2>
        <p className="text-lg text-notion-text-gray dark:text-notion-text-gray-dark mb-6">
          Hai rivisto tutte le carte scadute per questo mazzo. Torna più tardi!
        </p>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700"
        >
          Torna alla Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-4 bg-notion-bg dark:bg-notion-bg-dark text-notion-text dark:text-notion-text-dark">
      {/* Header fisso */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
        <button
          onClick={onClose}
          className="p-2 rounded-md hover:bg-notion-hover dark:hover:bg-notion-hover-dark flex items-center"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Termina Sessione
        </button>
        <div className="flex items-center gap-2">
          {currentCard.sourceBlockId && (
            <button
              onClick={handleShowContext}
              className="p-2 rounded-md hover:bg-notion-hover dark:hover:bg-notion-hover-dark"
              title="Mostra contesto (Split View)"
            >
              <LinkIcon className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`p-2 rounded-md ${isEditing ? 'bg-blue-600 text-white' : 'hover:bg-notion-hover dark:hover:bg-notion-hover-dark'}`}
            title="Modifica card"
          >
            {isEditing ? <SaveIcon className="w-5 h-5" /> : <EditIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Contenuto Card */}
      <div className="w-full max-w-3xl flex-1 flex flex-col justify-center">
        {isEditing ? (
          // --- VISTA MODIFICA ---
          <div className="space-y-4">
            <textarea
              value={editFront}
              onChange={(e) => setEditFront(e.target.value)}
              className="w-full h-32 p-4 text-2xl bg-notion-sidebar dark:bg-notion-sidebar-dark border border-notion-border dark:border-notion-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              value={editBack}
              onChange={(e) => setEditBack(e.target.value)}
              className="w-full h-48 p-4 text-xl bg-notion-sidebar dark:bg-notion-sidebar-dark border border-notion-border dark:border-notion-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSaveEdit}
              className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700"
            >
              Salva Modifiche
            </button>
          </div>
        ) : (
          // --- VISTA REVISIONE ---
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-semibold mb-8 min-h-[100px] whitespace-pre-wrap">
              {currentCard.front}
            </div>
            
            {isAnswerShown && (
              <>
                <div className="w-full h-px bg-notion-border dark:bg-notion-border-dark my-8"></div>
                <div className="text-2xl md:text-3xl text-notion-text-gray dark:text-notion-text-gray-dark min-h-[100px] whitespace-pre-wrap">
                  {currentCard.back}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer Azioni */}
      <div className="w-full max-w-3xl pt-8">
        {!isEditing && (
          isAnswerShown ? (
            // --- Pulsanti Valutazione ---
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => handleReview(0)}
                className="p-4 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700"
              >
                Sbagliato (1m)
              </button>
              <button
                onClick={() => handleReview(1)}
                className="p-4 rounded-lg font-semibold text-white bg-orange-500 hover:bg-orange-600"
              >
                Difficile (10m)
              </button>
              <button
                onClick={() => handleReview(2)}
                className="p-4 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700"
              >
                OK (1g)
              </button>
              <button
                onClick={() => handleReview(3)}
                className="p-4 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700"
              >
                Facile (4g)
              </button>
            </div>
          ) : (
            // --- Pulsante Mostra Risposta ---
            <button
              onClick={() => setIsAnswerShown(true)}
              className="w-full px-6 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-blue-700"
            >
              Mostra Risposta
            </button>
          )
        )}
      </div>
    </div>
  );
};