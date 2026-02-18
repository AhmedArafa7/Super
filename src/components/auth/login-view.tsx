
'use client';

import React, { useState } from 'react';
import { useAuth } from './auth-provider';
import { Layers, ShieldCheck, Lock, AlertCircle, Loader2, UserPlus, LogIn, UserCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

type ViewMode = 'login' | 'register';

export function LoginView() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<ViewMode>('login');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const success = await login(username, password);
        if (!success) setError('Neural credentials rejected. Unauthorized access attempt logged.');
      } else {
        if (!name.trim()) {
          setError('Identity Name is required for node initialization.');
          setIsLoading(false);
          return;
        }
        const success = await register(username, name);
        if (!success) setError('Node ID already exists in the registry. Choose another.');
      }
    } catch (err) {
      setError('System authentication error. Node unreachable.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden font-sans">
      <div className="absolute top-0 right-0 size-96 bg-primary/10 blur-[120px] -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 size-96 bg-indigo-500/10 blur-[120px] -ml-48 -mb-48" />

      <Card className="w-full max-w-md glass border-white/5 rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden">
        <div className="p-10">
          <CardHeader className="p-0 mb-8 flex flex-col items-center text-center">
            <div className="size-16 bg-primary rounded-3xl flex items-center justify-center shadow-lg shadow-primary/20 mb-6">
              <Layers className="text-white size-8" />
            </div>
            <CardTitle className="text-3xl font-headline font-bold text-white tracking-tight">NexusAI</CardTitle>
            <p className="text-muted-foreground text-sm mt-2 font-bold uppercase tracking-widest">
              {mode === 'login' ? 'Neural Link Required' : 'Initialize New Node'}
            </p>
          </CardHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'register' && (
              <div className="space-y-2 text-right animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="name" className="text-right block">Identity Name (Full Name)</Label>
                <div className="relative">
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Full Identity"
                    className="bg-white/5 border-white/10 h-12 rounded-xl focus-visible:ring-primary pl-10 text-right"
                    required
                  />
                  <UserCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                </div>
              </div>
            )}

            <div className="space-y-2 text-right">
              <Label htmlFor="username" className="text-right block">Node ID (Username)</Label>
              <div className="relative">
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="unique_id"
                  className="bg-white/5 border-white/10 h-12 rounded-xl focus-visible:ring-primary pl-10 text-right"
                  required
                />
                <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2 text-right">
              <Label htmlFor="password" className="text-right block">Security Code</Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-white/5 border-white/10 h-12 rounded-xl focus-visible:ring-primary pl-10 text-right"
                  required
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400 rounded-xl">
                <AlertCircle className="size-4" />
                <AlertDescription className="text-xs text-right">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-primary text-white hover:bg-primary/90 rounded-xl font-bold shadow-lg shadow-primary/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Synchronizing...
                </>
              ) : mode === 'login' ? (
                'Initiate Neural Link'
              ) : (
                'Authorize Node'
              )}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <button 
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 w-full"
            >
              {mode === 'login' ? (
                <><UserPlus className="size-3" /> Don't have a node? Create one now</>
              ) : (
                <><LogIn className="size-3" /> Already have a node? Link now</>
              )}
            </button>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold mt-6">
              Neural Network Secured by Nexus Core
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
