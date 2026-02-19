
"use client";

import React, { useState, useEffect } from "react";
import { Users, Loader2 } from "lucide-react";
import { getStoredUsers, User } from "@/lib/auth-store";
import { useToast } from "@/hooks/use-toast";
import { NodeSearch } from "./directory/node-search";
import { NodeCard } from "./directory/node-card";

/**
 * [STABILITY_ANCHOR: SEGMENTED_DIRECTORY_V2]
 * المنسق الرئيسي لسجل العقد - يدعم الآن التمرير الوظيفي للنخاع.
 */
export function NodeDirectory({ onNavigate }: { onNavigate?: (tab: any) => void }) {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadNodes = async () => {
      setIsLoading(true);
      try {
        const data = await getStoredUsers();
        setUsers(data);
      } catch (err) {
        toast({ variant: "destructive", title: "Sync Failure", description: "Node Directory unreachable." });
      } finally {
        setIsLoading(false);
      }
    };
    loadNodes();
  }, []);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.classification?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 font-sans text-right">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 flex-row-reverse text-right">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-2">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-widest">Verified Network</span>
          </div>
          <h1 className="text-5xl font-headline font-bold text-white tracking-tight flex items-center gap-4 justify-end">
            سجل العقد الحية
            <Users className="text-emerald-400 size-10" />
          </h1>
          <p className="text-muted-foreground text-lg">دليل العقد البشرية والآلية النشطة في النخاع - بيانات حقيقية وموثقة.</p>
        </div>
      </header>

      <NodeSearch value={search} onChange={setSearch} count={users.length} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
        {isLoading ? (
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="h-80 rounded-[2.5rem] bg-white/5 animate-pulse border border-white/5" />
          ))
        ) : filteredUsers.length === 0 ? (
          <div className="col-span-full py-32 text-center opacity-30 flex flex-col items-center">
            <Users className="size-16 mb-4" />
            <p className="text-xl font-bold">لم يتم العثور على أي عقد نشطة مطابقة</p>
          </div>
        ) : (
          filteredUsers.map((u) => (
            <NodeCard 
              key={u.id} 
              user={u} 
              onChat={() => onNavigate?.("chat")} 
            />
          ))
        )}
      </div>
    </div>
  );
}
