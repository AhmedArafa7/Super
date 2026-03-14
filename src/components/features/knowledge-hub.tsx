"use client";

import React from "react";
import { Library } from "lucide-react";
import { VaultExplorer } from "./vault-explorer";

/**
 * [STABILITY_ANCHOR: KNOWLEDGE_HUB_V5.0]
 * واجهة المكتبة المركزية - تعتمد الآن بشكل كامل على Google Drive عبر VaultExplorer.
 */
export function KnowledgeHub() {
  return (
    <div className="h-full w-full animate-in fade-in duration-700">
      <VaultExplorer 
        folderId="13PPxL5FD4f0aVhhI7JMuoQo8oEENRoEm" 
        title="المكتبة التعليمية" 
        icon={<Library className="size-6 text-indigo-400" />} 
      />
    </div>
  );
}
