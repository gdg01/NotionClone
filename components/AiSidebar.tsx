// src/components/AiSidebar.tsx (SOSTITUZIONE COMPLETA)
import React, { useState, useEffect, useRef } from 'react';
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { SparkleIcon, RefreshCwIcon } from './icons';
import { marked } from 'marked'; // <-- MODIFICA: Importa la libreria 'marked'

// Definiamo un tipo di messaggio per la nostra UI (invariato)
type UiMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

interface AiSidebarProps {
  initialText?: string; // Il testo selezionato
}

export const AiSidebar: React.FC<AiSidebarProps> = ({ initialText }) => {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const askGroq = useAction(api.ai.askGroq);

  // Gestisce il primo prompt (invariato)
  useEffect(() => {
    if (initialText) {
      const firstPrompt = `Sei un assistente esperto. Spiega il seguente concetto in modo chiaro e conciso:\n\n"${initialText}"`;
      const systemMessage: UiMessage = { role: 'system', content: 'In attesa della spiegazione...' };
      const userMessage: UiMessage = { role: 'user', content: firstPrompt };
      
      setMessages([systemMessage]);
      handleGeneration(userMessage);
    }
  }, [initialText]);

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

  return (
    <div className="h-full bg-notion-sidebar dark:bg-notion-sidebar-dark border-l border-notion-border dark:border-notion-border-dark flex flex-col">
      {/* Header (invariato) */}
      <div className="p-4 flex items-center justify-between border-b border-notion-border dark:border-notion-border-dark">
        <h2 className="text-lg font-bold flex items-center">
          <SparkleIcon className="w-5 h-5 mr-2 text-blue-500" />
          Assistente AI
        </h2>
        {isLoading && (
          <RefreshCwIcon className="w-4 h-4 text-notion-text-gray dark:text-notion-text-gray-dark animate-spin" />
        )}
      </div>

      {/* Corpo Chat */}
      <div className="flex-1 px-4 py-2 overflow-y-auto space-y-3">
        {messages.map((msg, index) => {
          
          // --- INIZIO MODIFICA: Logica di rendering ---
          let renderedContent;
          if (msg.role === 'assistant') {
            // 1. Converte il Markdown in HTML
            const rawHtml = marked.parse(msg.content) as string;
            
            // 2. Renderizza l'HTML usando le classi 'prose' per lo stile
            renderedContent = (
              <div
                className="prose prose-sm dark:prose-invert prose-p:my-2 prose-ul:my-2 prose-ol:my-2"
                dangerouslySetInnerHTML={{ __html: rawHtml }}
              />
            );
          } else {
            // 3. I messaggi dell'utente restano testo semplice
            renderedContent = (
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {msg.content}
              </div>
            );
          }
          // --- FINE MODIFICA ---

          return (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'system' ? (
                <span className="text-xs italic text-notion-text-gray dark:text-notion-text-gray-dark text-center w-full">
                  {msg.content}
                </span>
              ) : (
                <div 
                  className={`p-3 rounded-lg max-w-[90%] ${msg.role === 'user' ? 'bg-notion-hover dark:bg-notion-hover-dark' : ''}`}
                  // Rimuoviamo lo stile 'white-space' da qui
                >
                  {renderedContent} {/* <-- Usa il contenuto renderizzato */}
                </div>
              )}
            </div>
          );
        })}
        {/* Placeholder "sta scrivendo" (invariato) */}
        {isLoading && messages[messages.length-1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="p-3 rounded-lg max-w-[90%]">
              <span className="animate-pulse">...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Chat (invariato) */}
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
    </div>
  );
};