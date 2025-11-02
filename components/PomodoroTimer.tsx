// File: src/components/PomodoroTimer.tsx (SOSTITUZIONE COMPLETA)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TimerIcon, PlayIcon, PauseIcon, SettingsIcon, RefreshCwIcon, XIcon } from './icons';

// NON servono più file audio o Data URI

type Phase = 'work' | 'short' | 'long';

export const PomodoroTimer: React.FC = () => {
  // Impostazioni di default
  const [settings, setSettings] = useState({ work: 25, short: 5, long: 15, interval: 4 });
  
  // Stato corrente
  const [phase, setPhase] = useState<Phase>('work');
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(settings.work * 60);
  const [sessionsCount, setSessionsCount] = useState(0);
  
  // Stato UI
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- MODIFICA QUI: NUOVA FUNZIONE SUONO ---
  // Funzione per riprodurre il suono
  const playSound = () => {
    // Usiamo la Web Audio API per un suono di sveglia
    try {
      // Crea un contesto audio
      // @ts-ignore
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Crea un oscillatore (il generatore di suono)
      const oscillator = audioContext.createOscillator();
      
      // Crea un nodo di guadagno (per controllare il volume)
      const gainNode = audioContext.createGain();

      // Collega l'oscillatore al guadagno e il guadagno alla "cassa" (destination)
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = 'sawtooth'; // Onda "dente di sega", più aspra e da sveglia
      oscillator.frequency.value = 800; // Frequenza (Hz) - un tono acuto

      const now = audioContext.currentTime;
      
      // Volume a 0 all'inizio
      gainNode.gain.setValueAtTime(0, now);

      // Pattern: 3 beep rapidi
      // (Volume 0.5 per non essere troppo fastidioso)
      gainNode.gain.linearRampToValueAtTime(0.5, now + 0.1); // Beep 1 Inizio
      gainNode.gain.linearRampToValueAtTime(0, now + 0.25);  // Beep 1 Fine
      
      gainNode.gain.linearRampToValueAtTime(0.5, now + 0.35); // Beep 2 Inizio
      gainNode.gain.linearRampToValueAtTime(0, now + 0.5);  // Beep 2 Fine
      
      gainNode.gain.linearRampToValueAtTime(0.5, now + 0.6); // Beep 3 Inizio
      gainNode.gain.linearRampToValueAtTime(0, now + 0.75);  // Beep 3 Fine

      // Avvia l'oscillatore
      oscillator.start(now);
      
      // Ferma l'oscillatore dopo 1.5 secondi
      oscillator.stop(now + 1.5); 
      
      // Pulisci il contesto dopo che il suono è finito
      setTimeout(() => {
        audioContext.close();
      }, 2000);

    } catch (err) {
      console.error("Web Audio API playback failed:", err);
    }
  };
  // --- FINE MODIFICA ---

  // Funzione per avanzare alla fase successiva
  const advancePhase = useCallback(() => {
    if (phase === 'work') {
      const newSessionsCount = sessionsCount + 1;
      setSessionsCount(newSessionsCount);
      const nextPhase: Phase = newSessionsCount % settings.interval === 0 ? 'long' : 'short';
      setPhase(nextPhase);
      setTimeLeft(settings[nextPhase] * 60);
    } else {
      // La pausa (corta o lunga) è finita, si torna al lavoro
      setPhase('work');
      setTimeLeft(settings.work * 60);
    }
  }, [phase, sessionsCount, settings]);

  // Logica principale del timer
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Timer scaduto
            clearInterval(intervalRef.current!);
            setIsRunning(false); // Fermato (richiede avvio manuale)
            playSound();
            advancePhase();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, advancePhase]);

  // Gestione chiusura menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Aggiorna il tempo se le impostazioni cambiano (solo se non in esecuzione)
  const applySettings = (newSettings: typeof settings) => {
    setSettings(newSettings);
    if (!isRunning) {
        if (phase === 'work') setTimeLeft(newSettings.work * 60);
        else if (phase === 'short') setTimeLeft(newSettings.short * 60);
        else if (phase === 'long') setTimeLeft(newSettings.long * 60);
    }
  };

  // Avvia/Mette in pausa il timer
  const handleStartPause = () => {
    // Se il timer era a 0, ricarica la fase corrente prima di iniziare
    if (timeLeft === 0) {
      setTimeLeft(settings[phase] * 60);
    }
    setIsRunning(!isRunning);
  };

  // Resetta il timer alla fase corrente
  const resetCurrentPhase = () => {
    setIsRunning(false);
    setTimeLeft(settings[phase] * 60);
  };
  
  // Cambia la fase manualmente
  const selectPhase = (p: Phase) => {
    setPhase(p);
    setTimeLeft(settings[p] * 60);
    setIsRunning(false);
  };

  // Formattazione tempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- Componenti UI Interni ---

  const PhaseButton: React.FC<{ p: Phase; label: string }> = ({ p, label }) => (
    <button
      onClick={() => selectPhase(p)}
      className={`px-3 py-1 rounded text-sm font-medium ${phase === p ? 'bg-notion-active dark:bg-notion-active-dark text-notion-text dark:text-notion-text-dark' : 'text-notion-text-gray dark:text-notion-text-gray-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark'}`}
    >
      {label}
    </button>
  );

  const SettingsView: React.FC<{ onDone: () => void }> = ({ onDone }) => {
    const [localSettings, setLocalSettings] = useState(settings);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalSettings(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
    };
    
    const handleSave = () => {
        applySettings(localSettings);
        onDone();
    };

    const SettingInput: React.FC<{ name: keyof typeof settings; label: string }> = ({ name, label }) => (
        <div className="flex justify-between items-center mb-2">
            <label htmlFor={name} className="text-sm text-notion-text-gray dark:text-notion-text-gray-dark">{label}</label>
            <input
                type="number"
                id={name}
                name={name}
                value={localSettings[name]}
                onChange={handleChange}
                min="1"
                className="w-16 p-1 text-sm bg-notion-hover dark:bg-notion-hover-dark rounded border border-notion-border dark:border-notion-border-dark focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
        </div>
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-semibold">Settings</h4>
                <button onClick={handleSave} className="text-sm text-blue-500 hover:underline">Done</button>
            </div>
            <SettingInput name="work" label="Work (min)" />
            <SettingInput name="short" label="Short Break (min)" />
            <SettingInput name="long" label="Long Break (min)" />
            <SettingInput name="interval" label="Long break after" />
        </div>
    );
  };
  
  const TimerView: React.FC<{ onSettingsClick: () => void }> = ({ onSettingsClick }) => (
      <div>
          <div className="flex justify-between items-center mb-3 p-1 bg-notion-hover dark:bg-notion-hover-dark rounded-md">
              <PhaseButton p="work" label="Work" />
              <PhaseButton p="short" label="Short" />
              <PhaseButton p="long" label="Long" />
          </div>
          
          <div className="text-center my-4">
              <h1 className="text-5xl font-bold font-mono">{formatTime(timeLeft)}</h1>
              <p className="text-sm text-notion-text-gray dark:text-notion-text-gray-dark">
                Sessione {phase === 'work' ? sessionsCount + 1 : sessionsCount} / {settings.interval}
              </p>
          </div>

          <div className="flex justify-center items-center space-x-3">
              <button 
                  onClick={resetCurrentPhase}
                  className="p-2 rounded-full hover:bg-notion-hover dark:hover:bg-notion-hover-dark text-notion-text-gray dark:text-notion-text-gray-dark"
                  title="Reset phase"
              >
                  <RefreshCwIcon className="w-5 h-5" />
              </button>
              
              <button
                  onClick={handleStartPause}
                  className={`w-16 h-16 flex items-center justify-center rounded-full text-white font-semibold text-lg ${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                  aria-label={isRunning ? 'Pause timer' : 'Start timer'}
              >
                  {isRunning ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8" />}
              </button>

              <button 
                  onClick={onSettingsClick}
                  className="p-2 rounded-full hover:bg-notion-hover dark:hover:bg-notion-hover-dark text-notion-text-gray dark:text-notion-text-gray-dark"
                  title="Settings"
              >
                  <SettingsIcon className="w-5 h-5" />
              </button>
          </div>
      </div>
  );

  // Render componente principale
  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center text-sm text-notion-text-gray dark:text-notion-text-dark px-2 py-1 rounded-md hover:bg-notion-hover dark:hover:bg-notion-hover-dark transition-colors"
        aria-label="Open Pomodoro Timer"
      >
        <TimerIcon className="w-4 h-4" />
        {/* Mostra il tempo solo se è in esecuzione o in pausa, non se è idle */}
        {(isRunning || timeLeft < settings[phase] * 60) && (
            <span className={`ml-2 font-mono ${isRunning ? 'text-blue-500' : ''}`}>{formatTime(timeLeft)}</span>
        )}
      </button>

      {isMenuOpen && (
        <div
          ref={menuRef}
          className="absolute top-full right-0 mt-2 w-64 bg-notion-bg dark:bg-notion-bg-dark border border-notion-border dark:border-notion-border-dark rounded-md shadow-lg p-3 z-20"
        >
          <button 
            onClick={() => setIsMenuOpen(false)}
            className="absolute top-2 right-2 p-1 rounded hover:bg-notion-hover dark:hover:bg-notion-hover-dark"
            aria-label="Close menu"
          >
            <XIcon className="w-4 h-4 text-notion-text-gray dark:text-notion-text-gray-dark" />
          </button>
          
          {isSettingsOpen ? (
            <SettingsView onDone={() => setIsSettingsOpen(false)} />
          ) : (
            <TimerView onSettingsClick={() => setIsSettingsOpen(true)} />
          )}
        </div>
      )}
    </div>
  );
};