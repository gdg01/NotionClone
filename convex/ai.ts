// convex/ai.ts (SOSTITUZIONE COMPLETA)
import { action } from "./_generated/server";
import { v } from "convex/values";

// Tipo per i messaggi (corrisponde a quello della UI)
export type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

// --- MODIFICA: Definiamo i modelli in ordine di preferenza ---
// Dal più performante (e costoso) al meno performante (più economico).
const MODELS_IN_ORDER = [
  "llama-3.3-70b-versatile", // 1. Il migliore (prova questo per primo)
  "llama-3.1-8b-instant",   // 2. Il fallback (veloce ed economico)
  // Puoi aggiungere altri modelli Groq qui se necessario
];

export const askGroq = action({
  args: {
    // L'intera cronologia della chat
    history: v.array(v.object({
      role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
      content: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    // 1. Prendi la chiave API segreta
    const groqApiKey = process.env.GROQ_API_KEY;

    if (!groqApiKey) {
      throw new Error("GROQ_API_KEY non è impostata nelle variabili d'ambiente di Convex.");
    }

    const { history } = args;

    // --- MODIFICA: Logica di Fallback ---
    // Itera sui modelli definiti, provandoli uno per uno.
    for (const model of MODELS_IN_ORDER) {
      console.log(`[AI] Tentativo con il modello: ${model}`);

      // 2. Prepara la richiesta a Groq con il modello corrente
      const body = JSON.stringify({
        messages: history,
        model: model, // <-- Usa il modello del loop
        stream: false, // Le azioni Convex non supportano lo streaming
      });

      try {
        // 3. Esegui la chiamata fetch
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqApiKey}`,
          },
          body: body,
        });

        // 4. Controlla la risposta
        if (response.ok) {
          // SUCCESSO: La chiamata è andata a buon fine.
          console.log(`[AI] Successo con il modello: ${model}`);
          const data = await response.json();
          // Restituisci il risultato e interrompi il loop.
          return data.choices[0].message.content;
        }

        // FALLIMENTO (ma gestito):
        // Se l'errore è 429 (Too Many Requests), è probabile che abbiamo
        // esaurito la quota/rate-limit del piano gratuito per questo modello.
        if (response.status === 429) {
          console.warn(`[AI] Quota/Rate limit superata per ${model}. Tento con il prossimo modello...`);
          // Non facciamo nulla, il loop 'for' continuerà automaticamente
          // con il prossimo modello nella lista.
        } else {
          // FALLIMENTO (Grave):
          // Se è un altro tipo di errore (es. 401 Auth, 500 Server Error),
          // è inutile provare con un altro modello. Lancia l'errore.
          throw new Error(`Groq API request failed for ${model} (${response.status}): ${await response.text()}`);
        }

      } catch (error) {
        // FALLIMENTO (Eccezione):
        // Gestisce l'errore lanciato sopra (es. 500) o un errore di rete.
        console.error(`[AI] Eccezione durante la chiamata a ${model}:`, error);

        // Se era l'ultimo modello della lista, lancia l'errore.
        if (model === MODELS_IN_ORDER[MODELS_IN_ORDER.length - 1]) {
          throw error;
        }
        // Altrimenti, logga l'errore e lascia che il loop continui
      }
    } // --- Fine del loop ---

    // Se siamo arrivati qui, tutti i modelli nella lista hanno fallito.
    throw new Error("Tutti i modelli AI di fallback hanno fallito o non sono disponibili.");
  },
});