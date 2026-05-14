import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Erro capturado pelo Error Boundary:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-100 dark:bg-neutral-950 p-6 text-center">
                    <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl shadow-xl border border-red-200 dark:border-red-900/30 max-w-lg w-full flex flex-col items-center">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                            <AlertTriangle size={32} />
                        </div>
                        <h1 className="text-2xl font-black text-neutral-800 dark:text-neutral-100 mb-2">Ops! Algo deu errado.</h1>
                        <p className="text-neutral-500 dark:text-neutral-400 mb-6">Ocorreu um erro interno ao renderizar a tela. Nossa equipe foi notificada.</p>
                        <div className="w-full bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/20 text-left overflow-auto mb-6 max-h-40">
                            <code className="text-xs text-red-600 dark:text-red-400 font-mono">{this.state.error && this.state.error.toString()}</code>
                        </div>
                        <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full py-3 bg-[#E3000F] text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg flex items-center justify-center gap-2"><RefreshCcw size={18} /> Limpar Cache e Recarregar</button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
} 