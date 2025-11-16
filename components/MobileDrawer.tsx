// File: components/MobileDrawer.tsx (NUOVO FILE)

import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { XIcon } from './icons';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Chiudi con il tasto Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Gestione click sul backdrop (per chiudere)
  const handleBackdropClick = (e: React.MouseEvent) => {
    // Se il click è sul backdrop stesso (e non sul pannello), chiudi.
    if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
      onClose();
    }
  };
  
  // Stili per transizione
  const backdropClass = isOpen
    ? 'opacity-100 visible'
    : 'opacity-0 invisible';
    
  const panelClass = isOpen
    ? 'translate-y-0'
    : 'translate-y-full';

  // Usiamo un Portal per renderizzare il drawer a livello root
  return ReactDOM.createPortal(
    // Backdrop
    <div
      className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-all duration-300 ease-in-out ${backdropClass}`}
      onClick={handleBackdropClick} // Usa l'handler corretto
    >
      {/* Pannello "Bottom Sheet" */}
      <div
        ref={drawerRef}
        className={`fixed bottom-0 left-0 right-0 z-[70] flex h-[70vh] flex-col rounded-t-2xl bg-notion-bg dark:bg-notion-bg-dark shadow-2xl transition-transform duration-300 ease-in-out ${panelClass}`}
        onClick={(e) => e.stopPropagation()} // Impedisce la chiusura cliccando sul pannello
      >
        {/* Header del Drawer */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-notion-border dark:border-notion-border-dark p-4">
          <h3 className="text-lg font-semibold text-notion-text dark:text-notion-text-dark">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-notion-text-gray dark:text-notion-text-gray-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        
        {/* Contenuto Scrollabile */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>,
    document.body // Monta il drawer sul body
  );
};