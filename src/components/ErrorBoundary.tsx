import React, { Component, ReactNode } from 'react';
import { useLanguage } from '../LanguageContext';

interface ErrorBoundaryProps {
  children: ReactNode;
  t: (key: string) => string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Without an error boundary, any render-time error in React unmounts the whole
 * tree and every page goes blank until a hard reload. This boundary contains
 * the damage to a single recoverable error screen.
 */
class ErrorBoundaryView extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public props: ErrorBoundaryProps;
  state: ErrorBoundaryState = { error: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('Render error caught by ErrorBoundary:', error);
  }

  render() {
    const { children } = this.props;

    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-8 text-center">
          <div className="max-w-md">
            <div className="w-16 h-16 bg-[#FAF7F2] border border-stone-300 rounded-full flex items-center justify-center mb-6 mx-auto">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="font-editorial-serif text-3xl font-bold text-stone-900 mb-2">{this.props.t('error.something_wrong')}</h2>
            <p className="text-stone-500 font-serif italic mb-6">
              {this.props.t('error.unexpected_page')}
            </p>
            <div className="text-[10px] font-mono text-stone-400 mb-8 bg-stone-100 border border-stone-200 px-3 py-2 rounded text-left break-all">
              {this.state.error.message}
            </div>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="bg-[#1A1A1A] hover:bg-black text-white text-xs font-bold uppercase tracking-widest px-6 py-3 transition-colors cursor-pointer"
              >
                {this.props.t('common.reload')}
              </button>
              <button
                onClick={() => window.location.assign('/')}
                className="text-xs font-bold uppercase tracking-widest text-stone-600 hover:text-stone-900 px-6 py-3 transition-colors cursor-pointer"
              >
                {this.props.t('common.go_home')}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

export function ErrorBoundary({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  return <ErrorBoundaryView t={t} children={children} />;
}
