
'use client';

import React, { useState } from 'react';
import { useAuth } from './auth-provider';
import { Layers, ShieldCheck, Lock, AlertCircle, Loader2, UserPlus, LogIn, UserCircle, Github } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

type ViewMode = 'login' | 'register';

export function LoginView() {
  const { login, register, loginWithGoogle, loginWithGithub, loginAnonymously } = useAuth();
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
        if (!success) {
          setError('بيانات الدخول غير صحيحة. هل قمت بإنشاء حساب؟');
        }
      } else {
        if (!name?.trim()) {
          setError('يرجى إدخال اسمك الكامل.');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('كلمة السر يجب أن تكون 6 أحرف على الأقل.');
          setIsLoading(false);
          return;
        }
        const success = await register(username, name, password);
        if (!success) setError('اسم المستخدم موجود بالفعل، اختر اسماً آخر.');
      }
    } catch (err: any) {
      if (err.message?.includes('invalid-credential')) {
        setError('خطأ في كلمة السر أو اسم المستخدم. يرجى التأكد من البيانات.');
      } else {
        setError('حدث خطأ في النظام. يرجى المحاولة لاحقاً.');
      }
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
              {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
            </p>
          </CardHeader>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <Button 
              variant="outline" 
              onClick={() => loginWithGoogle()}
              className="h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 gap-2 font-bold text-xs"
            >
              <svg className="size-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </Button>
            <Button 
              variant="outline" 
              onClick={() => loginWithGithub()}
              className="h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 gap-2 font-bold text-xs"
            >
              <Github className="size-4" />
              GitHub
            </Button>
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase font-black text-muted-foreground"><span className="bg-slate-950 px-4 tracking-widest">أو عبر المعرف</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'register' && (
              <div className="space-y-2 text-right">
                <Label htmlFor="name" className="text-right block">الاسم الكامل</Label>
                <div className="relative">
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="اسمك الحقيقي"
                    className="bg-white/5 border-white/10 h-12 rounded-xl focus-visible:ring-primary pl-10 text-right"
                    required
                  />
                  <UserCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                </div>
              </div>
            )}

            <div className="space-y-2 text-right">
              <Label htmlFor="username" className="text-right block">اسم المستخدم</Label>
              <div className="relative">
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Unique ID"
                  className="bg-white/5 border-white/10 h-12 rounded-xl focus-visible:ring-primary pl-10 text-right"
                  required
                />
                <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2 text-right">
              <Label htmlFor="password" className="text-right block">كلمة السر</Label>
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
                  جاري المزامنة...
                </>
              ) : mode === 'login' ? (
                'تسجيل الدخول'
              ) : (
                'إنشاء الحساب'
              )}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
            <button 
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 w-full"
            >
              {mode === 'login' ? (
                <><UserPlus className="size-3" /> ليس لديك حساب؟ أنشئ واحداً الآن</>
              ) : (
                <><LogIn className="size-3" /> لديك حساب بالفعل؟ سجل دخولك</>
              )}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
              <div className="relative flex justify-center text-[8px] uppercase font-black text-muted-foreground/30"><span className="bg-slate-950 px-4 tracking-widest">أو</span></div>
            </div>

            <button 
              onClick={() => loginAnonymously()}
              className="text-[10px] text-muted-foreground hover:text-white font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2 w-full py-2 hover:bg-white/5 rounded-lg"
            >
              استمر كضيف (محدود)
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
