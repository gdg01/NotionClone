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
    return val ? [val] : [];
  }, [page.properties, column.id, isMulti]);
  
  // --- STATO LOCALE PER REATTIVITÀ ---
  const [selectedNames, setSelectedNames] = useState<string[]>(currentValues);
  const [search, setSearch] = useState("");
  const [editingOption, setEditingOption] = useState<SelectOption | null>(null);
  
  // --- STATO LOCALE PER ALLOPTIONS ---
  // Gestiamo 'allOptions' localmente per reattività immediata alla creazione
  const [allOptions, setAllOptions] = useState(() => column.options || []);
  
  // Sincronizza se le opzioni cambiano "dall'esterno"
  useEffect(() => {
    setAllOptions(column.options || []);
  }, [column.options]);
  // --- FINE STATO LOCALE PER ALLOPTIONS ---


  // Mappa per trovare velocemente un'opzione dal suo nome
  const optionsMap = useMemo(() => 
    new Map(allOptions.map(o => [o.name, o])), 
  [allOptions]); // Ora dipende dallo stato locale

  // Lista di oggetti SelectOption PIENI per i tag selezionati
  const selectedOptions = useMemo(() => 
    selectedNames.map(name => optionsMap.get(name)).filter(Boolean) as SelectOption[],
  [selectedNames, optionsMap]);

  // Lista delle opzioni DISPONIBILI (non selezionate E filtrate dalla ricerca)
  const availableOptions = useMemo(() => 
    allOptions.filter(o => 
      !selectedNames.includes(o.name) && 
      o.name.toLowerCase().includes(search.toLowerCase())
    ),
  [allOptions, selectedNames, search]); // Ora dipende dallo stato locale

  const canCreate = search.trim().length > 0 && !allOptions.some(o => o.name.toLowerCase() === search.toLowerCase().trim());

  // --- GESTORI EVENTI ---

  // Gestisce il click su un'opzione (dalla lista 'available')
  const handleSelect = (optionName: string) => {
    if (isMulti) {
      const newSelected = [...selectedNames, optionName];
      setSelectedNames(newSelected); // Aggiorna stato locale
      onPropertyChange(page._id, column.id, newSelected); // Salva in background
      setSearch(""); // Resetta l'input
    } else {
      setSelectedNames([optionName]);
      onPropertyChange(page._id, column.id, optionName); 
      onClose();
    }
  };
  
  // Gestisce la rimozione di un tag (cliccando la 'X')
  const handleRemove = (optionName: string) => {
    const newSelected = selectedNames.filter(s => s !== optionName);
    setSelectedNames(newSelected); // Aggiorna stato locale
    onPropertyChange(page._id, column.id, newSelected); // Salva in background
  };

  // --- FUNZIONE CREATE (MODIFICATA) ---
  const handleCreate = () => {
    if (!canCreate) return;
    const newName = search.trim();
    const newColor = Object.keys(TAG_COLORS)[allOptions.length % Object.keys(TAG_COLORS).length];
    const newOption: SelectOption = { id: newOptionId(), name: newName, color: newColor };
    
    // --- FIX PER REATTIVITÀ ---
    // 1. Aggiorna lo stato *locale* di allOptions
    const newAllOptions = [...allOptions, newOption];
    setAllOptions(newAllOptions);
    
    // 2. Salva la nuova opzione nella definizione della colonna (in background)
    onColumnChange({ ...column, options: newAllOptions }); 
    
    // 3. Applica la nuova opzione alla cella (aggiorna selectedNames localmente)
    //    Questo ora funzionerà perché 'newAllOptions' (e quindi 'optionsMap')
    //    verrà aggiornato nello *stesso* ciclo di render di 'selectedNames'
    handleSelect(newName);
  };
  // --- FINE FUNZIONE CREATE ---
  
  // --- Gestori per Modifica/Eliminazione Opzione (invariati) ---
  const handleDeleteOption = (optionId: string) => {
    const newOptions = allOptions.filter(o => o.id !== optionId);
    setAllOptions(newOptions); // Aggiorna stato locale
    onColumnChange({ ...column, options: newOptions }); // Salva in background
    setEditingOption(null);
  };

  const handleChangeColor = (optionId: string, color: string) => {
    const newOptions = allOptions.map(o => o.id === optionId ? { ...o, color } : o);
    setAllOptions(newOptions); // Aggiorna stato locale
    onColumnChange({ ...column, options: newOptions }); // Salva in background
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
      {/* --- SEZIONE INPUT/TAG SELEZIONATI --- */}
      <div 
        className="flex flex-row items-center flex-wrap gap-1 p-1.5 mb-1 bg-notion-hover dark:bg-notion-hover-dark border border-notion-border dark:border-notion-border-dark rounded-md"
        onClick={() => popoverRef.current?.querySelector('input')?.focus()}
      >
        {isMulti && selectedOptions.map(opt => (
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
            if (e.key === 'Backspace' && search === '' && isMulti && selectedNames.length > 0) {
              handleRemove(selectedNames[selectedNames.length - 1]);
            }
          }}
          placeholder={
            !isMulti && selectedOptions.length > 0 
              ? selectedOptions[0].name 
              : "+ Add"
          }
          className={`flex-grow bg-transparent outline-none text-sm p-0.5 w-[100px]${ // Rimossa larghezza fissa/minima
            !isMulti && selectedOptions.length > 0 ? 'hidden' : ''
          }`}
        />
      </div>
      
      {/* --- LISTA OPZIONI DISPONIBILI --- */}
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

      {/* Pop-up secondario per modificare l'opzione (colore/elimina) */}
      {editingOption && (
        <div 
          className="absolute inset-0 bg-notion-bg dark:bg-notion-sidebar-dark z-20 p-2"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* ... (logica di modifica opzione invariata, ma ora usa 'setAllOptions') ... */}
          <input 
            type="text" 
            defaultValue={editingOption.name}
            // onBlur per salvare la rinomina (TODO)
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