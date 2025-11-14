// SOSTITUISCI QUESTO FILE: components/DBview/DatabaseViewComponents.tsx

import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom'; // Importato per i Portals
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Doc, Id } from '../../convex/_generated/dataModel';
import { 
  PageIcon, PlusIcon, XIcon, TagIcon, TrashIcon, MoreHorizontalIcon,
  // --- REQUISITO 2: Importa tutte le nuove icone ---
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
} from '../icons';
import { DbColumn, DbColumnType, SelectOption } from '../../extensions/DatabaseView';
import { TagPill } from './TagPill';
import { AddColumnPopover } from './AddColumnPopover'; 
import { SelectPopover } from './SelectPopover';
import { EmojiPicker } from '../EmojiPicker'; // <-- MODIFICA: Importa EmojiPicker

// Helper per generare ID univoci per le opzioni
const newOptionId = () => `opt_${new Date().getTime().toString(36)}`;
// Helper per generare ID univoci per le colonne
const newColumnId = () => `prop_${new Date().getTime().toString(36)}`;


// --- HOOK PER CLICK-OUTSIDE ---
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


// --- COMPONENTE CELLA (Invariato) ---
const DatabaseCell: React.FC<{
  page: Doc<'pages'>;
  column: DbColumn;
  isEditable: boolean; 
  onPropertyChange: (pageId: Id<'pages'>, key: string, value: any) => void;
  onTagsChange: (pageId: Id<'pages'>, tags: string) => void;
}> = ({ page, column, isEditable, onPropertyChange, onTagsChange }) => {
  
  const value = page.properties?.[column.id];

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const key = column.id;
    let value: string | number | null = e.target.value; 
    if (column.type === 'number') {
      value = value === '' ? null : parseFloat(value);
      if (isNaN(value as number)) value = null; 
    }
    onPropertyChange(page._id, key, value);
  };
  
  if (isEditable && (column.type === 'text' || column.type === 'number')) {
     return (
        <input
          type={column.type === 'number' ? 'number' : 'text'}
          defaultValue={value || ''}
          onBlur={handleBlur}
          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
          placeholder={column.type === 'number' ? '0' : '-'}
          className="w-full h-full bg-transparent outline-none p-2"
        />
     );
  }

  switch (column.type) {
    case 'core': // 'Tags'
      if (!page.tags || page.tags.length === 0) return <div className="p-2 h-[37px]">&nbsp;</div>; 
      return (
        <div className="flex flex-wrap gap-1 p-2">
          {page.tags.map(tag => (
            <TagPill key={tag} name={tag} color="gray" />
          ))}
        </div>
      );
    
    case 'number':
      return <div className="p-2 text-right">{value}</div>;

    case 'select': {
      if (!value) return <div className="p-2 h-[37px]">&nbsp;</div>;
      const option = column.options?.find(o => o.name === value);
      return (
        <div className="p-2">
          <TagPill name={value} color={option?.color || 'gray'} />
        </div>
      );
    }
      
    case 'multi-select': {
      if (!value || !Array.isArray(value) || value.length === 0) return <div className="p-2 h-[37px]">&nbsp;</div>;
      const optionsMap = new Map(column.options?.map(o => [o.name, o.color]));
      return (
        <div className="flex flex-wrap gap-1 p-2">
          {value.map(name => (
            <TagPill key={name} name={name} color={optionsMap.get(name) || 'gray'} />
          ))}
        </div>
      );
    }
    
    case 'checkbox':
      return <div className="p-2 flex items-center justify-center"><input type="checkbox" checked={!!value} readOnly className="cursor-pointer" /></div>;
    case 'date':
       return <div className="p-2 truncate">{value ? new Date(value).toLocaleDateString() : ''}</div>;
    case 'url':
       return <div className="p-2 truncate"><a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{value}</a></div>;
      
    case 'text':
    default:
      return <div className="p-2 truncate">{value}</div>;
  }
};


