import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 dark:bg-[#050505] flex flex-col items-center justify-center p-4">
          <div className="glass-panel bg-white/90 dark:bg-black/40 p-8 rounded-[2rem] max-w-lg w-full border border-black/10 dark:border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <h2 className="text-2xl font-display font-bold text-red-600 dark:text-red-400 mb-4 tracking-tight">Something went wrong</h2>
            <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl overflow-auto max-h-48 text-xs font-mono text-slate-700 dark:text-slate-300 border border-black/5 dark:border-white/5 break-words">
              {this.state.error?.message}
            </div>
            <button
              className="mt-6 w-full bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 border border-red-500/30 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all duration-300 hover:scale-[0.98]"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
