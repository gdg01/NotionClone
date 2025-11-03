Ecco un README completo per il progetto, basato sull'analisi di tutti i file forniti.

-----


# Notion 2.0 - Un Clone Avanzato con AI

Questo progetto è un'implementazione "Notion-like" moderna e ad alte prestazioni, costruita da zero con un'architettura React, Tiptap e Convex. Va oltre un semplice editor di testo, integrando funzionalità avanzate di AI e gestione della conoscenza (PKM) per creare uno strumento di produttività completo.

A differenza di un editor standard, questo progetto è progettato per l'efficienza e la connessione delle idee, introducendo funzionalità come la ricerca contestuale ibrida, un assistente AI, link bidirezionali e una mappa della conoscenza visiva.

## Funzionalità Principali

  * **Editor Rich-Text basato su Tiptap:** Un editor WYSIWYG completo con comandi slash (`/`) per l'inserimento rapido di blocchi (titoli, liste, blocchi di codice, callout, colonne, ecc.).
  * **Sistema a Blocchi:** Ogni elemento è un blocco trascinabile con un menu contestuale (`BlockActions`) per azioni rapide (elimina, trasforma, copia link al blocco).
  * **Gerarchia e Sidebar:** Organizzazione delle pagine in una struttura nidificata, simile a un file system, navigabile tramite una sidebar a comparsa.
  * **Salvataggio Asincrono Ottimizzato:** Un sistema di salvataggio efficiente che utilizza il *debouncing* e invia solo le modifiche (patch JSON) al backend, con indicatori di stato in tempo reale ("Saving...", "Saved").
  * **Database Normalizzato:** I metadati delle pagine (titolo, icona, tag) sono separati dal contenuto pesante (`content`), garantendo caricamenti della sidebar quasi istantanei.
  * **Autenticazione Sicura:** Gestita tramite Clerk e integrata nativamente con il backend Convex.
  * **Styling Moderno:** Realizzato con Tailwind CSS, include una modalità Dark/Light.

## Funzionalità Avanzate ("Knowledge 2.0")

Questo progetto implementa diverse funzionalità avanzate di Personal Knowledge Management (PKM) e AI:

  * **AI Spotlight Search (Ricerca Contestuale):** Una barra di ricerca (tipo Spotlight/Alfred) che esegue una ricerca semantica (vettoriale) all'interno delle note dell'utente E una ricerca web (tramite Serper). I risultati vengono poi sintetizzati da un LLM (via Groq) per fornire una risposta unificata e contestuale.
  * **AI Assistant Panel:** Una sidebar di chat AI (basata su Groq e modelli Llama) che può essere richiamata per spiegare concetti, tradurre testo o rispondere a domande, mantenendo il contesto del testo selezionato.
  * **Backlinks (Link Bidirezionali):** Ogni pagina mostra automaticamente un elenco di "Link a questa pagina", creando una rete di conoscenza navigabile.
  * **Knowledge Graph View (Mappa dei Collegamenti):** Una visualizzazione grafica interattiva (basata su `react-force-graph`) che mostra tutte le pagine come nodi e i link tra di esse come archi. Include un'animazione cronologica per vedere la crescita della conoscenza nel tempo.
  * **Flow View:** Una visualizzazione gerarchica alternativa che mostra le connessioni genitore-figlio e i link in uscita da una pagina specifica.
  * **Split Screen View:** Possibilità di aprire e modificare due note affiancate per il multitasking.
  * **Strumenti di Produttività:**
      * **Pomodoro Timer:** Integrato direttamente nella barra di navigazione superiore.
      * **Sistema di Tag:** Possibilità di aggiungere tag colorati alle pagine per una migliore organizzazione e filtraggio nel Knowledge Graph.

## Tech Stack

  * **Frontend:** React 19, Vite, TypeScript
  * **Backend & Database:** [Convex](https://convex.dev/) (con database vettoriale integrato)
  * **Editor:** [Tiptap](https://tiptap.dev/)
  * **Autenticazione:** [Clerk](https://clerk.dev/)
  * **Styling:** [Tailwind CSS](https://tailwindcss.com/)
  * **AI (Chat & Summary):** [Groq](https://groq.com/) (Llama 3.1)
  * **AI (Embeddings):** Google `text-embedding-004`
  * **AI (Ricerca Web):** [Serper](https://serper.dev/)
  * **Grafici:** `react-force-graph`

## Come Avviare il Progetto

Questo progetto utilizza Vite per il frontend e Convex per il backend.

### 1\. Prerequisiti

  * Node.js (v18+ raccomandato)
  * Un account [Convex](https://convex.dev/)
  * Un account [Clerk](https://clerk.dev/)
  * API Key per: [Groq](https://groq.com/), [Serper](https://serper.dev/), [Google AI](https://aistudio.google.com/app/apikey)

### 2\. Installazione Frontend

1.  Clona il repository e installa le dipendenze:

    ```bash
    npm install
    ```

2.  Crea un file `.env` nella directory principale (puoi rinominare `.env.local` se presente) e aggiungi le chiavi VITE:

    ```env
    # Ottenuto dal dashboard di Convex dopo il deploy
    VITE_CONVEX_URL="https://YOUR_PROJECT.convex.cloud"

    # Ottenuto dal dashboard di Clerk
    VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
    ```

### 3\. Setup Backend (Convex)

1.  Avvia il client Convex in una finestra di terminale separata:

    ```bash
    npx convex dev
    ```

2.  Segui le istruzioni per collegare il progetto al tuo account Convex.

3.  **Importante:** Vai nel dashboard del tuo progetto Convex e imposta i seguenti "Environment Variables" (NON nel file `.env`):

      * `CLERK_ISSUER_URL`: L'URL "Issuer" dal tuo dashboard Clerk (es. `https/IL-TUO-PROGETTO.clerk.accounts.dev`)
      * `GROQ_API_KEY`: La tua API key di Groq
      * `SERPER_API_KEY`: La tua API key di Serper
      * `GOOGLE_API_KEY`: La tua API key di Google AI (per gli embeddings)
      * `HUGGINGFACE_API_KEY`: (Opzionale, se si usano modelli HF per embedding)

4.  Dopo aver impostato le variabili, Convex ricaricherà automaticamente lo schema.

### 4\. Avvio

1.  Assicurati che `npx convex dev` sia in esecuzione in un terminale.
2.  Avvia il server di sviluppo Vite in un altro terminale:
    ```bash
    npm run dev
    ```

Apri [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) (o la porta indicata da Vite) nel tuo browser.

### 5\. (Opzionale) Popolamento Indici AI

Per abilitare la ricerca semantica e i backlinks per i contenuti esistenti, potrebbe essere necessario eseguire un backfill manuale dal dashboard di Convex:

1.  Vai alla scheda "Functions" nel tuo dashboard Convex.
2.  Esegui la funzione `search:backfillAllPages` per indicizzare i contenuti per la ricerca vettoriale.
3.  Esegui la funzione `links:backfillAllLinks` per indicizzare tutti i `@PageLink` e `@BlockLink` esistenti.