import React, { useState, useRef, useEffect, useMemo } from 'react';
import { NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react';
import { ChevronDownIcon, SearchIcon, CheckIcon } from './icons'; // Assicurati di avere CheckIcon o rimuovilo
import { BlockActions } from './BlockActions';

// Lista estesa di linguaggi supportati da highlight.js
const ALL_LANGUAGES = [
  { value: 'auto', label: 'Auto Detect' },
  { value: 'plaintext', label: 'Plain Text' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'tsx', label: 'TSX' },
  { value: 'jsx', label: 'JSX' },
  { value: 'css', label: 'CSS' },
  { value: 'scss', label: 'SCSS' },
  { value: 'html', label: 'HTML' },
  { value: 'json', label: 'JSON' },
  { value: 'xml', label: 'XML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'yaml', label: 'YAML' },
  { value: 'bash', label: 'Bash / Shell' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'dart', label: 'Dart' },
  { value: 'sql', label: 'SQL' },
  { value: 'graphql', label: 'GraphQL' },
  { value: 'dockerfile', label: 'Dockerfile' },
  { value: 'lua', label: 'Lua' },
  { value: 'perl', label: 'Perl' },
  { value: 'r', label: 'R' },
  { value: 'scala', label: 'Scala' },
  { value: 'elixir', label: 'Elixir' },
  { value: 'haskell', label: 'Haskell' },
  { value: 'clojure', label: 'Clojure' },
  { value: 'julia', label: 'Julia' },
  { value: 'matlab', label: 'Matlab' },
  { value: 'powershell', label: 'PowerShell' },
  { value: 'objectivec', label: 'Objective-C' },
  { value: 'visual-basic', label: 'Visual Basic' },
  { value: 'assembly', label: 'Assembly (x86)' },
  { value: 'solidity', label: 'Solidity' },
  { value: 'verilog', label: 'Verilog' },
  { value: 'vhdl', label: 'VHDL' },
  { value: 'coffeescript', label: 'CoffeeScript' },
  { value: 'fsharp', label: 'F#' },
  { value: 'fortran', label: 'Fortran' },
  { value: 'pascal', label: 'Pascal' },
  { value: 'prolog', label: 'Prolog' },
  { value: 'latex', label: 'LaTeX' },
  { value: 'diff', label: 'Diff' },
  { value: 'makefile', label: 'Makefile' },
  { value: 'nginx', label: 'Nginx' },
  { value: 'apache', label: 'Apache Conf' },
  { value: 'toml', label: 'TOML' },
  { value: 'ini', label: 'INI' },
].sort((a, b) => {
  // Mantieni 'Auto' e 'Plain Text' in cima, ordina gli altri alfabeticamente
  if (a.value === 'auto') return -1;
  if (b.value === 'auto') return 1;
  if (a.value === 'plaintext') return -1;
  if (b.value === 'plaintext') return 1;
  return a.label.localeCompare(b.label);
});

export const CodeBlockComponent: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  editor,
  getPos,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const currentLanguageValue = node.attrs.language || 'auto';
  const currentLanguage =
    ALL_LANGUAGES.find((l) => l.value === currentLanguageValue) ||
    { value: currentLanguageValue, label: currentLanguageValue };

  // Filtra i linguaggi in base alla ricerca
  const filteredLanguages = useMemo(() => {
    if (!searchQuery) return ALL_LANGUAGES;
    return ALL_LANGUAGES.filter((lang) =>
      lang.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.value.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleSelect = (langValue: string) => {
    updateAttributes({ language: langValue });
    setIsOpen(false);
    setSearchQuery('');
  };

  // Chiudi il dropdown se si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus automatico sulla ricerca quando si apre il dropdown
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const { currentPageId } =
    editor.extensionManager.extensions.find((ext) => ext.name === 'pageLink')
      ?.options || { currentPageId: null };
  const pageId = currentPageId;

  return (
    <NodeViewWrapper className="relative group not-prose my-4 max-w-full">
      {/* BlockActions (Drag handle e menu) */}
      <BlockActions editor={editor} pos={getPos()} pageId={pageId} />

      {/* Dropdown Linguaggio */}
      <div
        ref={dropdownRef}
        className="absolute top-3 right-3 z-20"
        contentEditable={false}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center text-xs font-medium px-2 py-1 rounded transition-all duration-200 
            ${isOpen 
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-notion-hover-dark dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          aria-label="Select language"
        >
          {currentLanguage.label}
          <ChevronDownIcon className={`w-3 h-3 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full right-0 mt-1 w-48 max-h-60 bg-white dark:bg-notion-sidebar-dark border border-gray-200 dark:border-notion-border-dark rounded-lg shadow-xl overflow-hidden flex flex-col">
            
            {/* Barra di Ricerca Sticky */}
            <div className="p-2 border-b border-gray-100 dark:border-notion-border-dark bg-white dark:bg-notion-sidebar-dark sticky top-0 z-10">
              <div className="relative flex items-center">
                <SearchIcon className="w-3.5 h-3.5 absolute left-2 text-gray-400" />
                <input 
                  ref={searchInputRef}
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cerca linguaggio..."
                  className="w-full pl-7 pr-2 py-1 text-xs bg-gray-50 dark:bg-notion-hover-dark border border-transparent focus:border-blue-500 rounded-md outline-none text-notion-text dark:text-notion-text-dark placeholder-gray-400"
                />
              </div>
            </div>

            {/* Lista Linguaggi Scrollabile */}
            <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
              {filteredLanguages.length > 0 ? (
                filteredLanguages.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => handleSelect(lang.value)}
                    className={`flex items-center justify-between w-full text-left px-3 py-1.5 text-xs transition-colors
                      ${lang.value === currentLanguageValue
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-notion-hover-dark'
                      }`}
                  >
                    <span>{lang.label}</span>
                    {lang.value === currentLanguageValue && (
                      // Usa un carattere semplice se non hai CheckIcon
                      <span className="text-blue-500 font-bold">✓</span> 
                    )}
                  </button>
                ))
              ) : (
                <div className="p-3 text-xs text-center text-gray-400">
                  Nessun risultato
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Blocco Codice */}
      {/* max-w-full e overflow-x-auto sono cruciali per il mobile */}
      <pre className="rounded-lg bg-[#f6f8fa] dark:bg-[#1e1e1e] border border-gray-200 dark:border-notion-border-dark p-4 overflow-x-auto max-w-full font-mono text-sm leading-relaxed">
        <code 
          className={`block whitespace-pre ${node.attrs.language ? `language-${node.attrs.language}` : ''}`}
          style={{ minWidth: '100%' }} // Assicura che il contenuto possa espandersi
        >
          <NodeViewContent />
        </code>
      </pre>
    </NodeViewWrapper>
  );
};