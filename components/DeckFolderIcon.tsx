// File: components/DeckFolderIcon.tsx (NUOVO FILE - Versione Finale)

import React from 'react';

interface DeckFolderIconProps {
  /**
   * Classe Tailwind per il colore della linguetta (es. "text-red-500")
   */
  tabClassName: string;
  /**
   * Classe Tailwind per il colore del corpo (es. "text-notion-sidebar dark:text-notion-sidebar-dark")
   */
  bodyClassName: string;
  /**
   * Classi aggiuntive per il dimensionamento, ecc.
   */
  className?: string;
}

/**
 * Componente React che renderizza l'SVG della cartella finale.
 * Usa "currentColor" per permettere lo styling tramite classi Tailwind.
 */
export const DeckFolderIcon: React.FC<DeckFolderIconProps> = ({
  tabClassName,
  bodyClassName,
  className,
}) => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 38 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="none" // Scala per riempire
    >
      <mask
        id="mask0_6_12"
        style={{ maskType: 'alpha' }}
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="38"
        height="26"
      >
        <rect width="38" height="26" rx="4" fill="#9A9A9A" />
      </mask>
      <g mask="url(#mask0_6_12)">
        {/* PARTE 1: La linguetta colorata (ex #D04141) */}
        <rect
          y="1"
          width="37"
          height="20"
          rx="4"
          fill="currentColor"
          className={tabClassName} // Colore dinamico
        />
        <mask
          id="mask1_6_12"
          style={{ maskType: 'alpha' }}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="38"
          height="26"
        >
          <path
            d="M0 1C0 0.447716 0.447715 0 1 0H30.75C31.3023 0 31.75 0.447715 31.75 1V3C31.75 3.55228 32.1977 4 32.75 4H37C37.5523 4 38 4.44772 38 5V25C38 25.5523 37.5523 26 37 26H1C0.447716 26 0 25.5523 0 25V1Z"
            fill="#9A9A9A"
          />
        </mask>
        <g mask="url(#mask1_6_12)">
          {/* PARTE 2: Il corpo della cartella (ex #8E8E8E) */}
          <path
            d="M25 4H38V26H0V0H21C22 0 21.5 0 23 2C24.5 4 24 4 25 4Z"
            fill="currentColor"
            className={bodyClassName} // Colore della sidebar
          />
        </g>
      </g>
    </svg>
  );
};