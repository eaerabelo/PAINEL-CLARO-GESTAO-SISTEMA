import React, { useState, useEffect } from 'react';
import { Target, Lock, Check, History, MonitorPlay, Smartphone, Home, Watch, ShieldCheck, Save, LineChart, Loader2 } from 'lucide-react';
import { METAS_PADRAO } from '../utils/constants';
import { applyCurrencyMask, parseCurrencyToFloat } from '../utils/masks';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const safeMetasPadrao = METAS_PADRAO || { receita: 0, posTotal: 0, posPago: 0, controle: 0, urTotal: 0, fibra: 0, tv: 0, fixo: 0, aparelho: 0, acessorio: 0, pelicula: 0, seguro: 0, mesh: 0, trocafy: 0, mplay: 0 };

export const Meta = ({ hasAccess, canEdit, setAuthModal, goalsDB, setGoalsDB, currentYYYYMM, salesData = [], globalMonth }) => {
    const [selectedGoalMonth, setSelectedGoalMonth] = useState(currentYYYYMM);
    const [goalForm, setGoalForm] = useState({ ...safeMetasPadrao, receita: applyCurrencyMask(safeMetasPadrao.receita) });
    const [showGoalSuccess, setShowGoalSuccess] = useState(false);
    const [metaActiveSubTab, setMetaActiveSubTab] = useState('DEFINIR');
    const [selectedSxsMonth, setSelectedSxsMonth] = useState(globalMonth || currentYYYYMM);

    const [allHistoricalSales, setAllHistoricalSales] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    useEffect(() => {
        if (metaActiveSubTab === 'COMPARATIVO' || metaActiveSubTab === 'SEMANAL') {
            const fetchHistory = async () => {
                setIsLoadingHistory(true);
                try {
                    const response = await fetch(`${API_URL}/api/vendas`);
                    const data = await response.json();
                    setAllHistoricalSales(data);
                } catch (error) {
                    console.error("Erro ao buscar histórico via API:", error);
                } finally {
                    setIsLoadingHistory(false);
                }
            };
            fetchHistory();
        }
    }, [metaActiveSubTab]);

    useEffect(() => {
        setSelectedSxsMonth(globalMonth || currentYYYYMM);
    }, [globalMonth, currentYYYYMM]);

    useEffect(() => {
        const data = (goalsDB || {})[selectedGoalMonth] || {
            receita: 0, posTotal: 0, posPago: 0, controle: 0, urTotal: 0,
            fibra: 0, tv: 0, fixo: 0, aparelho: 0, acessorio: 0, pelicula: 0, seguro: 0, mesh: 0, trocafy: 0, mplay: 0, desafio: 0
        };
        setGoalForm({ ...data, receita: applyCurrencyMask(data.receita) });
    }, [selectedGoalMonth, goalsDB]);

    const handleGoalChange = (e) => {
        let { name, value } = e.target;
        if (name === 'receita') value = applyCurrencyMask(value);
        else value = value.replace(/\D/g, '');
        setGoalForm(prev => ({ ...prev, [name]: value }));
    };

    const saveGoals = (e) => {
        e.preventDefault();
        if (!canEdit) return;
        setGoalsDB(prev => ({
            ...prev,
            [selectedGoalMonth]: {
                ...goalForm,
                receita: parseCurrencyToFloat(goalForm.receita),
                posTotal: Number(goalForm.posTotal), posPago: Number(goalForm.posPago), controle: Number(goalForm.controle),
                urTotal: Number(goalForm.urTotal), fibra: Number(goalForm.fibra), tv: Number(goalForm.tv), fixo: Number(goalForm.fixo) || 0,
                aparelho: Number(goalForm.aparelho), acessorio: Number(goalForm.acessorio), pelicula: Number(goalForm.pelicula),
                seguro: Number(goalForm.seguro), mesh: Number(goalForm.mesh), mplay: Number(goalForm.mplay), trocafy: Number(goalForm.trocafy),
                lastUpdated: Date.now()
            }
        }));
        setShowGoalSuccess(true);
        setTimeout(() => setShowGoalSuccess(false), 3000);
    };

    const handleCopyFromPreviousMonth = () => {
        const [year, month] = (selectedGoalMonth || '').split('-');
        let prevMonth = parseInt(month, 10) - 1;
        let prevYear = parseInt(year, 10);
        if (prevMonth === 0) { prevMonth = 12; prevYear -= 1; }
        const prevKey = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
        const prevData = (goalsDB || {})[prevKey];
        if (prevData) setGoalForm({ ...prevData, receita: applyCurrencyMask(prevData.receita) });
        else setGoalForm({ ...safeMetasPadrao, receita: applyCurrencyMask(safeMetasPadrao.receita) });
    };

    const monthNames = Object.keys(goalsDB || {}).sort((a, b) => b.localeCompare(a));

    const monthlyMetrics = React.useMemo(() => {
        const metricsByMonth = {};
        const sourceData = allHistoricalSales.length > 0 ? allHistoricalSales : salesData;

        (sourceData || []).forEach(sale => {
            if (!sale.data) return;
            
            let saleMonth = '';
            if (typeof sale.data === 'string') {
                if (sale.data.includes('-')) {
                    saleMonth = sale.data.slice(0, 7);
                } else if (sale.data.includes('/')) {
                    const parts = sale.data.split('/');
                    if (parts.length === 3) saleMonth = `${parts[2]}-${parts[1]}`;
                }
            }

            if (!saleMonth) return;

            if (!metricsByMonth[saleMonth]) {
                metricsByMonth[saleMonth] = {
                    receita: 0, posTotal: 0, posPago: 0, controle: 0, urTotal: 0, fibra: 0, tv: 0, fixo: 0, aparelho: 0, acessorio: 0, pelicula: 0, seguro: 0, mplay: 0
                };
            }

            const pBase = String(sale.produtoBase || sale.produto || '').toUpperCase();
            const op = String(sale.tipoOperacao || sale.operacao || '').toUpperCase();
            const sub = String(sale.subOption || sale.subtipo || '').toUpperCase();
            const rec = Number(sale.receita) || 0;
            const q = Number(sale.qtda) || 1;

            metricsByMonth[saleMonth].receita += rec;

            let posTt = 0, controle = 0, depPg = 0, depBl = 0, depGratis = 0, migracaoPos = 0, migracaoControle = 0, grossPme = 0;
            let bl = 0, flex = 0, fibra = 0, tv = 0, tvBox = 0, fixo = 0, urPme = 0, aparelho = 0, acessorio = 0, pelicula = 0, seguro = 0;

            if (pBase.includes('PÓS PME') || pBase === 'PME' || pBase.includes('POS PME')) { grossPme += q; }
            else if (pBase.includes('PÓS') || pBase.includes('POS')) { if (op.includes('MIGRA') || pBase.includes('MIGRA') || sub.includes('MIGRA')) migracaoPos += q; else posTt += q; }
            else if (pBase.includes('CONTROLE')) { if (op.includes('MIGRA') || pBase.includes('MIGRA') || sub.includes('MIGRA')) migracaoControle += q; else controle += q; }
            else if (pBase.includes('FLEX')) { if (op.includes('MIGRA') || pBase.includes('MIGRA') || sub.includes('MIGRA')) migracaoControle += q; else flex += q; }
            else if (pBase.includes('DEPENDENTE') || pBase.includes('DEP')) { if (sub.includes('GRATUITO') || sub.includes('GRÁTIS') || sub.includes('GRATIS') || pBase.includes('GRÁTIS')) depGratis += q; else if (sub.includes('BANDA-LARGA') || sub.includes('BANDA LARGA')) depBl += q; else depPg += q; }
            else if (pBase.includes('BANDA LARGA') || pBase === 'BL' || pBase.includes('CLARO NET VIRTUA')) bl += q;
            else if (pBase.includes('FIBRA PME') || pBase.includes('UR PME')) urPme += q;
            else if (pBase.includes('FIBRA') || pBase.includes('BANDA LARGA RESIDENCIAL')) fibra += q;
            else if (pBase.includes('TV-BOX')) tvBox += q;
            else if (pBase.includes('CLARO TV+') || pBase.includes('TV')) tv += q;
            else if (pBase.includes('FIXO') || pBase.includes('NET FONE')) fixo += q;
            else if (pBase.includes('APARELHO')) { aparelho += q; }
            else if (pBase.includes('ACESSÓRIO') || pBase.includes('ACESSORIO')) { acessorio += q; }
            else if (pBase.includes('PELÍCULA') || pBase.includes('PELICULA')) { pelicula += q; }
            else if (pBase.includes('SEGURO')) seguro += q;

            if (sale.mplay === 'SIM') metricsByMonth[saleMonth].mplay += 1;

            metricsByMonth[saleMonth].posTotal += (posTt + controle + depPg + depBl + depGratis + migracaoPos + migracaoControle + grossPme + bl + flex);
            metricsByMonth[saleMonth].posPago += (posTt + migracaoPos + depPg + depBl + depGratis);
            metricsByMonth[saleMonth].controle += (controle + migracaoControle);
            metricsByMonth[saleMonth].urTotal += (fibra + tv + tvBox + fixo + urPme);
            metricsByMonth[saleMonth].fibra += (fibra + bl);
            metricsByMonth[saleMonth].tv += (tv + tvBox);
            metricsByMonth[saleMonth].fixo += fixo;
            metricsByMonth[saleMonth].aparelho += aparelho;
            metricsByMonth[saleMonth].acessorio += acessorio;
            metricsByMonth[saleMonth].pelicula += pelicula;
            metricsByMonth[saleMonth].seguro += seguro;
        });

        return metricsByMonth;
    }, [allHistoricalSales, salesData]);

    const weeklyMetrics = React.useMemo(() => {
        const [yearStr, monthStr] = selectedSxsMonth.split('-');
        const daysInMonth = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10), 0).getDate();
        const week5Label = daysInMonth > 28 ? `Semana 5 (29 a ${daysInMonth})` : 'Semana 5 (N/A)';

        const sourceData = allHistoricalSales.length > 0 ? allHistoricalSales : salesData;

        const weeks = [
            { label: 'Semana 1 (01 a 07)', receita: 0, posTotal: 0, posPago: 0, controle: 0, urTotal: 0, fibra: 0, tv: 0, aparelho: 0, acessorio: 0, pelicula: 0, seguro: 0, mplay: 0 },
            { label: 'Semana 2 (08 a 14)', receita: 0, posTotal: 0, posPago: 0, controle: 0, urTotal: 0, fibra: 0, tv: 0, aparelho: 0, acessorio: 0, pelicula: 0, seguro: 0, mplay: 0 },
            { label: 'Semana 3 (15 a 21)', receita: 0, posTotal: 0, posPago: 0, controle: 0, urTotal: 0, fibra: 0, tv: 0, aparelho: 0, acessorio: 0, pelicula: 0, seguro: 0, mplay: 0 },
            { label: 'Semana 4 (22 a 28)', receita: 0, posTotal: 0, posPago: 0, controle: 0, urTotal: 0, fibra: 0, tv: 0, aparelho: 0, acessorio: 0, pelicula: 0, seguro: 0, mplay: 0 },
            { label: week5Label, receita: 0, posTotal: 0, posPago: 0, controle: 0, urTotal: 0, fibra: 0, tv: 0, aparelho: 0, acessorio: 0, pelicula: 0, seguro: 0, mplay: 0 }
        ];

        (sourceData || []).forEach(sale => {
            if (!sale.data) return;
            
            // Filtragem idêntica à Seção Resultado
            let saleIsoDate = '';
            if (typeof sale.data === 'string') {
                if (sale.data.includes('-')) {
                    saleIsoDate = sale.data;
                } else if (sale.data.includes('/')) {
                    const parts = sale.data.split('/');
                    if (parts.length === 3) saleIsoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
            }
            
            if (!saleIsoDate.startsWith(selectedSxsMonth)) return;
            const day = parseInt(saleIsoDate.split('-')[2], 10);
            
            let wIdx = 0;
            if (day >= 8 && day <= 14) wIdx = 1;
            else if (day >= 15 && day <= 21) wIdx = 2;
            else if (day >= 22 && day <= 28) wIdx = 3;
            else if (day >= 29) wIdx = 4;

            const pBase = String(sale.produtoBase || sale.produto || '').toUpperCase();
            const op = String(sale.tipoOperacao || sale.operacao || '').toUpperCase();
            const sub = String(sale.subOption || sale.subtipo || '').toUpperCase();
            const rec = Number(sale.receita) || 0;
            const q = Number(sale.qtda) || 1;

            weeks[wIdx].receita += rec;

            // Lógica Exata Extraída da Seção "Resultado.jsx"
            let posTt = 0, controle = 0, depPg = 0, depBl = 0, depGratis = 0, migracaoPos = 0, migracaoControle = 0, grossPme = 0;
            let bl = 0, flex = 0, fibra = 0, tv = 0, tvBox = 0, fixo = 0, urPme = 0, aparelho = 0, acessorio = 0, pelicula = 0, seguro = 0, mplay = 0;

            if (pBase.includes('PÓS PME') || pBase === 'PME' || pBase.includes('POS PME')) { grossPme += q; }
            else if (pBase.includes('PÓS') || pBase.includes('POS')) {
                if (op.includes('MIGRA') || pBase.includes('MIGRA') || sub.includes('MIGRA')) migracaoPos += q;
                else posTt += q; 
            }
            else if (pBase.includes('CONTROLE')) {
                if (op.includes('MIGRA') || pBase.includes('MIGRA') || sub.includes('MIGRA')) migracaoControle += q;
                else controle += q; 
            }
            else if (pBase.includes('FLEX')) {
                if (op.includes('MIGRA') || pBase.includes('MIGRA') || sub.includes('MIGRA')) migracaoControle += q;
                else flex += q;
            }
            else if (pBase.includes('DEPENDENTE') || pBase.includes('DEP')) {
                if (sub.includes('GRATUITO') || sub.includes('GRÁTIS') || sub.includes('GRATIS') || pBase.includes('GRÁTIS')) depGratis += q;
                else if (sub.includes('BANDA-LARGA') || sub.includes('BANDA LARGA')) depBl += q;
                else depPg += q;
            }
            else if (pBase.includes('BANDA LARGA') || pBase === 'BL' || pBase.includes('CLARO NET VIRTUA')) bl += q;
            else if (pBase.includes('FIBRA PME') || pBase.includes('UR PME')) urPme += q;
            else if (pBase.includes('FIBRA') || pBase.includes('BANDA LARGA RESIDENCIAL')) fibra += q;
            else if (pBase.includes('TV-BOX')) tvBox += q;
            else if (pBase.includes('CLARO TV+') || pBase.includes('TV')) tv += q;
            else if (pBase.includes('FIXO') || pBase.includes('NET FONE')) fixo += q;
            else if (pBase.includes('APARELHO')) { aparelho += q; }
            else if (pBase.includes('ACESSÓRIO') || pBase.includes('ACESSORIO')) { acessorio += q; }
            else if (pBase.includes('PELÍCULA') || pBase.includes('PELICULA')) { pelicula += q; }
            else if (pBase.includes('SEGURO')) seguro += q;

            if (sale.mplay === 'SIM') mplay += 1;

            weeks[wIdx].posTotal += (posTt + controle + depPg + depBl + depGratis + migracaoPos + migracaoControle + grossPme + bl + flex);
            weeks[wIdx].posPago += (posTt + migracaoPos + depPg + depBl + depGratis);
            weeks[wIdx].controle += (controle + migracaoControle);
            weeks[wIdx].urTotal += (fibra + tv + tvBox + fixo + urPme);
            weeks[wIdx].fibra += (fibra + bl);
            weeks[wIdx].tv += (tv + tvBox);
            weeks[wIdx].aparelho += aparelho;
            weeks[wIdx].acessorio += acessorio;
            weeks[wIdx].pelicula += pelicula;
            weeks[wIdx].seguro += seguro;
            weeks[wIdx].mplay += mplay;
        });

        // Cálculo Matemático de Crescimento (Semana Contra Semana)
        for (let i = 1; i < weeks.length; i++) {
            weeks[i].crescimentos = {};
            ['receita', 'posTotal', 'posPago', 'controle', 'urTotal', 'fibra', 'tv', 'aparelho', 'acessorio', 'pelicula', 'seguro', 'mplay'].forEach(metric => {
                const prev = weeks[i - 1][metric];
                const curr = weeks[i][metric];
                if (prev > 0) {
                    weeks[i].crescimentos[metric] = ((curr - prev) / prev) * 100;
                } else if (curr > 0) {
                    weeks[i].crescimentos[metric] = 100;
                } else {
                    weeks[i].crescimentos[metric] = 0;
                }
            });
        }

        return weeks;
    }, [salesData, allHistoricalSales, selectedSxsMonth]);

    const renderMxMCell = (realVal, goalVal, isCurrency = false) => {
        const rVal = Number(realVal) || 0;
        const gVal = Number(goalVal) || 0;
        const pct = gVal > 0 ? (rVal / gVal) * 100 : (rVal > 0 ? 100 : 0);
        const formattedReal = isCurrency ? applyCurrencyMask(rVal) : rVal;
        const formattedGoal = isCurrency ? applyCurrencyMask(gVal) : gVal;
        
        let pctColor = 'text-neutral-500 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400';
        if (pct >= 100) pctColor = 'text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
        else if (pct >= 80) pctColor = 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
        else if (gVal > 0) pctColor = 'text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400';

        return (
            <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                    <span>{formattedReal}</span>
                    {gVal > 0 && <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${pctColor}`}>{pct.toFixed(1)}%</span>}
                </div>
                <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-bold mt-0.5">Meta: {formattedGoal}</span>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col animate-fade-in transition-colors">
            {!hasAccess ? (
                <div className="flex-1 flex items-center justify-center bg-neutral-50/50 dark:bg-neutral-900/50 rounded-2xl">
                    <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl shadow-lg border border-neutral-200 dark:border-neutral-800 max-w-sm text-center">
                        <Lock size={40} className="text-[#E3000F] mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">Acesso Restrito</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">Apenas contas de liderança têm autorização para visualizar o espelho de metas.</p>
                        <button onClick={() => setAuthModal({ isOpen: true, pendingAction: null, pendingId: null, requiredRole: 'SENIOR' })} className="px-6 py-2.5 bg-[#E3000F] text-white font-medium rounded-xl hover:bg-red-700 transition-colors">Autenticar</button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col h-full bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                    <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 shrink-0 overflow-x-auto scrollbar-hide">
                        <button onClick={() => setMetaActiveSubTab('DEFINIR')} className={`whitespace-nowrap px-8 py-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${metaActiveSubTab === 'DEFINIR' ? 'border-[#E3000F] text-[#E3000F] bg-white dark:bg-neutral-900' : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'}`}>Definir Metas</button>
                        <button onClick={() => setMetaActiveSubTab('COMPARATIVO')} className={`whitespace-nowrap px-8 py-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${metaActiveSubTab === 'COMPARATIVO' ? 'border-[#E3000F] text-[#E3000F] bg-white dark:bg-neutral-900' : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'}`}>Histórico MxM</button>
                        <button onClick={() => setMetaActiveSubTab('SEMANAL')} className={`whitespace-nowrap px-8 py-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${metaActiveSubTab === 'SEMANAL' ? 'border-[#E3000F] text-[#E3000F] bg-white dark:bg-neutral-900' : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'}`}>Histórico SXS</button>
                    </div>

                    {metaActiveSubTab === 'DEFINIR' && (
                        <div className="flex flex-col flex-1 relative overflow-hidden">
                            <div className={`absolute top-4 right-8 z-50 flex items-center gap-3 bg-green-50 text-green-700 border border-green-200 px-6 py-4 rounded-xl shadow-lg transition-all duration-500 ${showGoalSuccess ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
                                <Check size={20} />
                                <span className="font-bold text-sm">Metas publicadas com sucesso!</span>
                            </div>

                            <div className="p-6 md:p-8 border-b border-neutral-100 dark:border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-neutral-50/50 dark:bg-neutral-800/50 shrink-0">
                                <div>
                                    <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2"><Target className="text-[#E3000F]" /> Gestão de Metas Mensais</h2>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Configure a <strong className="text-neutral-700 dark:text-neutral-300">Meta Total da Loja</strong>. O sistema dividirá os valores pela quantidade de vendedores ativos automaticamente.</p>
                                </div>
                                <div className="flex items-center gap-4 bg-white dark:bg-neutral-900 p-2 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700">
                                    <div className="flex items-center gap-2 px-2 text-sm font-bold text-neutral-500"><History size={16} /> Mês:</div>
                                    <input type="month" value={selectedGoalMonth} onChange={(e) => setSelectedGoalMonth(e.target.value)} className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[#E3000F] px-4 py-2 rounded-lg font-bold outline-none cursor-pointer" />
                                    {canEdit && (
                                        <button type="button" onClick={handleCopyFromPreviousMonth} className="px-3 py-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-[#E3000F] hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">Puxar Mês Anterior</button>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-neutral-50/30 dark:bg-neutral-950/50">
                                <form onSubmit={saveGoals} className="max-w-6xl mx-auto space-y-6 pb-12">
                                    <fieldset disabled={!canEdit} className="space-y-6 min-w-0">
                                        <div className="lg:col-span-4 bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl p-6 border border-neutral-800 relative overflow-hidden group shadow-xl">
                                            <Target size={120} className="absolute -right-4 -bottom-4 text-white opacity-5 group-hover:opacity-10 transition-opacity" />
                                            <div className="flex items-center gap-2 mb-4"><div className="p-2 bg-green-500/20 text-green-400 rounded-lg"><MonitorPlay size={20} /></div><h3 className="font-bold text-white text-lg uppercase tracking-wide">Receita Global (R$)</h3></div>
                                            <div className="space-y-2"><label className="text-xs text-neutral-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-2">Receita Total</label><div className="relative max-w-md"><span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-white/50">R$</span><input type="text" name="receita" value={goalForm.receita} onChange={handleGoalChange} className="w-full bg-white/10 border border-white/20 text-white pl-12 pr-4 py-3.5 rounded-xl font-black text-2xl outline-none focus:border-green-400 transition-colors" /></div></div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                            <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col">
                                                <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-red-50 dark:bg-red-900/20 text-[#E3000F] rounded-lg"><Smartphone size={20} /></div><h4 className="font-bold text-neutral-800 dark:text-neutral-100 text-sm uppercase tracking-wide">Móvel</h4></div>
                                                <div className="space-y-4"><div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">Pós Total</label><input type="text" name="posTotal" value={goalForm.posTotal} onChange={handleGoalChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-4 py-2.5 rounded-xl text-lg font-black outline-none focus:ring-1 focus:ring-[#E3000F]" /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">Pós-Pago</label><input type="text" name="posPago" value={goalForm.posPago} onChange={handleGoalChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-xl text-sm font-bold outline-none" /></div><div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">Controle</label><input type="text" name="controle" value={goalForm.controle} onChange={handleGoalChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-xl text-sm font-bold outline-none" /></div></div></div>
                                            </div>
                                            <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col">
                                                <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-neutral-800 dark:bg-neutral-700 text-white rounded-lg"><Home size={20} /></div><h4 className="font-bold text-neutral-800 dark:text-neutral-100 text-sm uppercase tracking-wide">Residencial</h4></div>
                                                <div className="space-y-4"><div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">UR Total</label><input type="text" name="urTotal" value={goalForm.urTotal} onChange={handleGoalChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-4 py-2.5 rounded-xl text-lg font-black outline-none focus:ring-1 focus:ring-neutral-800" /></div><div className="grid grid-cols-3 gap-3"><div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">Fibra</label><input type="text" name="fibra" value={goalForm.fibra} onChange={handleGoalChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-xl text-sm font-bold outline-none" /></div><div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">TV</label><input type="text" name="tv" value={goalForm.tv} onChange={handleGoalChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-xl text-sm font-bold outline-none" /></div><div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">Fixo</label><input type="text" name="fixo" value={goalForm.fixo} onChange={handleGoalChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-xl text-sm font-bold outline-none" /></div></div></div>
                                            </div>
                                            <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col">
                                                <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-500 dark:text-orange-400 rounded-lg"><Watch size={20} /></div><h4 className="font-bold text-neutral-800 dark:text-neutral-100 text-sm uppercase tracking-wide">Aparelhos & Acessórios</h4></div>
                                                <div className="space-y-4"><div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">Aparelhos</label><input type="text" name="aparelho" value={goalForm.aparelho} onChange={handleGoalChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-4 py-2.5 rounded-xl text-lg font-black outline-none focus:ring-1 focus:ring-orange-500" /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">Acessórios</label><input type="text" name="acessorio" value={goalForm.acessorio} onChange={handleGoalChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-xl text-sm font-bold outline-none" /></div><div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">Películas</label><input type="text" name="pelicula" value={goalForm.pelicula} onChange={handleGoalChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-xl text-sm font-bold outline-none" /></div></div></div>
                                            </div>
                                            <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col">
                                                <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 rounded-lg"><ShieldCheck size={20} /></div><h4 className="font-bold text-neutral-800 dark:text-neutral-100 text-sm uppercase tracking-wide">Serviços / Adicionais</h4></div>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-5"><div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">Seguro</label><input type="text" name="seguro" value={goalForm.seguro} onChange={handleGoalChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-xl text-sm font-bold outline-none" /></div><div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">M-Play</label><input type="text" name="mplay" value={goalForm.mplay} onChange={handleGoalChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-xl text-sm font-bold outline-none" /></div><div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">Trocafy</label><input type="text" name="trocafy" value={goalForm.trocafy} onChange={handleGoalChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-xl text-sm font-bold outline-none" /></div><div className="space-y-1.5"><label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">MESH</label><input type="text" name="mesh" value={goalForm.mesh} onChange={handleGoalChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-xl text-sm font-bold outline-none" /></div></div>
                                            </div>
                                        </div>
                                    </fieldset>
                                    {canEdit && (
                                        <div className="flex justify-end pt-4 sticky bottom-4 z-20"><button type="submit" className="px-10 py-4 bg-[#E3000F] text-white font-bold rounded-2xl hover:bg-red-700 transition-colors shadow-2xl shadow-red-500/40 flex items-center gap-2 hover:-translate-y-1"><Save size={20} /> Atualizar e Publicar Metas</button></div>
                                    )}
                                </form>
                            </div>
                        </div>
                    )}

                    {metaActiveSubTab === 'COMPARATIVO' && (
                        <div className="flex-1 overflow-auto p-6 md:p-8 bg-neutral-50/50 dark:bg-neutral-950/50">
                            <div className="max-w-7xl mx-auto">
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                                        <LineChart className="text-[#E3000F]" /> Histórico Comparativo (MxM)
                                        {isLoadingHistory && <Loader2 size={20} className="animate-spin text-neutral-400" />}
                                    </h2>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Acompanhe a evolução do faturamento e compare os resultados de vendas mês a mês.</p>
                                </div>
                                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-x-auto">
                                    <table className="w-full text-sm text-left whitespace-nowrap">
                                        <thead className="bg-neutral-800 dark:bg-neutral-950 text-white uppercase text-[10px] tracking-wider">
                                            <tr><th className="px-6 py-4 rounded-tl-2xl font-bold sticky left-0 z-10 bg-neutral-900 shadow-[2px_0_5px_rgba(0,0,0,0.2)]">Mês de Ref.</th><th className="px-6 py-4 font-bold text-green-400">Receita (R$)</th><th className="px-6 py-4 font-bold">Pós Total</th><th className="px-6 py-4 font-bold text-neutral-400">Pós Pago</th><th className="px-6 py-4 font-bold text-neutral-400">Controle</th><th className="px-6 py-4 font-bold">UR Total</th><th className="px-6 py-4 font-bold text-neutral-400">Fibra</th><th className="px-6 py-4 font-bold text-neutral-400">TV</th><th className="px-6 py-4 font-bold text-neutral-400">Fixo</th><th className="px-6 py-4 font-bold">Aparelhos</th><th className="px-6 py-4 font-bold">Acessórios</th><th className="px-6 py-4 font-bold">Películas</th><th className="px-6 py-4 font-bold">Seguro</th><th className="px-6 py-4 font-bold rounded-tr-2xl">M-Play</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                            {monthNames.map(month => {
                                                const m = goalsDB[month];
                                                const real = monthlyMetrics[month] || { receita: 0, posTotal: 0, posPago: 0, controle: 0, urTotal: 0, fibra: 0, tv: 0, fixo: 0, aparelho: 0, acessorio: 0, pelicula: 0, seguro: 0, mplay: 0 };
                                                const isCurrent = month === currentYYYYMM;
                                                return (
                                                    <tr key={month} className={`hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors ${isCurrent ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                                                        <td className={`px-6 py-4 font-bold tracking-wider sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_5px_rgba(0,0,0,0.2)] ${isCurrent ? 'bg-red-50 dark:bg-neutral-800 text-[#E3000F]' : 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100'}`}>
                                                            {month.split('-').reverse().join('-')} {isCurrent && <span className="ml-2 text-[9px] bg-[#E3000F] text-white px-2 py-0.5 rounded-full">Atual</span>}
                                                        </td>
                                                        <td className="px-6 py-3 font-black text-green-600 dark:text-green-500 whitespace-nowrap">{renderMxMCell(real.receita, m.receita, true)}</td>
                                                        <td className="px-6 py-3 font-bold text-neutral-800 dark:text-neutral-100 whitespace-nowrap">{renderMxMCell(real.posTotal, m.posTotal)}</td>
                                                        <td className="px-6 py-3 text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{renderMxMCell(real.posPago, m.posPago)}</td>
                                                        <td className="px-6 py-3 text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{renderMxMCell(real.controle, m.controle)}</td>
                                                        <td className="px-6 py-3 font-bold text-neutral-800 dark:text-neutral-100 whitespace-nowrap">{renderMxMCell(real.urTotal, m.urTotal)}</td>
                                                        <td className="px-6 py-3 text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{renderMxMCell(real.fibra, m.fibra)}</td>
                                                        <td className="px-6 py-3 text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{renderMxMCell(real.tv, m.tv)}</td>
                                                        <td className="px-6 py-3 text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{renderMxMCell(real.fixo, m.fixo || 0)}</td>
                                                        <td className="px-6 py-3 font-medium text-orange-600 dark:text-orange-400 whitespace-nowrap">{renderMxMCell(real.aparelho, m.aparelho)}</td>
                                                        <td className="px-6 py-3 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">{renderMxMCell(real.acessorio, m.acessorio)}</td>
                                                        <td className="px-6 py-3 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">{renderMxMCell(real.pelicula, m.pelicula)}</td>
                                                        <td className="px-6 py-3 font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">{renderMxMCell(real.seguro, m.seguro)}</td>
                                                        <td className="px-6 py-3 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">{renderMxMCell(real.mplay, m.mplay)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {metaActiveSubTab === 'SEMANAL' && (
                        <div className="flex-1 overflow-auto p-6 md:p-8 bg-neutral-50/50 dark:bg-neutral-950/50">
                            <div className="max-w-7xl mx-auto">
                                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                                            <LineChart className="text-[#E3000F]" /> Histórico Semana x Semana (SxS)
                                            {isLoadingHistory && <Loader2 size={20} className="animate-spin text-neutral-400" />}
                                        </h2>
                                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Acompanhe as vendas faturadas semana a semana referentes ao mês selecionado.</p>
                                    </div>
                                    <div className="flex items-center gap-4 bg-white dark:bg-neutral-900 p-2 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 shrink-0">
                                        <div className="flex items-center gap-2 px-2 text-sm font-bold text-neutral-500"><History size={16} /> Mês:</div>
                                        <input type="month" value={selectedSxsMonth} onChange={(e) => setSelectedSxsMonth(e.target.value)} className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[#E3000F] px-4 py-2 rounded-lg font-bold outline-none cursor-pointer" />
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-x-auto">
                                    <table className="w-full text-sm text-left whitespace-nowrap">
                                        <thead className="bg-neutral-800 dark:bg-neutral-950 text-white uppercase text-[10px] tracking-wider">
                                            <tr>
                                                <th className="px-6 py-4 rounded-tl-2xl font-bold sticky left-0 z-10 bg-neutral-900 shadow-[2px_0_5px_rgba(0,0,0,0.2)]">Semana</th>
                                                <th className="px-6 py-4 font-bold text-green-400">Receita (R$)</th>
                                                <th className="px-6 py-4 font-bold">Gross Total</th>
                                                <th className="px-6 py-4 font-bold text-neutral-400">Pós Pago</th>
                                                <th className="px-6 py-4 font-bold text-neutral-400">Controle</th>
                                                <th className="px-6 py-4 font-bold">UR Total</th>
                                                <th className="px-6 py-4 font-bold text-neutral-400">Fibra</th>
                                                <th className="px-6 py-4 font-bold text-neutral-400">TV</th>
                                                <th className="px-6 py-4 font-bold text-orange-400">Aparelhos</th>
                                                <th className="px-6 py-4 font-bold text-neutral-400">Acessórios</th>
                                                <th className="px-6 py-4 font-bold text-neutral-400">Películas</th>
                                                <th className="px-6 py-4 font-bold text-blue-400">Seguro</th>
                                                <th className="px-6 py-4 font-bold rounded-tr-2xl text-purple-400">M-Play</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                            {weeklyMetrics.map((week, idx) => {
                                                const renderCrescimento = (metric) => {
                                                    if (idx === 0 || week.label.includes('N/A')) return null;
                                                    const val = week.crescimentos?.[metric] || 0;
                                                    if (val === 0 && week[metric] === 0) return null;
                                                    const isPos = val > 0;
                                                    const isNeg = val < 0;
                                                    const color = isPos ? 'text-green-500 bg-green-50 dark:bg-green-500/10' : isNeg ? 'text-red-500 bg-red-50 dark:bg-red-500/10' : 'text-neutral-500 bg-neutral-100 dark:bg-neutral-800';
                                                    return <span className={`ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold ${color}`}>{(isPos ? '+' : '') + val.toFixed(1)}%</span>;
                                                };
                                                return (
                                                    <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                                                        <td className="px-6 py-4 font-bold tracking-wider sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_5px_rgba(0,0,0,0.2)] bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100">{week.label}</td>
                                                        <td className="px-6 py-4 font-black text-neutral-800 dark:text-neutral-100 whitespace-nowrap">{applyCurrencyMask(week.receita)}{renderCrescimento('receita')}</td>
                                                        <td className="px-6 py-4 font-bold text-neutral-800 dark:text-neutral-100 whitespace-nowrap">{week.posTotal}{renderCrescimento('posTotal')}</td>
                                                        <td className="px-6 py-4 font-medium text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{week.posPago}{renderCrescimento('posPago')}</td>
                                                        <td className="px-6 py-4 font-medium text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{week.controle}{renderCrescimento('controle')}</td>
                                                        <td className="px-6 py-4 font-bold text-neutral-800 dark:text-neutral-100 whitespace-nowrap">{week.urTotal}{renderCrescimento('urTotal')}</td>
                                                        <td className="px-6 py-4 font-medium text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{week.fibra}{renderCrescimento('fibra')}</td>
                                                        <td className="px-6 py-4 font-medium text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{week.tv}{renderCrescimento('tv')}</td>
                                                        <td className="px-6 py-4 font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap">{week.aparelho}{renderCrescimento('aparelho')}</td>
                                                        <td className="px-6 py-4 font-medium text-neutral-600 dark:text-neutral-400 whitespace-nowrap">{week.acessorio}{renderCrescimento('acessorio')}</td>
                                                        <td className="px-6 py-4 font-medium text-neutral-600 dark:text-neutral-400 whitespace-nowrap">{week.pelicula}{renderCrescimento('pelicula')}</td>
                                                        <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-500 whitespace-nowrap">{week.seguro}{renderCrescimento('seguro')}</td>
                                                        <td className="px-6 py-4 font-bold text-purple-600 dark:text-purple-500 whitespace-nowrap">{week.mplay}{renderCrescimento('mplay')}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot className="bg-neutral-50 dark:bg-neutral-900 sticky bottom-0 z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                                            {(() => {
                                                const currentMonthMeta = (goalsDB || {})[selectedSxsMonth] || safeMetasPadrao;
                                                return (
                                                    <tr className="text-neutral-900 dark:text-neutral-100 font-black uppercase text-[11px]">
                                                        <td className="border-t-2 border-b border-neutral-300 dark:border-neutral-700 px-6 py-4 sticky left-0 bg-neutral-100 dark:bg-neutral-800 shadow-[2px_0_5px_rgba(0,0,0,0.05)] z-30 text-[#E3000F]">Realizado Mês</td>
                                                        <td className="border-t-2 border-b border-neutral-300 dark:border-neutral-700 px-6 py-3 bg-neutral-50 dark:bg-neutral-900 font-black text-green-600 dark:text-green-500 whitespace-nowrap">
                                                            <div className="flex flex-col">
                                                                <span>{applyCurrencyMask(weeklyMetrics.reduce((acc, w) => acc + w.receita, 0))}</span>
                                                                <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-bold mt-0.5">Meta: {applyCurrencyMask(currentMonthMeta.receita)}</span>
                                                            </div>
                                                        </td>
                                                        <td className="border-t-2 border-b border-neutral-300 dark:border-neutral-700 px-6 py-3 bg-neutral-50 dark:bg-neutral-900 font-black">
                                                            <div className="flex flex-col">
                                                                <span>{weeklyMetrics.reduce((acc, w) => acc + w.posTotal, 0)}</span>
                                                                <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-bold mt-0.5">Meta: {currentMonthMeta.posTotal}</span>
                                                            </div>
                                                        </td>
                                                        <td className="border-t-2 border-b border-neutral-300 dark:border-neutral-700 px-6 py-3 bg-neutral-50 dark:bg-neutral-900 font-medium text-neutral-500 dark:text-neutral-400">
                                                            <div className="flex flex-col">
                                                                <span>{weeklyMetrics.reduce((acc, w) => acc + w.posPago, 0)}</span>
                                                                <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-bold mt-0.5">Meta: {currentMonthMeta.posPago}</span>
                                                            </div>
                                                        </td>
                                                        <td className="border-t-2 border-b border-neutral-300 dark:border-neutral-700 px-6 py-3 bg-neutral-50 dark:bg-neutral-900 font-medium text-neutral-500 dark:text-neutral-400">
                                                            <div className="flex flex-col">
                                                                <span>{weeklyMetrics.reduce((acc, w) => acc + w.controle, 0)}</span>
                                                                <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-bold mt-0.5">Meta: {currentMonthMeta.controle}</span>
                                                            </div>
                                                        </td>
                                                        <td className="border-t-2 border-b border-neutral-300 dark:border-neutral-700 px-6 py-3 bg-neutral-50 dark:bg-neutral-900 font-black">
                                                            <div className="flex flex-col">
                                                                <span>{weeklyMetrics.reduce((acc, w) => acc + w.urTotal, 0)}</span>
                                                                <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-bold mt-0.5">Meta: {currentMonthMeta.urTotal}</span>
                                                            </div>
                                                        </td>
                                                        <td className="border-t-2 border-b border-neutral-300 dark:border-neutral-700 px-6 py-3 bg-neutral-50 dark:bg-neutral-900 font-medium text-neutral-500 dark:text-neutral-400">
                                                            <div className="flex flex-col">
                                                                <span>{weeklyMetrics.reduce((acc, w) => acc + w.fibra, 0)}</span>
                                                                <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-bold mt-0.5">Meta: {currentMonthMeta.fibra}</span>
                                                            </div>
                                                        </td>
                                                        <td className="border-t-2 border-b border-neutral-300 dark:border-neutral-700 px-6 py-3 bg-neutral-50 dark:bg-neutral-900 font-medium text-neutral-500 dark:text-neutral-400">
                                                            <div className="flex flex-col">
                                                                <span>{weeklyMetrics.reduce((acc, w) => acc + w.tv, 0)}</span>
                                                                <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-bold mt-0.5">Meta: {currentMonthMeta.tv}</span>
                                                            </div>
                                                        </td>
                                                        <td className="border-t-2 border-b border-neutral-300 dark:border-neutral-700 px-6 py-3 bg-neutral-50 dark:bg-neutral-900 font-black text-orange-600 dark:text-orange-500">
                                                            <div className="flex flex-col">
                                                                <span>{weeklyMetrics.reduce((acc, w) => acc + w.aparelho, 0)}</span>
                                                                <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-bold mt-0.5">Meta: {currentMonthMeta.aparelho}</span>
                                                            </div>
                                                        </td>
                                                        <td className="border-t-2 border-b border-neutral-300 dark:border-neutral-700 px-6 py-3 bg-neutral-50 dark:bg-neutral-900 font-medium text-neutral-500 dark:text-neutral-400">
                                                            <div className="flex flex-col">
                                                                <span>{weeklyMetrics.reduce((acc, w) => acc + w.acessorio, 0)}</span>
                                                                <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-bold mt-0.5">Meta: {currentMonthMeta.acessorio}</span>
                                                            </div>
                                                        </td>
                                                        <td className="border-t-2 border-b border-neutral-300 dark:border-neutral-700 px-6 py-3 bg-neutral-50 dark:bg-neutral-900 font-medium text-neutral-500 dark:text-neutral-400">
                                                            <div className="flex flex-col">
                                                                <span>{weeklyMetrics.reduce((acc, w) => acc + w.pelicula, 0)}</span>
                                                                <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-bold mt-0.5">Meta: {currentMonthMeta.pelicula}</span>
                                                            </div>
                                                        </td>
                                                        <td className="border-t-2 border-b border-neutral-300 dark:border-neutral-700 px-6 py-3 bg-neutral-50 dark:bg-neutral-900 font-medium text-blue-600 dark:text-blue-500">
                                                            <div className="flex flex-col">
                                                                <span>{weeklyMetrics.reduce((acc, w) => acc + w.seguro, 0)}</span>
                                                                <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-bold mt-0.5">Meta: {currentMonthMeta.seguro}</span>
                                                            </div>
                                                        </td>
                                                        <td className="border-t-2 border-b border-neutral-300 dark:border-neutral-700 px-6 py-3 bg-neutral-50 dark:bg-neutral-900 font-medium text-purple-600 dark:text-purple-500">
                                                            <div className="flex flex-col">
                                                                <span>{weeklyMetrics.reduce((acc, w) => acc + w.mplay, 0)}</span>
                                                                <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-bold mt-0.5">Meta: {currentMonthMeta.mplay}</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })()}
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};