// File: components/ReviewView.tsx (MODIFICATO PER FLIP E SWIPE MOBILE)

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Doc } from '../convex/_generated/dataModel';
import { ArrowLeftIcon, EditIcon, LinkIcon, SaveIcon, TrashIcon } from './icons';
import { motion, useAnimation, PanInfo } from 'framer-motion';

interface ReviewViewProps {
  deckId: string;
  deckType: 'page' | 'tag';
  onClose: () => void;
  onOpenInSplitView: (pageId: string, blockId: string | null) => void;
}

// Hook utility per rilevare mobile (invariato)
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
};

export const ReviewView: React.FC<ReviewViewProps> = ({
  deckId,
  deckType,
  onClose,
  onOpenInSplitView,
}) => {
  // 1. Ottieni carte e mutazioni (invariato)
  const dueCards = useQuery(api.flashcards.listDueCards, { deckId, deckType });
  const reviewCard = useMutation(api.flashcards.reviewCard);
  const updateCard = useMutation(api.flashcards.update);
  const deleteCard = useMutation(api.flashcards.deleteCard);

  // 2. Stato locale (invariato)
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isAnswerShown, setIsAnswerShown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const isMobile = useIsMobile();
  const swipeControls = useAnimation();

  const currentCard = useMemo(() => {
    if (!dueCards || dueCards.length === 0) return null;
    return dueCards[currentCardIndex % dueCards.length];
  }, [dueCards, currentCardIndex]);

  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");

  // 3. Resetta quando il mazzo cambia (invariato)
  useEffect(() => {
    setCurrentCardIndex(0);
    setIsAnswerShown(false);
  }, [deckId]);
  
  // 4. Sincronizza l'editor (invariato)
  useEffect(() => {
    if (currentCard) {
      setEditFront(currentCard.front);
      setEditBack(currentCard.back);
    }
  }, [currentCard, isEditing]);

  const handleNextCard = (resetAnimation = true) => {
    setIsAnswerShown(false);
    setIsEditing(false);
    if (dueCards && currentCardIndex >= dueCards.length - 1) {
      setCurrentCardIndex(0);
    }
    if (resetAnimation) {
      swipeControls.start({ x: 0, opacity: 1, transition: { duration: 0 } });
    }
  };

  // --- LOGICA (invariata) ---

  const handleReview = async (rating: "wrong" | "right") => {
    if (!currentCard) return;
    try {
      if (isMobile) {
        await swipeControls.start({
          x: rating === 'right' ? 300 : -300,
          opacity: 0,
          transition: { duration: 0.2 }
        });
      }
      
      await reviewCard({ cardId: currentCard._id, rating });
      handleNextCard(true);
    } catch (e) {
      console.error("Errore durante la revisione:", e);
      swipeControls.start({ x: 0, opacity: 1 });
    }
  };
  
  const handleSaveEdit = async () => {
    if (!currentCard) return;
    await updateCard({ cardId: currentCard._id, front: editFront, back: editBack });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!currentCard) return;
    if (window.confirm("Sei sicuro di voler eliminare questa flashcard? L'azione è irreversibile.")) {
      try {
        await deleteCard({ cardId: currentCard._id });
        handleNextCard(false);
      } catch (e) {
        console.error("Errore durante l'eliminazione:", e);
      }
    }
  };

  const handleShowContext = () => {
    if (!currentCard || !currentCard.sourceBlockId) return;
    onOpenInSplitView(currentCard.sourcePageId, currentCard.sourceBlockId);
  };

  // --- GESTIONE SWIPE (invariata) ---
  const onDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset } = info;
    const swipeThreshold = 100;

    if (offset.x > swipeThreshold) {
      handleReview("right");
    } else if (offset.x < -swipeThreshold) {
      handleReview("wrong");
    } else {
      swipeControls.start({ x: 0 });
    }
  };

  // --- Render ---

  if (dueCards === undefined) {
    return <div className="h-full w-full flex items-center justify-center">Caricamento...</div>;
  }

  if (!currentCard) {
    // Schermata "Mazzo Completato" (invariata)
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

  // --- CLASSI CSS PER LE FACCE DELLA CARTA ---
  const cardFaceClasses = "absolute w-full h-full p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-notion-sidebar dark:bg-notion-sidebar-dark rounded-lg shadow-lg border border-notion-border dark:border-notion-border-dark";

  return (
    <div className="h-full w-full relative flex flex-col items-center p-4 pt-24 pb-8 overflow-y-auto bg-notion-bg dark:bg-notion-bg-dark text-notion-text dark:text-notion-text-dark">
      
      {/* Header fisso (invariato) */}
      <div className="absolute top-8 left-0 right-0 p-4 flex justify-between items-center">
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
          {isEditing && (
             <button
              onClick={handleDelete}
              className="p-2 rounded-md text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50"
              title="Elimina Card"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* --- MODIFICATO: Contenuto Card (Animato con Swipe e Flip) --- */}
      <motion.div
        className="w-full max-w-3xl flex-1 flex flex-col justify-center"
        // Le gesture di SWIPE rimangono sul container esterno
        drag={isMobile && isAnswerShown && !isEditing ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={onDragEnd}
        animate={swipeControls} // Controlla l'animazione di swipe (x, opacity)
      >
        {isEditing ? (
          // --- VISTA MODIFICA (Invariata) ---
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
          // --- NUOVO: VISTA REVISIONE (Con Flip 3D) ---
          <div
            className="w-full flex-1 flex items-center justify-center"
            // 1. Aggiunge prospettiva per l'effetto 3D
            style={{ perspective: '1000px' }}
          >
            {/* 2. Questo è il container che FLIPPA */}
            <motion.div
              className="relative w-full"
              // Diamo una dimensione definita alla carta per il flip
              style={{
                transformStyle: 'preserve-3d',
                height: '40vh',
                maxHeight: '400px',
              }}
              // 3. Anima la rotazione Y in base allo stato (solo su mobile)
              animate={{ rotateY: isMobile && isAnswerShown ? 180 : 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              // 4. Il TAP gestisce il flip (solo su mobile)
              onClick={!isEditing && isMobile ? () => setIsAnswerShown(!isAnswerShown) : undefined}
            >
              {/* --- FRONTE --- */}
              <div
                className={cardFaceClasses}
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="text-3xl md:text-4xl font-semibold whitespace-pre-wrap">
                  {currentCard.front}
                </div>
              </div>

              {/* --- RETRO --- */}
              <div
                className={`${cardFaceClasses} text-notion-text-gray dark:text-notion-text-gray-dark`}
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <div className="text-2xl md:text-3xl whitespace-pre-wrap">
                  {currentCard.back}
                </div>
              </div>
            </motion.div>

            {/* --- VISTA DESKTOP (Mostra fronte e retro impilati) --- */}
            {!isMobile && (
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
        )}
      </motion.div>

      {/* --- MODIFICATO: Footer Azioni --- */}
      <div className="w-full max-w-3xl pt-8">
        {!isEditing && (
          isAnswerShown ? (
            <>
              {/* --- Pulsanti Valutazione (SOLO DESKTOP) --- */}
              {!isMobile && (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleReview("wrong")}
                    className="p-4 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 flex items-center justify-center gap-2"
                  >
                    Sbagliato
                  </button>
                  <button
                    onClick={() => handleReview("right")}
                    className="p-4 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    Giusto
                  </button>
                </div>
              )}
              
              {/* --- Istruzioni Swipe (SOLO MOBILE) --- */}
              {isMobile && (
                <div className="text-center text-lg text-notion-text-gray dark:text-notion-text-gray-dark p-4">
                  Swipe per 'Sbagliato' (sinistra) o 'Giusto' (destra)
                </div>
              )}
            </>
          ) : (
            // --- Pulsante Mostra Risposta (Desktop) o Istruzione (Mobile) ---
            isMobile ? (
              <div className="text-center text-lg text-notion-text-gray dark:text-notion-text-gray-dark p-4">
                Tocca la carta per girarla
              </div>
            ) : (
              <button
                onClick={() => setIsAnswerShown(true)}
                className="w-full px-6 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-blue-700"
              >
                Mostra Risposta
              </button>
            )
          )
        )}
      </div>
    </div>
  );
};