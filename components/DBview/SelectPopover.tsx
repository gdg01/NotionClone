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

// --- NUOVO COMPONENTE: IL MENU DI MODIFICA ESTERNNO ---
interface EditOptionPopoverProps {
  mainPopoverEl: HTMLDivElement | null;
  option: SelectOption;
  onClose: () => void;
  onDelete: (optionId: string) => void;
  onChangeColor: (optionId: string, color: string) => void;
  onRename: (optionId: string, newName: string) => void;
}

const EditOptionPopover: React.FC<EditOptionPopoverProps> = ({
  mainPopoverEl, option, onClose, onDelete, onChangeColor, onRename
}) => {
  const editPopoverRef = useRef<HTMLDivElement>(null);
  useClickOutside(editPopoverRef, onClose);

  const [name, setName] = useState(option.name);

  const handleRenameBlur = () => {
    const newName = name.trim();
    if (newName && newName !== option.name) {
      onRename(option.id, newName);
    }
  };

  if (!mainPopoverEl) return null;

  const mainRect = mainPopoverEl.getBoundingClientRect();
  const style: React.CSSProperties = {
    position: 'absolute',
    // Posiziona in alto come il popover principale
    top: `${mainRect.top}px`, 
    // Posiziona a destra, con un margine di 8px
    left: `${mainRect.right + 8}px`, 
    zIndex: 30, // Sopra il popover principale (z-10)
  };

  return ReactDOM.createPortal(
    <div
      ref={editPopoverRef}
      className="w-56 bg-notion-bg dark:bg-notion-sidebar-dark border border-notion-border dark:border-notion-border-dark rounded-lg shadow-lg z-30 p-2"
      style={style}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={handleRenameBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          if (e.key === 'Escape') onClose();
        }}
        autoFocus
        // --- MODIFICA: Aggiunto colore testo ---
        className="w-full text-sm p-1.5 mb-2 bg-notion-hover dark:bg-notion-hover-dark border border-notion-border dark:border-notion-border-dark rounded-md text-notion-text dark:text-notion-text-dark"
      />
      <div className="grid grid-cols-5 gap-2 mb-2">
        {Object.keys(TAG_COLORS).map(color => (
          <button
            key={color}
            onClick={() => {
              onChangeColor(option.id, color);
              onClose(); // Chiudi dopo aver selezionato un colore
            }}
            className={`w-8 h-8 rounded-full border border-black/10 ${TAG_COLORS[color].light.split(' ')[0]} ${TAG_COLORS[color].dark.split(' ')[1]}`}
          />
        ))}
      </div>
      <button
        onClick={() => onDelete(option.id)}
        className="w-full flex items-center p-2 rounded text-sm text-red-500 hover:bg-notion-hover dark:hover:bg-notion-hover-dark"
      >
        <TrashIcon className="w-4 h-4 mr-2" />
        Delete
      </button>
      <button onClick={onClose} className="w-full text-center p-1 text-xs mt-1 text-notion-text-gray dark:text-notion-text-gray-dark hover:underline">
        Indietro
      </button>
    </div>,
    document.body
  );
};
// --- FINE NUOVO COMPONENTE ---


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
  useClickOutside(popoverRef, () => {
    // Non chiudere se il menu di modifica è aperto
    if (!editingOption) {
      onClose();
    }
  });

  const isMulti = column.type === 'multi-select';
  
  const currentValues = useMemo(() => {
    const val = page.properties?.[column.id];
    if (isMulti) return Array.isArray(val) ? val : [];
    return val ? [val] : []; 
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

  // --- GESTORI EVENTI ---

  const handleSelect = (optionName: string) => {
    if (isMulti) {
      const newSelected = [...selectedNames, optionName];
      setSelectedNames(newSelected);
      onPropertyChange(page._id, column.id, newSelected);
    } else {
      setSelectedNames([optionName]);
      onPropertyChange(page._id, column.id, optionName); 
      onClose(); // Chiudi il popover principale su selezione singola
    }
    setSearch(""); 
  };
  
  const handleRemove = (optionName: string) => {
    if (isMulti) {
      const newSelected = selectedNames.filter(s => s !== optionName);
      setSelectedNames(newSelected);
      onPropertyChange(page._id, column.id, newSelected);
    } else {
      setSelectedNames([]);
      onPropertyChange(page._id, column.id, null);
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
  };
  
  // --- NUOVO GESTORE PER LA RINOMINA ---
  const handleRenameOption = (optionId: string, newName: string) => {
    const oldOption = allOptions.find(o => o.id === optionId);
    if (!oldOption) return;
    const oldName = oldOption.name;

    // 1. Aggiorna allOptions
    const newOptions = allOptions.map(o => 
      o.id === optionId ? { ...o, name: newName } : o
    );
    setAllOptions(newOptions);
    onColumnChange({ ...column, options: newOptions });

    // 2. Aggiorna selectedNames se questa opzione era selezionata
    if (selectedNames.includes(oldName)) {
      const newSelectedNames = selectedNames.map(name => 
        name === oldName ? newName : name
      );
      setSelectedNames(newSelectedNames);
      
      // 3. Aggiorna il valore della proprietà in Convex
      const newPropValue = isMulti ? newSelectedNames : newName;
      onPropertyChange(page._id, column.id, newPropValue);
    }
    
    // 4. Aggiorna lo stato di editingOption
    setEditingOption(opt => (opt ? { ...opt, name: newName } : null));
  };
  
  if (!anchorEl) return null;
  const rect = anchorEl.getBoundingClientRect();
  
  // --- MODIFICA: Ora ritorniamo un Fragment <> con 2 portali ---
  return (
    <>
      {/* --- PORTALE 1: POPOVER PRINCIPALE --- */}
      {ReactDOM.createPortal(
        <div
          ref={popoverRef}
          className="absolute z-10 bg-notion-bg dark:bg-notion-sidebar-dark border border-notion-border dark:border-notion-border-dark rounded-lg shadow-lg flex flex-col"
          style={{
            top: `${rect.top}px`,
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            minWidth: '200px', // Aggiunto per evitare che sia troppo stretto
            maxHeight: '300px',
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* --- SEZIONE INPUT/TAG SELEZIONATI --- */}
          <div 
            className="flex flex-row items-center flex-wrap gap-1 p-1.5 mb-1 bg-notion-hover dark:bg-notion-hover-dark border border-notion-border dark:border-notion-border-dark rounded-md"
            onClick={() => popoverRef.current?.querySelector('input')?.focus()}
          >
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
                if (e.key === 'Backspace' && search === '' && selectedNames.length > 0) {
                  handleRemove(selectedNames[selectedNames.length - 1]);
                }
              }}
              placeholder="+ Add"
              className="flex-grow bg-transparent outline-none text-sm p-0.5 w-[100px] text-notion-text dark:text-notion-text-dark"
            />
          </div>
          
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
                  {/* --- MODIFICA: Aggiunto colore testo icona --- */}
                  <MoreHorizontalIcon className="w-4 h-4 text-notion-text-gray dark:text-notion-text-gray-dark" />
                </button>
              </div>
            ))}
            
            {canCreate && (
              <button
                onClick={handleCreate}
                className="w-full text-left p-1 rounded hover:bg-notion-hover dark:hover:bg-notion-hover-dark text-sm flex gap-2 items-center text-notion-text-gray dark:text-notion-text-gray-dark"
              >
                + Crea <TagPill name={search.trim()} color="gray" />
              </button>
            )}
          </div>

          {/* --- IL POP-UP DI MODIFICA E' STATO RIMOSSO DA QUI --- */}
          
        </div>,
        document.body
      )}

      {/* --- PORTALE 2: POPOVER MODIFICA OPZIONE (RENDERIZZATO QUI) --- */}
      {editingOption && (
        <EditOptionPopover
          mainPopoverEl={popoverRef.current}
          option={editingOption}
          onClose={() => setEditingOption(null)}
          onDelete={handleDeleteOption}
          onChangeColor={handleChangeColor}
          onRename={handleRenameOption}
        />
      )}
    </>
  );
};