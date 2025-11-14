// CREA QUESTO NUOVO FILE: components/TagPill.tsx

import React from 'react';
import { getTagClasses } from '../../lib/TG'; // Importiamo la nostra utility per i colori
import { XIcon } from '../icons';

interface TagPillProps {
  name: string;
  color: string;
  onRemove?: (e: React.MouseEvent) => void; // Opzionale: per il multi-select
}

export const TagPill: React.FC<TagPillProps> = ({ name, color, onRemove }) => {
  return (
    <span
      className={`flex items-center text-sm px-2 py-0.5 rounded-md ${getTagClasses(color)} w-fit`}
    >
      {name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // Evita di chiudere il menu
            onRemove(e);
          }}
          className="ml-1 -mr-0.5 opacity-60 hover:opacity-100 rounded-full"
          aria-label={`Rimuovi tag ${name}`}
        >
          <XIcon className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};