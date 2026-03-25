'use client';

import React, { useRef } from "react";
import { Send, XCircle, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  onStop?: () => void;
  imageDataUri?: string | null;
  onImageChange?: (uri: string | null) => void;
}

export function ChatInput({ 
  value, 
  onChange, 
  onSend, 
  isLoading, 
  onStop,
  imageDataUri,
  onImageChange 
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            onImageChange?.(event.target?.result as string);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onImageChange?.(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="px-8 pb-10 pt-2 bg-slate-900/60 backdrop-blur-2xl border-t border-white/5 relative z-10">
      
      {/* Image Preview Area */}
      {imageDataUri && (
        <div className="absolute -top-32 left-8 animate-in slide-in-from-bottom-4 duration-300">
          <div className="relative group p-1.5 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
            <img 
              src={imageDataUri} 
              alt="Preview" 
              className="h-24 w-auto rounded-xl object-cover shadow-lg border border-white/5" 
            />
            <button 
              onClick={() => onImageChange?.(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto relative group">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="أمر البرمجة... (مثلاً: ابدأ بناء مشروع جديد)"
          className="w-full bg-white/[0.03] border border-white/10 rounded-[2rem] px-8 py-5 pr-32 min-h-[70px] max-h-[300px] text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none font-medium text-base shadow-inner group-hover:border-white/20"
          rows={1}
        />
        
        <div className="absolute left-4 bottom-4 flex items-center gap-2">
          {/* hidden input */}
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            accept="image/*"
            onChange={handleFileChange}
          />
          
          <Button
            size="icon"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            className="size-11 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all"
          >
            <ImageIcon className="size-5" />
          </Button>

          {isLoading ? (
            <Button
              size="icon"
              onClick={onStop}
              className="size-11 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 animate-pulse shadow-lg shadow-red-500/10"
            >
              <XCircle className="size-6" />
            </Button>
          ) : (
            <Button
              onClick={onSend}
              disabled={!value.trim() && !imageDataUri}
              className="size-11 rounded-full bg-gradient-to-br from-primary to-blue-600 text-white shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale disabled:hover:scale-100"
            >
              <Send className="size-5 -rotate-45 ml-0.5" />
            </Button>
          )}
        </div>
        
        <div className="absolute right-6 bottom-5 pointer-events-none">
          <span className="text-[10px] items-center gap-1.5 text-white/10 font-black tracking-[0.2em] uppercase flex">
            <span className="size-1.5 rounded-full bg-primary/30 animate-pulse" />
            Neural Interface V2.5
          </span>
        </div>
      </div>
    </div>
  );
}
