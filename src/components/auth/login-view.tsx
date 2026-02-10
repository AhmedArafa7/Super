
'use client';

import React, { useState } from 'react';
import { useAuth } from './auth-provider';
import { Layers, ShieldCheck, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function LoginView() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(username, password);
      if (!success) {
        setError('Invalid neural credentials. Access denied.');
      }
    } catch (err) {
      setError('System authentication error. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 size-96 bg-primary/10 blur-[120px] -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 size-96 bg-indigo-500/10 blur-[120px] -ml-48 -mb-48" />

      <Card className="w-full max-w-md glass border-white/5 rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden">
        <div className="p-10">
          <CardHeader className="p-0 mb-8 flex flex-col items-center text-center">
            <div className="size-16 bg-primary rounded-3xl flex items-center justify-center shadow-lg shadow-primary/20 mb-6">
              <Layers className="text-white size-8" />
            </div>
            <CardTitle className="text-3xl font-headline font-bold text-white tracking-tight">NexusAI</CardTitle>
            <p className="text-muted-foreground text-sm mt-2">Neural Link Authentication Required</p>
          </CardHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Neural ID</Label>
              <div className="relative">
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="bg-white/5 border-white/10 h-12 rounded-xl focus-visible:ring-primary pl-10"
                  required
                />
                <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Security Code</Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-white/5 border-white/10 h-12 rounded-xl focus-visible:ring-primary pl-10"
                  required
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400 rounded-xl">
                <AlertCircle className="size-4" />
                <AlertDescription className="text-xs">{error}</AlertDescription>
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
              ) : (
                'Initiate Neural Link'
              )}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-3">Restricted Access Protocol</p>
            <p className="text-xs text-muted-foreground/60 leading-relaxed">
              Don't have an account? Contact the Nexus Administrator to request an invitation key.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
