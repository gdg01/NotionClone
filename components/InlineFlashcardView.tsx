import React, { useState, useEffect, useRef } from 'react'
import { NodeViewWrapper, NodeViewProps, Editor } from '@tiptap/react'
import { SparkleIcon } from './icons'
import { useMutation, useAction } from 'convex/react'
import { api } from '../convex/_generated/api'
import { Id } from '../convex/_generated/dataModel'

export const InlineFlashcardView: React.FC<NodeViewProps> = ({
  node,
  editor,
  updateAttributes,
}) => {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false)
  const [answerText, setAnswerText] = useState(node.attrs.answer || '')
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const upsertCard = useMutation(api.flashcards.upsertFromSyntax)
  const generateAnswer = useAction(api.ai.getAnswerForQuestion)

  const { currentPageId } = editor.extensionManager.extensions.find(
    (ext) => ext.name === 'pageLink',
  )?.options || { currentPageId: null }

  // --- NUOVA FUNZIONE: Per mettere a fuoco alla fine del testo ---
  const focusTextareaAtEnd = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current
      textarea.focus()
      const length = textarea.value.length
      textarea.setSelectionRange(length, length)
    }
  }

  useEffect(() => {
    if (node.attrs.answer === null) {
      setIsOverlayOpen(true)
      setAnswerText('')
      // --- MODIFICA: Usa la nuova funzione ---
      setTimeout(() => focusTextareaAtEnd(), 100)
    }
  }, [node.attrs.answer])

  const saveAndCloseOverlay = async () => {
    if (isSaving || !isOverlayOpen) {
      return
    }
    if (!currentPageId || !node.attrs.id) {
      console.error('Manca pageId o blockId per salvare la flashcard')
      setIsOverlayOpen(false)
      return
    }

    setIsSaving(true)
    try {
      const flashcardId = await upsertCard({
        front: node.attrs.question,
        back: answerText,
        sourcePageId: currentPageId as Id<'pages'>,
        sourceBlockId: node.attrs.id,
      })

      updateAttributes({
        answer: answerText,
        flashcardId: flashcardId,
      })
    } catch (e) {
      console.error('Salvataggio fallito', e)
    } finally {
      setIsSaving(false)
      setIsOverlayOpen(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        saveAndCloseOverlay()
      }
    }
    if (isOverlayOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOverlayOpen, answerText, isSaving]) // Assicura che la funzione abbia i valori aggiornati

  const openOverlay = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsOverlayOpen(true)
    setAnswerText(node.attrs.answer || '')
    // --- MODIFICA: Usa la nuova funzione ---
    setTimeout(() => focusTextareaAtEnd(), 100)
  }

  const handleGenerateAI = async () => {
    setIsLoadingAI(true)
    try {
      const context = editor.state.doc.textContent

      const aiAnswer = await generateAnswer({
        question: node.attrs.question,
        context: context,
      })

      if (aiAnswer) {
        setAnswerText(aiAnswer)
        // --- MODIFICA: Usa la nuova funzione ---
        setTimeout(() => focusTextareaAtEnd(), 0)
      }
    } catch (err) {
      console.error('Errore generazione AI:', err)
    }
    setIsLoadingAI(false)
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setAnswerText(newValue)

    if (newValue.includes('??')) {
      setAnswerText(newValue.replace('??', ''))
      handleGenerateAI()
    }
  }

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      saveAndCloseOverlay()
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      saveAndCloseOverlay()
    }
  }

  return (
    <>
      <NodeViewWrapper
        as="span"
        className={`relative inline-flex items-baseline p-1 rounded-md cursor-pointer transition-colors
          bg-transparent 
          hover:bg-notion-hover dark:hover:bg-notion-hover-dark 
          ${isOverlayOpen ? 'bg-notion-hover dark:bg-notion-hover-dark' : ''}`}
        onClick={openOverlay}
      >
        💡<span className="font-bold">{node.attrs.question}</span>
      </NodeViewWrapper>

      {/* Popover */}
      {isOverlayOpen && (
        <div
          ref={popoverRef}
          className="absolute top-full left-0 z-50 mt-1 
                     bg-notion-bg dark:bg-notion-sidebar-dark shadow-xl rounded-lg p-2 w-80 "
          contentEditable={false}
          // --- MODIFICA: Rimossi onClick e onMouseDown per permettere il doppio click nella textarea ---
        >
          <textarea
            ref={textareaRef}
            value={answerText}
            onChange={handleTextChange}
            onKeyDown={handleTextareaKeyDown}
            disabled={isLoadingAI}
            placeholder={
              isLoadingAI
                ? 'Genero la risposta AI...'
                : "Scrivi la risposta qui... (o '??' per l'IA)"
            }
            className="w-full p-2 text-sm   rounded-md bg-notion-sidebar dark:bg-notion-sidebar-dark focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            rows={3}
          />
        </div>
      )}
    </>
  )
}