'use client';

import React, { useRef, useEffect } from "react";
import { Send, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ChatInputProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange' | 'onSubmit'> {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  onStop?: () => void;
  
  // Slots for high flexibility
  leftAttachments?: React.ReactNode;
  rightAttachments?: React.ReactNode;
  topContent?: React.ReactNode;
  bottomContent?: React.ReactNode;
  
  // Customization
  sendButtonIcon?: React.ReactNode;
  sendButtonClassName?: string;
  hideSendButton?: boolean;
  wrapperClassName?: string;
  inputClassName?: string;
  
  // Advanced generic events handled specifically for chat
  onPasteImage?: (file: File) => void;
  submitOnEnter?: boolean;
}

export const SharedChatInput = React.forwardRef<HTMLTextAreaElement, ChatInputProps>(({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  onStop,
  leftAttachments,
  rightAttachments,
  topContent,
  bottomContent,
  sendButtonIcon = <Send className="size-5 -rotate-45 ml-0.5" />,
  sendButtonClassName,
  hideSendButton = false,
  wrapperClassName,
  inputClassName,
  onPasteImage,
  submitOnEnter = true,
  className,
  placeholder = "اكتب رسالتك...",
  disabled,
  ...props
}, forwardedRef) => {

  const internalRef = useRef<HTMLTextAreaElement>(null);
  
  // Merge refs so both standard ref works and our internal one works
  const ref = forwardedRef || internalRef;
  const textAreaRef = (ref && typeof ref !== "function") ? ref : internalRef;

  // Auto-resize logic for the text area based on its content
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto";
      textAreaRef.current.style.height = `${Math.min(textAreaRef.current.scrollHeight, 300)}px`;
    }
  }, [value, textAreaRef]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (submitOnEnter && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled && !isLoading) {
        onSubmit();
      }
    }
    props.onKeyDown?.(e);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (onPasteImage) {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            onPasteImage(file);
            break;
          }
        }
      }
    }
    props.onPaste?.(e);
  };

  return (
    <div className={cn("relative w-full z-10", wrapperClassName)}>
      
      {/* Optional Top Content Slot (e.g., Image Previews) */}
      {topContent && (
        <div className="absolute -top-32 left-8 animate-in slide-in-from-bottom-4 duration-300">
          {topContent}
        </div>
      )}

      <div className={cn("max-w-4xl mx-auto relative group", className)}>
        <textarea
          {...props}
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className={cn(
            "w-full bg-white/[0.03] border border-white/10 rounded-[2rem] px-8 py-5 pr-32 min-h-[70px] max-h-[300px] text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none font-medium text-base group-hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed",
            inputClassName
          )}
          rows={1}
        />
        
        <div className="absolute left-4 bottom-4 flex items-center gap-2">
          
          {/* Custom Left Attachments Slot */}
          {leftAttachments}

          {/* Action Buttons */}
          {!hideSendButton && (
            isLoading && onStop ? (
              <Button
                size="icon"
                onClick={onStop}
                className="size-11 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 animate-pulse shadow-lg shadow-red-500/10 shrink-0"
              >
                <XCircle className="size-6" />
              </Button>
            ) : (
              <Button
                onClick={onSubmit}
                disabled={!value.trim() || disabled || isLoading}
                className={cn(
                  "size-11 rounded-full bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg border-0 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale disabled:hover:scale-100 shrink-0",
                  sendButtonClassName
                )}
              >
                {sendButtonIcon}
              </Button>
            )
          )}
          
          {/* Custom Right Attachments Slot */}
          {rightAttachments}
        </div>
        
        {/* Optional Bottom Decorator/Content Slot */}
        {bottomContent && (
          <div className="absolute right-6 bottom-5 pointer-events-none">
            {bottomContent}
          </div>
        )}
      </div>
    </div>
  );
});

SharedChatInput.displayName = "SharedChatInput";
