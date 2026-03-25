'use client';

import React, { useState, useEffect } from "react";
import { Github, Link as LinkIcon, ExternalLink, Search, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAgentStore, type GitHubRepo } from "@/lib/agent-store";
import { connectGitHubAccount } from "@/lib/github-auth-service";
import { getUserRepos } from "@/lib/github-sync-service";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * [STABILITY_ANCHOR: GITHUB_EXPLORER_V1.0]
 * واجهة استكشاف GitHub - تسمح للمستخدم بربط حساباته ومستودعاته.
 */

export function GitHubExplorer() {
  const { githubToken, linkedRepo, setGithubToken, setLinkedRepo, addLog } = useAgentStore();
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const { accessToken } = await connectGitHubAccount();
      setGithubToken(accessToken);
      addLog("تم ربط حساب GitHub بنجاح عبر OAuth.", "success");
      toast({ title: "✅ تم الاتصال", description: "تم ربط حساب GitHub بنجاح." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "فشل الاتصال", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRepos = async () => {
    if (!githubToken) return;
    setIsLoading(true);
    try {
      const data = await getUserRepos(githubToken);
      setRepos(data);
    } catch (error: any) {
      toast({ variant: "destructive", title: "خطأ في الجلب", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (githubToken && repos.length === 0) {
      fetchRepos();
    }
  }, [githubToken]);

  const filteredRepos = repos.filter(repo => 
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!githubToken) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6 animate-in fade-in duration-500">
        <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 shadow-2xl relative group">
          <div className="absolute inset-0 bg-primary/5 rounded-[3rem] blur-3xl group-hover:bg-primary/10 transition-colors" />
          <Github className="size-24 text-white mx-auto relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white tracking-tight">ربط GitHub</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">قم بربط حسابك لتمكين المهندس العصبي من الوصول لمشاريعك البرمجية والعمل عليها مباشرة.</p>
        </div>
        <Button 
          onClick={handleConnect} 
          disabled={isLoading}
          className="bg-white text-black hover:bg-white/90 px-10 h-14 rounded-2xl text-lg font-bold shadow-xl transition-all hover:scale-105 active:scale-95"
        >
          {isLoading ? <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> : <Github className="mr-2 h-5 w-5" />}
          الاتصال عبر GitHub
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900/20 animate-in slide-in-from-right duration-500">
      <div className="p-6 border-b border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl">
              <Github className="size-5 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-white">مستودعاتك</h3>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchRepos} 
            disabled={isLoading}
            className="text-slate-400 hover:text-white"
          >
            <RefreshCw className={cn("size-4 mr-2", isLoading && "animate-spin")} />
            تحديث القائمة
          </Button>
        </div>

        <div className="relative group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-slate-500 group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="بحث في مشاريعك..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white/5 border-white/10 rounded-xl pr-10 pl-4 h-11 focus:ring-primary/20 focus:border-primary/40 focus:bg-white/[0.07] transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {filteredRepos.map((repo) => {
          const isLinked = linkedRepo?.id === repo.id;
          return (
            <div 
              key={repo.id}
              className={cn(
                "group p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden",
                isLinked 
                  ? "bg-primary/10 border-primary/30 shadow-lg shadow-primary/5" 
                  : "bg-white/[0.03] border-white/5 hover:border-white/20 hover:bg-white/[0.05]"
              )}
              onClick={() => {
                setLinkedRepo(repo);
                addLog(`تم ربط المستودع: ${repo.full_name}`, "success");
              }}
            >
              {isLinked && (
                <div className="absolute inset-0 bg-primary/5 animate-pulse-slow pointer-events-none" />
              )}
              
              <div className="flex items-start justify-between relative z-10">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 group-hover:text-white transition-colors">{repo.name}</span>
                    {repo.private && (
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md border border-white/5 border-slate-700">PRIVATE</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1 max-w-[250px]">{repo.description || "لا يوجد وصف."}</p>
                </div>
                
                {isLinked ? (
                  <CheckCircle2 className="size-5 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                ) : (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="size-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(repo.html_url, '_blank');
                    }}
                  >
                    <ExternalLink className="size-4 text-slate-400" />
                  </Button>
                )}
              </div>
              
              <div className="mt-3 flex items-center gap-4 text-[10px] text-slate-500 font-mono">
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="size-3" />
                  {repo.default_branch}
                </span>
                <span className="opacity-30">|</span>
                <span className="truncate">{repo.full_name}</span>
              </div>
            </div>
          );
        })}

        {filteredRepos.length === 0 && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50 p-12 text-center">
            <Search className="size-12 mb-4" />
            <p className="text-sm font-medium">لا توجد مستودعات تطابق بحثك</p>
          </div>
        )}
      </div>
    </div>
  );
}
