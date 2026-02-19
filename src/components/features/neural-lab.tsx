
"use client";

import React from "react";
import { Microscope, Badge } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { IntegrityCheck } from "./lab/integrity-check";
import { OptimizerSim } from "./lab/optimizer-sim";

/**
 * [STABILITY_ANCHOR: SEGMENTED_LAB_V1]
 * المنسق الرئيسي للمختبر العصبي - تم التفكيك لضمان الاستقرار الوظيفي.
 */
export function NeuralLab() {
  const { user } = useAuth();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 font-sans">
      <header className="text-right space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-2">
          <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest">Protocol v5.5</span>
        </div>
        <h1 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4 justify-end">
          المختبر العصبي
          <Microscope className="text-indigo-400 size-10" />
        </h1>
        <p className="text-muted-foreground text-lg">بيئة محاكاة ومعايرة لضمان استقرار العقد والروابط الذكية.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20">
        <IntegrityCheck user={user} />
        <OptimizerSim />
      </div>
    </div>
  );
}