// --- COMPONENTE HELPER PER LE ICONE DI COLONNA (Invariato) ---
const PropertyIcon: React.FC<{ type: DbColumnType }> = ({ type }) => {
  const className = "w-4 h-4 mr-1.5 text-notion-text-gray dark:text-notion-text-gray-dark flex-shrink-0";
  
  switch (type) {
    case 'text': return <TextIcon className={className} />;
    case 'number': return <NumberIcon className={className} />;
    case 'select': return <SelectIcon className={className} />;
    case 'multi-select': return <MultiSelectIcon className={className} />;
    case 'status': return <StatusIcon className={className} />;
    case 'date': return <DateIcon className={className} />;
    case 'person': return <PersonIcon className={className} />;
    case 'files': return <FilesIcon className={className} />;
    case 'checkbox': return <CheckboxIcon className={className} />;
    case 'url': return <URLIcon className={className} />;
    case 'email': return <EmailIcon className={className} />;
    case 'phone': return <PhoneIcon className={className} />;
    case 'formula': return <FormulaIcon className={className} />;
    case 'relation': return <RelationIcon className={className} />;
    case 'rollup': return <RollupIcon className={className} />;
    case 'button': return <ButtonIcon className={className} />;
    case 'id': return <IDIcon className={className} />;
    case 'place': return <PlaceIcon className={className} />;
    case 'core': return <TagIcon className={className} />; // 'Tags'
    default:
      return <div className="w-4 h-4 mr-1.5" />; // Placeholder
  }
};


// --- ELENCO TIPI DI PROPRIETÀ (Invariato) ---
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

