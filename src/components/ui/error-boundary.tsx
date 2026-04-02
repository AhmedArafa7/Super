'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  componentStack: string | null | undefined;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    componentStack: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, componentStack: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({
      componentStack: errorInfo.componentStack,
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 font-sans">
          <div className="max-w-md w-full bg-slate-900 border border-red-500/20 rounded-[2.5rem] p-8 text-center shadow-2xl">
            <div className="size-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <AlertCircle className="size-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">عذراً، حدث خطأ تقني</h2>
            <p className="text-muted-foreground mb-6 text-sm">تم رصد خلل في أحد مكونات الواجهة (Ref: s_not_func). يرجى المحاولة مرة أخرى.</p>
            
            <div className="bg-black/40 rounded-xl p-4 mb-6 text-left overflow-auto max-h-32">
              <code className="text-[10px] text-red-400 block whitespace-pre-wrap">
                {this.state.error?.toString()}
              </code>
            </div>

            <Button 
              onClick={() => window.location.reload()}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold gap-2"
            >
              <RefreshCw className="size-4" /> تحديث الصفحة الـ Hard Refresh
            </Button>
            
            <p className="mt-6 text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-50">
              Nexus Neural Guard Active
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
