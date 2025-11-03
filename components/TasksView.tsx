// File: components/TasksView.tsx (SOSTITUZIONE COMPLETA)

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Doc, Id } from '../convex/_generated/dataModel';
import { 
  PageIcon, 
  ArrowLeftIcon, 
  PlusIcon, 
  TrashIcon, 
  MoreHorizontalIcon,
  // NUOVE ICONE DI STATO PERSONALIZZATE
  CircleDottedIcon, 
  CircleHalfIcon, 
  CircleFilledIcon
} from './icons'; // Assicurati di importare le nuove icone

// Definiamo le nostre colonne (Aggiunto il riferimento all'icona)
const COLUMNS = [
  { id: 'todo', title: 'To Do', icon: CircleDottedIcon, colorClass: 'text-notion-text-gray dark:text-notion-text-gray-dark' },
  { id: 'inprogress', title: 'In Progress', icon: CircleHalfIcon, colorClass: 'text-blue-500' },
  { id: 'done', title: 'Done', icon: CircleFilledIcon, colorClass: 'text-green-500' },
];

// Tipo per i props della vista principale
interface TasksViewProps {
  onClose: () => void;
  onSelectPage: (pageId: string) => void;
  allPages: Doc<'pages'>[] | undefined; 
}

// Tipo per i props di una singola card
interface TaskCardProps {
  task: Doc<'tasks'>;
  page: Doc<'pages'> | undefined; 
  onSelectPage: (pageId: string) => void;
  onDelete: (taskId: Id<'tasks'>) => void;
}

