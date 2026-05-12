import React from 'react';
import { Globe, ExternalLink } from 'lucide-react';
import { SISTEMAS_LINKS } from '../utils/constants';

export const SistemasClaro = () => {
    // Failsafe: Garante que o painel não quebre se a lista não vier do constants.js
    const linksSeguros = Array.isArray(SISTEMAS_LINKS) ? SISTEMAS_LINKS : [];

    return (
        <div className="h-full flex flex-col animate-fade-in transition-colors">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">Portal de Sistemas Claro</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Acesso rápido e direto às plataformas e ferramentas corporativas.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 overflow-y-auto pb-4 pr-2">
                {linksSeguros.map((sys, idx) => (
                    <a
                        key={idx}
                        href={sys.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-lg hover:border-[#E3000F] dark:hover:border-[#E3000F] hover:-translate-y-1 transition-all duration-300 group flex flex-col items-center justify-center text-center gap-3 relative overflow-hidden h-36"
                    >
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <ExternalLink size={16} className="text-[#E3000F]" />
                        </div>
                        <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 text-[#E3000F] flex items-center justify-center group-hover:bg-[#E3000F] group-hover:text-white transition-colors duration-300">
                            <Globe size={24} />
                        </div>
                        <span className="font-bold text-neutral-700 dark:text-neutral-300 text-[11px] uppercase tracking-wide group-hover:text-neutral-900 dark:group-hover:text-neutral-100 leading-tight">
                            {sys.name}
                        </span>
                    </a>
                ))}
            </div>
        </div>
    );
};