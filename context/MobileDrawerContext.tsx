// context/MobileDrawerContext.tsx (NUOVO FILE)
import React, { createContext, useContext, useState, useMemo } from 'react';
import type { Heading } from '../components/Editor'; // Importa il tipo da Editor
import type { EnrichedBacklink } from '../components/BacklinksList'; // Importa il tipo

type MobileDataContextType = {
  headings: Heading[];
  backlinks: EnrichedBacklink[];
  // Funzione per aggiornare i dati dall'Editor
  setMobileData: (data: { headings: Heading[]; backlinks: EnrichedBacklink[] }) => void;
};

const MobileDrawerContext = createContext<MobileDataContextType | undefined>(undefined);

export const MobileDrawerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [backlinks, setBacklinks] = useState<EnrichedBacklink[]>([]);

  const setMobileData = (data: { headings: Heading[]; backlinks: EnrichedBacklink[] }) => {
    setHeadings(data.headings);
    setBacklinks(data.backlinks);
  };

  const value = useMemo(() => ({
    headings,
    backlinks,
    setMobileData,
  }), [headings, backlinks]);

  return (
    <MobileDrawerContext.Provider value={value}>
      {children}
    </MobileDrawerContext.Provider>
  );
};

export const useMobileDrawerData = () => {
  const context = useContext(MobileDrawerContext);
  if (!context) {
    throw new Error('useMobileDrawerData deve essere usato dentro un MobileDrawerProvider');
  }
  return context;
};