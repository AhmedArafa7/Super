
"use client";

import React from "react";
import { BookOpen, GraduationCap, Clock, ArrowRight, Brain, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { addNotification } from "@/lib/notification-store";
import { useToast } from "@/hooks/use-toast";

const COURSES = [
  { id: "c1", title: "Neural Networks 101", level: "Beginner", time: "45m", icon: Brain },
  { id: "c2", title: "Quantum Computing Basics", level: "Intermediate", time: "2h", icon: Zap },
  { id: "c3", title: "AI Ethics & Protocol", level: "Advanced", time: "1h", icon: GraduationCap },
  { id: "c4", title: "Next.js Hyper-Speed", level: "Intermediate", time: "1.5h", icon: BookOpen },
];

export function KnowledgeHub() {
  const { toast } = useToast();

  const handleRemindMe = (courseTitle: string) => {
    toast({
      title: "Reminder Set",
      description: `You will be notified about "${courseTitle}" in 5 seconds.`,
    });

    setTimeout(() => {
      addNotification({
        type: 'learning_reminder',
        title: 'Neural Session Starting',
        message: `⏰ Time to start your session: "${courseTitle}". The virtual classroom is ready.`,
      });
    }, 5000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-12">
        <h2 className="text-4xl font-headline font-bold text-white tracking-tight mb-2">Knowledge Hub</h2>
        <p className="text-muted-foreground text-lg">Enhance your neural capabilities with modular learning paths.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {COURSES.map((course) => (
          <div key={course.id} className="group p-6 glass rounded-[2.5rem] border-white/5 hover:border-indigo-500/30 transition-all duration-300 flex flex-col">
            <div className="size-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 mb-6 group-hover:scale-110 transition-transform">
              <course.icon className="size-7 text-indigo-400" />
            </div>
            <Badge variant="outline" className="w-fit mb-3 border-white/10 text-muted-foreground text-[10px] uppercase tracking-widest">{course.level}</Badge>
            <h3 className="text-xl font-bold text-white mb-2">{course.title}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
              <Clock className="size-3" />
              {course.time} estimated
            </div>
            <div className="mt-auto space-y-2">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl h-10">Start Learning</Button>
              <Button 
                variant="ghost" 
                className="w-full rounded-xl text-xs text-muted-foreground hover:text-white"
                onClick={() => handleRemindMe(course.title)}
              >
                Remind Me Later
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 glass rounded-[3rem] p-8 border-indigo-500/20 flex flex-col md:flex-row items-center gap-8">
        <div className="size-20 bg-indigo-500 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <GraduationCap className="size-10 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-white mb-2">Master the Nexus Protocol</h3>
          <p className="text-muted-foreground">Join 15,000+ users currently learning advanced prompt engineering and neural automation.</p>
        </div>
        <Button variant="outline" className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 rounded-xl px-8 h-12">
          View Curriculum
          <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  );
}
