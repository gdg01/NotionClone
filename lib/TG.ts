// File: src/lib/tagColors.ts (Versione Mista: Leggibile Light + Tonal Dark)

// Mappa i nomi dei colori (che salviamo nel DB) alle classi Tailwind
export const TAG_COLORS: Record<string, { light: string, dark: string }> = {
  gray: 	{ light: 'bg-gray-200 text-gray-800', 	dark: 'dark:bg-gray-800 dark:text-gray-400' },
  red: 		{ light: 'bg-red-200 text-red-800', 		dark: 'dark:bg-red-900/50 dark:text-red-400' 	},
  orange: { light: 'bg-orange-200 text-orange-800', dark: 'dark:bg-orange-900/50 dark:text-orange-400' },
  yellow: { light: 'bg-yellow-200 text-yellow-800', dark: 'dark:bg-yellow-900/50 dark:text-yellow-400' },
  green: 	{ light: 'bg-green-200 text-green-800', 	dark: 'dark:bg-green-900/50 dark:text-green-400' 	},
  teal: 	{ light: 'bg-teal-200 text-teal-800', 	dark: 'dark:bg-teal-900/50 dark:text-teal-400' 	},
  blue: 	{ light: 'bg-blue-200 text-blue-800', 	dark: 'dark:bg-blue-900/50 dark:text-blue-400' 	},
  cyan: 	{ light: 'bg-cyan-200 text-cyan-800', 	dark: 'dark:bg-cyan-900/50 dark:text-cyan-400' 	},
  purple: { light: 'bg-purple-200 text-purple-800', dark: 'dark:bg-purple-900/50 dark:text-purple-400' },
  pink: 	{ light: 'bg-pink-200 text-pink-800', 	dark: 'dark:bg-pink-900/50 dark:text-pink-400' 	},
};

// Funzione helper per ottenere le classi complete
export function getTagClasses(colorName: string): string {
  const color = TAG_COLORS[colorName] || TAG_COLORS.gray;
  return `${color.light} ${color.dark}`;
}