import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Page } from '../App'; // Assumendo che il tipo Page sia esportato da App.tsx
import { GlobeIcon, CopyIcon, CheckIcon, XIcon } from './icons'; // Assicurati di avere CheckIcon

interface ShareMenuProps {
  page: Page;
}

export const ShareMenu: React.FC<ShareMenuProps> = ({ page }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isPublic, setIsPublic] = useState(page.isPublic || false);
  const [shareId, setShareId] = useState(page.shareId || null);
  const [isLoading, setIsLoading] = useState(false);

  const toggleAccess = useMutation(api.pages.togglePublicAccess);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const publicUrl = shareId
    ? `${window.location.origin}/share/${shareId}`
    : '';

  useEffect(() => {
    setIsPublic(page.isPublic || false);
    setShareId(page.shareId || null);
  }, [page.isPublic, page.shareId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const newShareId = await toggleAccess({ id: page._id });
      setShareId(newShareId);
      setIsPublic(!!newShareId);
    } catch (error) {
      console.error('Failed to toggle sharing', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setIsCopying(true);
    setTimeout(() => setIsCopying(false), 2000);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(true)}
        className="flex items-center text-sm text-notion-text-gray dark:text-notion-text-dark px-2 py-1 rounded-md hover:bg-notion-hover dark:hover:bg-notion-hover-dark transition-colors"
      >
        <GlobeIcon className="w-4 h-4 mr-1" />
        {isPublic ? 'Condiviso' : 'Condividi'}
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute top-full right-0 mt-2 w-72 bg-notion-bg dark:bg-notion-bg-dark border border-notion-border dark:border-notion-border-dark rounded-md shadow-lg p-3 z-20"
        >
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold">Condividi sul web</h4>
            <button onClick={() => setIsOpen(false)} className="p-1 rounded hover:bg-notion-hover dark:hover:bg-notion-hover-dark">
              <XIcon className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-notion-text-gray dark:text-notion-text-gray-dark">
              Chiunque abbia il link può vedere
            </p>
            <button
              onClick={handleToggle}
              disabled={isLoading}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isPublic ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isPublic ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {isPublic && !isLoading && (
            <div className="mt-4">
              <label className="text-xs font-medium text-notion-text-gray dark:text-notion-text-gray-dark">
                Copia link pubblico
              </label>
              <div className="flex space-x-2 mt-1">
                <input
                  type="text"
                  readOnly
                  value={publicUrl}
                  className="w-full text-sm p-1.5 bg-notion-hover dark:bg-notion-hover-dark border border-notion-border dark:border-notion-border-dark rounded-md"
                />
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-md text-notion-text-gray dark:text-notion-text-gray-dark hover:bg-notion-hover dark:hover:bg-notion-hover-dark"
                >
                  {isCopying ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {isLoading && (
            <p className="text-sm text-center text-notion-text-gray dark:text-notion-text-gray-dark mt-4">
              Aggiornamento...
            </p>
          )}
        </div>
      )}
    </div>
  );
};