// --- Popover TIPO (Invariato) ---
interface ColumnTypePopoverProps {
  anchorEl: HTMLElement;
  onClose: () => void;
  onTypeSelect: (type: DbColumnType) => void;
}
const ColumnTypePopover: React.FC<ColumnTypePopoverProps> = ({ anchorEl, onClose, onTypeSelect }) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  useClickOutside(popoverRef, onClose);
  const rect = anchorEl.getBoundingClientRect();
  return ReactDOM.createPortal(
    <div
      ref={popoverRef}
      className="absolute z-20 w-60 bg-notion-bg dark:bg-notion-sidebar-dark border border-notion-border dark:border-notion-border-dark rounded-lg shadow-lg p-2"
      style={{ top: `${rect.top}px`, left: `${rect.right + 4}px` }}
      onMouseDown={(e) => e.stopPropagation()} 
    >
      <p className="text-xs text-notion-text-gray dark:text-notion-text-gray-dark px-2 mb-1">
        Tipo di proprietà
      </p>
      <ul className="max-h-60 overflow-y-auto">
        {PROPERTY_TYPES_LIST.map(type => (
          <li key={type.id}>
            <button 
              className="w-full flex items-center p-2 rounded hover:bg-notion-hover dark:hover:bg-notion-hover-dark text-notion-text dark:text-notion-text-dark"
              onClick={() => {
                onTypeSelect(type.id as DbColumnType);
                onClose();
              }}
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

// --- Menu CONTESTUALE (Invariato) ---
interface ColumnContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onDelete: () => void;
  onChangeType: (anchorEl: HTMLElement) => void;
}
const ColumnContextMenu: React.FC<ColumnContextMenuProps> = ({ x, y, onClose, onDelete, onChangeType }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const changeTypeRef = useRef<HTMLButtonElement>(null); 
  useClickOutside(menuRef, onClose);

  return ReactDOM.createPortal(
    <div
      ref={menuRef}
      className="absolute z-20 w-56 bg-notion-bg dark:bg-notion-sidebar-dark border border-notion-border dark:border-notion-border-dark rounded-lg shadow-lg p-2"
      style={{ top: `${y}px`, left: `${x}px` }}
      onMouseDown={(e) => e.stopPropagation()} 
    >
      <button
        ref={changeTypeRef} 
        onClick={(e) => {
          e.stopPropagation();
          onChangeType(changeTypeRef.current!); 
        }}
        className="w-full flex items-center p-2 rounded text-sm text-notion-text dark:text-notion-text-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark"
      >
        <MoreHorizontalIcon className="w-4 h-4 mr-2" />
        Modifica Tipo
      </button>
      <button
        onClick={() => {
          onDelete();
          onClose();
        }}
        className="w-full flex items-center p-2 rounded text-sm text-red-500 hover:bg-notion-hover dark:hover:bg-notion-hover-dark"
      >
        <TrashIcon className="w-4 h-4 mr-2" />
        Elimina
      </button>
    </div>,
    document.body
  );
};


// --- COMPONENTE PRINCIPALE (CONTROLLER) ---
export const DatabaseViewComponents: React.FC<NodeViewProps> = (props) => {
  const { editor, node, updateAttributes } = props;
  
  // --- STATO PRINCIPALE (Invariato) ---
  const [isCreatingRow, setIsCreatingRow] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const newPageInputRef = useRef<HTMLInputElement>(null);
  const [editingColumn, setEditingColumn] = useState<DbColumn | null>(null);
  const [activePopup, setActivePopup] = useState<null | {
    type: 'addColumn' | 'editCell';
    anchorEl: HTMLElement;
    pageId?: Id<'pages'>;
    column?: DbColumn;
  }>(null);
  
  
  // --- STATO PER MENU CONTESTUALE COLONNA (Invariato) ---
  const [contextMenu, setContextMenu] = useState<{ 
    x: number; 
    y: number; 
    column: DbColumn; 
  } | null>(null);
  const [typePicker, setTypePicker] = useState<{ 
    anchorEl: HTMLElement; 
    column: DbColumn;
  } | null>(null);

  // --- STATO PER RIORDINAMENTO DRAG (Invariato) ---
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);

  
  // --- MODIFICA 1: DATI E STATO TITOLO/ICONA ---
  
  // 'dbViewId' è ora l'Id della pagina che rappresenta questa tabella
  const dbViewId = node.attrs.id as Id<'pages'>; 
  
  // Query per i metadati della "Pagina-Tabella" (titolo, icona)
  // Assumiamo che api.pages.getById esista (come da conversazione)
  const dbPage = useQuery(api.pages.getById, dbViewId ? { pageId: dbViewId } : "skip");
  
  // Mutazione per aggiornare titolo/icona della "Pagina-Tabella"
  const updatePage = useMutation(api.pages.update); 

  // Stato locale per l'input del titolo, sincronizzato con Convex
  const [localTitle, setLocalTitle] = useState(dbPage?.title || "Senza titolo");
  useEffect(() => {
    if (dbPage && dbPage.title !== localTitle) {
      setLocalTitle(dbPage.title);
    }
  }, [dbPage?.title]); // Si aggiorna solo se il titolo di Convex cambia
  
  // Stato per il picker dell'icona
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  // L'icona viene letta direttamente da dbPage
  const icon = dbPage?.icon;

  // --- DATI RIGHE E COLONNE ---
  // Definizioni delle colonne (lette da Tiptap)
  const viewColumns: DbColumn[] = node.attrs.columns || [];
  
  // Opzioni dell'editor (invariate)
  const { onSelectPage, onOpenInSplitView } = editor.extensionManager.extensions.find(ext => ext.name === 'databaseView')?.options || {};
  
  // Query per le *righe* della tabella (usa l'indice by_dbViewId)
  const pages = useQuery(api.pages.getDatabasePages, dbViewId ? { dbViewId } : "skip");
  
  // Mutazione per creare *righe*
  const createPage = useMutation(api.pages.create);

  // --- FINE MODIFICA 1 ---


  // --- FUNZIONI DI CALLBACK ---

  // Rimossa: splitTitleForIcon (non più necessaria)

  // Salva il titolo della tabella in Convex
  const handleTitleBlur = () => {
    const newTitle = localTitle.trim() || "Senza titolo";
    setLocalTitle(newTitle);
    if (newTitle !== dbPage?.title) {
      updatePage({ id: dbViewId, title: newTitle });
    }
  };

  // Salva l'icona della tabella in Convex
  const handleIconSelect = (emoji: string) => {
    updatePage({ id: dbViewId, icon: emoji });
    setIsPickerOpen(false);
  };

  // Aggiorna proprietà di una riga (invariato)
  const handlePropertyChange = (pageId: Id<'pages'>, propKey: string, propValue: any) => {
    const page = pages?.find(p => p._id === pageId);
    if (!page) return;
    const newProperties = { ...(page.properties || {}), [propKey]: propValue };
    updatePage({ id: pageId, properties: newProperties });
  };
  
  // Aggiorna tag di una riga (invariato)
  const handleTagsChange = (pageId: Id<'pages'>, newTags: string) => {
    const tagsArray = newTags.split(',').map(t => t.trim()).filter(Boolean);
    updatePage({ id: pageId, tags: tagsArray });
  };

  // Salva opzioni 'select' (invariato, usa updateAttributes)
  const handleColumnOptionsChange = (columnId: string, newOptions: SelectOption[]) => {
    const newColumns = viewColumns.map(col => 
      col.id === columnId ? { ...col, options: newOptions } : col
    );
    updateAttributes({ columns: newColumns });
  };
  
  // Crea colonna (invariato, usa updateAttributes)
  const handleColumnCreate = (title: string, type: DbColumnType) => {
    const newCol: DbColumn = {
      id: newColumnId(),
      title: title.trim() || type, 
      type: type,
      options: (type === 'select' || type === 'multi-select' || type === 'status') ? [] : undefined,
    };
    updateAttributes({ columns: [...viewColumns, newCol] });
    setActivePopup(null);
  };
  
  // Click su "+ New" (invariato)
  const handleAddNewPageClick = () => {
     if (!dbViewId) return;
     setIsCreatingRow(true);
     setNewPageTitle("");
     setTimeout(() => newPageInputRef.current?.focus(), 50);
  };

  // --- MODIFICA 2: CREAZIONE RIGA ---
  // Crea la riga come figlia della "Pagina-Tabella"
  const handleCreatePageFinal = () => {
    if (!dbViewId || !isCreatingRow) return;
    const title = newPageTitle.trim();
    setIsCreatingRow(false);
    setNewPageTitle("");
    if (title === "") return; 

    // NON serve più 'currentPageId'
    
    createPage({ 
      title: title, 
      parentPage: dbViewId, // La riga è figlia della TABELLA
      dbViewId: dbViewId     // La riga appartiene a QUESTA VISTA
    });
  };
  // --- FINE MODIFICA 2 ---
  
  // Click su una riga (invariato)
  const handlePageClick = (e: React.MouseEvent, pageId: string) => {
    e.preventDefault();
    const isSplitViewRequest = e.metaKey || e.ctrlKey;
    if (isSplitViewRequest) onOpenInSplitView(pageId);
    else onSelectPage(pageId);
  };
  
  // Rinomina colonna (invariato, usa updateAttributes)
  const handleColumnRename = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!editingColumn) return;
    const newTitle = e.target.value.trim();
    if (newTitle && newTitle !== editingColumn.title) {
      const newColumns = viewColumns.map(col => 
        col.id === editingColumn.id ? { ...col, title: newTitle } : col
      );
      updateAttributes({ columns: newColumns });
    }
    setEditingColumn(null);
  };
  
  // --- FUNZIONI MENU CONTESTUALE COLONNA (Invariate, usano updateAttributes) ---
  const handleColumnDelete = (columnId: string) => {
    const newColumns = viewColumns.filter(col => col.id !== columnId);
    updateAttributes({ columns: newColumns });
    setContextMenu(null); 
  };
  
  const handleColumnTypeChange = (columnId: string, newType: DbColumnType) => {
    const newColumns = viewColumns.map(col => {
      if (col.id !== columnId) return col;
      const newOptions = (newType === 'select' || newType === 'multi-select' || newType === 'status') ? [] : undefined;
      return { ...col, type: newType, options: newOptions };
    });
    updateAttributes({ columns: newColumns });
    setTypePicker(null); 
    setContextMenu(null); 
  };
  
  const handleColumnContextMenu = (e: React.MouseEvent, column: DbColumn) => {
    e.preventDefault();
    e.stopPropagation();
    if (column.type === 'core') return;
    setContextMenu({ x: e.clientX, y: e.clientY, column });
    setTypePicker(null); 
  };
  
  // --- FUNZIONI RIORDINO (Invariate, usano updateAttributes) ---
  const handleDragStart = (e: React.DragEvent, columnId: string) => {
    setDraggedColumnId(columnId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', columnId);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
  };
  const handleDrop = (e: React.DragEvent, targetColumn: DbColumn) => {
    e.preventDefault();
    if (!draggedColumnId || draggedColumnId === targetColumn.id) return;
    const draggedIndex = viewColumns.findIndex(c => c.id === draggedColumnId);
    const targetIndex = viewColumns.findIndex(c => c.id === targetColumn.id);
    if (draggedIndex === -1 || targetIndex === -1) return;
    const newColumns = [...viewColumns];
    const [draggedItem] = newColumns.splice(draggedIndex, 1); 
    newColumns.splice(targetIndex, 0, draggedItem); 
    updateAttributes({ columns: newColumns });
  };
  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedColumnId(null);
  };


  // Calcola lo stile della griglia CSS (invariato)
  const gridTemplateColumns = useMemo(() => {
    const nameCol = "minmax(200px, 1.5fr)"; 
    const propCols = viewColumns.map(col => {
      switch(col.type) {
        case 'number': return "minmax(120px, 0.5fr)";
        case 'select': return "minmax(180px, 1fr)";
        case 'multi-select': return "minmax(200px, 1.5fr)";
        case 'core': return "minmax(200px, 1.5fr)"; // 'Tags'
        case 'checkbox': return "minmax(80px, 0.3fr)";
        default: return "minmax(180px, 1fr)";
      }
    }).join(' ');
    const addCol = "40px"; 
    return `${nameCol} ${propCols} ${addCol}`;
  }, [viewColumns]);

  // --- MODIFICA 3: GESTIONE CARICAMENTO ---
  // Mostra caricamento se dbViewId non è valido o se la "pagina-tabella" non è ancora stata caricata
  if (!dbViewId || dbPage === undefined) {
    return <NodeViewWrapper className="p-2 bg-notion-hover dark:bg-notion-hover-dark rounded-md">
      <p>Caricamento vista database...</p>
    </NodeViewWrapper>
  }
  // Se dbPage è null, l'ID non è valido (es. cancellato)
  if (dbPage === null) {
     return <NodeViewWrapper className="p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md">
      <p>Errore: Vista Database non trovata. ID: {dbViewId}</p>
    </NodeViewWrapper>
  }
  // --- FINE MODIFICA 3 ---


  return (
    <NodeViewWrapper 
      className="not-prose my-4 relative" 
      data-type="database-view" 
      contentEditable={false}
      onMouseDown={() => {
        setContextMenu(null);
        setTypePicker(null);
        setIsPickerOpen(false); // Chiudi anche il picker
      }}
    >
      
      {/* --- MODIFICA 4: RENDER TITOLO E ICONA DA CONVEX --- */}
      <div className="relative flex items-center mb-2 group">
        
        {/* L'icona è un bottone per aprire il Picker */}
        <div className="absolute left-0 flex items-center justify-center w-8">
          <button
            onClick={(e) => { e.stopPropagation(); setIsPickerOpen(true); }}
            className="flex items-center justify-center w-full h-full rounded hover:bg-notion-hover dark:hover:bg-notion-hover-dark"
          >
            {icon ? (
              <span className="text-xl">{icon}</span>
            ) : (
              <PageIcon className="w-5 h-5 text-notion-text-gray dark:text-notion-text-gray-dark" />
            )}
          </button>
          
          {/* Pop-up EmojiPicker */}
          {isPickerOpen && (
             <div className="absolute top-full left-0 z-20" onMouseDown={(e) => e.stopPropagation()}>
                <EmojiPicker
                  onSelect={handleIconSelect}
                  onClose={() => setIsPickerOpen(false)}
                />
             </div>
          )}
        </div>

        {/* L'input usa lo stato locale e salva 'onBlur' in Convex */}
        <input
          type="text"
          value={localTitle} 
          onChange={(e) => setLocalTitle(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
            if (e.key === 'Escape') {
                setLocalTitle(dbPage?.title || "Senza titolo");
                e.currentTarget.blur();
            }
          }}
          placeholder="Senza titolo"
          className="w-full bg-transparent outline-none p-0 font-bold text-l text-notion-text dark:text-notion-text-dark"
          style={{ paddingLeft: '34px' }} 
        />
      </div>
      {/* --- FINE MODIFICA 4 --- */}

      
      {/* Contenitore principale con overflow (Invariato) */}
      <div className="overflow-x-auto border-b border-notion-border dark:border-notion-border-dark">
        <div 
          className="w-full min-w-[600px] grid" 
          style={{ gridTemplateColumns: gridTemplateColumns }}
        >
          {/* --- HEADER (Invariato) --- */}
          <div className="p-2 text-left text-sm font-medium text-notion-text-gray dark:text-notion-text-gray-dark sticky top-0 z-[1]">Name</div>
          
          {viewColumns.map((col: DbColumn) => (
            <div 
              key={col.id} 
              className={`flex items-center p-2 text-left text-sm font-medium text-notion-text-gray dark:text-notion-text-gray-dark border-notion-border dark:border-notion-border-dark sticky top-0 z-[1] truncate
                ${col.type !== 'core' ? 'cursor-grab' : ''} 
                ${draggedColumnId === col.id ? 'opacity-50' : ''} 
              `}
              onContextMenu={(e) => handleColumnContextMenu(e, col)}
              draggable={col.type !== 'core'} 
              onDragStart={(e) => handleDragStart(e, col.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col)}
              onDragEnd={handleDragEnd}
            >
              {editingColumn?.id === col.id ? (
                <div className="flex items-center w-full">
                  <PropertyIcon type={col.type} />
                  <input
                    type="text"
                    defaultValue={col.title}
                    onBlur={handleColumnRename}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                    autoFocus
                    className="w-full bg-transparent outline-none p-0"
                    onContextMenu={(e) => e.stopPropagation()} 
                  />
                </div>
              ) : (
                <button 
                  onClick={() => {
                     if (col.type !== 'core') setEditingColumn(col)
                  }}
                  className="w-full flex items-center text-left truncate"
                  disabled={col.type === 'core'} 
                >
                  <PropertyIcon type={col.type} />
                  {col.title}
                </button>
              )}
            </div>
          ))}

          <div className="w-10 p-1 border-notion-border dark:border-notion-border-dark sticky top-0 z-[1]">
            <button 
              onClick={(e) => {
                setActivePopup({ type: 'addColumn', anchorEl: e.currentTarget });
              }}
              className="flex items-center justify-center w-full p-1 rounded hover:bg-notion-hover dark:hover:bg-notion-hover-dark" 
              title="Aggiungi colonna"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          </div>
          
          {/* --- BODY (RIGHE) (Invariato) --- */}
          {pages === undefined && (
            <div className="p-4 text-center text-notion-text-gray dark:text-notion-text-gray-dark" style={{ gridColumn: `span ${viewColumns.length + 2}` }}>Caricamento righe...</div>
          )}
          
          {pages && pages.map(page => (
            <React.Fragment key={page._id}>
              {/* Colonna Nome */}
              <div className="p-2 text-sm text-notion-text dark:text-notion-text-dark border-t border-notion-border dark:border-notion-border-dark">
                <a 
                  onClick={(e) => handlePageClick(e, page._id)} 
                  className="flex items-center gap-1 hover:underline cursor-pointer"
                  title={`${page.title || 'Senza titolo'} (Ctrl+Clic per aprire a lato)`}
                >
                  {page.icon ? (
                    <span>{page.icon}</span>
                  ) : (
                    <PageIcon className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span className="truncate">{page.title || 'Senza titolo'}</span>
                </a>
              </div>
              
              {/* Colonne Proprietà */}
              {viewColumns.map((col: DbColumn) => {
                const isEditable = col.type === 'text' || col.type === 'number'; 
                const isPopup = col.type === 'select' || col.type === 'multi-select' || col.type === 'core' || col.type === 'date' || col.type === 'person';
                
                return (
                  <div 
                    key={col.id} 
                    className={`text-sm border-l border-t border-notion-border dark:border-notion-border-dark ${isPopup ? 'cursor-pointer' : ''}`}
                    onClick={(e) => {
                      if (isPopup) { 
                        setActivePopup({
                          type: 'editCell',
                          anchorEl: e.currentTarget,
                          pageId: page._id,
                          column: col,
                        });
                      }
                    }}
                  >
                    <DatabaseCell
                      page={page}
                      column={col}
                      isEditable={isEditable}
                      onPropertyChange={handlePropertyChange}
                      onTagsChange={handleTagsChange}
                    />
                  </div>
                );
              })}
              {/* Cella vuota per il pulsante + */}
              <div className=" border-l border-t border-notion-border dark:border-notion-border-dark"></div>
            </React.Fragment>
          ))}
          
          {/* --- RIGA DI CREAZIONE INLINE (Invariata) --- */}
          {isCreatingRow && (
            <>
              <div className="p-2 text-sm border-l border-t border-notion-border dark:border-notion-border-dark">
                <div className="flex items-center gap-1">
                  <PageIcon className="w-4 h-4 flex-shrink-0" />
                  <input
                    ref={newPageInputRef}
                    type="text"
                    value={newPageTitle}
                    onChange={(e) => setNewPageTitle(e.target.value)}
                    onBlur={handleCreatePageFinal}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreatePageFinal();
                      if (e.key === 'Escape') setIsCreatingRow(false);
                    }}
                    placeholder="Scrivi un nome..."
                    className="w-full bg-transparent outline-none p-0"
                  />
                </div>
              </div>
              {viewColumns.map(col => (
                <div key={col.id} className="p-2 text-sm text-notion-text-gray dark:text-notion-text-gray-dark border-b border-notion-border dark:border-notion-border-dark">
                  {/* Cella vuota */}
                </div>
              ))}
            </>
          )}
          
        </div>
      </div>
      
      {/* Pulsante '+ New' in fondo (Invariato) */}
      <button 
        onClick={handleAddNewPageClick}
        className="flex items-center p-2 text-sm text-notion-text-gray dark:text-notion-text-gray-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark"
      >
        <PlusIcon className="w-4 h-4 mr-1" />
        New
      </button>

      {/* --- RENDER DEI POP-UP (Invariato) --- */}
      
      {activePopup?.type === 'addColumn' && (
        <AddColumnPopover
          anchorEl={activePopup.anchorEl}
          onClose={() => setActivePopup(null)}
          onColumnCreate={handleColumnCreate}
        />
      )}
      
      {activePopup?.type === 'editCell' && activePopup.pageId && activePopup.column && (
        <SelectPopover
          anchorEl={activePopup.anchorEl}
          onClose={() => setActivePopup(null)}
          page={pages?.find(p => p._id === activePopup.pageId) as Doc<'pages'>}
          column={activePopup.column}
          onPropertyChange={handlePropertyChange}
          onColumnChange={(newColumnData) => handleColumnOptionsChange(activePopup.column!.id, newColumnData.options || [])}
        />
      )}
      
      {/* --- RENDER POPOVER MENU CONTESTUALE (Invariato) --- */}
      
      {contextMenu && (
        <ColumnContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onDelete={() => handleColumnDelete(contextMenu.column.id)}
          onChangeType={(anchor) => setTypePicker({ anchorEl: anchor, column: contextMenu.column })}
        />
      )}
      
      {typePicker && (
        <ColumnTypePopover
          anchorEl={typePicker.anchorEl}
          onClose={() => setTypePicker(null)}
          onTypeSelect={(newType) => handleColumnTypeChange(typePicker.column.id, newType)}
        />
      )}
      
    </NodeViewWrapper>
  );
};