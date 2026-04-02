"use client";

import React from "react";
import LearningHub from "./learning-hub/learning-hub";

/**
 * [STABILITY_ANCHOR: KNOWLEDGE_HUB_V6.0]
 * واجهة التعلم المركزية - تم إعادة بنائها بالكامل كمركز تعليمي شامل.
 * يدعم 5 مواد دراسية، 6 أقسام فرعية، جدول أسبوعي، وعمليات CRUD كاملة.
 */
export function KnowledgeHub() {
  return (
    <div className="h-full w-full animate-in fade-in duration-700">
      <LearningHub />
    </div>
  );
}
