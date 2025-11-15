// File: src/App.tsx (SOSTITUZIONE COMPLETA)

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useConvexAuth, useQuery, useMutation, useConvex } from 'convex/react';
import { SignInButton, UserButton } from '@clerk/clerk-react';
import { api } from './convex/_generated/api';
import type { Doc, Id } from './convex/_generated/dataModel';
import { Sidebar } from './components/Sidebar';
import { Editor, type EditorHandle } from './components/Editor';
import { AiSidebar } from './components/AiSidebar';
import { BreadcrumbNav, type SaveStatus } from './components/BreadcrumbNav';
import { AddPageIcon, XIcon } from './components/icons'; 
import { debounce } from 'lodash';
import { compare } from 'fast-json-patch';
import { SpotlightSearch } from './components/SpotlightSearch';
import { GraphView } from './components/GraphView';
import { FlowView } from './components/FlowView';
import { TasksView } from './components/TasksView';
// --- INIZIO NUOVI IMPORT ---
import { FlashcardDashboard } from './components/FlashcardDashboard';
import { ReviewView } from './components/ReviewView';
// --- FINE NUOVI IMPORT ---
import { MobileDrawerProvider } from './context/MobileDrawerContext';
export type Page = Doc<"pages">;


// --- Funzioni di supporto (invariate) ---
function getTextFromNode(node: any): string {
  if (!node) return '';
  if (node.type === 'text') return node.text || '';
  if (!node.content) return '';
  return node.content.map(getTextFromNode).join('');
}

function getNodePreview(node: any): string {
  const text = getTextFromNode(node).trim();
  if (!text) return "Blocco vuoto";
  const words = text.split(/\s+/);
  const previewText = words.slice(0, 3).join(' ');
  return words.length > 3 ? `${previewText}...` : previewText;
}

const Spinner = () => (
    <div className="flex items-center justify-center h-full w-full">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-500"></div>
    </div>
);

const LandingPage = () => (
    <main className="flex flex-col items-center justify-center h-screen bg-notion-bg dark:bg-notion-bg-dark text-notion-text dark:text-notion-text-dark">
        <div className="text-center p-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to Your Notion Clone</h1>
            <p className="text-lg text-notion-text-gray dark:text-notion-text-gray-dark mb-8">
                Log in or sign up to start organizing your thoughts.
            </p>
            <SignInButton mode="modal">
                <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-transform transform hover:scale-105">
                    Get Started
                </button>
            </SignInButton>
        </div>
    </main>
);

