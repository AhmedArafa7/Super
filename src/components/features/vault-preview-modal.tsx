import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { VaultPreviewContent } from "./vault-preview-content";

interface VaultPreviewModalProps {
  asset: any | null;
  onClose: () => void;
  onRefresh?: () => void;
  onToggleFloating?: () => void;
}

/**
 * [STABILITY_ANCHOR: VAULT_PREVIEW_V2.1]
 * المودال العائم للمعاينة - يستخدم VaultPreviewContent بداخله.
 */
export function VaultPreviewModal({ asset, onClose, onRefresh, onToggleFloating }: VaultPreviewModalProps) {
  if (!asset) return null;

  return (
    <Dialog open={!!asset} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl bg-slate-950 border-white/10 p-0 overflow-hidden rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.9)] focus:outline-none flex flex-col h-[85vh]">
        <VaultPreviewContent 
          asset={asset} 
          onClose={onClose} 
          onRefresh={onRefresh} 
          isFloating={true}
          onToggleFloating={onToggleFloating}
        />
      </DialogContent>
    </Dialog>
  );
}
