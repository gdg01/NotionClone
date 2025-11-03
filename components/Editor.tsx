// components/Editor.tsx (Corretto)

import React, {
  useState,
  useEffect,
  forwardRef, 
  useImperativeHandle, 
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  useEditor,
  EditorContent,
  ReactRenderer,
  ReactNodeViewRenderer,
} from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus'

import StarterKit from '@tiptap/starter-kit';
import Paragraph from '@tiptap/extension-paragraph';
import Heading from '@tiptap/extension-heading';
import Placeholder from '@tiptap/extension-placeholder';
import { Suggestion } from '@tiptap/suggestion';
import {
  Extension,
  Node,
  mergeAttributes,
  type Editor as TiptapEditor,
} from '@tiptap/core';
import UniqueID from '@tiptap/extension-unique-id';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import Dropcursor from '@tiptap/extension-dropcursor';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import c from 'highlight.js/lib/languages/c';
import x86asm from 'highlight.js/lib/languages/x86asm';
import { debounce } from 'lodash';

// Importa utility da Prosemirror
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

import type { Page } from '../App';
import { TableOfContents } from './TableOfContents';
import { CodeBlockComponent } from './CodeBlockComponent';
import { EmojiPicker } from './EmojiPicker';
import { NewPageIcon } from './icons';
import { PageLinkComponent } from './PageLinkComponent';
import { BlockLinkComponent } from './BlockLinkComponent';
import { BlockWrapperComponent } from './BlockWrapperComponent';
import { SubPagesListComponent } from './SubPagesListComponent';
import type { SaveStatus } from './BreadcrumbNav';
// --- MODIFICA: Importa TextSelectionMenu ---
import { TextSelectionMenu } from './TextSelectionMenu'; 
import { BacklinksList, EnrichedBacklink } from './BacklinksList'; 
//convex 
import { useMutation, useQuery } from 'convex/react'; 
import { api } from '../convex/_generated/api'; 
import { getTagClasses, TAG_COLORS } from '../lib/TG';
import { Doc } from '../convex/_generated/dataModel';

// --- Componente Helper per i Tag (Invariato) ---
interface TagInputProps {
  pageTags: string[]; // Nomi dei tag su questa pagina
  onUpdatePageTags: (tags: string[]) => void;
}

