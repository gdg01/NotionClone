// File: components/BlockActions.tsx (Corretto)

import React, { useState, useRef, useEffect } from 'react';
import type { Editor } from '@tiptap/core';
import { Node } from '@tiptap/pm/model'; // Importa il tipo Node
import { 
    DragIcon, 
    TrashIcon, 
    ArrowUpRightIcon, 
    RefreshCwIcon, 
    ChevronRightIcon, 
    TextIcon, 
    Heading1Icon, 
    Heading2Icon, 
    Heading3Icon, 
    ListIcon, 
    ListOrderedIcon, 
    CalloutIcon, 
    QuoteIcon, 
    CodeIcon,
    ArrowLeftIcon
} from './icons';

// Props del componente (invariate)
interface BlockActionsProps {
    editor: Editor;
    pos: number;
    pageId: string | null;
}

const TurnIntoMenu = ({ editor, pos, closeMenus }: { editor: Editor; pos: number; closeMenus: () => void; }) => {
    
    // Controllo di sicurezza (invariato, ma corretto)
    let node: Node | null | undefined;
    try {
        node = editor.state.doc.nodeAt(pos);
    } catch (e) {
        console.warn(`Error resolving node at pos ${pos} in TurnIntoMenu:`, e);
        return null; 
    }
    
    if (!node) {
        return null; 
    }
    
    // --- INIZIO MODIFICA: Ordine della catena di comandi ---
    // Ora usiamo .setNodeSelection(pos).focus() invece di .focus().setNodeSelection(pos)
    const turnIntoOptions = [
        { 
            name: 'Text', 
            icon: TextIcon, 
            command: () => editor.chain().setNodeSelection(pos).focus().setParagraph().run(), 
            isActive: node.type.name === 'paragraph'
        },
        { 
            name: 'Heading 1', 
            icon: Heading1Icon, 
            command: () => editor.chain().setNodeSelection(pos).focus().toggleHeading({ level: 1 }).run(), 
            isActive: node.type.name === 'heading' && node.attrs.level === 1 
        },
        { 
            name: 'Heading 2', 
            icon: Heading2Icon, 
            command: () => editor.chain().setNodeSelection(pos).focus().toggleHeading({ level: 2 }).run(), 
            isActive: node.type.name === 'heading' && node.attrs.level === 2 
        },
        { 
            name: 'Heading 3', 
            icon: Heading3Icon, 
            command: () => editor.chain().setNodeSelection(pos).focus().toggleHeading({ level: 3 }).run(), 
            isActive: node.type.name === 'heading' && node.attrs.level === 3 
        },
        { 
            name: 'Bulleted list', 
            icon: ListIcon, 
            command: () => editor.chain().setNodeSelection(pos).focus().toggleBulletList().run(), 
            isActive: node.type.name === 'bulletList' 
        },
        { 
            name: 'Numbered list', 
            icon: ListOrderedIcon, 
            command: () => editor.chain().setNodeSelection(pos).focus().toggleOrderedList().run(), 
            isActive: node.type.name === 'orderedList' 
        },
        { 
            name: 'Quote', 
            icon: QuoteIcon, 
            command: () => editor.chain().setNodeSelection(pos).focus().toggleBlockquote().run(), 
            isActive: node.type.name === 'blockquote' 
        },
        { 
            name: 'Callout', 
            icon: CalloutIcon, 
            command: () => editor.chain().setNodeSelection(pos).focus().toggleCallout().run(), 
            isActive: node.type.name === 'callout' 
        },
        { 
            name: 'Code block', 
            icon: CodeIcon, 
            command: () => editor.chain().setNodeSelection(pos).focus().toggleCodeBlock().run(), 
            isActive: node.type.name === 'codeBlock' 
        },
    ];
    // --- FINE MODIFICA ---

    return (
        <div className="block-submenu-content"> 
            {turnIntoOptions.map(option => (
                <button
                    key={option.name}
                    className={`block-menu-item ${option.isActive ? 'is-active' : ''}`}
                    onClick={() => {
                        option.command();
                        closeMenus();
                    }}
                >
                    <option.icon className="w-4 h-4 mr-2 flex-shrink-0" />
                    {option.name}
                </button>
            ))}
        </div>
    );
};

