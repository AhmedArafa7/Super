"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  name: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class LocalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[LocalErrorBoundary: ${this.props.name}] Error:`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center p-8 border border-red-500/10 bg-red-500/5 rounded-3xl text-center space-y-4 m-4">
          <div className="size-16 bg-red-500/20 rounded-full flex items-center justify-center text-red-500">
            <AlertCircle className="size-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-white font-bold">Calibration Error: {this.props.name}</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              This node is currently unstable. Re-sync in progress.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={this.handleRetry}
            className="rounded-xl border-white/10 hover:bg-white/5 gap-2"
          >
            <RefreshCw className="size-3" /> Retry Sync
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * [STABILITY_ANCHOR: SAFE_COMPONENT_WRAPPER_V1.0]
 * غلاف الأمان للمكونات - يعزل الأخطاء ويمنع الانهيار الشامل.
 */
export function SafeComponentWrapper({ children, name, fallback }: Props) {
  return (
    <LocalErrorBoundary name={name} fallback={fallback}>
      {children}
    </LocalErrorBoundary>
  );
}

/**
 * Fallback مخصص للـ Sidebar
 */
export function SidebarFallback() {
  return (
    <div className="w-64 border-r border-white/5 bg-slate-900/50 flex flex-col items-center justify-center space-y-4">
      <div className="size-12 bg-primary/10 rounded-xl animate-pulse flex items-center justify-center text-primary">
        <Layers className="size-6" />
      </div>
      <div className="h-4 w-32 bg-white/5 rounded-full animate-pulse" />
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}