const TagInput: React.FC<TagInputProps> = ({ pageTags, onUpdatePageTags }) => {
  const [inputValue, setInputValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  
  const allTags = useQuery(api.tags.list);
  const getOrCreateTag = useMutation(api.tags.getOrCreate);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allTagsMap = useMemo(() => {
    if (!allTags) return new Map<string, Doc<'tags'>>();
    return new Map(allTags.map(tag => [tag.name, tag]));
  }, [allTags]);

  const filteredSuggestions = useMemo(() => {
    if (!allTags) return [];
    const lowerInput = inputValue.trim().toLowerCase();
    
    return allTags.filter(
      tag => 
        tag.name.toLowerCase().includes(lowerInput) && 
        !pageTags.includes(tag.name)
    );
  }, [allTags, inputValue, pageTags]);

  const isNewTag = inputValue.trim().length > 0 && 
                   !allTagsMap.has(inputValue.trim().toLowerCase());

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setIsColorPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdatePageTags(pageTags.filter(tag => tag !== tagToRemove));
  };

  const handleAddTag = (tagName: string) => {
    if (!pageTags.includes(tagName)) {
      onUpdatePageTags([...pageTags, tagName]);
    }
    setInputValue('');
    setIsDropdownOpen(false);
    inputRef.current?.focus();
  };

  const handleCreateTag = async (color: string) => {
    const newTagName = inputValue.trim().toLowerCase();
    if (newTagName.length === 0) return;

    try {
      await getOrCreateTag({ name: newTagName, color: color });
      onUpdatePageTags([...pageTags, newTagName]);
      
      setInputValue('');
      setIsColorPickerOpen(false);
      setIsDropdownOpen(false);
      inputRef.current?.focus();
    } catch (error) {
      console.error("Errore durante la creazione del tag:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isNewTag) {
        setIsColorPickerOpen(true);
      } else if (filteredSuggestions.length > 0) {
        handleAddTag(filteredSuggestions[0].name);
      }
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="flex flex-wrap items-center gap-2">
        {pageTags.map(tagName => {
          const tagData = allTagsMap.get(tagName);
          const colorName = tagData?.color || 'gray';
          return (
            <span 
              key={tagName} 
              className={`flex items-center text-sm px-2 py-0.5 rounded-full ${getTagClasses(colorName)}`}
            >
              {tagName}
              <button 
                onClick={() => handleRemoveTag(tagName)} 
                className="ml-1.5 opacity-60 hover:opacity-100 rounded-full"
                aria-label={`Rimuovi tag ${tagName}`}
              >
                &times;
              </button>
            </span>
          );
        })}

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsDropdownOpen(true);
            setIsColorPickerOpen(false);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsDropdownOpen(true)}
          placeholder={pageTags.length > 0 ? "Aggiungi..." : "Aggiungi tag..."}
          className="bg-transparent text-sm outline-none p-1 w-24"
        />
      </div>

      {isDropdownOpen && (filteredSuggestions.length > 0 || isNewTag) && (
        <div className="absolute top-full left-0 z-10 mt-2 w-56 bg-white dark:bg-notion-sidebar-dark rounded-md shadow-lg border border-notion-border dark:border-notion-border-dark overflow-hidden">
          
          {isColorPickerOpen && isNewTag ? (
            <div>
              <div className="p-2 text-xs font-semibold text-notion-text-gray dark:text-notion-text-gray-dark border-b border-notion-border dark:border-notion-border-dark">Scegli un colore</div>
              <div className="p-2 grid grid-cols-5 gap-2">
                {Object.keys(TAG_COLORS).map(colorName => (
                  <button
                    key={colorName}
                    title={colorName}
                    onClick={() => handleCreateTag(colorName)}
                    className={`w-8 h-8 rounded-full border border-black/10 ${TAG_COLORS[colorName].light.split(' ')[0]} ${TAG_COLORS[colorName].dark.split(' ')[1]}`}
                  />
                ))}
              </div>
            </div>
          ) : (
            
            <>
              {filteredSuggestions.map(tag => (
                <button
                  key={tag._id}
                  onClick={() => handleAddTag(tag.name)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-notion-hover dark:hover:bg-notion-hover-dark flex items-center justify-between`}
                >
                  <span>{tag.name}</span>
                  <span className={`w-3 h-3 rounded-full ${getTagClasses(tag.color)}`} />
                </button>
              ))}

              {isNewTag && (
                <button
                  onClick={() => setIsColorPickerOpen(true)}
                  className="w-full text-left px-3 py-2 text-sm text-blue-500 hover:bg-notion-hover dark:hover:bg-notion-hover-dark"
                >
                  + Crea tag "{inputValue.trim().toLowerCase()}"
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      toggleCallout: () => ReturnType;
    };
    columns: {
      setColumns: () => ReturnType;
    };
  }
}

const lowlight = createLowlight();
lowlight.register('javascript', javascript);
lowlight.register('python', python);
lowlight.register('c', c);
lowlight.register('x86asm', x86asm);

interface EditorProps {
  page: Page;
  initialContent: any;
  pages: Page[];
  pageTitlesMap: Map<string, string>;
  blockPreviewsMap: Map<string, string>;
  onUpdatePage: (
    pageId: string,
    updates: Partial<Omit<Page, '_id' | 'userId' | '_creationTime'>>
  ) => Promise<void>;
  onSelectPage: (pageId: string) => void;
  onSelectBlock: (pageId: string, blockId: string) => void;
  onTitleChange: (title: string) => void;
  onContentChange: (content: any) => void;
  
  onCreateSubPage: (options?: {
    navigate?: boolean;
    insertLink?: boolean; 
    title?: string; // Già presente dal nostro codice precedente
  }) => Promise<Page | undefined>;
  
  scrollToBlockId: string | null;
  onDoneScrolling: () => void;
  onOpenInSplitView: (pageId: string, blockId?: string | null) => void;
  onOpenAiPanel: () => void;
  saveStatus: SaveStatus;
  onSaveNow: () => Promise<void>;
  isSplitView: boolean;
  isSidebarOpen: boolean;
}

interface Heading {
  id: string;
  level: number;
  text: string;
}

// ... (definizioni Nodi: PageLink, BlockLink, SubPagesList, Column, Columns, Callout, CustomCodeBlock - Invariate) ...
const PageLink = Node.create({
  name: 'pageLink',
  group: 'inline',
  inline: true,
  atom: true,
  addOptions() {
    return {
      getPageById: (id: string) => undefined as Page | undefined,
      onSelectPage: () => {},
      currentPageId: null,
      onOpenInSplitView: () => {},
    };
  },
  addAttributes() {
    return {
      pageId: { default: null },
      title: { default: 'Untitled' },
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-type="page-link"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes({ 'data-type': 'page-link' }, HTMLAttributes),
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(PageLinkComponent);
  },
});

const BlockLink = Node.create({
  name: 'blockLink',
  group: 'inline',
  inline: true,
  atom: true,
  addOptions() {
    return {
      onSelectBlock: () => {},
      pageTitles: new Map(),
      blockPreviews: new Map(),
      onOpenInSplitView: () => {},
    };
  },
  addAttributes() {
    return { pageId: { default: null }, blockId: { default: null }, customAlias: { default: null } };
  },
  parseHTML() {
    return [{ tag: 'a[data-type="block-link"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'a',
      mergeAttributes({ 'data-type': 'block-link' }, HTMLAttributes),
      'Link to block',
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(BlockLinkComponent);
  },
});

const SubPagesList = Node.create({
  name: 'subPagesList',
  group: 'block',
  atom: true,
  draggable: true,
  addOptions() {
    return {
      pages: [] as Page[],
      currentPageId: null as string | null,
      onSelectPage: (id: string) => {},
      onOpenInSplitView: (id: string) => {},
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="sub-pages-list"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'sub-pages-list' }),
      0,
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(SubPagesListComponent);
  },
});

const Column = Node.create({
  name: 'column',
  group: 'block',
  content: 'block+',
  defining: true,
  parseHTML() {
    return [{ tag: 'div[data-type="column"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'column' }), 0];
  },
});
const Columns = Node.create({
  name: 'columns',
  group: 'block',
  content: 'column{2}',
  defining: true,
  isolating: true,
  parseHTML() {
    return [{ tag: 'div[data-type="columns"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'columns' }), 0];
  },
  addCommands() {
    return {
      setColumns:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            content: [
              { type: 'column', content: [{ type: 'paragraph' }] },
              { type: 'column', content: [{ type: 'paragraph' }] },
            ],
          }),
    };
  },
});
const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'inline*',
  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      {
        ...HTMLAttributes,
        'data-type': 'callout',
        class:
          'p-4 bg-notion-sidebar dark:bg-notion-sidebar-dark rounded-lg my-2 flex',
      },
      ['span', { class: 'mr-3 text-xl' }, '💡'],
      ['div', { class: 'min-w-0' }, 0],
    ];
  },
  addCommands() {
    return {
      toggleCallout: () => ({ commands }) => commands.toggleNode(this.name, 'paragraph'),
    };
  },
});

const CustomCodeBlock = CodeBlockLowlight.extend({
  draggable: true,
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent);
  },
});


// ... (SlashCommandMenu - Invariato) ...
const commandItems = ({
  editor,
  onCreateSubPage,
}: {
  editor: TiptapEditor;
  onCreateSubPage: (options?: {
    navigate?: boolean;
    insertLink?: boolean;
    title?: string;
  }) => Promise<Page | undefined>;
}) => [
  {
    title: 'Text',
    icon: '✍️',
    command: () => editor.chain().focus().setParagraph().run(),
  },
  {
    title: 'Heading 1',
    icon: '1️⃣',
    command: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    aliases: ['h1', '1'],
  },
  {
    title: 'Heading 2',
    icon: '2️⃣',
    command: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    aliases: ['h2', '2'],
  },
  {
    title: 'Heading 3',
    icon: '3️⃣',
    command: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    aliases: ['h3', '3'],
  },
  {
    title: 'Bullet List',
    icon: '⚫️',
    command: () => editor.chain().focus().toggleBulletList().run(),
    aliases: ['ul', 'list'],
  },
  {
    title: 'Numbered List',
    icon: '🔢',
    command: () => editor.chain().focus().toggleOrderedList().run(),
    aliases: ['ol'],
  },
  {
    title: 'Code Block',
    icon: '💻',
    command: () => editor.chain().focus().toggleCodeBlock().run(),
    aliases: ['code', 'codice'],
  },
  {
    title: 'Callout',
    icon: '📣',
    command: () => editor.chain().focus().toggleCallout().run(),
  },
  {
    title: 'Divider',
    icon: '➖',
    command: () => editor.chain().focus().setHorizontalRule().run(),
    aliases: ['hr'],
  },
  {
    title: 'Page',
    icon: '📄',
    command: () => onCreateSubPage && onCreateSubPage({ navigate: false, insertLink: false }),
    isPageCommand: true,
  },
  {
    title: '2 Columns',
    icon: '🰰',
    command: () => editor.chain().focus().setColumns().run(),
    aliases: ['cols', 'columns', 'colonne'],
  },
  {
    title: 'Sub-Pages List',
    icon: '📁',
    command: () => editor.chain().focus().insertContent({ type: 'subPagesList' }).run(),
    aliases: ['subpages', 'children', 'listpages'],
  },
];

const SlashCommandMenu = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectItem = (index: number) => {
    if (props.items[index]) {
      props.command(props.items[index]);
    }
  };
  useEffect(() => setSelectedIndex(0), [props.items]);
  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex(
          (selectedIndex + props.items.length - 1) % props.items.length
        );
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));
  if (props.items.length === 0) return null;
  return (
    <div className="bg-white dark:bg-notion-sidebar-dark rounded-lg shadow-lg border border-notion-border dark:border-notion-border-dark w-72 p-1 text-notion-text dark:text-notion-text-dark">
      <div className="text-xs text-notion-text-gray dark:text-notion-text-gray-dark px-2 py-1">
        BLOCKS
      </div>
      {props.items.map((item: any, index: number) => (
        <button
          key={item.title}
          className={`flex items-center w-full text-left px-2 py-1.5 rounded ${
            index === selectedIndex
              ? 'bg-notion-hover dark:bg-notion-hover-dark'
              : ''
          }`}
          onClick={() => selectItem(index)}
        >
          <div className="w-8 h-8 flex items-center justify-center text-lg border border-notion-border dark:border-notion-border-dark rounded mr-3">
            {item.icon}
          </div>
          <div>
            <p className="font-medium">{item.title}</p>
          </div>
        </button>
      ))}
    </div>
  );
});

const SlashCommand = Extension.create({
  name: 'slash-command',

  addOptions() {
    return {
      onCreateSubPage: async (options?: { navigate?: boolean; insertLink?: boolean; title?: string; }) => undefined as Page | undefined,
      onSelectPage: () => {},
      onUpdatePage: async (pageId: string, updates: any) => {},
      currentPageId: null as string | null,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: '/',

        command: async ({ editor, range, props }) => {
          const insertionPos = range.from;
          editor.chain().focus().deleteRange(range).run();

          if (props.isPageCommand) {
            const newPage = await props.command();

            if (newPage && newPage._id) {
              
              // --- MODIFICA: Problema 1 (Untitled) ---
              // Passiamo il titolo (che sarà 'Untitled' in questo caso)
              // all'attributo del nodo, così non deve aspettare la cache.
              editor
                .chain()
                .focus()
                .insertContentAt(insertionPos, {
                  type: 'pageLink',
                  attrs: { 
                    pageId: newPage._id,
                    title: newPage.title || 'Untitled' // <-- CORREZIONE
                  },
                })
                .insertContentAt(insertionPos + 1, ' ') 
                .run();
              // --- FINE MODIFICA ---

              const updatedContentObject = editor.getJSON();
              const updatedContentString = JSON.stringify(updatedContentObject);

              if (this.options.onUpdatePage && this.options.currentPageId) {
                try {
                  await this.options.onUpdatePage(
                    this.options.currentPageId,
                    { content: updatedContentString }
                  );
                } catch (err) {
                  console.error(
                    'Salvataggio fallito prima della navigazione:',
                    err
                  );
                  return;
                }
              }
              this.options.onSelectPage(newPage._id);
            }
          } else {
            props.command();
          }
        },

        items: ({ query }) =>
          commandItems({
            editor: this.editor,
            onCreateSubPage: this.options.onCreateSubPage,
          })
            .filter(
              (item) =>
                item.title.toLowerCase().includes(query.toLowerCase()) ||
                item.aliases?.some((alias) => alias.includes(query.toLowerCase()))
            )
            .slice(0, 10),

        render: () => {
          let component: any, popup: any;
          return {
            onStart: (props) => {
              component = new ReactRenderer(SlashCommandMenu, {
                props,
                editor: props.editor,
              });
              if (!props.clientRect) return;
              popup = (window as any).tippy('body', {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              });
            },
            onUpdate: (props) => {
              component.updateProps(props);
              if (!props.clientRect) return;
              popup[0].setProps({ getReferenceClientRect: props.clientRect });
            },
            onKeyDown: (props) => {
              if (props.event.key === 'Escape') {
                popup[0].hide();
                return true;
              }
              return component.ref?.onKeyDown(props);
            },
            onExit: () => {
              popup[0].destroy();
              component.destroy();
            },
          };
        },
      }),
    ];
  },
});


// ... (Estensioni DnD e ColumnCleanup - Invariate) ...
const columnDragPluginKey = new PluginKey('columnDrag');

const getDragTarget = (view: any, event: DragEvent) => {
  const targetElement = document.elementFromPoint(event.clientX, event.clientY);
  if (!targetElement) {
    return null;
  }
  const nodeView = targetElement.closest('.block-wrapper, [data-type="code-block"]');
  if (!nodeView) {
    return null; 
  }
  const contentElement = nodeView.querySelector('[data-node-view-content]') as HTMLElement;
  if (!contentElement || !view.dom.contains(contentElement)) {
    return null;
  }
  const posAtDOM = view.posAtDOM(contentElement, 0);
  if (posAtDOM === null || posAtDOM === undefined || posAtDOM === -1) {
    return null;
  }
  const $pos = view.state.doc.resolve(posAtDOM);
  if ($pos.depth < 1) { 
       return null;
  }
  const targetNode = $pos.node(1);
  const nodeStartPos = $pos.before(1);
  const rect = (nodeView as HTMLElement).getBoundingClientRect();
  const xPos = event.clientX - rect.left;
  const triggerWidth = 40; // 40px fissi
  let side = null;
  if (xPos < triggerWidth) {
    side = 'left';
  } else if (xPos > rect.width - triggerWidth) {
    side = 'right';
  }
  return { targetNode, nodeStartPos, side };
}

const ColumnDragHandler = Extension.create({
  name: 'columnDragHandler',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: columnDragPluginKey,
        state: {
          init() {
            return { active: false, side: null, pos: null };
          },
          apply(tr, val) {
            const meta = tr.getMeta(columnDragPluginKey);
            if (meta) {
              return meta;
            }
            if (tr.docChanged || tr.selectionSet) {
              return { active: false, side: null, pos: null };
            }
            return val;
          },
        },
        props: {
          handleDragOver(view, event, slice, moved) {
            if (!moved || !slice.content.firstChild || slice.content.childCount !== 1 || 
                slice.content.firstChild.type.name === 'columns' || 
                !slice.content.firstChild.type.spec.draggable) {
              return false;
            }
            const targetInfo = getDragTarget(view, event);
            if (!targetInfo) {
              view.dispatch(view.state.tr.setMeta(columnDragPluginKey, { active: false }));
              return false;
            }
            const { targetNode, nodeStartPos, side } = targetInfo;
            if (targetNode.type.name === 'columns') {
                 view.dispatch(view.state.tr.setMeta(columnDragPluginKey, { active: false }));
                 return true;
            }
            const { from } = view.state.selection;
            const $from = view.state.doc.resolve(from);
            if ($from.before(1) === nodeStartPos) {
                 view.dispatch(view.state.tr.setMeta(columnDragPluginKey, { active: false }));
                 return true;
            }
            if (side) {
              view.dispatch(
                view.state.tr.setMeta(columnDragPluginKey, {
                  active: true,
                  side: side,
                  pos: nodeStartPos,
                })
              );
              return true;
            } else {
              view.dispatch(view.state.tr.setMeta(columnDragPluginKey, { active: false }));
              return false; 
            }
          },
          handleDrop(view, event, slice, moved) {
            if (!moved || !slice.content.firstChild || slice.content.childCount !== 1 || 
                slice.content.firstChild.type.name === 'columns' || 
                !slice.content.firstChild.type.spec.draggable) {
              return false;
            }
            const targetInfo = getDragTarget(view, event);
            const pluginState = columnDragPluginKey.getState(view.state);
            if (!targetInfo) {
               view.dispatch(view.state.tr.setMeta(columnDragPluginKey, { active: false }));
               return false;
            }
            const { targetNode, nodeStartPos, side } = targetInfo;
            if (targetNode.type.name === 'columns') {
                 return false;
            }
            const { from } = view.state.selection;
            const $from = view.state.doc.resolve(from);
            if ($from.before(1) === nodeStartPos) {
                 return false;
            }
            if (side) {
              const { schema } = view.state;
              const draggedContent = slice.content;
              if (!targetNode || !draggedContent) {
                 return false;
              }
              const columnType = schema.nodes.column;
              const columnsType = schema.nodes.columns;
              const { from: draggedFrom } = view.state.selection;
              const $draggedFrom = view.state.doc.resolve(draggedFrom);
              const draggedNode = $draggedFrom.node(1);
              if (!draggedNode) {
                  return false;
              }
              const draggedNodeStart = $draggedFrom.before(1);
              const draggedNodeEnd = draggedNodeStart + draggedNode.nodeSize;
              const targetNodeStart = nodeStartPos;
              const targetNodeEnd = targetNodeStart + targetNode.nodeSize;
              let content = [];
              if (side === 'left') {
                content = [
                  columnType.create(null, draggedContent),
                  columnType.create(null, targetNode),
                ];
              } else {
                content = [
                  columnType.create(null, targetNode),
                  columnType.create(null, draggedContent),
                ];
              }
              const columnsNode = columnsType.create(null, content);
              let tr = view.state.tr;
              if (draggedNodeStart < targetNodeStart) {
                tr.delete(draggedNodeStart, draggedNodeEnd);
                const mappedTargetStart = tr.mapping.map(targetNodeStart);
                const mappedTargetEnd = tr.mapping.map(targetNodeEnd);
                tr.replaceWith(mappedTargetStart, mappedTargetEnd, columnsNode);
              } else {
                tr.replaceWith(targetNodeStart, targetNodeEnd, columnsNode);
                const mappedDragStart = tr.mapping.map(draggedNodeStart);
                const mappedDragEnd = tr.mapping.map(draggedNodeEnd);
                tr.delete(mappedDragStart, mappedDragEnd);
              }
              view.dispatch(tr);
              event.preventDefault();
              return true;
            } else {
              view.dispatch(view.state.tr.setMeta(columnDragPluginKey, { active: false }));
              return false;
            }
          },
          decorations(state) {
            const pluginState = columnDragPluginKey.getState(state);
            if (!pluginState.active || !pluginState.side || pluginState.pos === null) {
              return DecorationSet.empty;
            }
            const { side, pos } = pluginState;
            const node = state.doc.nodeAt(pos);
            if (!node) return DecorationSet.empty;
            const deco = Decoration.node(pos, pos + node.nodeSize, {
              class: `show-drop-line-${side}`,
            });
            return DecorationSet.create(state.doc, [deco]);
          },
          handleDragLeave(view, event) {
            view.dispatch(
              view.state.tr.setMeta(columnDragPluginKey, { active: false })
            );
            return false;
          },
        },
      }),
    ];
  },
});

const isEmptyColumn = (node: any) => {
  if (!node || node.type.name !== 'column') return false;
  if (node.childCount === 0) return true;
  if (node.childCount === 1) {
    const childNode = node.firstChild;
    if (childNode && childNode.isTextblock && childNode.content.size === 0) {
      return true;
    }
  }
  return false;
};

const ColumnCleanup = Extension.create({
  name: 'columnCleanup',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('columnCleanup'),
        appendTransaction: (transactions, oldState, newState) => {
          if (!transactions.some(tr => tr.docChanged)) {
            return null;
          }
          const { doc } = newState;
          let cleanupTr = newState.tr; 
          let hasChanges = false;
          const nodesToVisit: { node: any, pos: number }[] = [];
          doc.descendants((node, pos) => {
            if (node.type.name === 'columns') {
              nodesToVisit.push({ node, pos });
            }
          });
          for (const { node, pos } of nodesToVisit.reverse()) {
            if (node.childCount !== 2) continue; 
            const colA = node.child(0);
            const colB = node.child(1);
            const isAEmpty = isEmptyColumn(colA);
            const isBEmpty = isEmptyColumn(colB);
            const nodeEndPos = pos + node.nodeSize;
            if (isAEmpty && isBEmpty) {
              cleanupTr.delete(pos, nodeEndPos);
              hasChanges = true;
            } else if (isAEmpty) {
              cleanupTr.replaceWith(pos, nodeEndPos, colB.content);
              hasChanges = true;
            } else if (isBEmpty) {
              cleanupTr.replaceWith(pos, nodeEndPos, colA.content);
              hasChanges = true;
            }
          }
          if (hasChanges) {
            return cleanupTr;
          }
          return null;
        },
      }),
    ];
  },
});

// --- Componente Editor ---
export type EditorHandle = {
  getEditor: () => TiptapEditor | null;
};

export const Editor = forwardRef<EditorHandle, EditorProps>(({
  page,
  initialContent,
  pages,
  pageTitlesMap,
  blockPreviewsMap,
  onUpdatePage,
  onSelectPage,
  onSelectBlock,
  onTitleChange,
  onContentChange,
  onCreateSubPage,
  scrollToBlockId,
  onDoneScrolling,
  onOpenInSplitView,
  onOpenAiPanel,
  saveStatus,
  onSaveNow,
  isSplitView, 
  isSidebarOpen
}, ref) => {
  
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [title, setTitle] = useState(page.title || '');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const updateHeadingsFromEditor = useCallback((editor: TiptapEditor) => {
    const newHeadings: Heading[] = [];
    editor.state.doc.forEach((node) => {
      if (node.type.name === 'heading' && node.attrs.id) {
        newHeadings.push({
          level: node.attrs.level,
          text: node.textContent,
          id: node.attrs.id,
        });
      }
    });
    setHeadings(newHeadings);
  }, []); 
  const backlinks = useQuery(api.links.getBacklinksForPage, {
    pageId: page._id,
  });
  
  useEffect(() => {
    const styleId = 'column-drag-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        .ProseMirror [class*="show-drop-line-"] {
          position: relative;
        }
        .ProseMirror [class*="show-drop-line-"]::before {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          width: 2px;
          background-color: #60A5FA; /* blu-500 */
          pointer-events: none; 
        }
        .ProseMirror .show-drop-line-left::before {
          left: -1px; 
        }
        .ProseMirror .show-drop-line-right::before {
          right: -1px;
        }
      `;
      document.head.appendChild(style);
    }
  }, []); 

  const debouncedOnTitleChange = useMemo(() => {
    const saveAndSetTitle = async (newTitle: string) => {
      if (saveStatus === 'Dirty') {
        await onSaveNow();
      }
      onTitleChange(newTitle);
    };
    return debounce(saveAndSetTitle, 2000);
  }, [onTitleChange, saveStatus, onSaveNow]);

  const pagesRef = React.useRef(pages);
  React.useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);

  const getPageById = useCallback((id: string): Page | undefined => {
    return pagesRef.current.find((p) => p._id === id);
  }, []);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          paragraph: false,
          heading: false,
          codeBlock: false,
          dropcursor: false, 
        }),
        ColumnDragHandler,
        Dropcursor.configure({ color: '#60A5FA', width: 2 }),
        Paragraph.extend({
          draggable: true,
          addNodeView() {
            return ReactNodeViewRenderer(BlockWrapperComponent);
          },
        }),
        Heading.extend({
          draggable: true,
          addNodeView() {
            return ReactNodeViewRenderer(BlockWrapperComponent);
          },
        }),
        CustomCodeBlock.configure({ lowlight }),
        UniqueID.configure({
          types: [
            'heading',
            'paragraph',
            'callout',
            'columns',
            'bulletList',
            'orderedList',
            'codeBlock',
            'blockquote',
            'horizontalRule',
            'subPagesList',
          ],
        }),
        Columns,
        Column,
        Callout,
        ColumnCleanup,
        SubPagesList.configure({
          pages: pages,
          currentPageId: page._id,
          onSelectPage: onSelectPage,
          onOpenInSplitView: onOpenInSplitView,
        }),
        PageLink.configure({
          getPageById,
          onSelectPage,
          currentPageId: page._id,
          onOpenInSplitView,
        }),
        BlockLink.configure({
          onSelectBlock,
          pageTitles: pageTitlesMap,
          blockPreviews: blockPreviewsMap,
          onOpenInSplitView: onOpenInSplitView,
        }),
        SlashCommand.configure({
          onCreateSubPage,
          onSelectPage,
          onUpdatePage: onUpdatePage,
          currentPageId: page._id,
        }),
        Placeholder.configure({
          emptyNodeClass: 'is-empty',
          placeholder: ({ editor, node, pos }) => {
            if (node.type.name === 'codeBlock') {
              return 'Type some code...';
            }
            if (node.type.name === 'subPagesList') {
              return 'Sub-pages list';
            }
            return null;
          },
        }),
      ],
      content: initialContent,
      onCreate: ({ editor }) => {
        updateHeadingsFromEditor(editor);
      },
      
      onUpdate: ({ editor }) => {
        onContentChange(editor.getJSON());
        const newHeadings: Heading[] = [];
        editor.state.doc.forEach((node) => {
          if (node.type.name === 'heading' && node.attrs.id) {
            newHeadings.push({
              level: node.attrs.level,
              text: node.textContent,
              id: node.attrs.id,
            });
          }
        });
        setHeadings(newHeadings);
        updateHeadingsFromEditor(editor);
      },
      editorProps: {
        attributes: {
          class:
            'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none dark:prose-invert',
          },
        handlePaste: (view, event, slice) => {
          const text = event.clipboardData?.getData('text/plain') || '';
          const blockLinkRegex = /#([a-zA-Z0-9-]+):([a-zA-Z0-9-]+)$/;
          const match = text.trim().match(blockLinkRegex);
          
          if (match) {
            const [, pageId, blockId] = match;
            event.preventDefault();
            const { state } = view;
            const { schema, tr, selection } = state;
            if (!schema.nodes.blockLink) return false;
            let customAlias: string | null = null;
            if (!selection.empty) {
              customAlias = state.doc.textBetween(selection.from, selection.to);
            }
            const blockLinkNode = schema.nodes.blockLink.create({ pageId, blockId, customAlias });
            const spaceNode = schema.text(' ');
            let newTr = tr.replaceSelectionWith(blockLinkNode, false);
            const spaceInsertPos = selection.from + blockLinkNode.nodeSize;
            newTr = newTr.insert(spaceInsertPos, spaceNode);
            const newCursorPos = spaceInsertPos + spaceNode.nodeSize;
            newTr.setSelection(
              view.state.selection.constructor.near(newTr.doc.resolve(newCursorPos))
            );
            view.dispatch(newTr);
            return true;
          }
          return false;
        },
      },
    },
    [page._id, getPageById]
  );

  // --- MODIFICA: Problema 1 & 2 ---
  const handleCreatePageFromSelection = useCallback(async () => {
    if (!editor || editor.state.selection.empty) {
      return;
    }

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to).trim();

    if (selectedText.length === 0) {
      return;
    }

    const selectionRange = { from, to };

    try {
      const newPage = await onCreateSubPage({
        navigate: false,
        insertLink: false, 
        title: selectedText,
      });

      if (newPage && newPage._id) {
        // 2. Sostituisci il testo con il pageLink
        editor.chain()
          .focus()
          // 1. Usa la selezione corrente {from, to} per cancellare il testo
          .deleteRange({ from, to }) 
          // 2. Inserisci il pageLink nella posizione del cursore (che ora è 'from')
          .insertContent({
            type: 'pageLink',
            attrs: {
              pageId: newPage._id,
              title: selectedText,
            },
          })
          .run();
          
        // --- CORREZIONE PROBLEMA 2 (Autosalvataggio) ---
        // 3. Forza salvataggio immediato
        const updatedContent = editor.getJSON();
        // Avvisa App.tsx che il contenuto è dirty
        onContentChange(updatedContent); 
        // Chiama la funzione di salvataggio immediato
        await onSaveNow(); 
        // --- FINE CORREZIONE ---
      }
    } catch (e) {
      console.error("Failed to create page from selection", e);
    }

  }, [editor, onCreateSubPage, onContentChange, onSaveNow]);
  // --- FINE MODIFICA ---
  
  useImperativeHandle(ref, () => ({
    getEditor: () => editor,
  }), [editor]);

  useEffect(() => {
    setTitle(page.title || '');
  }, [page.title]);

  useEffect(() => {
    if (scrollToBlockId && editor) {
      const timer = setTimeout(() => {
        const element = document.getElementById(scrollToBlockId);
        if (element) {
          element.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
        onDoneScrolling();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [scrollToBlockId, editor, onDoneScrolling, page._id]);

  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.extensionManager.extensions.forEach((extension) => {
        if (extension.name === 'pageLink') {
          extension.options.getPageById = getPageById;
          extension.options.onOpenInSplitView = onOpenInSplitView;
        }
        if (extension.name === 'blockLink') {
          extension.options.pageTitles = pageTitlesMap;
          extension.options.blockPreviews = blockPreviewsMap;
          extension.options.onOpenInSplitView = onOpenInSplitView;
        }
        if (extension.name === 'subPagesList') {
            extension.options.pages = pagesRef.current;
            extension.options.currentPageId = page._id;
            extension.options.onSelectPage = onSelectPage;
            extension.options.onOpenInSplitView = onOpenInSplitView;
        }
        if (extension.name === 'slash-command') {
          extension.options.onCreateSubPage = onCreateSubPage;
        }
      });
    }
  }, [
    page._id, 
    getPageById,
    pageTitlesMap,
    blockPreviewsMap,
    onOpenInSplitView,
    editor,
    onSelectPage,
    onCreateSubPage,
  ]);

  return (
    <div 
      ref={scrollContainerRef} 
      className="h-full overflow-y-auto pt-12 scrollbar-none"
    >
      <TableOfContents 
        headings={headings} 
        pageId={page._id} 
        isSplitView={isSplitView} 
      />
        {backlinks && backlinks.length > 0 && (
          <BacklinksList
            isSidebarOpen={isSidebarOpen}
            backlinks={backlinks as EnrichedBacklink[]}
            onSelectPage={onSelectPage}
            onOpenInSplitView={onOpenInSplitView}
          />
        )}
        
      <div className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-12 relative">
      
        {page.coverImage && (
          <div className="w-full h-48 rounded-lg overflow-hidden group relative mb-4 mt-8">
            <img 
              src={page.coverImage} 
              alt="Cover" 
              className="w-full h-full object-cover" 
            />
            <button
              onClick={() => onUpdatePage(page._id, { coverImage: undefined })}
              className="absolute top-2 right-2 z-10 p-1 bg-white/70 dark:bg-black/70 rounded shadow text-notion-text dark:text-notion-text-dark opacity-0 group-hover:opacity-100 transition-opacity text-xs"
            >
              Remove Cover
            </button>
          </div>
        )}


        <div className="relative">
        
          <div className={page.coverImage ? 'mt-[-36px] ml-1' : 'mt-8'}>
            <button
              onClick={() => setIsPickerOpen(true)}
              className="text-4xl block hover:bg-notion-hover dark:hover:bg-notion-hover-dark rounded p-1 bg-white dark:bg-notion-bg-dark shadow"
              aria-label="Add icon"
            >
              {page.icon ? (
                page.icon
              ) : (
                <NewPageIcon className="w-8 h-8 text-notion-text-gray dark:text-notion-text-gray-dark" />
              )}
            </button>
            {isPickerOpen && (
              <div className="absolute top-0 left-0 z-10">
                <EmojiPicker
                  onSelect={(emoji) => {
                    onUpdatePage(page._id, { icon: emoji });
                    setIsPickerOpen(false);
                  }}
                  onClose={() => setIsPickerOpen(false)}
                />
              </div>
            )}
          </div>

          {!page.coverImage && (
            <button
              onClick={() => onUpdatePage(page._id, { 
                coverImage: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%D&auto=format&fit=crop&w=1500&q=80" 
              })}
              className="text-sm text-notion-text-gray dark:text-notion-text-gray-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark p-1 rounded ml-1 mt-1"
            >
              Add Cover
            </button>
          )}

          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              debouncedOnTitleChange(e.target.value);
            }}
            placeholder="Untitled"
            className="w-full text-4xl md:text-5xl font-bold border-none outline-none bg-transparent mb-4 placeholder-notion-text-gray/50 dark:placeholder-notion-text-gray-dark/50 mt-4"
          />
        </div>


        {/* Sezione Metadati (Invariata) */}
        <div className="border-y border-notion-border dark:border-notion-border-dark mb-6 py-4 space-y-3">
          
          <div className="flex items-center text-sm">
            <span className="w-24 font-medium text-notion-text-gray dark:text-notion-text-gray-dark">Status</span>
            {page.isPinned ? (
              <div className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded-full">📌 Pinned</span>
                <button 
                  onClick={() => onUpdatePage(page._id, { isPinned: false })}
                  className="text-xs text-notion-text-gray dark:text-notion-text-gray-dark hover:text-red-500"
                >
                  (unpin)
                </button>
              </div>
            ) : (
               <button 
                  onClick={() => onUpdatePage(page._id, { isPinned: true })}
                  className="text-sm text-notion-text-gray dark:text-notion-text-gray-dark hover:text-notion-text dark:hover:text-notion-text-dark"
                >
                  Pin this page
                </button>
            )}
          </div>
          
          <div className="flex items-start">
             <span className="w-24 text-sm font-medium text-notion-text-gray dark:text-notion-text-gray-dark pt-1">Tags</span>
            <div className="flex-1">
              <TagInput
                pageTags={page.tags || []} 
                onUpdatePageTags={(newTags) => onUpdatePage(page._id, { tags: newTags })}
              />
            </div>
          </div>
          
          {page.properties && Object.keys(page.properties).length > 0 && (
             <>
              {Object.entries(page.properties).map(([key, value]) => (
                <div key={key} className="flex items-center text-sm">
                   <span className="w-24 font-medium text-notion-text-gray dark:text-notion-text-gray-dark capitalize">{key}</span>
                   <span className="text-notion-text dark:text-notion-text-dark">{String(value)}</span>
                </div>
              ))}
             </>
          )}
        </div>


        {editor && (
          <BubbleMenu
            editor={editor}
            tippyOptions={{ duration: 100, placement: 'top-start' }}
            className="flex items-center gap-1 bg-white dark:bg-notion-sidebar-dark rounded-lg shadow-lg border border-notion-border dark:border-notion-border-dark p-1"
          >
            <TextSelectionMenu 
              editor={editor} 
              onOpenAiPanel={onOpenAiPanel}
              // Passa la funzione corretta
              onCreatePageFromSelection={handleCreatePageFromSelection} 
            />
          </BubbleMenu>
        )}
        <EditorContent editor={editor} />
        
        <div className="h-32" /> 
        
      </div>
    </div>
  );
});