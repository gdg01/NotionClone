// File: components/FlowView.tsx (Integrale - Corretto)

import React, { useMemo, useRef, useState, useLayoutEffect, useEffect } from 'react';
// MODIFICA: Rimosso 'createPage', mantenuto 'updatePage' per rinominare
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Doc } from '../convex/_generated/dataModel';
import { PageIcon, PlusIcon, ArrowLeftIcon } from './icons';

interface FlowViewProps {
  startPageId: string;
  onSelectPage: (pageId: string) => void;
  onClose: () => void;
  onOpenInSplitView: (pageId: string) => void;
  isSplitMode: boolean; // Prop per cambiare layout
  // MODIFICA: Aggiunta la prop per la creazione "avanzata" di pagine
  onCreateChildPage: (parentId: string) => Promise<string | undefined>;
}

type FlowNode = {
  id: string;
  label: string;
  icon: string | undefined;
};

type GraphData = {
  nodes: { id: string; label: string; icon: string | undefined }[];
  links: { source: string; target: string }[];
};

export const FlowView: React.FC<FlowViewProps> = ({
  startPageId,
  onSelectPage,
  onClose,
  onOpenInSplitView,
  isSplitMode,
  // MODIFICA: Ricevuta la nuova prop
  onCreateChildPage,
}) => {
  const graphDataQuery = useQuery(api.graph.getGraphData) as GraphData | undefined;
  const allPages = useQuery(api.pages.getAllMetadata);
  
  // MODIFICA: Rimosso createPage, la logica è ora in App.tsx
  // const createPage = useMutation(api.pages.create); 
  
  // Manteniamo updatePage per la modifica del titolo
  const updatePage = useMutation(api.pages.update);

  // Riferimenti per gli elementi DOM
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<string, HTMLDivElement | null>());

  // Stato per i tracciati SVG e dimensioni
  const [svgPaths, setSvgPaths] = useState<string[]>([]);
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });

  // Stato per forzare il ricalcolo su resize/scroll
  const [tick, setTick] = useState(0);

  // Stato per hover
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Stato per modifica
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  // Stato per il centro del flusso
  const [currentStartId, setCurrentStartId] = useState(startPageId);

  // Sincronizza lo stato se la prop iniziale cambia
  useEffect(() => {
    setCurrentStartId(startPageId);
  }, [startPageId]);

  // Algoritmo BFS per calcolare i livelli (Invariato)
  const { levels, nodesMap, allLinks } = useMemo(() => {
    if (!graphDataQuery || !allPages) return { levels: [], nodesMap: new Map(), allLinks: [] };

    const nodesMap = new Map<string, FlowNode>(
      graphDataQuery.nodes.map(n => [n.id, n])
    );
    
    const contentLinks = graphDataQuery.links;
    const allLinksSet = new Set(contentLinks.map(l => `${l.source}:${l.target}`)); 
    const combinedLinks = [...contentLinks]; 

    const forwardLinks = new Map<string, string[]>();
    for (const link of graphDataQuery.links) {
      if (!forwardLinks.has(link.source)) {
        forwardLinks.set(link.source, []);
      }
      forwardLinks.get(link.source)!.push(link.target);
    }

    if (allPages) {
      for (const page of allPages) {
        if (page.parentId) {
          const source = page.parentId;
          const target = page._id;
          const linkKey = `${source}:${target}`;

          if (nodesMap.has(source) && nodesMap.has(target)) {
            
            if (!forwardLinks.has(source)) {
              forwardLinks.set(source, []);
            }
            if (!forwardLinks.get(source)!.includes(target)) {
              forwardLinks.get(source)!.push(target);
            }

            if (!allLinksSet.has(linkKey)) { 
              allLinksSet.add(linkKey);
              combinedLinks.push({ source, target });
            }
          }
        }
      }
    }

    const nodesInLevels: string[][] = [];
    const visited = new Set<string>();
    const queue: [string, number][] = [[currentStartId, 0]]; 
    visited.add(currentStartId);

    while (queue.length > 0) {
      const [currentId, level] = queue.shift()!;

      if (!nodesInLevels[level]) {
        nodesInLevels[level] = [];
      }
      
      if (nodesMap.has(currentId)) {
        nodesInLevels[level].push(currentId);
        const children = forwardLinks.get(currentId) || [];
        for (const childId of children) {
          if (!visited.has(childId)) {
            visited.add(childId);
            queue.push([childId, level + 1]);
          }
        }
      }
    }

    return { levels: nodesInLevels, nodesMap, allLinks: combinedLinks };
  }, [graphDataQuery, currentStartId, allPages]); 

  // Mappa delle connessioni (Invariata)
  const getAllConnectedNodes = useMemo(() => {
    return (nodeId: string): Set<string> => {
      if (!allLinks) return new Set(); 
      
      const connected = new Set<string>();
      const visited = new Set<string>();
      
      const findPredecessors = (id: string) => {
        if (visited.has(id)) return;
        visited.add(id);
        connected.add(id);
        
        for (const link of allLinks) { 
          if (link.target === id && !visited.has(link.source)) {
            findPredecessors(link.source);
          }
        }
      };
      
      const findSuccessors = (id: string) => {
        if (visited.has(id)) return;
        visited.add(id);
        connected.add(id);
        
        for (const link of allLinks) { 
          if (link.source === id && !visited.has(link.target)) {
            findSuccessors(link.target);
          }
        }
      };
      
      visited.clear();
      findPredecessors(nodeId);
      
      visited.clear();
      findSuccessors(nodeId);
      
      return connected;
    };
  }, [allLinks]);

  // Effetto per ricalcolare i tracciati SVG (Invariato)
  useLayoutEffect(() => {
    if (!graphDataQuery || !containerRef.current || !allLinks) {
      setSvgPaths([]);
      return;
    }

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const newPaths: string[] = [];

    for (const link of allLinks) {
      const sourceEl = nodeRefs.current.get(link.source);
      const targetEl = nodeRefs.current.get(link.target);

      if (sourceEl && targetEl) {
        
        const sourceRect = sourceEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect(); 

        const startX = sourceRect.right - containerRect.left + container.scrollLeft;
        const startY = sourceRect.top + sourceRect.height / 2 - containerRect.top + container.scrollTop;
        const endX = targetRect.left - containerRect.left + container.scrollLeft;
        const endY = targetRect.top + targetRect.height / 2 - containerRect.top + container.scrollTop;

        if (endX > startX) {
          const controlX1 = startX + (endX - startX) / 2;
          const controlY1 = startY;
          const controlX2 = startX + (endX - startX) / 2;
          const controlY2 = endY;

          const pathData = `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;
          newPaths.push(pathData);
        }
      }
    }

    setSvgPaths(newPaths);
    setSvgDimensions({
      width: container.scrollWidth,
      height: container.scrollHeight,
    });

  }, [levels, graphDataQuery, tick, allLinks]); 
  
  // Effetto per 'tick' su resize e scroll (Invariato)
  useEffect(() => {
    const container = containerRef.current;
    
    const updatePaths = () => setTick(t => t + 1);

    window.addEventListener('resize', updatePaths);
    container?.addEventListener('scroll', updatePaths);

    return () => {
      window.removeEventListener('resize', updatePaths);
      container?.removeEventListener('scroll', updatePaths);
    };
  }, []);
  
  // Funzione di click (Invariata)
  const handleNodeClick = (e: React.MouseEvent, pageId: string) => {
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault();
      onOpenInSplitView(pageId);
    } else {
      onSelectPage(pageId);
    }
  };

  // MODIFICA: Funzione per aggiungere una pagina figlia
  const handleAddChildPage = async (e: React.MouseEvent, parentId: string) => {
    e.stopPropagation(); 
    try {
      // Usa la prop passata da App.tsx
      const newPageId = await onCreateChildPage(parentId);
      
      if (newPageId) {
        setEditingNodeId(newPageId); // Attiva la modifica del titolo
      } else {
        console.error("Creazione pagina fallita o ID non restituito.");
      }

    } catch (error) {
      console.error("Impossibile creare la pagina figlia:", error);
    }
  };

  // Funzione per salvare il titolo (Invariata)
  const handleTitleSave = (pageId: string, newTitle: string) => {
    if (newTitle.trim() === "") {
      newTitle = "Senza titolo";
    }
    updatePage({
      id: pageId,
      title: newTitle,
    });
    setEditingNodeId(null);
  };

  // Classe dinamica per il contenitore principale (Invariata)
  const wrapperClass = isSplitMode
    ? "h-full w-full relative bg-notion-bg-dark/100 flex flex-col"
    : "fixed inset-0 z-30 bg-notion-bg-dark/100 flex flex-col";

  return (
    <div className={wrapperClass}>
      {/* Background (Invariato) */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.75) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />
      
      {/* Header (Invariato) */}
      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between">
        <button
          onClick={onClose}
          className="p-2 rounded-md text-notion-text-dark hover:bg-notion-hover-dark flex items-center"
          title="Torna all'editor"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Indietro
        </button>
        <h2 className="text-lg font-bold text-notion-text-dark">
          Flusso Pagina
        </h2>
        <div className="w-24"></div>
      </div>

      {/* Contenitore principale (Invariato) */}
      <div 
        ref={containerRef}
        className="relative flex-1 flex p-8 pt-20 space-x-12 overflow-x-auto overflow-y-hidden"
      >
        
        {/* Overlay SVG per le frecce */}
        <svg
          className="absolute top-0 left-0"
          width={svgDimensions.width}
          height={svgDimensions.height}
          style={{ pointerEvents: 'none' }}
        >
          <defs>
            {/* Definizione della punta della freccia */}
            <marker 
              id="arrowhead" 
              markerWidth="10" 
              markerHeight="7" 
              refX="10" // Sposta la freccia alla fine della linea
              refY="3.5" 
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
            </marker>
            {/* Definizione punta freccia evidenziata */}
            <marker 
              id="arrowhead-highlight" 
              markerWidth="10" 
              markerHeight="7" 
              refX="10" 
              refY="3.5" 
              orient="auto"
              className="text-blue-500" // Colore highlight
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
            </marker>
          </defs>
          <g 
            className="text-notion-border-dark" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            fill="none"
          >
            {svgPaths.map((path, i) => {
              const link = allLinks?.[i];
              if (!link) return null;
              
              const connectedNodes = hoveredNode ? getAllConnectedNodes(hoveredNode) : new Set();
              const isHighlighted = hoveredNode && 
                (connectedNodes.has(link.source) && connectedNodes.has(link.target));
              
              // MODIFICA BUG: L'opacità ora si attenua correttamente
              const opacityClass = hoveredNode 
                ? (isHighlighted ? 'opacity-100' : 'opacity-30') 
                : 'opacity-100';

              return (
                <path 
                  key={i} 
                  d={path} 
                  // Applica la punta della freccia corretta
                  markerEnd={isHighlighted ? "url(#arrowhead-highlight)" : "url(#arrowhead)"}
                  className={opacityClass}
                  style={{
                    // Applica il colore e lo spessore
                    stroke: isHighlighted ? '#3b82f6' : 'currentColor', // Blu se evidenziato
                    strokeWidth: isHighlighted ? '2.5' : '1.5',
                    transition: 'all 0.2s ease'
                  }}
                />
              );
            })}
          </g>
        </svg>

        {/* Stati di Caricamento / Vuoto (Invariati) */}
        {(graphDataQuery === undefined || allPages === undefined) && (
          <div className="flex-1 p-8 text-center text-notion-text-gray-dark">
            Caricamento del flusso...
          </div>
        )}
        {graphDataQuery && allPages && levels.length === 0 && (
          <div className="flex-1 p-8 text-center text-notion-text-gray-dark">
            Nessun dato da mostrare per questo flusso.
          </div>
        )}

        {/* Rendering dei Livelli (colonne) (Invariato) */}
        {graphDataQuery && allPages && levels.map((nodeIds, levelIndex) => (
          <div 
            key={levelIndex} 
            className="flex flex-col space-y-4 pt-8"
            style={{ minWidth: '256px', paddingTop: `${levelIndex * 20}px` }} 
          >
            <div className="text-xs uppercase text-notion-text-gray-dark font-semibold mb-2 px-2">
              Livello {levelIndex}
            </div>
            
            {nodeIds.map(nodeId => {
              const node = nodesMap.get(nodeId);
              if (!node) return null;

              const connectedNodes = hoveredNode ? getAllConnectedNodes(hoveredNode) : new Set();
              const isConnected = hoveredNode && connectedNodes.has(nodeId);
              const isDimmed = hoveredNode && !isConnected;

              // Blocco per la modifica del titolo (Invariato)
              if (editingNodeId === nodeId) {
                return (
                  <div
                    ref={(el) => {
                      if (el) nodeRefs.current.set(nodeId, el);
                      else nodeRefs.current.delete(nodeId);
                    }}
                    key={nodeId}
                    className="p-3 bg-notion-bg dark:bg-notion-sidebar-dark border rounded-lg shadow-md w-full border-blue-500"
                  >
                    <div className="flex items-center">
                      <span className="mr-2 text-lg">
                        {node.icon ? node.icon : <PageIcon className="w-4 h-4" />}
                      </span>
                      <input
                        type="text"
                        autoFocus
                        defaultValue={node.label || 'Senza titolo'}
                        className="font-medium text-notion-text dark:text-notion-text-dark bg-transparent focus:outline-none w-full"
                        onClick={(e) => e.stopPropagation()}
                        onBlur={(e) => handleTitleSave(nodeId, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleTitleSave(nodeId, e.currentTarget.value);
                          } else if (e.key === 'Escape') {
                            setEditingNodeId(null);
                          }
                        }}
                      />
                    </div>
                  </div>
                );
              }

              // Blocco nodo standard (Invariato)
              return (
                <div
                  ref={(el) => {
                    if (el) nodeRefs.current.set(nodeId, el);
                    else nodeRefs.current.delete(nodeId);
                  }}
                  key={nodeId}
                  onMouseEnter={() => setHoveredNode(nodeId)}
                  onMouseLeave={() => setHoveredNode(null)}
                  className={`group p-3 bg-notion-bg dark:bg-notion-sidebar-dark border rounded-lg shadow-md w-full transition-all ${
                    isConnected 
                      ? 'border-blue-500 shadow-xl scale-105' // Evidenziato
                      : isDimmed 
                      ? 'opacity-30 border-notion-border dark:border-notion-border-dark' // Attenuato
                      : 'border-notion-border dark:border-notion-border-dark hover:shadow-xl hover:border-blue-500/50' // Normale
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center truncate cursor-pointer" 
                      onClick={(e) => handleNodeClick(e, nodeId)} // Chiama la logica di click
                      title="Click: Apri pagina. Ctrl+Click: Apri in split view."
                    >
                      <span className="mr-2 text-lg">
                        {node.icon ? node.icon : <PageIcon className="w-4 h-4" />}
                      </span>
                      <span className="font-medium truncate text-notion-text dark:text-notion-text-dark">
                        {node.label || 'Untitled'}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleAddChildPage(e, nodeId)} // Chiama la nuova logica di creazione
                      className="p-1 rounded text-notion-text-gray-dark hover:bg-notion-hover-dark opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Aggiungi pagina figlia"
                    >
                      <PlusIcon className="w-4 h-4" /> 
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};