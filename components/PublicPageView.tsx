import React, { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Editor } from './Editor'; // Importa il tuo Editor esistente
import { PageIcon } from './icons';

interface PublicPageViewProps {
  shareId: string;
}

const Spinner = () => (
  <div className="flex items-center justify-center h-full w-full">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-500"></div>
  </div>
);

export const PublicPageView: React.FC<PublicPageViewProps> = ({ shareId }) => {
  // 1. Usa la nuova query pubblica
  const data = useQuery(api.pages.getPublicPageData, { shareId });

  // 2. Parsa il contenuto
  const initialContent = useMemo(() => {
    if (!data?.content) return null;
    try {
      return JSON.parse(data.content);
    } catch (e) {
      return null;
    }
  }, [data?.content]);

  // 3. Crea le mappe necessarie per i link (saranno vuote, ma evitano errori)
  const pageTitlesMap = useMemo(() => new Map<string, string>(), []);
  const blockPreviewsMap = useMemo(() => new Map<string, string>(), []);
  
  // 4. Gestisci gli stati
  if (data === undefined) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (data === null || !initialContent) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center text-notion-text-gray">
        <PageIcon className="w-12 h-12 mb-4" />
        <h1 className="text-2xl font-semibold">Pagina non trovata</h1>
        <p>Questo link potrebbe essere errato o la pagina è stata resa privata.</p>
      </div>
    );
  }

  const { page, subPages } = data;

  // 5. Renderizza l'Editor in modalità Sola Lettura
  return (
    <Editor
      // Dati della pagina
      page={page}
      initialContent={initialContent}
      
      // Prop per la modalità Sola Lettura
      isReadOnly={true}
      
      // Funzioni vuote o di sola navigazione (per i link)
      // (Queste pagine pubbliche non hanno accesso all'app principale)
      onSelectPage={(pageId) => alert(`Navigazione a ${pageId} disabilitata in anteprima.`)}
      onSelectBlock={(pageId, blockId) => alert(`Navigazione a ${pageId}:${blockId} disabilitata.`)}
      onOpenInSplitView={() => {}}
      
      // Passa le sottopagine pubbliche per il componente SubPagesList
      pages={subPages as any} 
      
      // Mappe vuote
      pageTitlesMap={pageTitlesMap}
      blockPreviewsMap={blockPreviewsMap}

      // Funzioni vuote per le azioni di modifica
      onUpdatePage={() => Promise.resolve()}
      onTitleChange={() => {}}
      onContentChange={() => {}}
      onCreateSubPage={() => Promise.resolve(undefined)}
      onOpenAiPanel={() => {}}
      onSaveNow={() => Promise.resolve()}
      
      // Props UI
      scrollToBlockId={null}
      onDoneScrolling={() => {}}
      saveStatus="Idle"
      isSplitView={false}
      isSidebarOpen={false}
    />
  );
};
