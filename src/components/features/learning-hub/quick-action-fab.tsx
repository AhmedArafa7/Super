'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, StickyNote, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionFabProps {
  onAddNote: () => void;
  onAddTask: () => void;
}

export function QuickActionFab({ onAddNote, onAddTask }: QuickActionFabProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-4 sm:left-6 z-50 flex flex-col-reverse items-center gap-3">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'size-12 sm:size-14 rounded-2xl shadow-2xl flex items-center justify-center transition-colors duration-300',
          isOpen
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-primary hover:bg-primary/90'
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {isOpen ? <X className="size-5 sm:size-6 text-white" /> : <Plus className="size-5 sm:size-6 text-white" />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.button
              initial={{ opacity: 0, scale: 0.3, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.3, y: 20 }}
              transition={{ delay: 0.05 }}
              onClick={() => { onAddNote(); setIsOpen(false); }}
              className="size-11 sm:size-12 rounded-xl bg-amber-500 hover:bg-amber-600 shadow-xl flex items-center justify-center group relative active:scale-95 transition-transform"
            >
              <StickyNote className="size-5 text-white" />
              <span className="absolute right-14 sm:right-16 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden sm:block">
                ملاحظة سريعة
              </span>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, scale: 0.3, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.3, y: 20 }}
              transition={{ delay: 0.1 }}
              onClick={() => { onAddTask(); setIsOpen(false); }}
              className="size-11 sm:size-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 shadow-xl flex items-center justify-center group relative active:scale-95 transition-transform"
            >
              <FileText className="size-5 text-white" />
              <span className="absolute right-14 sm:right-16 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden sm:block">
                مهمة جديدة
              </span>
            </motion.button>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
