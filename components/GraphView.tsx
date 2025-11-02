// File: components/GraphView.tsx (Aggiornato con Animazione Cronologica)

import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { ForceGraph2D } from 'react-force-graph';
import { 
    XIcon, 
    RefreshCwIcon, 
    SettingsIcon, 
    SearchIcon, 
    PinIcon, 
    PinOffIcon, 
    CopyIcon, 
    EyeOffIcon,
    Tag,
    PlayIcon,  // <-- AGGIUNTO
    PauseIcon  // <-- AGGIUNTO
} from './icons';
import { Doc } from '../convex/_generated/dataModel';
import { getTagClasses } from '../lib/tagColors';

// Mappa Colori RGB per Canvas (invariata)
const CANVAS_COLOR_MAP: Record<string, string> = {
  gray:   '156, 163, 175', // text-gray-400
  red:    '239, 68, 68',   // red-500
  orange: '249, 115, 22',  // orange-500
  yellow: '234, 179, 8',   // yellow-500
  green:  '34, 197, 94',  // green-500
  teal:   '20, 184, 166',  // teal-500
  blue:   '59, 130, 246',  // blue-500
  cyan:   '6, 182, 212',   // cyan-500
  purple: '168, 85, 247',  // purple-500
  pink:   '236, 72, 153',  // pink-500
};
const PINNED_NODE_COLOR = '255, 215, 0';
const SEARCHED_NODE_COLOR = '50, 255, 50';

interface GraphViewProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPage: (pageId: string) => void;
}

type ContextMenuData = {
  x: number;
  y: number;
  node: any;
};

// --- Hook useClickOutside (invariato) ---
const useClickOutside = (ref: React.RefObject<HTMLDivElement>, handler: () => void) => {
  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };
    document.addEventListener('mousedown', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
    };
  }, [ref, handler]);
};

// --- Pop-over Ricerca (invariato) ---
const SearchPopover: React.FC<{
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSearch: () => void;
}> = ({ searchQuery, setSearchQuery, onSearch }) => {
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-notion-sidebar-dark shadow-lg rounded-md border border-notion-border-dark text-notion-text-dark p-3">
      <h4 className="text-sm font-semibold mb-2 text-notion-text-gray-dark">Cerca Pagina</h4>
      <div className="flex space-x-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          placeholder="Nome della pagina..."
          className="flex-grow bg-notion-bg-dark border border-notion-border-dark rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={onSearch}
          className="flex-shrink-0 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-md"
          title="Cerca"
        >
          <SearchIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// --- Pop-over Impostazioni (invariato) ---
const SettingsPopover: React.FC<{
  hoverLevel: number;
  onHoverLevelChange: (level: number) => void;
  colorGroups: { showPinned: boolean };
  onToggleShowPinned: () => void;
  showOrphans: boolean;
  onToggleShowOrphans: () => void;
}> = ({ hoverLevel, onHoverLevelChange, colorGroups, onToggleShowPinned, showOrphans, onToggleShowOrphans }) => {
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-notion-sidebar-dark shadow-lg rounded-md border border-notion-border-dark text-notion-text-dark p-4 flex flex-col space-y-3">
      {/* Slider Profondità Hover */}
      <div>
        <div className="flex justify-between items-center text-sm mb-1">
          <label htmlFor="hoverLevel">Profondità Hover</label>
          <span className="font-semibold">{hoverLevel}</span>
        </div>
        <input
          id="hoverLevel"
          type="range"
          min="1"
          max="5"
          value={hoverLevel}
          onChange={(e) => onHoverLevelChange(Number(e.target.value))}
          className="w-full h-2 bg-notion-bg-dark rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>
      
      {/* Checkbox Filtri */}
      <label className="flex items-center justify-between hover:bg-notion-hover-dark rounded cursor-pointer p-1.5 -mx-1.5">
        <span className="text-sm">Colora Pagine Fissate (📌)</span>
        <input
          type="checkbox"
          checked={colorGroups.showPinned}
          onChange={onToggleShowPinned}
          className="form-checkbox h-4 w-4 text-blue-500 rounded bg-notion-bg-dark border-notion-border-dark"
        />
      </label>
      <label className="flex items-center justify-between hover:bg-notion-hover-dark rounded cursor-pointer p-1.5 -mx-1.5">
        <span className="text-sm">Mostra Pagine Isolate</span>
        <input
          type="checkbox"
          checked={showOrphans}
          onChange={onToggleShowOrphans}
          className="form-checkbox h-4 w-4 text-blue-500 rounded bg-notion-bg-dark border-notion-border-dark"
        />
      </label>
    </div>
  );
};