// Componente principale BlockActions (invariato)
export const BlockActions: React.FC<BlockActionsProps> = ({ editor, pos, pageId }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuView, setMenuView] = useState<'main' | 'turnInto'>('main');
    const [menuHeight, setMenuHeight] = useState<string | number>('auto');
    const [copyLinkText, setCopyLinkText] = useState('Copy Link');

    const menuRef = useRef<HTMLDivElement>(null);
    const mainViewRef = useRef<HTMLDivElement>(null);
    const turnIntoViewRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const toggleMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        const newOpenState = !menuOpen;
        setMenuOpen(newOpenState);
        
        if (newOpenState) {
            setMenuView('main');
            requestAnimationFrame(() => {
                setMenuHeight(mainViewRef.current?.scrollHeight || 'auto');
            });
        } else {
            setMenuHeight(0);
        }
    }

    const deleteNode = () => {
        try {
            const node = editor.state.doc.nodeAt(pos);
            if(node) {
                editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run();
            }
        } catch (e) {
            console.warn(`Error deleting node at pos ${pos}:`, e);
        }
        closeAllMenus();
    };

    const copyLinkToBlock = () => {
        try {
            const node = editor.state.doc.nodeAt(pos);
            const blockId = node?.attrs.id;
            
            if (blockId && pageId) {
                const url = new URL(window.location.href);
                url.hash = `${pageId}:${blockId}`;
                const urlToCopy = url.href;

                navigator.clipboard.writeText(urlToCopy).then(() => {
                    setCopyLinkText('Copied!');
                    setTimeout(() => setCopyLinkText('Copy Link'), 2000);
                });
            } else {
                setCopyLinkText('Error');
                setTimeout(() => setCopyLinkText('Copy Link'), 2000);
            }
        } catch (e) {
            console.warn(`Error copying link for node at pos ${pos}:`, e);
            setCopyLinkText('Error');
            setTimeout(() => setCopyLinkText('Copy Link'), 2000);
        }
        closeAllMenus();
    };

    const showTurnIntoMenu = () => {
        setMenuView('turnInto');
        setMenuHeight(turnIntoViewRef.current?.scrollHeight || 'auto');
    };

    const showMainMenu = () => {
        setMenuView('main');
        setMenuHeight(mainViewRef.current?.scrollHeight || 'auto');
    };

    const closeAllMenus = () => {
        setMenuOpen(false);
        setMenuHeight(0);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (buttonRef.current && buttonRef.current.contains(target)) return;
            if (menuRef.current && !menuRef.current.contains(target)) {
                closeAllMenus();
            }
        };
        if (menuOpen) {
             document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen]);


    // (JSX invariato)
    return (
        <div className={`block-handle ${menuOpen ? 'is-active' : ''}`} contentEditable={false}>
            <button
                ref={buttonRef}
                className="handle-button"
                data-drag-handle 
                onClick={toggleMenu}
                aria-label="Drag or open menu"
            >
                <DragIcon className="w-5 h-5" />
            </button>
            
            <div 
                ref={menuRef} 
                // --- MODIFICA: Aggiunto z-20 e pointer-events-auto ---
                className="block-menu z-20 pointer-events-auto"
                // --- FINE MODIFICA ---
                style={{
                    position: 'absolute',
                    overflow: 'hidden',
                    height: (menuHeight + 12) + 'px',
                    transition: 'height 0.2s ease-in-out, opacity 0.2s ease-in-out',
                    opacity: menuOpen ? 1 : 0,
                }}
            > 
                <div
                    ref={mainViewRef}
                    style={{
                        position: 'absolute',
                        width: '100%',
                        transition: 'transform 0.2s ease-in-out',
                        transform: menuView === 'main' ? 'translateX(0)' : 'translateX(-100%)',
                    }}
                >
                    <button className="block-menu-item" onClick={deleteNode}>
                        <TrashIcon className="w-4 h-4 mr-2" />
                        Delete
                    </button>
                     <button className="block-menu-item" onClick={copyLinkToBlock} title="Copy link to block">
                        <ArrowUpRightIcon className="w-4 h-4 mr-2" />
                        {copyLinkText}
                    </button>
                    <button 
                        className="block-menu-item w-full"
                        onClick={showTurnIntoMenu}
                    >
                        <RefreshCwIcon className="w-4 h-4 mr-2" />
                        Turn into
                        <ChevronRightIcon className="w-4 h-4 ml-auto text-notion-text-gray dark:text-notion-text-gray-dark" />
                    </button>
                </div>

                <div
                    ref={turnIntoViewRef}
                    style={{
                        position: 'absolute',
                        width: '100%',
                        transition: 'transform 0.2s ease-in-out',
                        transform: menuView === 'turnInto' ? 'translateX(0)' : 'translateX(100%)',
                    }}
                >
                    <button className="block-menu-item w-full" onClick={showMainMenu}>
                        <ArrowLeftIcon className="w-4 h-4 mr-2" />
                        Torna indietro
                    </button>
                    <div className="border-t border-notion-border dark:border-notion-border-dark my-1 mx-2"></div>
                    
                    <TurnIntoMenu editor={editor} pos={pos} closeMenus={closeAllMenus} />
                </div>
            </div>
        </div>
    );
};