// SOSTITUISCI QUESTO FILE: components/DBview/DatabaseViewComponents.tsx

import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Doc, Id } from '../../convex/_generated/dataModel';
import {
  PageIcon,
  PlusIcon,
  XIcon,
  TagIcon,
  TrashIcon,
  MoreHorizontalIcon,
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
  // --- MODIFICA: Icone per il nuovo pulsante ---
  ArrowUpRightIcon,
  SplitIcon,
} from '../icons';
import {
  DbColumn,
  DbColumnType,
  SelectOption,
} from '../../extensions/DatabaseView';
import { TagPill } from './TagPill';
import { AddColumnPopover } from './AddColumnPopover';
import { SelectPopover } from './SelectPopover';
import { EmojiPicker } from '../EmojiPicker';

// Helper per generare ID univoci per le opzioni
const newOptionId = () => `opt_${new Date().getTime().toString(36)}`;
// Helper per generare ID univoci per le colonne
const newColumnId = () => `prop_${new Date().getTime().toString(36)}`;

const DEFAULT_COLUMNS: DbColumn[] = [
];

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

// --- COMPONENTE CELLA (MODIFICATO per altezza minima) ---
const DatabaseCell: React.FC<{
  page: Doc<'pages'>;
  column: DbColumn;
  isEditable: boolean;
  onPropertyChange: (pageId: Id<'pages'>, key: string, value: any) => void;
}> = ({ page, column, isEditable, onPropertyChange }) => {
  const value = page.properties?.[column.id];

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const key = column.id;
    let newValue: string | number | null = e.target.value;

    if (column.type === 'number') {
      newValue = newValue === '' ? null : parseFloat(newValue);
      if (isNaN(newValue as number)) newValue = null;
    } else if (newValue === '') {
      newValue = null;
    }

    onPropertyChange(page._id, key, newValue);
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const key = column.id;
     const newValue = e.target.value; 
     const timestamp = newValue ? new Date(newValue).getTime() : null;
     onPropertyChange(page._id, key, timestamp);
  };

  // --- MODALITÀ MODIFICA ---
  if (isEditable) {
    switch (column.type) {
      case 'text':
      case 'status':
      case 'person':
      case 'files':
      case 'formula':
      case 'relation':
      case 'rollup':
      case 'button':
      case 'id':
      case 'place':
        return (
          <input
            type="text"
            defaultValue={value || ''}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
            placeholder="-"
            className="w-full h-full bg-transparent outline-none p-2 text-sm"
          />
        );
      case 'number':
        return (
          <input
            type="number"
            defaultValue={value || ''}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
            placeholder="0"
            className="w-full h-full bg-transparent outline-none p-2 text-sm text-right"
          />
        );
      case 'url':
        return (
          <input
            type="url"
            defaultValue={value || ''}
            onBlur={handleBlur}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
            placeholder="https://..."
            className="w-full h-full bg-transparent outline-none p-2 text-sm text-blue-500"
          />
        );
      case 'email':
         return (
          <input
            type="email"
            defaultValue={value || ''}
            onBlur={handleBlur}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
            placeholder="esempio@mail.com"
            className="w-full h-full bg-transparent outline-none p-2 text-sm text-blue-500"
          />
        );
      case 'phone':
         return (
          <input
            type="tel"
            defaultValue={value || ''}
            onBlur={handleBlur}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
            placeholder="+123456789"
            className="w-full h-full bg-transparent outline-none p-2 text-sm"
          />
        );
      case 'date':
        const dateValue = value ? new Date(value).toISOString().split('T')[0] : '';
        return (
           <input
            type="date"
            value={dateValue}
            onChange={handleDateChange}
            className="w-full h-full bg-transparent outline-none p-2 text-sm"
          />
        );
      case 'checkbox':
         return (
          <div className="w-full h-full flex items-center justify-center p-2">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onPropertyChange(page._id, column.id, e.target.checked)}
              className="cursor-pointer"
            />
          </div>
         );
    }
  }

  // --- MODALITÀ SOLA LETTURA (per popup e display) ---
  // --- MODIFICA: Sostituito h-[37px] con min-h-[42px] ---
  switch (column.type) {
    case 'core': // 'Tags'
      if (!page.tags || page.tags.length === 0)
        return <div className="p-2 min-h-[42px]">&nbsp;</div>;
      return (
        <div className="flex flex-wrap gap-1 p-2 min-h-[42px]">
          {page.tags.map((tag) => (
            <TagPill key={tag} name={tag} color="gray" />
          ))}
        </div>
      );

    case 'number':
      return <div className="p-2 text-right text-sm min-h-[42px]">{value}</div>;

    case 'select': {
      if (!value) return <div className="p-2 min-h-[42px]">&nbsp;</div>;
      const option = column.options?.find((o) => o.name === value);
      return (
        <div className="p-2 min-h-[42px]">
          <TagPill name={value} color={option?.color || 'gray'} />
        </div>
      );
    }

    case 'multi-select': {
      if (!value || !Array.isArray(value) || value.length === 0)
        return <div className="p-2 min-h-[42px]">&nbsp;</div>;
      const optionsMap = new Map(column.options?.map((o) => [o.name, o.color]));
      return (
        <div className="flex flex-wrap gap-1 p-2 min-h-[42px]">
          {value.map((name) => (
            <TagPill
              key={name}
              name={name}
              color={optionsMap.get(name) || 'gray'}
            />
          ))}
        </div>
      );
    }
    
    case 'checkbox':
       return (
         <div className="w-full h-full flex items-center justify-center p-2 min-h-[42px]">
            <input type="checkbox" checked={!!value} readOnly disabled />
         </div>
       );
    
     case 'date':
       return <div className="p-2 text-sm truncate min-h-[42px]">{value ? new Date(value).toLocaleDateString() : ''}</div>;
       
    case 'url':
       return <div className="p-2 text-sm truncate min-h-[42px]"><a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{value}</a></div>;
       
    case 'email':
       return <div className="p-2 text-sm truncate min-h-[42px]"><a href={`mailto:${value}`} className="text-blue-500 hover:underline">{value}</a></div>;
       
    case 'phone':
       return <div className="p-2 text-sm truncate min-h-[42px]"><a href={`tel:${value}`} className="hover:underline">{value}</a></div>;

    case 'text':
    default:
      return <div className="p-2 text-sm truncate min-h-[42px]">{value}</div>;
  }
};
// --- FINE COMPONENTE CELLA ---