// --- Pop-over Tag (invariato) ---
const TagsPopover: React.FC<{
  allTags: Doc<'tags'>[] | undefined;
  activeTags: Set<string>;
  onToggleTag: (tagName: string) => void;
  onClearTags: () => void;
}> = ({ allTags, activeTags, onToggleTag, onClearTags }) => {
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-notion-sidebar-dark shadow-lg rounded-md border border-notion-border-dark text-notion-text-dark p-4 flex flex-col space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-semibold text-notion-text-gray-dark">Filtra per Tag</h4>
        <button
           onClick={onClearTags}
           className="text-xs text-blue-400 hover:underline"
        >
           Pulisci
        </button>
      </div>
      <div className="max-h-48 overflow-y-auto pr-1 scrollbar-thin-dark">
        {allTags?.map(tag => (
          <label
            key={tag._id}
            className={`w-full text-left p-2 rounded mb-1 capitalize flex items-center justify-between cursor-pointer ${
              activeTags.has(tag.name) ? 'bg-blue-500/50' : 'hover:bg-notion-hover-dark'
            }`}
          >
            <div className="flex items-center">
               <input
                type="checkbox"
                checked={activeTags.has(tag.name)}
                onChange={() => onToggleTag(tag.name)}
                className="form-checkbox h-4 w-4 mr-3 text-blue-500 rounded bg-notion-bg-dark border-notion-border-dark"
              />
              <span className="text-sm"># {tag.name}</span>
            </div>
            <span className={`w-3 h-3 rounded-full ${getTagClasses(tag.color)}`} />
          </label>
        ))}
        {(!allTags || allTags.length === 0) && (
           <p className="text-xs text-notion-text-gray-dark p-2">Nessun tag trovato.</p>
        )}
      </div>
    </div>
  );
};

// --- Componente Menu Contestuale (Invariato) ---
const ContextMenu: React.FC<{ 
  menu: ContextMenuData; 
  onClose: () => void;
  onPinToggle: (node: any) => void;
  onHide: (node: any) => void;
  onCopyLink: (node: any) => void;
}> = ({ menu, onClose, onPinToggle, onHide, onCopyLink }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  const isPinned = menu.node.fx !== undefined && menu.node.fy !== undefined;
  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-48 bg-notion-sidebar-dark border border-notion-border-dark rounded-md shadow-lg py-2"
      style={{ top: menu.y, left: menu.x }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-1.5 text-sm font-semibold truncate border-b border-notion-border-dark">
        {menu.node.icon} {menu.node.label}
      </div>
      <div className="p-1">
        <button
          onClick={() => { onPinToggle(menu.node); onClose(); }}
          className="w-full flex items-center px-3 py-1.5 text-sm rounded hover:bg-notion-hover-dark"
        >
          {isPinned ? <PinOffIcon className="w-4 h-4 mr-2" /> : <PinIcon className="w-4 h-4 mr-2" />}
          {isPinned ? 'Sblocca Posizione' : 'Fissa Posizione'}
        </button>
        <button
          onClick={() => { onCopyLink(menu.node); onClose(); }}
          className="w-full flex items-center px-3 py-1.5 text-sm rounded hover:bg-notion-hover-dark"
        >
          <CopyIcon className="w-4 h-4 mr-2" />
          Copia Link
        </button>
         <button
          onClick={() => { onHide(menu.node); onClose(); }}
          className="w-full flex items-center px-3 py-1.5 text-sm rounded hover:bg-notion-hover-dark text-red-400"
        >
          <EyeOffIcon className="w-4 h-4 mr-2" />
          Nascondi Nodo
        </button>
      </div>
    </div>
  );
};


