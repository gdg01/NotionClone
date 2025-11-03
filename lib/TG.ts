// File: src/lib/tagColors.ts (NUOVO FILE)

// Mappa i nomi dei colori (che salviamo nel DB) alle classi Tailwind
export const TAG_COLORS: Record<string, { light: string, dark: string }> = {
  gray:   { light: 'bg-gray-200 text-gray-800',   dark: 'dark:bg-gray-700 dark:text-gray-200' },
  red:    { light: 'bg-red-100 text-red-800',     dark: 'dark:bg-red-900 dark:text-red-200'   },
  orange: { light: 'bg-orange-100 text-orange-800', dark: 'dark:bg-orange-900 dark:text-orange-200' },
  yellow: { light: 'bg-yellow-100 text-yellow-800', dark: 'dark:bg-yellow-900 dark:text-yellow-200' },
  green:  { light: 'bg-green-100 text-green-800',  dark: 'dark:bg-green-900 dark:text-green-200'  },
  teal:   { light: 'bg-teal-100 text-teal-800',   dark: 'dark:bg-teal-900 dark:text-teal-200'   },
  blue:   { light: 'bg-blue-100 text-blue-800',    dark: 'dark:bg-blue-900 dark:text-blue-200'    },
  cyan:   { light: 'bg-cyan-100 text-cyan-800',    dark: 'dark:bg-cyan-900 dark:text-cyan-200'    },
  purple: { light: 'bg-purple-100 text-purple-800', dark: 'dark:bg-purple-900 dark:text-purple-200' },
  pink:   { light: 'bg-pink-100 text-pink-800',    dark: 'dark:bg-pink-900 dark:text-pink-200'    },
};

// Funzione helper per ottenere le classi complete
export function getTagClasses(colorName: string): string {
  const color = TAG_COLORS[colorName] || TAG_COLORS.gray;
  return `${color.light} ${color.dark}`;
}