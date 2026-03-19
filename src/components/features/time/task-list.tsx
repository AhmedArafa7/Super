'use client';

import React, { useState } from "react";
import { Plus, Trash2, CheckCircle2, Circle, ListTodo, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTimeStore, Task } from "@/lib/time-store";
import { cn } from "@/lib/utils";

export function TaskList() {
  const [newTitle, setNewTitle] = useState("");
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const { tasks, addTask, toggleTask, deleteTask } = useTimeStore();

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addTask(newTitle, priority);
    setNewTitle("");
  };

  const priorityColors = {
    high: "text-red-400 border-red-500/20 bg-red-500/10",
    medium: "text-amber-400 border-amber-500/20 bg-amber-500/10",
    low: "text-indigo-400 border-indigo-500/20 bg-indigo-500/10"
  };

  return (
    <Card className="glass border-white/5 rounded-[2.5rem] p-8 flex flex-col h-full shadow-2xl">
      <div className="flex items-center justify-between mb-8 flex-row-reverse">
        <h3 className="text-xl font-bold text-white flex items-center gap-3 flex-row-reverse">
          <ListTodo className="text-primary" /> قائمة المهام اليومية
        </h3>
        <Badge variant="outline" className="border-white/10 opacity-50">{tasks.length} مهام</Badge>
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex gap-3 flex-row-reverse">
          <Input 
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="ما الذي تود إنجازه؟"
            className="bg-white/5 border-white/10 h-12 text-right rounded-xl focus-visible:ring-primary"
            dir="auto"
          />
          <Button onClick={handleAdd} className="h-12 w-12 bg-primary rounded-xl shrink-0 shadow-lg shadow-primary/20">
            <Plus className="size-6" />
          </Button>
        </div>
        
        <div className="flex gap-2 justify-end">
          {(['high', 'medium', 'low'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all",
                priority === p ? "bg-primary border-primary text-white" : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
              )}
            >
              {p === 'high' ? 'عالية' : p === 'medium' ? 'متوسطة' : 'منخفضة'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
        {tasks.length === 0 ? (
          <div className="py-20 text-center opacity-20 flex flex-col items-center gap-3">
            <CheckCircle2 className="size-12" />
            <p className="text-sm font-bold">كل شيء مكتمل! استمتع بوقتك.</p>
          </div>
        ) : (
          tasks.map(task => (
            <div 
              key={task.id}
              className={cn(
                "p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4 transition-all hover:bg-white/10 group flex-row-reverse",
                task.completed && "opacity-50 grayscale"
              )}
            >
              <button 
                onClick={() => toggleTask(task.id)}
                className={cn(
                  "size-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                  task.completed ? "bg-green-500 border-green-500" : "border-white/20"
                )}
              >
                {task.completed && <CheckCircle2 className="size-4 text-white" />}
              </button>
              
              <div className="flex-1 text-right min-w-0">
                <p className={cn("text-sm font-bold truncate", task.completed && "line-through")}>{task.title}</p>
                <div className="flex items-center gap-2 justify-end mt-1">
                  <Badge className={cn("text-[8px] border-none px-2 py-0", priorityColors[task.priority])}>
                    {task.priority.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <button 
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