export const GraphView: React.FC<GraphViewProps> = ({ isOpen, onClose, onSelectPage }) => {
  const graphDataQuery = useQuery(api.graph.getGraphData);
  const allTagsList = useQuery(api.tags.list);
  const graphRef = useRef<any>();

  // Stati (invariati)
  const [hoveredNode, setHoveredNode] = useState<any | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuData | null>(null);
  const [hiddenNodes, setHiddenNodes] = useState<Set<string>>(new Set());
  const [showOrphans, setShowOrphans] = useState(true);
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedNode, setSearchedNode] = useState<any | null>(null);
  const [hoverLevel, setHoverLevel] = useState(1);
  const [colorGroups, setColorGroups] = useState({ showPinned: true });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTagsOpen, setIsTagsOpen] = useState(false);

  // --- NUOVI STATI PER L'ANIMAZIONE ---
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationTime, setAnimationTime] = useState<number | null>(null); // null = Vista "Live"
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [animationSpeed, setAnimationSpeed] = useState(1); // 1x
  
  const searchRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);

  useClickOutside(searchRef, () => setIsSearchOpen(false));
  useClickOutside(settingsRef, () => setIsSettingsOpen(false));
  useClickOutside(tagsRef, () => setIsTagsOpen(false));

  // Memo: Dati grezzi (invariato)
  // Ora include 'createdAt' dal backend
  const graphData = useMemo(() => {
    if (!graphDataQuery) return { nodes: [], links: [] };
    return {
      nodes: graphDataQuery.nodes,
      links: graphDataQuery.links,
    };
  }, [graphDataQuery]);

  // --- NUOVO MEMO: TIME RANGE ---
