// File: components/TasksView.tsx (NUOVO FILE)

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Doc, Id } from '../convex/_generated/dataModel';
import { PageIcon, ArrowLeftIcon, PlusIcon, TrashIcon } from './icons';

// Definiamo le nostre colonne
const COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'inprogress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
];

// Tipo per i props della vista principale
interface TasksViewProps {
  onClose: () => void;
  onSelectPage: (pageId: string) => void;
  allPages: Doc<'pages'>[] | undefined; // Riceve le pagine da App.tsx
}

// Tipo per i props di una singola card
interface TaskCardProps {
  task: Doc<'tasks'>;
  page: Doc<'pages'> | undefined; // La pagina associata
  onSelectPage: (pageId: string) => void;
  onDelete: (taskId: Id<'tasks'>) => void;
}

// --- Componente TaskCard ---
const TaskCard: React.FC<TaskCardProps> = ({ task, page, onSelectPage, onDelete }) => {
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('taskId', task._id);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="p-3 bg-notion-bg-dark border border-notion-border-dark rounded-lg shadow-md w-full cursor-grab active:cursor-grabbing"
    >
      {/* Titolo del task */}
      <p className="font-medium text-notion-text-dark mb-2">{task.title}</p>
      
      {/* Link alla pagina associata */}
      {page ? (
        <a
          onClick={(e) => { e.preventDefault(); onSelectPage(page._id); }}
          href={`#${page._id}`}
          className="flex items-center text-sm text-notion-text-gray-dark hover:text-blue-400"
          title={`Vai alla pagina: ${page.title || 'Untitled'}`}
        >
          {page.icon ? (
            <span className="mr-1.5">{page.icon}</span>
          ) : (
            <PageIcon className="w-4 h-4 mr-1.5" />
          )}
          <span className="truncate">{page.title || 'Untitled'}</span>
        </a>
      ) : (
        <p className="text-sm text-red-400">Pagina non trovata</p>
      )}
      
      {/* Pulsante Elimina */}
      <button
        onClick={() => onDelete(task._id)}
        className="mt-2 p-1 text-notion-text-gray-dark hover:text-red-400"
        title="Elimina task"
      >
        <TrashIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

// --- Componente NewTaskForm ---
const NewTaskForm: React.FC<{ allPages: Doc<'pages'>[], columnStatus: string }> = ({ allPages, columnStatus }) => {
  const [title, setTitle] = useState('');
  const [selectedPageId, setSelectedPageId] = useState<string>(allPages[0]?._id || '');
  const createTask = useMutation(api.tasks.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedPageId) return;

    try {
      await createTask({
        title: title.trim(),
        pageId: selectedPageId as Id<'pages'>,
        // Nota: la mutazione 'create' imposta lo stato 'todo' di default.
        // Se volessi creare un task direttamente in "inprogress", 
        // dovresti modificare la mutation 'create' per accettare uno stato.
      });
      setTitle('');
    } catch (error) {
      console.error("Errore creazione task:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 bg-notion-sidebar-dark rounded-lg space-y-2 mb-4">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nuovo task..."
        className="w-full p-2 text-sm bg-notion-bg-dark border border-notion-border-dark rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <select
        value={selectedPageId}
        onChange={(e) => setSelectedPageId(e.target.value)}
        className="w-full p-2 text-sm bg-notion-bg-dark border border-notion-border-dark rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="" disabled>Associa a una pagina...</option>
        {allPages.map(page => (
          <option key={page._id} value={page._id}>
            {page.icon} {page.title || 'Untitled'}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="w-full p-2 text-sm bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium"
      >
        Aggiungi Task
      </button>
    </form>
  );
};


// --- Componente TasksView Principale ---
export const TasksView: React.FC<TasksViewProps> = ({ onClose, onSelectPage, allPages }) => {
  const tasks = useQuery(api.tasks.list);
  const updateTaskStatus = useMutation(api.tasks.updateStatus);
  const deleteTask = useMutation(api.tasks.deleteTask);
  
  // Crea una mappa delle pagine per un accesso rapido
  const pagesMap = useMemo(() => {
    if (!allPages) return new Map<string, Doc<'pages'>>();
    return new Map(allPages.map(p => [p._id, p]));
  }, [allPages]);
  
  // Raggruppa i task per stato
  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, Doc<'tasks'>[]> = {};
    for (const col of COLUMNS) {
      grouped[col.id] = [];
    }
    tasks?.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      } else {
        // Se un task ha uno stato non valido, mettilo in "todo"
        grouped['todo'].push(task);
      }
    });
    return grouped;
  }, [tasks]);

  // Gestori Drag-and-Drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessario per permettere il drop
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
      <div className="fixed inset-0 z-30 bg-notion-bg-dark/100 flex items-center justify-center">
        <p className="text-notion-text-gray-dark">Caricamento task...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative bg-notion-bg-dark/100 flex flex-col text-notion-text-dark">
      
      {/* Header */}
      <div className="p-4 z-10 flex items-center justify-between border-b border-notion-border-dark">
        <button
          onClick={onClose}
          className="p-2 rounded-md hover:bg-notion-hover-dark flex items-center"
          title="Torna all'editor"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Indietro
        </button>
        <h2 className="text-lg font-bold">Bacheca Task</h2>
        <div className="w-24"></div>
      </div>

      {/* Contenitore Colonne (scorre orizzontalmente) */}
      <div className="flex-1 flex p-4 space-x-4 overflow-x-auto">
        {COLUMNS.map(column => (
          <div
            key={column.id}
            className="w-80 flex-shrink-0 bg-notion-sidebar-dark p-2 rounded-lg"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Header Colonna */}
            <h3 className="text-sm font-semibold uppercase text-notion-text-gray-dark mb-3 px-2">
              {column.title} ({tasksByStatus[column.id]?.length || 0})
            </h3>
            
            {/* Form creazione (solo per "To Do") */}
            {column.id === 'todo' && (
              <NewTaskForm allPages={allPages} columnStatus={column.id} />
            )}
            
            {/* Lista Task */}
            <div className="space-y-3 overflow-y-auto max-h-[calc(100%-80px)]">
              {tasksByStatus[column.id] && tasksByStatus[column.id].map(task => (
                <TaskCard
                  key={task._id}
                  task={task}
                  page={pagesMap.get(task.pageId)}
                  onSelectPage={onSelectPage}
                  onDelete={deleteTask}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};