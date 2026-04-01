'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, StickyNote, FileText, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionFabProps {
  onAddNote: () => void;
  onAddTask: () => void;
}

/**
 * [STABILITY_ANCHOR: QUICK_ACTION_FAB_V2.0_MERGED]
 * زر الإجراءات السريعة المطور — Nexus V2
 */
export function QuickActionFab({ onAddNote, onAddTask }: QuickActionFabProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-10 left-10 z-50 flex flex-col-reverse items-center gap-4">
      {/* Backdrop Blur when Open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm -z-10 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Main Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'size-16 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex items-center justify-center transition-all duration-700 relative overflow-hidden',
          isOpen
            ? 'bg-slate-900 border border-white/20'
            : 'bg-primary border border-primary/20 hover:scale-105 active:scale-95'
        )}
        whileHover={{ rotate: 5 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
        <AnimatePresence mode="wait">
          <motion.div
            key={isOpen ? 'close' : 'open'}
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? <X className="size-7 text-white" /> : <Plus className="size-8 text-white" />}
          </motion.div>
        </AnimatePresence>
      </motion.button>

      {/* Action Sub-Buttons */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.button
              initial={{ opacity: 0, scale: 0.3, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.3, y: 30 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              onClick={() => { onAddNote(); setIsOpen(false); }}
              className="size-14 rounded-2xl bg-amber-500 hover:bg-amber-600 shadow-2xl flex items-center justify-center group relative border border-amber-400/20 active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <StickyNote className="size-6 text-white group-hover:scale-110 transition-transform" />
              <div className="absolute right-20 bg-slate-900/90 backdrop-blur-xl text-white text-[10px] font-black px-4 py-2 rounded-xl border border-white/10 whitespace-nowrap shadow-2xl transform origin-right">
                ADD QUICK NOTE
              </div>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, scale: 0.3, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.3, y: 30 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
              onClick={() => { onAddTask(); setIsOpen(false); }}
              className="size-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 shadow-2xl flex items-center justify-center group relative border border-emerald-400/20 active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <FileText className="size-6 text-white group-hover:scale-110 transition-transform" />
              <div className="absolute right-20 bg-slate-900/90 backdrop-blur-xl text-white text-[10px] font-black px-4 py-2 rounded-xl border border-white/10 whitespace-nowrap shadow-2xl transform origin-right">
                CREATE NEW TASK
              </div>
            </motion.button>
            
            <div className="opacity-40 text-[9px] font-mono tracking-widest text-primary mb-2 flex items-center gap-1">
               <Sparkles className="size-3" /> ACTION_NODES_READY
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
