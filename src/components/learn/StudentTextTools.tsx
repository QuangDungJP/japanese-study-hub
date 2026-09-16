import React, { useEffect, useState, useRef } from 'react';
import { Highlighter, Underline, Eraser } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const StudentTextTools = () => {
  const [showToolbar, setShowToolbar] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      // If clicking inside the toolbar itself, do nothing
      if (toolbarRef.current && toolbarRef.current.contains(e.target as Node)) {
        return;
      }

      setTimeout(() => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          setPosition({
            top: rect.top - 50 + window.scrollY,
            left: rect.left + rect.width / 2 + window.scrollX,
          });
          setShowToolbar(true);
        } else {
          setShowToolbar(false);
        }
      }, 10);
    };

    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.toString().trim().length === 0) {
        setShowToolbar(false);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  const applyFormat = (formatType: 'highlight' | 'underline' | 'clear') => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    // Enable design mode temporarily to use execCommand which handles cross-node selections natively
    document.designMode = "on";
    
    if (formatType === 'highlight') {
      document.execCommand('hiliteColor', false, '#fef08a'); // Tailwind yellow-200
    } else if (formatType === 'underline') {
      document.execCommand('underline', false);
    } else if (formatType === 'clear') {
      document.execCommand('removeFormat', false);
      // execCommand removeFormat doesn't always clear background color, so we clear it manually:
      document.execCommand('hiliteColor', false, 'transparent');
    }
    
    document.designMode = "off";
    
    // Clear selection after applying
    selection.removeAllRanges();
    setShowToolbar(false);
  };

  if (!showToolbar) return null;

  return (
    <div
      ref={toolbarRef}
      className="absolute z-50 flex items-center gap-1 bg-white dark:bg-zinc-800 p-1 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 animate-in fade-in zoom-in-95 duration-100"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
      }}
    >
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-8 w-8 p-0 text-amber-500 hover:text-amber-600 hover:bg-amber-50"
        onMouseDown={(e) => { e.preventDefault(); applyFormat('highlight'); }}
        title="Highlight"
      >
        <Highlighter className="w-4 h-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
        onMouseDown={(e) => { e.preventDefault(); applyFormat('underline'); }}
        title="Gạch chân"
      >
        <Underline className="w-4 h-4" />
      </Button>
      <div className="w-px h-5 bg-zinc-200 mx-1" />
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-8 w-8 p-0 text-zinc-500 hover:text-red-500 hover:bg-red-50"
        onMouseDown={(e) => { e.preventDefault(); applyFormat('clear'); }}
        title="Xóa định dạng"
      >
        <Eraser className="w-4 h-4" />
      </Button>
    </div>
  );
};
