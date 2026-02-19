
"use client";

import React, { useRef } from "react";
import { Wand2, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
  input: string;
  setInput: (val: string) => void;
  isAITyping: boolean;
  isEditing: boolean;
  onSend: () => void;
  onFileSelect: (file: File) => void;
}

/**
 * [STABILITY_ANCHOR: CHAT_INPUT_NODE_V1]
 * عقدة الإدخال المستقلة - تدعم الطلبات العصبية والمرفقات.
 */
export function ChatInput({ input, setInput, isAITyping, isEditing, onSend, onFileSelect }: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="p-8 bg-white/5 border-t border-white/5">
      <div className="relative flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            variant="ghost" 
            size="icon" 
            className="size-14 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10"
          >
            <ImageIcon className="size-6 text-indigo-400" />
          </Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileSelect(file);
            }} 
          />
        </div>

        <Input 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && onSend()} 
          placeholder={isEditing ? "تعديل الطلب..." : "تحدث إلى NexusAI..."} 
          className="h-14 bg-white/5 border-white/10 rounded-2xl px-8 text-right flex-1 text-white shadow-inner focus-visible:ring-primary" 
          dir="auto" 
          disabled={isAITyping}
        />
        
        <Button 
          onClick={onSend} 
          disabled={isAITyping || (!input.trim())} 
          size="icon" 
          className="size-14 rounded-2xl bg-primary shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          {isAITyping ? <Loader2 className="animate-spin" /> : <Wand2 className="size-6" />}
        </Button>
      </div>
    </div>
  );
}
