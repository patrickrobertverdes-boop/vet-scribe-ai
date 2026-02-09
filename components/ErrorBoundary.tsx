'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);

        // Log to monitoring service if available
        if (typeof window !== 'undefined' && (window as any).errorLogger) {
            (window as any).errorLogger(error, errorInfo);
        }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-dvh w-full flex items-center justify-center bg-background p-6">
                    <div className="max-w-md w-full space-y-8 text-center">
                        <div className="flex justify-center">
                            <div className="h-20 w-20 rounded-2xl bg-rose-100 border-2 border-rose-500 flex items-center justify-center">
                                <AlertTriangle className="h-10 w-10 text-rose-600" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-2xl font-bold text-foreground">
                                Something Went Wrong
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                The application encountered an unexpected error.
                                Your data is safe, but you'll need to refresh the page.
                            </p>
                        </div>

                        {this.state.error && (
                            <div className="p-4 bg-muted rounded-xl text-left">
                                <p className="text-xs font-mono text-foreground break-all">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={this.handleReset}
                                className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Reload Application
                            </button>

                            <button
                                onClick={() => window.location.href = '/'}
                                className="w-full h-12 border border-border rounded-xl font-bold text-sm text-foreground hover:bg-muted transition-colors"
                            >
                                Return to Dashboard
                            </button>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            If this problem persists, please contact support.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
