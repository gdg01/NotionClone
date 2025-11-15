// SOSTITUISCI QUESTO FILE: components/DBview/SelectPopover.tsx

import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import type { Doc } from '../../convex/_generated/dataModel';
import { DbColumn, SelectOption } from '../../extensions/DatabaseView';
import { getTagClasses, TAG_COLORS } from '../../lib/TG';
import { TagPill } from './TagPill';
import { MoreHorizontalIcon, TrashIcon } from '../icons';

// Hook per il click-outside
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

// Helper per generare ID
const newOptionId = () => `opt_${new Date().getTime().toString(36)}`;

interface SelectPopoverProps {
  page: Doc<'pages'>;
  column: DbColumn;
  onPropertyChange: (pageId: string, key: string, value: any) => void;
  onColumnChange: (newColumnData: DbColumn) => void;
  onClose: () => void;
  anchorEl: HTMLElement | null;
}

export const SelectPopover: React.FC<SelectPopoverProps> = ({
  page, column, onPropertyChange, onColumnChange, onClose, anchorEl
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  useClickOutside(popoverRef, onClose);

  const isMulti = column.type === 'multi-select';
  
  // Trova i valori attuali
  const currentValues = useMemo(() => {
    const val = page.properties?.[column.id];
    if (isMulti) return Array.isArray(val) ? val : [];
    return val ? [val] : []; // Standardizza sempre a un array
  }, [page.properties, column.id, isMulti]);
  
  const [selectedNames, setSelectedNames] = useState<string[]>(currentValues);
  const [search, setSearch] = useState("");
  const [editingOption, setEditingOption] = useState<SelectOption | null>(null);
  
  const [allOptions, setAllOptions] = useState(() => column.options || []);
  
  useEffect(() => {
    setAllOptions(column.options || []);
  }, [column.options]);

  const optionsMap = useMemo(() => 
    new Map(allOptions.map(o => [o.name, o])), 
  [allOptions]);

  const selectedOptions = useMemo(() => 
    selectedNames.map(name => optionsMap.get(name)).filter(Boolean) as SelectOption[],
  [selectedNames, optionsMap]);

  const availableOptions = useMemo(() => 
    allOptions.filter(o => 
      !selectedNames.includes(o.name) && 
      o.name.toLowerCase().includes(search.toLowerCase())
    ),
  [allOptions, selectedNames, search]);

  const canCreate = search.trim().length > 0 && !allOptions.some(o => o.name.toLowerCase() === search.toLowerCase().trim());

  // --- GESTORI EVENTI (MODIFICATI) ---

  // Gestisce il click su un'opzione (dalla lista 'available')
  const handleSelect = (optionName: string) => {
    if (isMulti) {
      const newSelected = [...selectedNames, optionName];
      setSelectedNames(newSelected);
      onPropertyChange(page._id, column.id, newSelected);
    } else {
      // --- MODIFICA PER SELECT SINGOLO ---
      // Si comporta come multi-select, ma imposta solo un valore
      setSelectedNames([optionName]);
      onPropertyChange(page._id, column.id, optionName); 
      // Non chiamare onClose()
      // --- FINE MODIFICA ---
    }
    setSearch(""); // Resetta l'input in entrambi i casi
  };
  
  // Gestisce la rimozione di un tag (cliccando la 'X')
  const handleRemove = (optionName: string) => {
    if (isMulti) {
      const newSelected = selectedNames.filter(s => s !== optionName);
      setSelectedNames(newSelected);
      onPropertyChange(page._id, column.id, newSelected);
    } else {
      // --- MODIFICA PER SELECT SINGOLO ---
      // Svuota l'array e imposta la proprietà a null
      setSelectedNames([]);
      onPropertyChange(page._id, column.id, null);
      // --- FINE MODIFICA ---
    }
  };

  const handleCreate = () => {
    if (!canCreate) return;
    const newName = search.trim();
    const newColor = Object.keys(TAG_COLORS)[allOptions.length % Object.keys(TAG_COLORS).length];
    const newOption: SelectOption = { id: newOptionId(), name: newName, color: newColor };
    
    const newAllOptions = [...allOptions, newOption];
    setAllOptions(newAllOptions);
    
    onColumnChange({ ...column, options: newAllOptions }); 
    
    handleSelect(newName);
  };
  
  // --- Gestori per Modifica/Eliminazione Opzione (invariati) ---
  const handleDeleteOption = (optionId: string) => {
    const newOptions = allOptions.filter(o => o.id !== optionId);
    setAllOptions(newOptions);
    onColumnChange({ ...column, options: newOptions });
    setEditingOption(null);
  };

  const handleChangeColor = (optionId: string, color: string) => {
    const newOptions = allOptions.map(o => o.id === optionId ? { ...o, color } : o);
    setAllOptions(newOptions);
    onColumnChange({ ...column, options: newOptions });
    setEditingOption(null);
  };
  
  if (!anchorEl) return null;
  const rect = anchorEl.getBoundingClientRect();
  
  return ReactDOM.createPortal(
    <div
      ref={popoverRef}
      className="absolute z-10 bg-notion-bg dark:bg-notion-sidebar-dark border border-notion-border dark:border-notion-border-dark rounded-lg shadow-lg flex flex-col"
      style={{
        top: `${rect.top}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        maxHeight: '300px',
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* --- SEZIONE INPUT/TAG SELEZIONATI (MODIFICATA) --- */}
      <div 
        className="flex flex-row items-center flex-wrap gap-1 p-1.5 mb-1 bg-notion-hover dark:bg-notion-hover-dark border border-notion-border dark:border-notion-border-dark rounded-md"
        onClick={() => popoverRef.current?.querySelector('input')?.focus()}
      >
        {/* MODIFICA: Rimosso 'isMulti &&'. 
          Ora mappa i tag selezionati *sempre*.
        */}
        {selectedOptions.map(opt => (
          <TagPill 
            key={opt.id} 
            name={opt.name} 
            color={opt.color} 
            onRemove={(e) => {
              e.stopPropagation(); 
              handleRemove(opt.name); 
            }}
          />
        ))}
        
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); handleCreate(); }
            if (e.key === 'Escape') onClose();
            // Questa logica ora funziona per entrambi i tipi
            if (e.key === 'Backspace' && search === '' && selectedNames.length > 0) {
              handleRemove(selectedNames[selectedNames.length - 1]);
            }
          }}
          // MODIFICA: Placeholder semplificato
          placeholder="+ Add"
          className="flex-grow bg-transparent outline-none text-sm p-0.5 w-[100px]"
          // MODIFICA: Rimosso 'hidden'
        />
      </div>
      {/* --- FINE SEZIONE MODIFICATA --- */}
      
      <p className="text-xs text-notion-text-gray dark:text-notion-text-gray-dark px-1 mb-1">
        Seleziona un'opzione o creane una
      </p>

      <div className="overflow-y-auto">
        {availableOptions.map(opt => (
          <div key={opt.id} className="group flex items-center justify-between p-1 rounded hover:bg-notion-hover dark:hover:bg-notion-hover-dark">
            <button
              onClick={() => handleSelect(opt.name)}
              className="flex-grow flex items-center justify-between"
            >
              <TagPill name={opt.name} color={opt.color} />
            </button>
            <button 
              onClick={() => setEditingOption(opt)}
              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-notion-active dark:hover:bg-notion-active-dark"
            >
              <MoreHorizontalIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
        
        {canCreate && (
          <button
            onClick={handleCreate}
            className="w-full text-left p-1 rounded hover:bg-notion-hover dark:hover:bg-notion-hover-dark text-sm"
          >
            + Crea <TagPill name={search.trim()} color="gray" />
          </button>
        )}
      </div>

      {/* Pop-up secondario per modificare l'opzione (invariato) */}
      {editingOption && (
        <div 
          className="absolute inset-0 bg-notion-bg dark:bg-notion-sidebar-dark z-20 p-2"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <input 
            type="text" 
            defaultValue={editingOption.name}
            className="w-full text-sm p-1.5 mb-2 bg-notion-hover dark:bg-notion-hover-dark border border-notion-border dark:border-notion-border-dark rounded-md"
          />
          <div className="grid grid-cols-5 gap-2 mb-2">
            {Object.keys(TAG_COLORS).map(color => (
              <button
                key={color}
                onClick={() => handleChangeColor(editingOption.id, color)}
                className={`w-8 h-8 rounded-full border border-black/10 ${TAG_COLORS[color].light.split(' ')[0]} ${TAG_COLORS[color].dark.split(' ')[1]}`}
              />
            ))}
          </div>
          <button
            onClick={() => handleDeleteOption(editingOption.id)}
            className="w-full flex items-center p-2 rounded text-sm text-red-500 hover:bg-notion-hover dark:hover:bg-notion-hover-dark"
          >
            <TrashIcon className="w-4 h-4 mr-2" />
            Delete
          </button>
          <button onClick={() => setEditingOption(null)} className="w-full text-center p-1 text-xs mt-1 text-notion-text-gray dark:text-notion-text-gray-dark hover:underline">
            Indietro
          </button>
        </div>
      )}
    </div>,
    document.body
  );
};