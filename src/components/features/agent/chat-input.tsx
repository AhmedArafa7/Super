'use client';

import React, { useRef } from "react";
import { Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SharedChatInput } from "@/components/ui/chat-input";

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

  const handlePasteImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      onImageChange?.(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const TopContent = imageDataUri ? (
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
  ) : null;

  const LeftAttachments = (
    <>
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
        className="size-11 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all shrink-0"
      >
        <ImageIcon className="size-5" />
      </Button>
    </>
  );

  const BottomContent = (
    <span className="text-[10px] items-center gap-1.5 text-white/10 font-black tracking-[0.2em] uppercase flex">
      <span className="size-1.5 rounded-full bg-primary/30 animate-pulse" />
      Neural Interface V2.5
    </span>
  );

  return (
    <div className="px-8 pb-10 pt-2 bg-slate-900/60 backdrop-blur-2xl border-t border-white/5 relative z-10 w-full">
      <SharedChatInput 
        value={value}
        onChange={onChange}
        onSubmit={onSend}
        isLoading={isLoading}
        onStop={onStop}
        placeholder="أمر البرمجة... (مثلاً: ابدأ بناء مشروع جديد)"
        onPasteImage={handlePasteImage}
        topContent={TopContent}
        leftAttachments={LeftAttachments}
        bottomContent={BottomContent}
        inputClassName="pl-32 pr-8 pb-10"
      />
    </div>
  );
}