// --- MEMO: TIME RANGE (MODIFICATO PER GESTIRE STATO DI CARICAMENTO) ---
  const [minTime, maxTime] = useMemo(() => {
    // 1. Aspetta che la query finisca
    if (graphDataQuery === undefined) {
      return [null, null];
    }
    
    // 2. Usa i dati memoizzati
    if (!graphData || graphData.nodes.length === 0) {
      return [null, null]; // Nessun dato
    }
    
    // 3. Filtra solo per timestamp REALI (escludi undefined, NaN, 0)
    const allTimes = [
      ...graphData.nodes.map(n => n.createdAt),
      ...graphData.links.map(l => l.createdAt)
    ].filter(t => typeof t === 'number' && !isNaN(t) && t > 0);

    if (allTimes.length === 0) {
      return [null, null]; // I dati esistono, ma non hanno timestamp validi
    }
    
    const min = Math.min(...allTimes);
    const max = Math.max(...allTimes);
    
    // 4. Gestisci il caso limite in cui c'è un solo elemento (min === max)
    if (min === max) {
      // Dà allo slider un piccolo range per funzionare
      return [min - 1000, max]; 
    }
    
    return [min, max];
  }, [graphDataQuery, graphData]); // <-- Aggiungi graphDataQuery come dipendenza

  // --- NUOVO EFFECT: Imposta l'animationTime iniziale (opzionale) ---
  // Questo imposta lo slider all'inizio quando si caricano i dati.
  // Commentalo se preferisci iniziare dalla vista "Live" (animationTime: null)
  useEffect(() => {
    if (minTime > 0 && animationTime === null) {
      // Inizializza a null per la vista Live di default
      // setAnimationTime(minTime); // Decommenta per iniziare dall'inizio
    }
  }, [minTime, animationTime]);


  // Memo: Mappa Colori Tag (invariato)
  const tagColorNameMap = useMemo(() => {
    if (!allTagsList) return new Map<string, string>();
    return new Map(allTagsList.map(tag => [tag.name, tag.color]));
  }, [allTagsList]);

  // Memo: Mappa di vicinanza (invariato)
  const neighborMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    if (!graphData) return map;
    for (const link of graphData.links) {
      const sourceId = (link.source as any).id || link.source;
      const targetId = (link.target as any).id || link.target;
      if (!map.has(sourceId)) map.set(sourceId, new Set());
      if (!map.has(targetId)) map.set(targetId, new Set());
      map.get(sourceId)!.add(targetId);
      map.get(targetId)!.add(sourceId);
    }
    return map;
  }, [graphData]);
  
  // Memo: Mappa di highlighting (invariato)
  const highlightMap = useMemo(() => {
    const highlightedIds = new Set<string>();
    if (!hoveredNode) return highlightedIds;
    const queue: { id: string; level: number }[] = [{ id: hoveredNode.id, level: 0 }];
    const visited = new Set<string>([hoveredNode.id]);
    highlightedIds.add(hoveredNode.id);
    while (queue.length > 0) {
      const { id: currentId, level: currentLevel } = queue.shift()!;
      if (currentLevel >= hoverLevel) continue;
      const neighbors = neighborMap.get(currentId) || new Set();
      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          highlightedIds.add(neighborId);
          queue.push({ id: neighborId, level: currentLevel + 1 });
        }
      }
    }
    return highlightedIds;
  }, [hoveredNode, hoverLevel, neighborMap]);


  // Memo: Dati Filtrati (MODIFICATO per Animazione)
  const filteredGraphData = useMemo(() => {
    const { nodes, links } = graphData;

    let visibleNodes;
    let visibleLinks;

    if (animationTime === null) {
      // --- VISTA LIVE (Logica precedente) ---
      visibleNodes = nodes.filter(node => {
        if (hiddenNodes.has(node.id)) return false;
        if (!showOrphans && node.linkCount === 0) return false;
        if (activeTags.size > 0) {
          if (!node.tags || node.tags.length === 0) return false;
          if (!node.tags.some((tag: string) => activeTags.has(tag))) return false;
        }
        return true;
      });
      
      const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
      
      visibleLinks = links.filter(link => {
        const sourceId = (link.source as any).id || link.source;
        const targetId = (link.target as any).id || link.target;
        return visibleNodeIds.has(sourceId) && visibleNodeIds.has(targetId);
      });

    } else {
      // --- VISTA ANIMAZIONE (Nuova logica temporale) ---
      // Filtra nodi e link basati sul tempo
      // Nota: i filtri (orphans, tags) sono disabilitati durante l'animazione
      // per semplicità, ma potrebbero essere combinati se necessario.
      
      visibleNodes = nodes.filter(node => 
        node.createdAt <= animationTime && !hiddenNodes.has(node.id)
      );
      
      const timeVisibleNodeIds = new Set(visibleNodes.map(n => n.id));
      
      visibleLinks = links.filter(link => {
         const sourceId = (link.source as any).id || link.source;
         const targetId = (link.target as any).id || link.target;
         return (
           link.createdAt <= animationTime &&
           timeVisibleNodeIds.has(sourceId) &&
           timeVisibleNodeIds.has(targetId)
         );
      });
    }

    return { nodes: visibleNodes, links: visibleLinks };

  }, [graphData, hiddenNodes, showOrphans, activeTags, animationTime]); // <-- AGGIUNTA DIPENDENZA


  // Effect: Chiude menu e pop-over (invariato)
  useEffect(() => {
    setContextMenu(null);
    setIsSearchOpen(false);
    setIsSettingsOpen(false);
    setIsTagsOpen(false);
  }, [filteredGraphData]);


  // --- NUOVO EFFECT: LOGICA ANIMAZIONE ---
  useEffect(() => {
    if (isAnimating) {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
      animationIntervalRef.current = setInterval(() => {
        setAnimationTime(currentTime => {
          if (currentTime === null || currentTime >= maxTime) {
            setIsAnimating(false); // Ferma alla fine
            return maxTime;
          }
          // Calcola step. Es: 1/500 del range totale per frame * velocità
          const step = (maxTime - minTime) / 500 * animationSpeed; 
          return Math.min(currentTime + step, maxTime);
        });
      }, 50); // Aggiorna 20 volte/sec
    } else {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
        animationIntervalRef.current = null;
      }
    }
    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    };
  }, [isAnimating, minTime, maxTime, animationSpeed]);


  // Handler: Click e Navigazione (Invariati)
  const handleNodeClick = useCallback(
    (node: any) => {
      onSelectPage(node.id as string);
      onClose();
    },
    [onSelectPage, onClose]
  );

  const centerGraph = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.zoomToFit?.(400, 40); 
    }
  }, []);

  // Handler Menu Contestuale (Invariati)
  const handleNodeRightClick = useCallback((node: any, event: MouseEvent) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, node });
  }, []);

  const handlePinToggle = (node: any) => {
    if (node.fx !== undefined && node.fy !== undefined) {
      node.fx = undefined; 
      node.fy = undefined;
    } else {
      node.fx = node.x; 
      node.fy = node.y;
    }
    graphRef.current?.d3ReheatSimulation(); 
  };

  const handleHideNode = (node: any) => {
    setHiddenNodes(prev => new Set(prev).add(node.id));
  };

  const handleCopyLink = (node: any) => {
    navigator.clipboard.writeText(`${window.location.origin}#${node.id}`);
  };

  // Handler Filtri (Invariati)
  const handleToggleTag = (tagName: string) => {
    setActiveTags(prev => {
      const newTags = new Set(prev);
      if (newTags.has(tagName)) {
        newTags.delete(tagName);
      } else {
        newTags.add(tagName);
      }
      return newTags;
    });
  };

  const handleSearch = () => {
    if (!searchQuery) {
      setSearchedNode(null);
      centerGraph();
      return;
    }
    // Cerca nei dati *attualmente filtrati* (temporali o live)
    const node = filteredGraphData.nodes.find(n => 
      n.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (node) {
      setSearchedNode(node);
      graphRef.current?.centerAt(node.x, node.y, 1000);
      graphRef.current?.zoom(8, 1000);
      setIsSearchOpen(false);
    } else {
      setSearchedNode(null);
    }
  };

  useEffect(() => {
    setSearchedNode(null);
  }, [filteredGraphData]);


  // --- FUNZIONE DISEGNO NODO (Invariata) ---
  const drawNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.label || '';
    const fontSize = 12 / globalScale;
    ctx.font = `${fontSize}px Sans-Serif`;

    // 1. Calcolo Opacità
    const isSearched = node.id === searchedNode?.id;
    const isHighlighted = highlightMap.has(node.id); 
    // Controlla i tag attivi *solo se non stiamo animando*
    const isFiltered = (animationTime !== null) || activeTags.size === 0 || node.tags?.some((tag: string) => activeTags.has(tag));
    
    let opacity = 1.0;
    if (searchedNode && !isSearched) opacity = 0.05;
    else if (hoveredNode && !isHighlighted) opacity = 0.1; 
    else if (animationTime === null && activeTags.size > 0 && !isFiltered) opacity = 0.05; // Filtro tag solo in Live

    // 2. Calcolo dimensione
    const baseRadius = 2;
    const size = baseRadius + (node.linkCount || 0) * 0.5;
    const nodeRadius = Math.min(size, 15) / globalScale;

    // 3. Calcolo colore
    let colorRgb: string; 
    if (isSearched) {
      colorRgb = SEARCHED_NODE_COLOR;
    } else if (colorGroups.showPinned && node.isPinned) {
      colorRgb = PINNED_NODE_COLOR;
    } 
    else if (node.tags && node.tags.length > 0) {
      const firstTagName = node.tags[0];
      const colorName = tagColorNameMap.get(firstTagName) || 'gray';
      colorRgb = CANVAS_COLOR_MAP[colorName] || CANVAS_COLOR_MAP.gray;
    } 
    else {
      colorRgb = CANVAS_COLOR_MAP.gray;
    }
    
    const fillStyle = `rgba(${colorRgb}, ${opacity * 0.9})`;

    // Disegna il cerchio
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI, false);
    ctx.fill();

    // Disegna testo
    if (opacity > 0.3 && (globalScale > 1.5 || isHighlighted || isSearched)) {
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.8})`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, node.x + nodeRadius + 2, node.y);
    }
  }, [highlightMap, activeTags, colorGroups, tagColorNameMap, searchedNode, hoveredNode, animationTime]); // <-- AGGIUNTA DIPENDENZA


  // --- FUNZIONE DISEGNO LINK (Invariata) ---
  const drawLink = useCallback((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const start = link.source;
    const end = link.target;
    if (typeof start !== 'object' || typeof end !== 'object') return;
    
    const isSearched = start.id === searchedNode?.id || end.id === searchedNode?.id;
    const isHighlighted = highlightMap.has(start.id) && highlightMap.has(end.id);
    const isFiltered = (animationTime !== null) || activeTags.size === 0 || 
      (start.tags?.some((t: string) => activeTags.has(t)) && 
       end.tags?.some((t: string) => activeTags.has(t)));
       
    let opacity = 0.3;
    if (isSearched || isHighlighted) opacity = 0.6;
    if (searchedNode && !isSearched) opacity = 0.02;
    else if (hoveredNode && !isHighlighted) opacity = 0.05;
    else if (animationTime === null && activeTags.size > 0 && !isFiltered) opacity = 0.02; // Filtro tag solo in Live
    
    if (opacity <= 0.02) return;
    
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const perpLength = Math.sqrt(dx * dx + dy * dy);
    const normPerpX = -dy / perpLength;
    const normPerpY = dx / perpLength;
    const lateralOffset = perpLength * 0.2;
    const control1X = start.x + dx * 0.25 + normPerpX * lateralOffset;
    const control1Y = start.y + dy * 0.25 + normPerpY * lateralOffset;
    const control2X = start.x + dx * 0.75 - normPerpX * lateralOffset;
    const control2Y = start.y + dy * 0.75 - normPerpY * lateralOffset;
    ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.lineWidth = 1 / globalScale;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.bezierCurveTo(control1X, control1Y, control2X, control2Y, end.x, end.y);
    ctx.stroke();
    
    if (opacity > 0.1) {
      const arrowLength = 8 / globalScale;
      const arrowAngle = Math.PI / 6;
      const t = 0.95; 
      const mt = 1 - t;
      const midX = mt * mt * mt * start.x + 3 * mt * mt * t * control1X + 3 * mt * t * t * control2X + t * t * t * end.x;
      const midY = mt * mt * mt * start.y + 3 * mt * mt * t * control1Y + 3 * mt * t * t * control2Y + t * t * t * end.y;
      const angle = Math.atan2(end.y - midY, end.x - midX);
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(end.x - arrowLength * Math.cos(angle - arrowAngle), end.y - arrowLength * Math.sin(angle - arrowAngle));
      ctx.lineTo(end.x - arrowLength * Math.cos(angle + arrowAngle), end.y - arrowLength * Math.sin(angle + arrowAngle));
      ctx.closePath();
      ctx.fill();
    }
  }, [highlightMap, activeTags, searchedNode, hoveredNode, animationTime]); // <-- AGGIUNTA DIPENDENZA

  
  // --- NUOVO COMPONENTE: CONTROLLI ANIMAZIONE ---
  const AnimationControls = () => {
    // Non renderizzare i controlli se i tempi non sono stati ancora calcolati.
    if (minTime === null || maxTime === null) {
      return null;
    }
    // Non mostrare se il grafo è vuoto o in caricamento
    if (graphDataQuery === undefined || graphData.nodes.length === 0) {
      return null; 
    }

    // Resetta l'animazione e torna alla vista normale "Live"
    const handleResetAnimation = () => {
      setIsAnimating(false);
      setAnimationTime(null); // 'null' torna alla vista non filtrata
    };

    // Avvia l'animazione dall'inizio (o riprende se in pausa)
    const handleTogglePlay = () => {
      if (isAnimating) {
        setIsAnimating(false); // Pausa
      } else {
        // Se siamo alla fine o in "Live", riparti dall'inizio
        if (animationTime === maxTime || animationTime === null) {
          setAnimationTime(minTime);
        }
        setIsAnimating(true); // Play
      }
    };
    
    // Formatta la data per lo slider
    const formatDate = (timestamp: number | null) => {
       if (timestamp === null) return "Live";
       
       const date = new Date(timestamp);
       
       // Controlla se la data è valida
       if (isNaN(date.getTime())) {
         // Se il timestamp non è valido (es. NaN),
         // ritorna "Live" invece di "Invalid Date"
         return "Live"; 
       }
       
       return date.toLocaleDateString();
    };

    const currentDisplayTime = animationTime ?? maxTime;

    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-2 bg-notion-sidebar-dark border border-notion-border-dark rounded-lg shadow-2xl p-2 text-notion-text-dark">
        {/* Pulsante Play/Pause */}
        <button
          onClick={handleTogglePlay}
          className="p-2 rounded-md hover:bg-notion-hover-dark"
          title={isAnimating ? "Pausa" : "Play (dall'inizio)"}
        >
          {isAnimating ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
        </button>

        {/* Pulsante Reset (torna a "Live") */}
        <button
          onClick={handleResetAnimation}
          disabled={animationTime === null} // Disabilitato se già in "Live"
          className="p-2 rounded-md hover:bg-notion-hover-dark disabled:opacity-30"
          title="Resetta (Vista Live)"
        >
          <XIcon className="w-5 h-5" />
        </button>
        
        {/* Slider del Tempo */}
        <input
          type="range"
          min={minTime}
          max={maxTime}
          value={currentDisplayTime}
          onChange={(e) => {
            setIsAnimating(false); // Stoppa l'animazione se si muove lo slider
            setAnimationTime(Number(e.target.value));
          }}
          className="w-56 md:w-64 h-2 bg-notion-bg-dark rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        
        {/* Data Corrente */}
        <span className="text-xs w-20 text-center text-notion-text-gray-dark">
          {formatDate(animationTime)}
        </span>
      </div>
    );
  };


  // --- Render (Invariato, usa la nuova barra UI) ---
  if (!isOpen) return null;
  
  // Calcola se i filtri (non temporali) sono attivi
  const hasActiveFilters = (activeTags.size > 0 || !showOrphans) && animationTime === null;

  return (
    <div className="fixed inset-0 z-40 bg-notion-bg-dark/100 flex flex-col">
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.75) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />
      
      {contextMenu && (
        <ContextMenu
          menu={contextMenu}
          onClose={() => setContextMenu(null)}
          onPinToggle={handlePinToggle}
          onHide={handleHideNode}
          onCopyLink={handleCopyLink}
        />
      )}

      {/* Contenitore principale per il grafo e gli stati di caricamento */}
      <div className="flex-1 relative">
        {graphDataQuery === undefined ? (
          // Stato di Caricamento
          <div className="absolute inset-0 flex items-center justify-center">
            <RefreshCwIcon className="w-8 h-8 text-notion-text-dark animate-spin" />
          </div>
        ) : graphData.nodes.length === 0 ? (
          // Stato Vuoto
          <div className="absolute inset-0 flex items-center justify-center">
             <p className="text-notion-text-gray-dark">Nessuna pagina, nessuna connessione. Inizia a scrivere!</p>
          </div>
        ) : (
          // Grafo
          <ForceGraph2D
            ref={graphRef}
            graphData={filteredGraphData} // <-- USA I DATI FILTRATI (TEMPORALI O LIVE)
            backgroundColor="rgba(0,0,0,0)"
            onEngineStop={() => centerGraph()}
            nodeRelSize={undefined}
            onNodeHover={setHoveredNode}
            onNodeClick={handleNodeClick}
            onNodeRightClick={handleNodeRightClick}
            onNodeDragEnd={(node: any) => {
              node.fx = node.x;
              node.fy = node.y;
            }}
            nodeCanvasObject={drawNode}
            nodeCanvasObjectMode={() => 'replace'}
            linkCanvasObject={drawLink}
            linkCanvasObjectMode={() => 'replace'}
            cooldownTicks={100}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
            onNodeDragStart={() => setContextMenu(null)}
            onZoom={() => setContextMenu(null)}
            onBackgroundClick={() => setContextMenu(null)}
          />
        )}
      </div>

      {/* === NUOVA BARRA ANIMAZIONE === */}
      <AnimationControls />

      {/* --- BARRA DI CONTROLLO IN BASSO --- */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-1 bg-notion-sidebar-dark border border-notion-border-dark rounded-lg shadow-2xl p-1 text-notion-text-dark">
        
        {/* Gruppo 1: Filtri e Ricerca (Disabilitati durante l'animazione) */}
        <div ref={searchRef} className="relative">
          <button
            onClick={() => setIsSearchOpen(s => !s)}
            disabled={animationTime !== null} // <-- Disabilita
            className={`p-2 rounded-md ${isSearchOpen ? 'bg-blue-600 text-white' : 'hover:bg-notion-hover-dark'} disabled:opacity-30`}
            title="Cerca"
          >
            <SearchIcon className="w-5 h-5" />
          </button>
          {isSearchOpen && (
            <SearchPopover
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSearch={handleSearch}
            />
          )}
        </div>
        <div ref={settingsRef} className="relative">
          <button
            onClick={() => setIsSettingsOpen(s => !s)}
            disabled={animationTime !== null} // <-- Disabilita
            className={`p-2 rounded-md ${isSettingsOpen ? 'bg-blue-600 text-white' : 'hover:bg-notion-hover-dark'} disabled:opacity-30`}
            title="Impostazioni"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
          {isSettingsOpen && (
            <SettingsPopover
              hoverLevel={hoverLevel}
              onHoverLevelChange={setHoverLevel}
              colorGroups={colorGroups}
              onToggleShowPinned={() => setColorGroups(prev => ({ ...prev, showPinned: !prev.showPinned }))}
              showOrphans={showOrphans}
              onToggleShowOrphans={() => setShowOrphans(prev => !prev)}
            />
          )}
        </div>
        <div ref={tagsRef} className="relative">
          <button
            onClick={() => setIsTagsOpen(s => !s)}
            disabled={animationTime !== null} // <-- Disabilita
            className={`p-2 rounded-md relative ${isTagsOpen ? 'bg-blue-600 text-white' : 'hover:bg-notion-hover-dark'} disabled:opacity-30`}
            title="Filtra per Tag"
          >
            <Tag className="w-5 h-5" />
            {hasActiveFilters && ( // Mostra pallino solo se filtri live sono attivi
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-blue-400 ring-2 ring-notion-sidebar-dark" />
            )}
          </button>
          {isTagsOpen && (
            <TagsPopover
              allTags={allTagsList}
              activeTags={activeTags}
              onToggleTag={handleToggleTag}
              onClearTags={() => setActiveTags(new Set())}
            />
          )}
        </div>

        {/* Separatore */}
        <div className="h-6 w-px bg-notion-border-dark mx-1"></div>

        {/* Gruppo 2: Azioni Grafo (Sempre attive) */}
        <button
          onClick={centerGraph}
          className="p-2 rounded-md hover:bg-notion-hover-dark"
          title="Centra Grafo"
        >
          <RefreshCwIcon className="w-5 h-5" />
        </button>
        
        {/* Separatore */}
        <div className="h-6 w-px bg-notion-border-dark mx-1"></div>
        
        {/* Gruppo 3: Uscita (Sempre attiva) */}
        <button
          onClick={onClose}
          className="p-2 rounded-md hover:bg-notion-hover-dark"
          title="Chiudi Grafo"
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};