// --- Componente TaskCard (Invariato per lo stile) ---
const TaskCard: React.FC<TaskCardProps> = ({ task, page, onSelectPage, onDelete }) => {
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('taskId', task._id);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="p-4 bg-notion-bg dark:bg-notion-bg-dark border border-notion-border dark:border-notion-border-dark rounded-lg shadow-sm hover:shadow-md w-full cursor-grab active:cursor-grabbing group relative"
    >
      {/* Titolo */}
      <p className="font-semibold text-notion-text dark:text-notion-text-dark mb-2">{task.title}</p>
      
      {/* Descrizione */}
      {task.description && (
        <p className="text-sm text-notion-text-gray dark:text-notion-text-gray-dark mb-3 whitespace-pre-wrap">
          {task.description}
        </p>
      )}
      
      {/* Ref alla pagina */}
      {page ? (
        <a
          onClick={(e) => { e.preventDefault(); onSelectPage(page._id); }}
          href={`#${page._id}`}
          className="inline-flex items-center text-xs text-notion-text-gray dark:text-notion-text-gray-dark bg-notion-hover dark:bg-notion-hover-dark px-2 py-1 rounded-full hover:bg-notion-active dark:hover:bg-notion-active-dark"
          title={`Vai alla pagina: ${page.title || 'Untitled'}`}
        >
          {page.icon ? (
            <span className="mr-1.5">{page.icon}</span>
          ) : (
            <PageIcon className="w-3.5 h-3.5 mr-1.5" />
          )}
          <span className="truncate">{page.title || 'Untitled'}</span>
        </a>
      ) : (
        <p className="text-sm text-red-400">Pagina non trovata</p>
      )}
      
      <button
        onClick={() => onDelete(task._id)}
        className="absolute top-2 right-2 p-1 text-notion-text-gray dark:text-notion-text-gray-dark hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Elimina task"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

// --- Componente NewTaskForm (Invariato) ---
interface NewTaskFormProps {
  allPages: Doc<'pages'>[];
  columnStatus: string;
  onClose: () => void;
}

const NewTaskForm: React.FC<NewTaskFormProps> = ({ allPages, columnStatus, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState(''); 
  const [selectedPageId, setSelectedPageId] = useState<string>(allPages[0]?._id || '');
  const createTask = useMutation(api.tasks.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedPageId) return;

    try {
      await createTask({
        title: title.trim(),
        pageId: selectedPageId as Id<'pages'>,
        description: description.trim() || undefined,
        status: columnStatus,
      });
      setTitle('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error("Errore creazione task:", error);
    }
  };
  
  if (!selectedPageId && allPages.length > 0) {
    setSelectedPageId(allPages[0]._id);
  }

  return (
    <form onSubmit={handleSubmit} className="p-1 space-y-2 mb-4">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nuovo task..."
        className="w-full p-2 text-sm bg-notion-bg dark:bg-notion-bg-dark border border-notion-border dark:border-notion-border-dark rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Aggiungi una descrizione... (opzionale)"
        rows={2}
        className="w-full p-2 text-sm bg-notion-bg dark:bg-notion-bg-dark border border-notion-border dark:border-notion-border-dark rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      
      <select
        value={selectedPageId}
        onChange={(e) => setSelectedPageId(e.target.value)}
        className="w-full p-2 text-sm bg-notion-bg dark:bg-notion-bg-dark border border-notion-border dark:border-notion-border-dark rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="" disabled>Associa a una pagina...</option>
        {allPages.map(page => (
          <option key={page._id} value={page._id}>
            {page.icon} {page.title || 'Untitled'}
          </option>
        ))}
      </select>
      
      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="flex-1 p-2 text-sm bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium"
        >
          Aggiungi
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 p-2 text-sm bg-notion-hover dark:bg-notion-hover-dark hover:bg-notion-active dark:hover:bg-notion-active-dark rounded-md"
        >
          Annulla
        </button>
      </div>
    </form>
  );
};


// --- Componente TasksView Principale (Modificato) ---
export const TasksView: React.FC<TasksViewProps> = ({ onClose, onSelectPage, allPages }) => {
  const tasks = useQuery(api.tasks.list);
  const updateTaskStatus = useMutation(api.tasks.updateStatus);
  const deleteTask = useMutation(api.tasks.deleteTask);
  
  const [showNewTaskForm, setShowNewTaskForm] = useState<string | null>(null);

  const pagesMap = useMemo(() => {
    if (!allPages) return new Map<string, Doc<'pages'>>();
    return new Map(allPages.map(p => [p._id, p]));
  }, [allPages]);
  
  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, Doc<'tasks'>[]> = {};
    for (const col of COLUMNS) {
      grouped[col.id] = [];
    }
    tasks?.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      } else {
        grouped['todo'].push(task);
      }
    });
    return grouped;
  }, [tasks]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); 
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      updateTaskStatus({
        taskId: taskId as Id<'tasks'>,
        newStatus: newStatus,
      });
    }
  };

  if (!tasks || !allPages) {
    return (
      <div className="fixed inset-0 z-30 bg-notion-sidebar dark:bg-notion-sidebar-dark flex items-center justify-center">
        <p className="text-notion-text-gray dark:text-notion-text-gray-dark">Caricamento task...</p>
      </div>
    );
  }

  return (
    <div 
      className="h-full w-full relative bg-notion-sidebar dark:bg-notion-sidebar-dark flex flex-col text-notion-text dark:text-notion-text-dark"
    >
      
      <div className="p-4 z-10 flex items-center justify-between border-b border-notion-border dark:border-notion-border-dark bg-notion-bg dark:bg-notion-bg-dark">
        <button
          onClick={onClose}
          className="p-2 rounded-md hover:bg-notion-hover dark:hover:bg-notion-hover-dark flex items-center"
          title="Torna all'editor"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Indietro
        </button>
        <h2 className="text-lg font-bold">Bacheca Task</h2>
        <div className="w-24"></div>
      </div>

      {/* Contenitore Colonne: Rimosso overflow-y-auto per permettere alle colonne di allungarsi */}
      <div className="flex-1 flex p-4 space-x-4 overflow-x-auto items-start"> 
        {COLUMNS.map(column => {
          const StatusIcon = column.icon; // Componente Icona dinamico
          
          return (
            <div
              key={column.id}
              // Altezza dinamica: min-h-full forza la colonna ad essere alta quanto il contenuto del contenitore flex-1, 
              // ma il contenitore interno si adatta al contenuto, permettendo all'altezza di "seguire" i task.
              className="w-80 flex-shrink-0 bg-notion-bg dark:bg-notion-bg-dark p-2 rounded-lg"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Header Colonna (con Icona di Stato) */}
              <div className="flex items-center justify-between mb-3 px-2">
                <h3 className="text-sm font-semibold uppercase flex items-center">
                  {/* Icona di Stato */}
                  <StatusIcon className={`w-3.5 h-3.5 mr-1.5 ${column.colorClass}`} /> 
                  
                  {column.title} <span className="ml-1 text-notion-text-gray dark:text-notion-text-gray-dark">
                    {tasksByStatus[column.id]?.length || 0}
                  </span>
                </h3>
                
                {/* Pulsanti + e ... */}
                <div className="flex items-center">
                  <button 
                    onClick={() => setShowNewTaskForm(column.id)}
                    className="p-1 text-notion-text-gray dark:text-notion-text-gray-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark rounded-md"
                    title="Aggiungi task"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => alert(`Opzioni colonna: ${column.title}`)}
                    className="p-1 ml-1 text-notion-text-gray dark:text-notion-text-gray-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark rounded-md"
                  >
                    <MoreHorizontalIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Form creazione (condizionale) */}
              {showNewTaskForm === column.id && (
                <NewTaskForm
                  allPages={allPages}
                  columnStatus={column.id}
                  onClose={() => setShowNewTaskForm(null)}
                />
              )}
              
              {/* Lista Task - Rimossa l'altezza fissa/scroll per farla crescere */}
              <div className="space-y-3"> 
                {tasksByStatus[column.id] && tasksByStatus[column.id].map(task => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    page={pagesMap.get(task.pageId)}
                    onSelectPage={onSelectPage}
                    onDelete={(taskId) => deleteTask({ taskId: taskId })}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};