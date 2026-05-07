import React from 'react';
import { applyCurrencyMask } from '../utils/masks';

export const ProgressBar = ({ label, realizado, meta, isDark = false, isCurrency = false }) => {
    const metaVal = Number(meta) || 0;
    const pct = metaVal > 0 ? Math.min(Math.round((realizado / metaVal) * 100), 100) : 0;
    const bgBar = isDark ? 'bg-neutral-800' : 'bg-neutral-100';
    const fillBar = pct >= 100 ? 'bg-green-500' : 'bg-[#E3000F]';
    const textMain = isDark ? 'text-white' : 'text-neutral-800';
    const textSub = isDark ? 'text-neutral-400' : 'text-neutral-500';
    const formattedRealizado = isCurrency ? applyCurrencyMask(realizado) : realizado;
    const formattedMeta = isCurrency ? applyCurrencyMask(metaVal) : metaVal;

    return (
        <div className="mb-4 last:mb-0">
            <div className="flex justify-between items-end mb-1.5">
                <span className={`text-xs font-bold uppercase tracking-wider ${textSub}`}>{label}</span>
                <div className="text-right">
                    <span className={`text-lg font-black ${textMain}`}>{formattedRealizado}</span>
                    <span className={`text-xs ml-1 ${textSub}`}>/ {formattedMeta}</span>
                </div>
            </div>
            <div className={`w-full ${bgBar} rounded-full h-1.5 overflow-hidden`}>
                <div className={`${fillBar} h-full rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }}></div>
            </div>
        </div>
    );
};