export default function App() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const convex = useConvex();
  const pages = useQuery(api.pages.getSidebar, !isAuthenticated ? "skip" : undefined);
  const allPagesMetadata = useQuery(api.pages.getAllMetadata, !isAuthenticated ? "skip" : undefined);

  const createPage = useMutation(api.pages.create);
  const updatePageMutation = useMutation(api.pages.update);
  const archivePage = useMutation(api.pages.archive);
  const patchContentMutation = useMutation(api.pages.patchContent);
  
  const lastSavedContent = useRef<any>(null);
  const lastSavedPageId = useRef<string | null>(null);
  
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("Idle");
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [lastModified, setLastModified] = useState<number | null>(null); 
  const saveStatusTimer = useRef<number | null>(null);
  
  const dirtyPage = useRef<{ pageId: string, content: any } | null>(null);
  
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);

  const [activePageId, setActivePageId] = useState<string | null>(null);
  const activePageIdRef = useRef(activePageId);
  const [scrollToBlockId, setScrollToBlockId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('notion-clone-theme') || 'dark';
  });

  const [splitViewPage, setSplitViewPage] = useState<{ pageId: string, blockId: string | null } | null>(null);
  const [isGraphViewOpen, setIsGraphViewOpen] = useState(false);

  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  // --- INIZIO MODIFICA STATO AI ---
  const [aiInitialText, setAiInitialText] = useState("");
  const [aiInitialFlashcard, setAiInitialFlashcard] = useState<{q: string, a: string} | null>(null);
  const [aiFlashcardContext, setAiFlashcardContext] = useState<{pageId: string, blockId: string | null} | null>(null);
  // --- FINE MODIFICA STATO AI ---
  
  const editorRef = useRef<EditorHandle>(null); 
  const layoutRef = useRef<HTMLDivElement>(null); 
  const mainPanelRef = useRef<HTMLElement>(null); 

  const [isFlowViewOpen, setIsFlowViewOpen] = useState(false);
  const [flowViewPageId, setFlowViewPageId] = useState<string | null>(null);

  const [isTasksViewOpen, setIsTasksViewOpen] = useState(false);

  // --- INIZIO NUOVA SEZIONE: Stati Flashcard ---
  const [isFlashcardDashboardOpen, setIsFlashcardDashboardOpen] = useState(false);
  const [isReviewSessionOpen, setIsReviewSessionOpen] = useState(false);
  const [reviewSessionDeckId, setReviewSessionDeckId] = useState<string | null>(null);
  const [reviewSessionDeckType, setReviewSessionDeckType] = useState<'page' | 'tag'>('page');
  // --- FINE NUOVA SEZIONE ---

  const [mainPanelWidth, setMainPanelWidth] = useState(75); 


  const activePageContentString = useQuery(
    api.pages.getContent,
    activePageId ? { pageId: activePageId as Id<"pages"> } : "skip"
  );
  
  const splitPageContentString = useQuery(
    api.pages.getContent,
    splitViewPage ? { pageId: splitViewPage.pageId as Id<"pages"> } : "skip"
  );

  // ... (Tutta la logica di useEffect, useMemo, saveContent, handleContentChange, handleSaveNow... rimane INVARIATA) ...

  useEffect(() => {
      if (activePageContentString !== undefined && activePageId) {
         if (activePageIdRef.current !== activePageId) {
           return;
         }
         setLastSaveTime(new Date()); 
         setLastModified(null);
         try {
           lastSavedContent.current = JSON.parse(activePageContentString || "{}");
           lastSavedPageId.current = activePageId; 
         } catch(e) {
           lastSavedContent.current = {};
           lastSavedPageId.current = activePageId; 
         }
      }
  }, [activePageContentString, activePageId]);

  useEffect(() => {
    activePageIdRef.current = activePageId;
  }, [activePageId]);

  const activePageContent = useMemo(() => {
    if (activePageContentString === undefined) return undefined; 
    if (activePageContentString === "") return null; 
    try {
      return JSON.parse(activePageContentString);
    } catch (e) { 
      console.error("Failed to parse active content", e);
      return null; 
    }
  }, [activePageContentString]);

  const splitPageContent = useMemo(() => {
    if (splitPageContentString === undefined) return undefined;
    if (splitPageContentString === "") return null;
    try {
      return JSON.parse(splitPageContentString);
    } catch (e) { 
      console.error("Failed to parse split content", e);
      return null;
    }
  }, [splitPageContentString]);


  const pageTitlesMap = useMemo(() => {
    if (!allPagesMetadata) return new Map<string, string>();
    return new Map(allPagesMetadata.map(page => [page._id, page.title || 'Untitled']));
  }, [allPagesMetadata]);

  const blockPreviewsMap = useMemo(() => {
    if (!allPagesMetadata) return new Map<string, string>();
    return new Map<string, string>();
  }, [allPagesMetadata]);


  const saveContent = useCallback((pageId: Id<'pages'>, content: any): Promise<void> => {
    if (saveStatusTimer.current) {
        clearTimeout(saveStatusTimer.current);
    }
    setSaveStatus("Saving");

    const baseContent = (lastSavedPageId.current === pageId) 
      ? lastSavedContent.current 
      : {}; 
    
    const patch = compare(baseContent || {}, content);

    if (patch.length === 0) {
        setSaveStatus("Saved");
        setLastSaveTime(new Date());
        lastSavedPageId.current = pageId; 
        dirtyPage.current = null;
        setLastModified(null);
        saveStatusTimer.current = window.setTimeout(() => setSaveStatus("Idle"), 2000);
        return Promise.resolve();
    }

    return patchContentMutation({ 
        id: pageId, 
        patch: JSON.stringify(patch)
    }).then(() => {
        setSaveStatus("Saved");
        setLastSaveTime(new Date());
        lastSavedContent.current = content;
        lastSavedPageId.current = pageId; 
        dirtyPage.current = null;
        setLastModified(null);
        saveStatusTimer.current = window.setTimeout(() => setSaveStatus("Idle"), 2000);
    }).catch((error) => {
        console.error("Save failed", error);
        setSaveStatus("Idle");
        throw error;
    });
  }, [patchContentMutation]);

  const debouncedSaveRef = useRef(
    debounce(saveContent, 15000)
  );

  const handleContentChange = (pageId: Id<'pages'>, content: any) => {
    if (saveStatusTimer.current) {
        clearTimeout(saveStatusTimer.current);
    }
    setSaveStatus("Dirty");
    setLastModified(Date.now()); 
    dirtyPage.current = { pageId, content };
    debouncedSaveRef.current(pageId, content);
  };

  const handleSaveNow = (): Promise<void> => {
    debouncedSaveRef.current.cancel(); 
    
    if (saveStatus !== 'Dirty' || !dirtyPage.current) {
       return Promise.resolve();
    }
    
    const { pageId, content } = dirtyPage.current;
    
    return saveContent(pageId as Id<'pages'>, content);
  };

  // --- GESTIONE PANNELLI (MODIFICATA) ---

  const closeAllPanels = () => {
    setIsGraphViewOpen(false);
    setIsFlowViewOpen(false);
    setSplitViewPage(null);
    setIsAiPanelOpen(false);
    setIsTasksViewOpen(false);
    setIsFlashcardDashboardOpen(false);
    setIsReviewSessionOpen(false);
  }

  const handleOpenTasksView = () => {
    closeAllPanels();
    setIsTasksViewOpen(true);
  };

  // --- INIZIO NUOVA SEZIONE: Gestori Flashcard ---
  const handleOpenFlashcardDashboard = () => {
    closeAllPanels();
    setIsFlashcardDashboardOpen(true);
  };

  const handleStartReview = (deckId: string, type: 'page' | 'tag') => {
    closeAllPanels();
    setReviewSessionDeckId(deckId);
    setReviewSessionDeckType(type);
    setIsReviewSessionOpen(true); // Apre la vista di revisione
  };

  const handleCloseReview = () => {
    setIsReviewSessionOpen(false);
    setReviewSessionDeckId(null);
    setIsFlashcardDashboardOpen(true); // Ritorna alla dashboard
  };
  // --- FINE NUOVA SEZIONE ---

  const handleOpenAiPanel = (initialText: string = "") => {
    const editor = editorRef.current?.getEditor();
    if (!editor && !initialText) return;
    
    let selectedText = initialText;
    if (!selectedText && editor) {
        const { from, to } = editor.state.selection;
        selectedText = editor.state.doc.textBetween(from, to).trim();
    }
    
    closeAllPanels();
    setAiInitialText(selectedText || "");
    setIsAiPanelOpen(true);
    setIsSidebarOpen(false); 
    
    setAiInitialFlashcard(null);
    setAiFlashcardContext(null);
  };
  
  // --- NUOVA FUNZIONE: Apertura creatore Flashcard AI ---
  const handleOpenFlashcardCreator = (
    generatedCard: {q: string, a: string},
    pageId: string,
    blockId: string | null
  ) => {
    closeAllPanels();
    setAiInitialFlashcard(generatedCard); // Imposta la card
    setAiFlashcardContext({ pageId, blockId }); // Salva il contesto
    
    setAiInitialText(""); // Non serve testo selezionato
    setIsAiPanelOpen(true);
    setIsSidebarOpen(false); 
  };
  // --- FINE NUOVA FUNZIONE ---

  const handleCloseAiPanel = () => {
    setIsAiPanelOpen(false);
    setAiInitialText(""); 
    setAiInitialFlashcard(null);
    setAiFlashcardContext(null);
  };

  const handleOpenInSplitView = async (pageId: string, blockId: string | null = null) => {
    if (saveStatus === 'Dirty') {
       await handleSaveNow();
    }
    closeAllPanels();
    setSplitViewPage({ pageId, blockId });
    setIsSidebarOpen(false); 
    // Non chiudere la Review Session, così da poterla avere affiancata
    //setIsReviewSessionOpen(false); // La review non può avere uno split
  };

  const handleOpenFlowAndEditor = async (pageId: string) => {
    if (saveStatus === 'Dirty') {
      await handleSaveNow();
    }
    closeAllPanels();
    setFlowViewPageId(pageId);
    setIsFlowViewOpen(true);
    setSplitViewPage({ pageId: pageId, blockId: null });
    setIsSidebarOpen(false); 
  };

  const handleCloseSplitView = () => {
    setSplitViewPage(null);
  };

  const handleSelectPage = async (pageId: string | null) => { 
    if (saveStatus === 'Dirty') {
       await handleSaveNow();
    }
    closeAllPanels();
    setActivePageId(pageId);
    setScrollToBlockId(null);
    
    if (pageId) {
      window.history.pushState(null, '', `#${pageId}`);
    } else {
      window.history.pushState(null, '', `#`);
    }
  };

  const handleSelectBlock = async (pageId: string, blockId: string) => {
    if (saveStatus === 'Dirty') {
       await handleSaveNow();
    }
    
    closeAllPanels();
    
    if (pageId === activePageId) {
      setScrollToBlockId(blockId);
    } else {
      setActivePageId(pageId);
      setScrollToBlockId(blockId);
    }
    window.history.pushState(null, '', `#${pageId}:${blockId}`);
  };

  // --- (Logica di ridimensionamento e useEffect vari invariati) ---
  
  const isSidePanelOpen = !!splitViewPage || isAiPanelOpen;

  const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      const startX = e.clientX;
      const startMainWidth = mainPanelRef.current!.offsetWidth;
      const containerWidth = layoutRef.current!.offsetWidth;
      const handleMouseMove = (me: MouseEvent) => {
          const dx = me.clientX - startX;
          let newMainWidth = startMainWidth + dx;
          let newMainPercent = (newMainWidth / containerWidth) * 100;
          newMainPercent = Math.max(25, Math.min(85, newMainPercent)); 
          setMainPanelWidth(newMainPercent);
      };
      const handleMouseUp = () => {
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
      };
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
      if (!isSidePanelOpen) {
          setMainPanelWidth(75);
      }
  }, [isSidePanelOpen]);

  useEffect(() => {
    if (pages && pages.length > 0 && !activePageId) {
        const firstPage = pages.find(p => !p.isArchived);
        if (firstPage) {
            handleSelectPage(firstPage._id);
        }
    }
  }, [pages, activePageId]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'light' ? 'dark' : 'light');
    root.classList.add(theme);
    localStorage.setItem('notion-clone-theme', theme);
  }, [theme]);

  // --- MODIFICA: useEffect per hashchange ---
  useEffect(() => {
    const handleHashChange = () => {
      // Aggiunti tutti i nuovi stati
      if (splitViewPage || isAiPanelOpen || isTasksViewOpen || isFlashcardDashboardOpen || isReviewSessionOpen) return;

      const hash = window.location.hash.substring(1);
      if (!hash) {
        setScrollToBlockId(null);
        if (pages && pages.length > 0 && !activePageId) {
           const firstPage = pages.find(p => !p.isArchived);
           if (firstPage) setActivePageId(firstPage._id);
        }
        return;
      }
      
      const [targetPageId, blockId] = hash.split(':');
      
      if (allPagesMetadata?.some(p => p._id === targetPageId)) {
        if (activePageId !== targetPageId) {
          setActivePageId(targetPageId);
        }
        setScrollToBlockId(blockId || null);
      }
    };
    handleHashChange();
    
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [allPagesMetadata, activePageId, splitViewPage, isAiPanelOpen, pages, isTasksViewOpen, isFlashcardDashboardOpen, isReviewSessionOpen]); // <-- Aggiungi dipendenze
  // --- FINE MODIFICA ---

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setIsSpotlightOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // ... (Tutta la logica 'addPage', 'deletePage', 'updatePageMetadata', 'handleTitleChange', 'activePage', 'splitPage' rimane INVARIATA) ...

  const addPage = useCallback(async (
      parentId: string | null = null, 
      options: { navigate?: boolean, insertLink?: boolean, title?: string } = { navigate: true, insertLink: true }
    ): Promise<Page | undefined> => {
    
    const editorInstance = (parentId === activePageId && editorRef.current) 
      ? editorRef.current.getEditor() 
      : null;
      
    const pageIdThatIsParent = parentId; 

    if (!convex) {
      console.error("addPage fallito: il client Convex non è inizializzato.");
      return undefined;
    }

    if (saveStatus === 'Dirty') {
       await handleSaveNow();
    }
    
    const newPageId = await createPage({
        title: options.title || 'Untitled',
        parentPage: pageIdThatIsParent ?? undefined,
    });
    
    if (pageIdThatIsParent && options.insertLink !== false) {
      
      const newLinkNode = { 
        type: 'pageLink', 
        attrs: { pageId: newPageId, title: options.title || 'Untitled' } 
      };
      const paragraphWithLink = {
        type: 'paragraph',
        content: [
          newLinkNode,
          { type: 'text', text: ' ' }
        ]
      };
      const newEmptyParagraphNode = { type: 'paragraph' };

      if (editorInstance) {
        editorInstance.chain().focus().insertContentAt(editorInstance.state.doc.content.size, [
          paragraphWithLink,
          newEmptyParagraphNode
        ]).run();
        
        await saveContent(pageIdThatIsParent as Id<'pages'>, editorInstance.getJSON());
      } 
      else {
        try {
          const parentContentString = await convex.query(api.pages.getContent, { pageId: pageIdThatIsParent as Id<"pages"> });
          
          let parentContent: { type: string, content?: any[] } = { type: 'doc', content: [] };
          if (parentContentString && parentContentString !== "") {
            parentContent = JSON.parse(parentContentString);
          }
          if (!parentContent.content) {
            parentContent.content = [];
          }

          parentContent.content.push(paragraphWithLink);
          parentContent.content.push(newEmptyParagraphNode);

          await updatePageMutation({
            id: pageIdThatIsParent as Id<'pages'>,
            content: JSON.stringify(parentContent)
          });
          
        } catch (e) {
          console.error("Fallimento nell'aggiornare la pagina madre da addPage", e);
        }
      }
    }
    
    if (options.navigate) {
      handleSelectPage(newPageId);
    }
    
     return { 
        _id: newPageId, 
        title: options.title || 'Untitled', 
        parentId: pageIdThatIsParent ?? undefined,
        userId: '', 
        _creationTime: Date.now(),
        isArchived: false,
    } as Page;

  }, [
    createPage, 
    saveStatus, 
    activePageId,
    convex, 
    saveContent,
    updatePageMutation
  ]);


  const deletePage = useCallback((pageId: string) => {
    archivePage({ id: pageId as Id<"pages"> });
    if (activePageId === pageId && pages) {
      const parentId = pages.find(p => p._id === pageId)?.parentId;
      const remainingPages = pages.filter(p => p._id !== pageId && !p.isArchived);
      
      let nextPageId: string | null = null;
      if (parentId && remainingPages.some(p => p._id === parentId)) {
          nextPageId = parentId;
      } else {
          nextPageId = remainingPages.length > 0 ? remainingPages[0]._id : null;
      }
      
      handleSelectPage(nextPageId); 
      setScrollToBlockId(null);
      if(splitViewPage?.pageId === pageId) {
          setSplitViewPage(null); 
      }
    }
  }, [archivePage, activePageId, pages, splitViewPage]); 

  
  const updatePageMetadata = useCallback(async(pageId: string, updates: Partial<Omit<Page, '_id' | 'userId' | '_creationTime'>>) => {
    updatePageMutation({
      id: pageId as Id<"pages">,
      ...updates,
    });
  }, [updatePageMutation]);


  const handleTitleChange = (pageId: Id<'pages'>, title: string) => {
    updatePageMetadata(pageId, { title });
  };
  
  const activePage = useMemo(() => allPagesMetadata?.find((p) => p._id === activePageId), [allPagesMetadata, activePageId]);
  const splitPage = useMemo(() => allPagesMetadata?.find((p) => p._id === splitViewPage?.pageId), [allPagesMetadata, splitViewPage]);


  if (isLoading) {
      return <Spinner />;
    }
  
    if (!isAuthenticated) {
      return <LandingPage />;
    }
  
    if (!convex || pages === undefined || allPagesMetadata === undefined) {
      return (
          <div className="flex items-center justify-center h-screen w-full">
              <Spinner />
          </div>
      );
    }

  return (
    <MobileDrawerProvider>
      <div className="flex h-screen w-full font-sans bg-notion-bg dark:bg-notion-bg-dark text-notion-text dark:text-notion-text-dark transition-colors duration-200 overflow-hidden">
        <>
          <Sidebar
            onAddPage={(parentId) => addPage(parentId, { navigate: true })}
            onDeletePage={deletePage}
            onSelectPage={handleSelectPage}
            onOpenInSplitView={handleOpenInSplitView}
            onUpdatePage={updatePageMetadata} 
            activePageId={activePageId}
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
            theme={theme}
            toggleTheme={toggleTheme}
            onOpenGraphView={() => setIsGraphViewOpen(true)}
            onOpenFlowView={(pageId: string) => {
              setFlowViewPageId(pageId);
              setIsFlowViewOpen(true);
            }}
            onOpenFlowAndEditor={handleOpenFlowAndEditor}
            onOpenTasksView={handleOpenTasksView}
            // --- NUOVA PROP ---
            onOpenFlashcards={handleOpenFlashcardDashboard}
            // --- FINE NUOVA PROP ---
            />

          <div 
            className="flex-1 relative h-full transition-all duration-300 ease-in-out"
            style={{ paddingLeft: isSidebarOpen ? '18rem' : '0' }} 
          >
            <BreadcrumbNav
              pages={allPagesMetadata as Page[]}
              activePageId={activePageId}
              onSelectPage={handleSelectPage}
              onOpenInSplitView={handleOpenInSplitView}
              isSidebarOpen={isSidebarOpen}
              toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              saveStatus={saveStatus}
              lastSaveTime={lastSaveTime}
              onSaveNow={handleSaveNow}
              lastModified={lastModified}
              onOpenSpotlight={() => setIsSpotlightOpen(true)}
            />

            <div ref={layoutRef} className="flex h-full w-full">
              
              <main 
                ref={mainPanelRef}
                className={`h-full ${!isSidePanelOpen ? 'w-full' : 'flex-shrink-0'}`}
                style={{ width: isSidePanelOpen ? `${mainPanelWidth}%` : '100%' }}
              >
                {/* --- MODIFICA LOGICA DI RENDER PRINCIPALE --- */}
                
                {isFlashcardDashboardOpen ? (
                  <FlashcardDashboard
                    onStartReview={handleStartReview}
                    onClose={() => handleSelectPage(activePageId)} // Torna all'editor
                    onSelectPage={handleSelectPage} // Per aprire un mazzo/pagina
                  />
                ) : isReviewSessionOpen && reviewSessionDeckId ? (
                  <ReviewView
                    deckId={reviewSessionDeckId}
                    deckType={reviewSessionDeckType}
                    onClose={handleCloseReview} // Torna alla dashboard
                    onOpenInSplitView={handleOpenInSplitView} // Per il contesto
                  />
                ) : isTasksViewOpen ? (
                  <TasksView
                    onClose={() => handleSelectPage(activePageId)} // Torna all'editor
                    onSelectPage={handleSelectPage}
                    allPages={allPagesMetadata as Page[]}
                  />
                ) : isFlowViewOpen && flowViewPageId ? (
                  <FlowView
                    startPageId={flowViewPageId}
                    onSelectPage={handleSelectPage}
                    onClose={() => {
                      setIsFlowViewOpen(false);
                      setFlowViewPageId(null);
                      setSplitViewPage(null);
                    }}
                    onOpenInSplitView={handleOpenInSplitView}
                    isSplitMode={!!splitViewPage} 
                    onCreateChildPage={async (parentId) => {
                      const newPage = await addPage(parentId, { navigate: false });
                      return newPage?._id;
                    }}
                  />
                ) : activePage && activePageContent !== undefined ? (
                  <Editor
                    ref={editorRef}
                    key={activePage._id}
                    page={activePage}
                    initialContent={activePageContent} 
                    pages={allPagesMetadata as Page[]} 
                    pageTitlesMap={pageTitlesMap}
                    blockPreviewsMap={blockPreviewsMap}
                    onUpdatePage={updatePageMetadata} 
                    onTitleChange={(title) => handleTitleChange(activePage._id, title)}
                    onContentChange={(content) => handleContentChange(activePage._id, content)}
                    onSelectPage={handleSelectPage}
                    onCreateSubPage={(options) => addPage(activePage._id, options)}
                    scrollToBlockId={scrollToBlockId}
                    onDoneScrolling={() => setScrollToBlockId(null)}
                    onSelectBlock={handleSelectBlock}
                    onOpenInSplitView={handleOpenInSplitView}
                    onOpenAiPanel={handleOpenAiPanel}
                    // --- NUOVA PROP PER EDITOR ---
                    onOpenFlashcardCreator={handleOpenFlashcardCreator}
                    // --- FINE NUOVA PROP ---
                    saveStatus={saveStatus}
                    onSaveNow={handleSaveNow}
                    isSplitView={isSidePanelOpen} 
                    isSidebarOpen={isSidebarOpen}
                  />
                ) : activePage ? (
                  <div className="flex items-center justify-center h-full pt-12">
                    <Spinner />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full pt-12 text-notion-text-gray dark:text-notion-text-gray-dark">
                    <h2 className="text-2xl font-semibold mb-4">Nessuna pagina selezionata</h2>
                    <p className="mb-6">Crea una nuova pagina per iniziare.</p>
                    <button
                      onClick={() => addPage(null, { navigate: true })}
                      className="flex items-center px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 dark:bg-notion-hover-dark dark:text-notion-text-dark dark:hover:bg-notion-active-dark transition-colors"
                    >
                      <AddPageIcon className="w-5 h-5 mr-2" />
                      Crea una nuova pagina
                    </button>
                  </div>
                )}
                
                <SpotlightSearch
                  isOpen={isSpotlightOpen}
                  onClose={() => setIsSpotlightOpen(false)}
                  onSelectBlock={handleSelectBlock}
                  onOpenInSplitView={handleOpenInSplitView}
                />
                
                <GraphView
                  isOpen={isGraphViewOpen}
                  onClose={() => setIsGraphViewOpen(false)}
                  onSelectPage={handleSelectPage}
                />
              </main>

              {/* ... (Pannelli laterali invariati) ... */}
              {isSidePanelOpen && (
                <div
                  className="w-2 h-full cursor-col-resize flex-shrink-0 group flex justify-center"
                  onMouseDown={handleMouseDown}
                >
                  <div className="w-0.5 h-full bg-notion-border dark:bg-notion-border-dark group-hover:bg-blue-500 transition-colors duration-200"></div>
                </div>
              )}
              
              {splitViewPage && splitPage && splitPageContent !== undefined && !isAiPanelOpen && (
                <aside 
                  className="h-full flex-shrink-0"
                  style={{ width: `calc(100% - ${mainPanelWidth}%)` }} 
                >
                  <button
                    onClick={handleCloseSplitView}
                    className="absolute top-3 right-3 z-20 p-1.5 rounded-md hover:bg-notion-hover dark:hover:bg-notion-hover-dark"
                    aria-label="Close split panel"
                    style={{ top: '0.8rem', right: '0.8rem' }} 
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                  <Editor
                    key={splitPage._id}
                    page={splitPage}
                    initialContent={splitPageContent}
                    pages={allPagesMetadata as Page[]}
                    pageTitlesMap={pageTitlesMap}
                    blockPreviewsMap={blockPreviewsMap}
                    onUpdatePage={updatePageMetadata}
                    onTitleChange={(title) => handleTitleChange(splitPage._id, title)}
                    onContentChange={(content) => handleContentChange(splitViewPage.pageId as Id<"pages">, content)}
                    onSelectPage={handleSelectPage} 
                    onSelectBlock={handleSelectBlock}
                    onCreateSubPage={(options) => addPage(splitPage._id, options)}
                    scrollToBlockId={splitViewPage.blockId} 
                    onDoneScrolling={() => setSplitViewPage(s => s ? { ...s, blockId: null } : null)}
                    onOpenInSplitView={handleOpenInSplitView}
                    onOpenAiPanel={() => handleOpenAiPanel()}
                    onOpenFlashcardCreator={handleOpenFlashcardCreator} // Passa anche qui
                    saveStatus={saveStatus}
                    onSaveNow={handleSaveNow}
                    isSplitView={isSidePanelOpen}
                    isSidebarOpen={isSidebarOpen}
                  />
                </aside>
              )}
              
              {splitViewPage && !splitPage && !isAiPanelOpen && (
                 <aside 
                    className="h-full flex-shrink-0 relative"
                    style={{ width: `calc(100% - ${mainPanelWidth}%)` }}
                 >
                    <Spinner />
                 </aside>
              )}

              {/* --- MODIFICA PANNELLO AI --- */}
              {isAiPanelOpen && (
                <aside 
                  className="h-full flex-shrink-0 relative" 
                  style={{ width: `calc(100% - ${mainPanelWidth}%)` }} 
                >
                  <button
                    onClick={handleCloseAiPanel}
                    className="absolute top-3 right-3 z-20 p-1.5 rounded-md hover:bg-notion-hover dark:hover:bg-notion-hover-dark"
                    aria-label="Close AI panel"
                    style={{ top: '0.8rem', right: '0.8rem' }} 
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                  
                  <AiSidebar 
                    initialText={aiInitialText} 
                    // --- NUOVE PROP PER AISIDEBAR ---
                    initialFlashcard={aiInitialFlashcard}
                    flashcardContext={aiFlashcardContext}
                    onClose={handleCloseAiPanel} // Per salvare e chiudere
                    // --- FINE NUOVE PROP ---
                  />

                </aside>
              )}
              {/* --- FINE MODIFICA --- */}
              
            </div>
          </div>
        </>
      </div>
    </MobileDrawerProvider>

  );
}