// --- Componenti Popover (invariati) ---
const PropertyIcon: React.FC<{ type: DbColumnType }> = ({ type }) => {
  const className =
    'w-4 h-4 mr-1.5 text-notion-text-gray dark:text-notion-text-gray-dark flex-shrink-0';
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
    case 'core': return <TagIcon className={className} />;
    default: return <div className="w-4 h-4 mr-1.5" />;
  }
};
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
        {PROPERTY_TYPES_LIST.map((type) => (
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
// --- FINE Popover ---


// --- COMPONENTE PRINCIPALE (CONTROLLER) ---
export const DatabaseViewComponents: React.FC<NodeViewProps> = (props) => {
  const { editor, node } = props;

  // --- STATI ---
  const [isCreatingRow, setIsCreatingRow] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const newPageInputRef = useRef<HTMLInputElement>(null);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingColumn, setEditingColumn] = useState<DbColumn | null>(null);
  const [activePopup, setActivePopup] = useState<null | {
    type: 'addColumn' | 'editCell';
    anchorEl: HTMLElement;
    pageId?: Id<'pages'>;
    column?: DbColumn;
  }>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    column: DbColumn;
  } | null>(null);
  const [typePicker, setTypePicker] = useState<{
    anchorEl: HTMLElement;
    column: DbColumn;
  } | null>(null);
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);

  // --- MODIFICA: Stati per Hover e Tasto Ctrl ---
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [isCtrlPressed, setIsCtrlPressed] = useState<boolean>(false);
  // --- FINE MODIFICA ---

  // --- DATI CONVEX (Logica di centralizzazione) ---
  const dbViewId = node.attrs.id as Id<'pages'>;
  const dbPage = useQuery(api.pages.getById, dbViewId ? { pageId: dbViewId } : 'skip');
  const updatePage = useMutation(api.pages.update);
  const [localTitle, setLocalTitle] = useState(dbPage?.title || 'Senza titolo');
  useEffect(() => {
    if (dbPage && dbPage.title !== localTitle) {
      setLocalTitle(dbPage.title);
    }
  }, [dbPage?.title]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const icon = dbPage?.icon;
  const viewColumns: DbColumn[] = dbPage?.properties?.columns || [];
  
  useEffect(() => {
    if (dbPage && dbPage.properties?.columns === undefined) {
      updatePage({
        id: dbViewId,
        properties: { ...dbPage.properties, columns: DEFAULT_COLUMNS },
      });
    }
  }, [dbPage, dbViewId, updatePage]);

  const { onSelectPage, onOpenInSplitView } =
    editor.extensionManager.extensions.find(
      (ext) => ext.name === 'databaseView'
    )?.options || {};

  const pages = useQuery(
    api.pages.getDatabasePages,
    dbViewId ? { dbViewId } : 'skip'
  );
  const createPage = useMutation(api.pages.create);
  
  // --- MODIFICA: Listener Globale per tasto Ctrl/Meta ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.metaKey) {
        setIsCtrlPressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.metaKey) {
        setIsCtrlPressed(false);
      }
    };
    const handleBlur = () => {
      setIsCtrlPressed(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);
  // --- FINE MODIFICA ---


  // --- FUNZIONI CALLBACK (Logica centralizzata) ---

  const handleTitleBlur = () => {
    const newTitle = localTitle.trim() || 'Senza titolo';
    setLocalTitle(newTitle);
    if (newTitle !== dbPage?.title) {
      updatePage({ id: dbViewId, title: newTitle });
    }
  };

  const handleIconSelect = (emoji: string) => {
    updatePage({ id: dbViewId, icon: emoji });
    setIsPickerOpen(false);
  };

  const handlePropertyChange = (
    pageId: Id<'pages'>,
    propKey: string,
    propValue: any
  ) => {
    const page = pages?.find((p) => p._id === pageId);
    if (!page) return;
    const newProperties = { ...(page.properties || {}), [propKey]: propValue };
    updatePage({ id: pageId, properties: newProperties });
  };
  
  const updateDbPageColumns = (newColumns: DbColumn[]) => {
    if (!dbPage) return;
    updatePage({
      id: dbViewId,
      properties: { ...dbPage.properties, columns: newColumns },
    });
  };

  const handleColumnOptionsChange = (
    columnId: string,
    newOptions: SelectOption[]
  ) => {
    const newColumns = viewColumns.map((col) =>
      col.id === columnId ? { ...col, options: newOptions } : col
    );
    updateDbPageColumns(newColumns);
  };

  const handleColumnCreate = (title: string, type: DbColumnType) => {
    const newCol: DbColumn = {
      id: newColumnId(),
      title: title.trim() || type,
      type: type,
      options:
        type === 'select' || type === 'multi-select' || type === 'status'
          ? []
          : undefined,
    };
    updateDbPageColumns([...viewColumns, newCol]);
    setActivePopup(null);
  };
  
  const handleColumnRename = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!editingColumn) return;
    const newTitle = e.target.value.trim();
    if (newTitle && newTitle !== editingColumn.title) {
      const newColumns = viewColumns.map((col) =>
        col.id === editingColumn.id ? { ...col, title: newTitle } : col
      );
      updateDbPageColumns(newColumns);
    }
    setEditingColumn(null);
  };
  
  const handleColumnDelete = (columnId: string) => {
    const newColumns = viewColumns.filter((col) => col.id !== columnId);
    updateDbPageColumns(newColumns);
    setContextMenu(null);
  };

  const handleColumnTypeChange = (columnId: string, newType: DbColumnType) => {
    const newColumns = viewColumns.map((col) => {
      if (col.id !== columnId) return col;
      const newOptions =
        newType === 'select' ||
        newType === 'multi-select' ||
        newType === 'status'
          ? []
          : undefined;
      return { ...col, type: newType, options: newOptions };
    });
    updateDbPageColumns(newColumns);
    setTypePicker(null);
    setContextMenu(null);
  };
  
  const handleDrop = (e: React.DragEvent, targetColumn: DbColumn) => {
    e.preventDefault();
    if (!draggedColumnId || draggedColumnId === targetColumn.id) return;
    const draggedIndex = viewColumns.findIndex((c) => c.id === draggedColumnId);
    const targetIndex = viewColumns.findIndex((c) => c.id === targetColumn.id);
    if (draggedIndex === -1 || targetIndex === -1) return;
    const newColumns = [...viewColumns];
    const [draggedItem] = newColumns.splice(draggedIndex, 1);
    newColumns.splice(targetIndex, 0, draggedItem);
    updateDbPageColumns(newColumns);
  };

  const handleAddNewPageClick = () => {
    if (!dbViewId) return;
    setIsCreatingRow(true);
    setNewPageTitle('');
    setTimeout(() => newPageInputRef.current?.focus(), 50);
  };
  
  const handleCreatePageFinal = () => {
    if (!dbViewId || !isCreatingRow) return;
    const title = newPageTitle.trim();
    setIsCreatingRow(false);
    setNewPageTitle('');
    if (title === "") return;
    createPage({
      title: title,
      parentPage: dbViewId,
      dbViewId: dbViewId,
    });
  };

  // --- MODIFICA: Funzione di navigazione (chiamata da più punti) ---
  const handlePageClick = (e: React.MouseEvent, pageId: string) => {
    e.preventDefault();
    const isSplitViewRequest = e.metaKey || e.ctrlKey;
    if (isSplitViewRequest) onOpenInSplitView(pageId);
    else onSelectPage(pageId);
  };
  // --- FINE MODIFICA ---
  
  const startEditingTitle = (page: Doc<'pages'>) => {
    setEditingRowId(page._id);
    setEditingTitle(page.title);
    setTimeout(() => {
      document.getElementById(`title-input-${page._id}`)?.focus();
    }, 0);
  };
  
  const handleTitleChangeBlur = (pageId: Id<'pages'>) => {
    const newTitle = editingTitle.trim() || 'Senza titolo';
    updatePage({ id: pageId, title: newTitle });
    setEditingRowId(null);
  };
  
  const handleTitleKeyDown = (e: React.KeyboardEvent, pageId: Id<'pages'>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleChangeBlur(pageId);
    }
    if (e.key === 'Escape') {
      setEditingRowId(null);
    }
  };

  const handleColumnContextMenu = (e: React.MouseEvent, column: DbColumn) => {
    e.preventDefault();
    e.stopPropagation();
    if (column.type === 'core') return;
    setContextMenu({ x: e.clientX, y: e.clientY, column });
    setTypePicker(null);
  };
  const handleDragStart = (e: React.DragEvent, columnId: string) => {
    setDraggedColumnId(columnId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', columnId);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedColumnId(null);
  };
  
  // Calcolo griglia (invariato)
  const gridTemplateColumns = useMemo(() => {
    const nameCol = 'minmax(200px, 1.5fr)';
    const propCols = viewColumns
      .map((col) => {
        switch (col.type) {
          case 'number': return 'minmax(120px, 0.5fr)';
          case 'select': return 'minmax(180px, 1fr)';
          case 'multi-select': return 'minmax(200px, 1.5fr)';
          case 'core': return 'minmax(200px, 1.5fr)'; 
          case 'checkbox': return 'minmax(80px, 0.3fr)';
          case 'date': return 'minmax(140px, 0.75fr)';
          case 'url': return 'minmax(200px, 1.5fr)';
          default: return 'minmax(180px, 1fr)';
        }
      })
      .join(' ');
    const addCol = '40px';
    return `${nameCol} ${propCols} ${addCol}`;
  }, [viewColumns]);

  // Gestione caricamento (invariato)
  if (!dbViewId || dbPage === undefined) {
    return (
      <NodeViewWrapper className="p-2 bg-notion-hover dark:bg-notion-hover-dark rounded-md">
        <p>Caricamento vista database...</p>
      </NodeViewWrapper>
    );
  }
  if (dbPage === null) {
    return (
      <NodeViewWrapper className="p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md">
        <p>Errore: Vista Database non trovata. ID: {dbViewId}</p>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      className="not-prose my-4 relative"
      data-type="database-view"
      contentEditable={false}
      onMouseDown={() => {
        setContextMenu(null);
        setTypePicker(null);
        setIsPickerOpen(false);
      }}
    >
      {/* Render Titolo/Icona (invariato) */}
      <div className="relative flex items-center mb-2 group">
        <div className="absolute left-0 flex items-center justify-center w-8">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPickerOpen(true);
            }}
            className="flex items-center justify-center w-full h-full rounded hover:bg-notion-hover dark:hover:bg-notion-hover-dark"
          >
            {icon ? (
              <span className="text-xl">{icon}</span>
            ) : (
              <PageIcon className="w-5 h-5 text-notion-text-gray dark:text-notion-text-gray-dark" />
            )}
          </button>
          {isPickerOpen && (
            <div
              className="absolute top-full left-0 z-20"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <EmojiPicker
                onSelect={handleIconSelect}
                onClose={() => setIsPickerOpen(false)}
              />
            </div>
          )}
        </div>
        <input
          type="text"
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
            if (e.key === 'Escape') {
              setLocalTitle(dbPage?.title || 'Senza titolo');
              e.currentTarget.blur();
            }
          }}
          placeholder="Senza titolo"
          className="w-full bg-transparent outline-none p-0 font-bold text-l text-notion-text dark:text-notion-text-dark"
          style={{ paddingLeft: '34px' }}
        />
      </div>

      <div className="overflow-x-auto border-b border-notion-border dark:border-notion-border-dark">
        <div
          className="w-full min-w-[600px] grid"
          style={{ gridTemplateColumns: gridTemplateColumns }}
        >
          {/* --- HEADER (Invariato) --- */}
          <div className="p-2 text-left text-sm font-medium text-notion-text-gray dark:text-notion-text-gray-dark sticky top-0 z-[1]">
            Name
          </div>
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.currentTarget.blur();
                    }}
                    autoFocus
                    className="w-full bg-transparent outline-none p-0"
                    onContextMenu={(e) => e.stopPropagation()}
                  />
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (col.type !== 'core') setEditingColumn(col);
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

          {/* --- BODY (RIGHE) (MODIFICATO) --- */}
          {pages === undefined && (
            <div
              className="p-4 text-center text-notion-text-gray dark:text-notion-text-gray-dark"
              style={{ gridColumn: `span ${viewColumns.length + 2}` }}
            >
              Caricamento righe...
            </div>
          )}

          {pages &&
            pages.map((page) => (
              // --- MODIFICA: Invece di React.Fragment, usiamo un <div> con display: contents ---
              // Questo ci permette di catturare l'hover sull'intera riga
              <div
                key={page._id}
                style={{ display: 'contents' }}
                onMouseEnter={() => setHoveredRowId(page._id)}
                onMouseLeave={() => setHoveredRowId(null)}
              >
                {/* Colonna Nome (MODIFICATA) */}
                <div className="text-sm text-notion-text dark:text-notion-text-dark border-t border-notion-border dark:border-notion-border-dark relative h-full">
                  {editingRowId === page._id ? (
                    <div className="flex items-center gap-1 p-2 h-full">
                      {page.icon ? (
                        <span>{page.icon}</span>
                      ) : (
                        <PageIcon className="w-4 h-4 flex-shrink-0" />
                      )}
                      <input
                        id={`title-input-${page._id}`}
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => handleTitleChangeBlur(page._id)}
                        onKeyDown={(e) => handleTitleKeyDown(e, page._id)}
                        className="w-full bg-transparent outline-none p-0"
                      />
                    </div>
                  ) : (
                    // Contenitore Flex per Titolo e Pulsante "Open"
                    <div className="flex items-center justify-between p-2 h-full min-h-[42px]">
                      <a
                        onClick={(e) => {
                          e.preventDefault();
                          // Il clic semplice ora rinomina
                          startEditingTitle(page);
                        }}
                        onAuxClick={(e) => {
                          // Il clic rotellina naviga
                          if (e.button === 1) handlePageClick(e, page._id);
                        }}
                        className="flex items-center gap-1 hover:underline cursor-pointer min-w-0"
                        title={`${page.title || 'Senza titolo'} (Clic per rinominare)`}
                      >
                        {page.icon ? (
                          <span>{page.icon}</span>
                        ) : (
                          <PageIcon className="w-4 h-4 flex-shrink-0" />
                        )}
                        <span className="truncate">{page.title || 'Senza titolo'}</span>
                      </a>
                      
                      {/* Pulsante "Open" che appare in hover sulla riga */}
                      {hoveredRowId === page._id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Passiamo l'evento a handlePageClick, che sa già
                            // come gestire Ctrl/Cmd vs Clic normale.
                            handlePageClick(e, page._id);
                          }}
                          className="flex-shrink-0 flex items-center text-xs text-notion-text-gray dark:text-notion-text-gray-dark bg-notion-hover dark:bg-notion-hover-dark p-1 rounded"
                          title={isCtrlPressed ? "Apri in split view" : "Apri pagina"}
                        >
                          {isCtrlPressed ? (
                            <>
                              <SplitIcon className="w-3.5 h-3.5 mr-1" />
                              <span>OPEN</span>
                            </>
                            
                          ) : (
                            <>
                              <ArrowUpRightIcon className="w-3.5 h-3.5 mr-1" />
                              <span>OPEN</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Colonne Proprietà (MODIFICATE per h-full) */}
                {viewColumns.map((col: DbColumn) => {
                  const isEditable = [
                    'text', 'number', 'date', 'checkbox', 'url', 'email', 'phone'
                  ].includes(col.type);
                  const isPopup = [
                    'select', 'multi-select', 'core', 'person'
                  ].includes(col.type);

                  return (
                    <div
                      key={col.id}
                      className={`text-sm border-l border-t border-notion-border dark:border-notion-border-dark h-full
                        ${isPopup ? 'cursor-pointer' : ''}
                        ${!isEditable ? 'hover:bg-notion-hover dark:hover:bg-notion-hover-dark' : ''}
                      `}
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
                      />
                    </div>
                  );
                })}
                {/* Cella vuota per il pulsante + (MODIFICATA per h-full) */}
                <div className="border-l border-t border-notion-border dark:border-notion-border-dark h-full"></div>
              </div> // --- Fine del wrapper display: contents ---
            ))}

          {/* --- RIGA DI CREAZIONE INLINE (Invariata) --- */}
          {isCreatingRow && (
            <>
              <div className="p-2 text-sm border-l border-t border-notion-border dark:border-notion-border-dark min-h-[42px]">
                <div className="flex items-center gap-1 h-full">
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
              {viewColumns.map((col) => (
                <div
                  key={col.id}
                  className="p-2 text-sm border-t border-notion-border dark:border-notion-border-dark min-h-[42px]"
                ></div>
              ))}
              <div className="border-l border-t border-notion-border dark:border-notion-border-dark min-h-[42px]"></div>
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

      {activePopup?.type === 'editCell' &&
        activePopup.pageId &&
        activePopup.column &&
        (activePopup.column.type === 'select' || activePopup.column.type === 'multi-select') && (
          <SelectPopover
            anchorEl={activePopup.anchorEl}
            onClose={() => setActivePopup(null)}
            page={pages?.find((p) => p._id === activePopup.pageId) as Doc<'pages'>}
            column={activePopup.column}
            onPropertyChange={handlePropertyChange}
            onColumnChange={(newColumnData) =>
              handleColumnOptionsChange(
                activePopup.column!.id,
                newColumnData.options || []
              )
            }
          />
        )}

      {/* --- RENDER POPOVER MENU CONTESTUALE (Invariato) --- */}
      {contextMenu && (
        <ColumnContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onDelete={() => handleColumnDelete(contextMenu.column.id)}
          onChangeType={(anchor) =>
            setTypePicker({ anchorEl: anchor, column: contextMenu.column })
          }
        />
      )}

      {typePicker && (
        <ColumnTypePopover
          anchorEl={typePicker.anchorEl}
          onClose={() => setTypePicker(null)}
          onTypeSelect={(newType) =>
            handleColumnTypeChange(typePicker.column.id, newType)
          }
        />
      )}
    </NodeViewWrapper>
  );
};