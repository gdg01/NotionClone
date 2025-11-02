// src/services/webLlmService.ts (VERSIONE CORRETTA E DEFINITIVA)

import { MLCEngine, CreateChatCompletionRequest } from "@mlc-ai/web-llm";

// Definiamo il modello da usare. Llama-3.2-3B è ottimo per l'italiano.
// "q4f16_1" è un buon equilibrio tra velocità e qualità (~1.8GB).
const SELECTED_MODEL = "Llama-3.2-1B-Instruct-q4f16_1-MLC";
// ALTERNATIVE:
// "Llama-3.2-1B-Instruct-q4f16_1" // Più veloce, meno accurato (~600MB)
// "Llama-3.1-8B-Instruct-q4f32_1" // Più lento, più accurato (~4.5GB)

// La nostra classe singleton per il motore di chat
class ChatEngine {
  // La nostra istanza di MLCEngine (l'API corretta)
  private llm: MLCEngine;
  private currentModel: string | null = null;
  public isReady: boolean = false;

  constructor() {
    this.llm = new MLCEngine();
  }

  /**
   * Carica il modello. Chiamato dalla nostra UI.
   * @param progressCallback Funzione per aggiornare l'UI sullo stato del caricamento.
   */
  async loadModel(progressCallback: (status: string) => void) {
    if (this.isReady && this.currentModel === SELECTED_MODEL) {
      progressCallback("Modello già pronto.");
      return;
    }

    this.isReady = false;
    this.currentModel = SELECTED_MODEL;
    progressCallback("Caricamento modello: " + SELECTED_MODEL);

    try {
      await this.llm.reload(SELECTED_MODEL, undefined, {
        progressCallback: (report: { text: string }) => {
          progressCallback(report.text);
        },
      });
      
      this.isReady = true;
      progressCallback("Modello pronto. Puoi chattare!");

    } catch (err) {
      console.error("Errore durante il caricamento del modello:", err);
      progressCallback("Errore caricamento modello.");
      this.isReady = false;
    }
  }

  /**
   * Genera una risposta in streaming.
   * @param messages La cronologia attuale della chat.
   * @param updateCallback Callback per inviare i "pezzi" di risposta (streaming).
   * @returns La risposta completa.
   */
  async generateResponse(
    messages: CreateChatCompletionRequest["messages"],
    updateCallback: (chunk: string) => void
  ): Promise<string> {
    
    if (!this.isReady) {
      throw new Error("Il motore di chat non è pronto.");
    }

    try {
      // Si usa la nuova API compatibile con OpenAI
      const completion = await this.llm.chat.completions.create({
        stream: true,
        messages: messages,
        temperature: 0.7,
      });

      let fullResponse = "";
      for await (const chunk of completion) {
        // A volte il chunk o delta possono essere vuoti, controlliamo
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          fullResponse += content;
          updateCallback(content);
        }
      }
      
      return fullResponse;

    } catch (err) {
      console.error("Errore durante la generazione:", err);
      return "Mi dispiace, ho riscontrato un errore.";
    }
  }

  /**
   * Resetta la chat (svuota la cronologia interna del modello).
   */
  async resetChat() {
    await this.llm.resetChat();
  }
}

// Esporta una singola istanza (singleton) del nostro motore
export const chatEngine = new ChatEngine();