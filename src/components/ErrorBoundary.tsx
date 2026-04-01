import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-zinc-200/50 max-w-lg w-full border border-zinc-100 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-8 mx-auto">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-zinc-950 mb-4">Application Error</h1>
            <p className="text-zinc-500 text-sm font-medium mb-8 leading-relaxed">
              An unexpected error occurred. This might be due to a temporary connection issue or a state conflict.
            </p>
            
            <div className="bg-zinc-50 p-6 rounded-2xl text-[10px] font-mono text-zinc-600 overflow-auto max-h-48 mb-8 border border-zinc-100 text-left leading-normal">
              <div className="font-black uppercase tracking-widest mb-2 text-zinc-400">Error Details</div>
              {this.state.error?.stack || this.state.error?.message || 'Unknown Error'}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-zinc-950 text-white py-5 rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-zinc-200"
              >
                Refresh Application
              </button>
              <button
                onClick={() => {
                  sessionStorage.clear();
                  window.location.reload();
                }}
                className="w-full bg-white text-zinc-500 py-4 rounded-2xl font-bold text-xs hover:text-zinc-950 transition-all"
              >
                Reset Session & Clear Data
              </button>
            </div>
            
            <p className="mt-8 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
              TheraDoc Clinical AI • v1.2.0
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
