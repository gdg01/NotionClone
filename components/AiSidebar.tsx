// src/components/AiSidebar.tsx (SOSTITUZIONE COMPLETA)
import React, { useState, useEffect, useRef } from 'react';
import { useAction, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SparkleIcon, RefreshCwIcon, SaveIcon } from './icons'; // <-- Importa SaveIcon
import { marked } from 'marked';
import { Id } from '../convex/_generated/dataModel'; // <-- Importa Id

// Definiamo un tipo di messaggio per la nostra UI (invariato)
type UiMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

interface AiSidebarProps {
  initialText?: string; // Il testo selezionato
  // --- INIZIO MODIFICA: Nuove props per Flashcard ---
  initialFlashcard?: { q: string, a: string } | null;
  flashcardContext?: { pageId: string, blockId: string | null } | null;
  onClose: () => void; // Per chiudere il pannello
  // --- FINE MODIFICA ---
}

export const AiSidebar: React.FC<AiSidebarProps> = ({ 
  initialText,
  initialFlashcard, 
  flashcardContext,
  onClose
}) => {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // --- INIZIO MODIFICA: Stato per l'editor flashcard ---
  const [cardFront, setCardFront] = useState("");
  const [cardBack, setCardBack] = useState("");
  const [isSavingCard, setIsSavingCard] = useState(false);
  
  const createFlashcard = useMutation(api.flashcards.create);
  // --- FINE MODIFICA ---

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const askGroq = useAction(api.ai.askGroq);

  // Gestisce il primo prompt (Modificato)
  useEffect(() => {
    // Modalità Chat (comportamento esistente)
    if (initialText && !initialFlashcard) {
      const firstPrompt = `Sei un assistente esperto. Spiega il seguente concetto in modo chiaro e conciso:\n\n"${initialText}"`;
      const systemMessage: UiMessage = { role: 'system', content: 'In attesa della spiegazione...' };
      const userMessage: UiMessage = { role: 'user', content: firstPrompt };
      
      setMessages([systemMessage]);
      handleGeneration(userMessage);
    }
    
    // --- INIZIO MODIFICA: Modalità Creazione Flashcard ---
    if (initialFlashcard) {
      setMessages([]); // Nascondi la chat
      setCardFront(initialFlashcard.q);
      setCardBack(initialFlashcard.a);
    }
    // --- FINE MODIFICA ---
  }, [initialText, initialFlashcard]);


  // Funzione helper per gestire la generazione (invariata)
  const handleGeneration = async (promptMessage: UiMessage) => {
    setIsLoading(true);
    const history = messages
      .filter(m => m.role !== 'system')
      .concat(promptMessage);
    
    setMessages(history);

    try {
      const responseContent = await askGroq({ history: history as any });
      const assistantMessage: UiMessage = { role: 'assistant', content: responseContent };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'system', content: "Errore durante la generazione." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Gestisce l'invio del form (invariato)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;
    const userMessage: UiMessage = { role: 'user', content: userInput };
    setUserInput("");
    handleGeneration(userMessage);
  };
  
  // Scroll automatico (invariato)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- INIZIO MODIFICA: Salva Flashcard ---
  const handleSaveFlashcard = async () => {
    if (!flashcardContext || !cardFront.trim() || !cardBack.trim()) return;
    
    setIsSavingCard(true);
    try {
      await createFlashcard({
        front: cardFront,
        back: cardBack,
        sourcePageId: flashcardContext.pageId as Id<"pages">,
        sourceBlockId: flashcardContext.blockId || undefined,
        // TODO: Aggiungere selezione Tag
      });
      onClose(); // Chiudi il pannello dopo il salvataggio
    } catch (e) {
      console.error("Errore salvataggio flashcard:", e);
    } finally {
      setIsSavingCard(false);
    }
  };
  // --- FINE MODIFICA ---

  return (
    <div className="h-full bg-notion-sidebar dark:bg-notion-sidebar-dark border-l border-notion-border dark:border-notion-border-dark flex flex-col">
      {/* Header (Modificato) */}
      <div className="p-4 flex items-center justify-between border-b border-notion-border dark:border-notion-border-dark">
        <h2 className="text-lg font-bold flex items-center">
          <SparkleIcon className="w-5 h-5 mr-2 text-blue-500" />
          {initialFlashcard ? "Crea Flashcard" : "Assistente AI"}
        </h2>
        {(isLoading || isSavingCard) && (
          <RefreshCwIcon className="w-4 h-4 text-notion-text-gray dark:text-notion-text-gray-dark animate-spin" />
        )}
      </div>

      {/* --- INIZIO MODIFICA: Render Condizionale --- */}
      {initialFlashcard ? (
        // --- VISTA CREAZIONE FLASHCARD ---
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <div>
            <label className="text-xs font-semibold text-notion-text-gray dark:text-notion-text-gray-dark">DOMANDA (FRONTE)</label>
            <textarea
              value={cardFront}
              onChange={(e) => setCardFront(e.target.value)}
              placeholder="Domanda..."
              rows={5}
              className="w-full mt-1 p-2 text-sm border border-notion-border dark:border-notion-border-dark rounded-md bg-notion-bg dark:bg-notion-bg-dark focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-notion-text-gray dark:text-notion-text-gray-dark">RISPOSTA (RETRO)</label>
            <textarea
              value={cardBack}
              onChange={(e) => setCardBack(e.target.value)}
              placeholder="Risposta..."
              rows={8}
              className="w-full mt-1 p-2 text-sm border border-notion-border dark:border-notion-border-dark rounded-md bg-notion-bg dark:bg-notion-bg-dark focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

      ) : (
        // --- VISTA CHAT (Esistente) ---
        <>
          <div className="flex-1 px-4 py-2 overflow-y-auto space-y-3">
            {messages.map((msg, index) => {
              
              let renderedContent;
              if (msg.role === 'assistant') {
                const rawHtml = marked.parse(msg.content) as string;
                renderedContent = (
                  <div
                    className="prose prose-sm dark:prose-invert prose-p:my-2 prose-ul:my-2 prose-ol:my-2"
                    dangerouslySetInnerHTML={{ __html: rawHtml }}
                  />
                );
              } else {
                renderedContent = (
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </div>
                );
              }

              return (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'system' ? (
                    <span className="text-xs italic text-notion-text-gray dark:text-notion-text-gray-dark text-center w-full">
                      {msg.content}
                    </span>
                  ) : (
                    <div 
                      className={`p-3 rounded-lg max-w-[90%] ${msg.role === 'user' ? 'bg-notion-hover dark:bg-notion-hover-dark' : ''}`}
                    >
                      {renderedContent}
                    </div>
                  )}
                </div>
              );
            })}
            {isLoading && messages[messages.length-1]?.role === 'user' && (
              <div className="flex justify-start">
                <div className="p-3 rounded-lg max-w-[90%]">
                  <span className="animate-pulse">...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </>
      )}
      {/* --- FINE MODIFICA: Render Condizionale --- */}


      {/* Footer Input (Modificato) */}
      {initialFlashcard ? (
        // --- FOOTER VISTA FLASHCARD ---
        <div className="p-4 border-t border-notion-border dark:border-notion-border-dark">
           <button
             onClick={handleSaveFlashcard}
             disabled={isSavingCard || !cardFront.trim() || !cardBack.trim()}
             className="w-full flex items-center justify-center p-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-500"
           >
             <SaveIcon className="w-4 h-4 mr-2" />
             Salva Flashcard
           </button>
        </div>
      ) : (
        // --- FOOTER VISTA CHAT (Esistente) ---
        <form onSubmit={handleSubmit} className="p-4 border-t border-notion-border dark:border-notion-border-dark">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Chiedi qualcosa..."
            disabled={isLoading}
            className="w-full p-2 border border-notion-border dark:border-notion-border-dark rounded-md bg-notion-bg dark:bg-notion-bg-dark focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>
      )}
    </div>
  );
};