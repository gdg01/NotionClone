// SOSTITUISCI QUESTO FILE: components/DBview/AddColumnPopover.tsx

import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { DbColumnType } from '../../extensions/DatabaseView';
import { 
  TextIcon, CheckSquareIcon, ChevronDownIcon 
} from '../icons'; // Assicurati di avere queste icone

// Hook per gestire il click-outside
const useClickOutside = (ref: React.RefObject<any>, handler: () => void) => {
  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return;
      handler();
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
};

// Tipi di proprietà disponibili (come nel video)
// NOTA: Abbiamo usato 'name' per il nome visualizzato (es. "Number")
const PROPERTY_TYPES = [
  { id: 'text', name: 'Text', icon: TextIcon },
  { id: 'number', name: 'Number', icon: () => <span className="font-semibold text-sm w-4 h-4 flex items-center justify-center mr-2">#</span> },
  { id: 'select', name: 'Select', icon: ChevronDownIcon },
  { id: 'multi-select', name: 'Multi-select', icon: CheckSquareIcon },
  // Aggiungi altri (Date, Person, ecc.) qui
];

interface AddColumnPopoverProps {
  onColumnCreate: (title: string, type: DbColumnType) => void;
  onClose: () => void;
  anchorEl: HTMLElement | null;
}

export const AddColumnPopover: React.FC<AddColumnPopoverProps> = ({
  onColumnCreate,
  onClose,
  anchorEl,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // --- FIX: Torniamo a un singolo stato 'name' ---
  const [name, setName] = useState('');
  useClickOutside(popoverRef, onClose);

  useEffect(() => {
    // Auto-focus sull'input
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  if (!anchorEl) return null;
  const rect = anchorEl.getBoundingClientRect();
  
  // --- FIX: Il filtro ora usa 'name' ---
  const filteredTypes = PROPERTY_TYPES.filter(t => 
    t.name.toLowerCase().includes(name.toLowerCase())
  );
  
  const handleCreate = (type: DbColumnType, typeName: string) => {
    // Se l'utente ha scritto "pollo" e clicca "Text", il nome è "pollo".
    // Se non ha scritto nulla e clicca "Text", il nome è "Text".
    onColumnCreate(name.trim() || typeName, type);
    onClose();
  };

  return ReactDOM.createPortal(
    <div
      ref={popoverRef}
      className="absolute z-10 w-64 bg-notion-bg dark:bg-notion-sidebar-dark border border-notion-border dark:border-notion-border-dark rounded-lg shadow-lg p-2"
      style={{
        top: `${rect.bottom + 4}px`, // Offset corretto
        left: `${rect.left}px`,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* --- FIX: Unico input per nome E filtro --- */}
      
      {/* --- FIX: Testo in italiano --- */}
      <p className="text-xs text-notion-text-gray dark:text-notion-text-gray-dark px-2 mb-1">
        Seleziona un tipo di proprietà
      </p>
      <ul className="max-h-48 overflow-y-auto">
        {filteredTypes.map(type => (
          <li key={type.id}>
            <button 
              className="w-full flex items-center p-2 rounded hover:bg-notion-hover dark:hover:bg-notion-hover-dark text-notion-text-gray dark:text-notion-text-gray-dark"
              // Passiamo sia l'id che il nome del tipo
              onClick={() => handleCreate(type.id as DbColumnType, type.name)}
            >
              <type.icon className="w-4 h-4 mr-2" />
              <span className="text-sm">{type.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>,
    document.body
  );
};