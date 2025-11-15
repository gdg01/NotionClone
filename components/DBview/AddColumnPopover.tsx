// SOSTITUISCI QUESTO FILE: components/DBview/AddColumnPopover.tsx

import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { DbColumnType } from '../../extensions/DatabaseView';
import {
  TextIcon,
  NumberIcon,
  SelectIcon,
  MultiSelectIcon,
  StatusIcon,
  DateIcon,
  PersonIcon,
  FilesIcon,
  CheckboxIcon,
  URLIcon,
  EmailIcon,
  PhoneIcon,
  FormulaIcon,
  RelationIcon,
  RollupIcon,
  ButtonIcon,
  IDIcon,
  PlaceIcon,
} from '../icons'; // Importa tutte le icone

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

// --- MODIFICA: Elenco Tipi di Proprietà Completo ---
const PROPERTY_TYPES_LIST = [
  { id: 'text', name: 'Text', icon: TextIcon },
  { id: 'number', name: 'Number', icon: NumberIcon },
  { id: 'select', name: 'Select', icon: SelectIcon },
  { id: 'multi-select', name: 'Multi-select', icon: MultiSelectIcon },
  { id: 'status', name: 'Status', icon: StatusIcon },
  { id: 'date', name: 'Date', icon: DateIcon },
  { id: 'person', name: 'Person', icon: PersonIcon },
  { id: 'files', name: 'Files & media', icon: FilesIcon },
  { id: 'checkbox', name: 'Checkbox', icon: CheckboxIcon },
  { id: 'url', name: 'URL', icon: URLIcon },
  { id: 'email', name: 'Email', icon: EmailIcon },
  { id: 'phone', name: 'Phone', icon: PhoneIcon },
  { id: 'formula', name: 'Formula', icon: FormulaIcon },
  { id: 'relation', name: 'Relation', icon: RelationIcon },
  { id: 'rollup', name: 'Rollup', icon: RollupIcon },
  { id: 'button', name: 'Button', icon: ButtonIcon },
  { id: 'id', name: 'ID', icon: IDIcon },
  { id: 'place', name: 'Place', icon: PlaceIcon },
];
// --- FINE MODIFICA ---

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
  
  const [name, setName] = useState('');
  useClickOutside(popoverRef, onClose);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  if (!anchorEl) return null;
  const rect = anchorEl.getBoundingClientRect();
  
  const filteredTypes = PROPERTY_TYPES_LIST.filter(t => 
    t.name.toLowerCase().includes(name.toLowerCase())
  );
  
  const handleCreate = (type: DbColumnType, typeName: string) => {
    onColumnCreate(name.trim() || typeName, type);
    onClose();
  };

  return ReactDOM.createPortal(
    <div
      ref={popoverRef}
      className="absolute z-10 w-64 bg-notion-bg dark:bg-notion-sidebar-dark border border-notion-border dark:border-notion-border-dark rounded-lg shadow-lg p-2"
      style={{
        top: `${rect.bottom + 4}px`,
        left: `${rect.left}px`,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <p className="text-xs text-notion-text-gray dark:text-notion-text-gray-dark px-2 mb-1">
        Seleziona un tipo di proprietà
      </p>
      
      {/* --- MODIFICA: Mappa sul nuovo elenco completo --- */}
      <ul className="max-h-48 overflow-y-auto">
        {filteredTypes.map(type => (
          <li key={type.id}>
            <button 
              className="w-full flex items-center p-2 rounded hover:bg-notion-hover dark:hover:bg-notion-hover-dark text-notion-text-gray dark:text-notion-text-gray-dark"
              onClick={() => handleCreate(type.id as DbColumnType, type.name)}
            >
              <type.icon className="w-4 h-4 mr-2" />
              <span className="text-sm">{type.name}</span>
            </button>
          </li>
        ))}
      </ul>
      {/* --- FINE MODIFICA --- */}
    </div>,
    document.body
  );
};