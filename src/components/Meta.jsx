import React, { useState, useEffect } from 'react';
import { Target, Lock, Check, History, MonitorPlay, Smartphone, Home, Watch, ShieldCheck, Save, LineChart } from 'lucide-react';
import { METAS_PADRAO } from '../utils/constants';
import { applyCurrencyMask, parseCurrencyToFloat } from '../utils/masks';

const safeMetasPadrao = METAS_PADRAO || { receita: 0, posTotal: 0, posPago: 0, controle: 0, urTotal: 0, fibra: 0, tv: 0, fixo: 0, aparelho: 0, acessorio: 0, pelicula: 0, seguro: 0, mesh: 0, trocafy: 0, mplay: 0 };

export const Meta = ({ hasAccess, setAuthModal, goalsDB, setGoalsDB, currentYYYYMM }) => {
    const [selectedGoalMonth, setSelectedGoalMonth] = useState(currentYYYYMM);
    const [goalForm, setGoalForm] = useState({ ...safeMetasPadrao, receita: applyCurrencyMask(safeMetasPadrao.receita) });
    const [showGoalSuccess, setShowGoalSuccess] = useState(false);
    const [metaActiveSubTab, setMetaActiveSubTab] = useState('DEFINIR');

    useEffect(() => {
        const data = goalsDB[selectedGoalMonth] || {
            receita: 0, posTotal: 0, posPago: 0, controle: 0, urTotal: 0,
            fibra: 0, tv: 0, fixo: 0, aparelho: 0, acessorio: 0, pelicula: 0, seguro: 0, mesh: 0, trocafy: 0, mplay: 0
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
        setGoalsDB(prev => ({
            ...prev,
            [selectedGoalMonth]: {
                ...goalForm,
                receita: parseCurrencyToFloat(goalForm.receita),
                posTotal: Number(goalForm.posTotal), posPago: Number(goalForm.posPago), controle: Number(goalForm.controle),
                urTotal: Number(goalForm.urTotal), fibra: Number(goalForm.fibra), tv: Number(goalForm.tv), fixo: Number(goalForm.fixo) || 0,
                aparelho: Number(goalForm.aparelho), acessorio: Number(goalForm.acessorio), pelicula: Number(goalForm.pelicula),
                seguro: Number(goalForm.seguro), mesh: Number(goalForm.mesh), mplay: Number(goalForm.mplay), trocafy: Number(goalForm.trocafy)
            }
        }));
        setShowGoalSuccess(true);
        setTimeout(() => setShowGoalSuccess(false), 3000);
    };

    const handleCopyFromPreviousMonth = () => {
        const [year, month] = selectedGoalMonth.split('-');
        let prevMonth = parseInt(month, 10) - 1;
        let prevYear = parseInt(year, 10);
        if (prevMonth === 0) { prevMonth = 12; prevYear -= 1; }
        const prevKey = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
        const prevData = goalsDB[prevKey];
        if (prevData) setGoalForm({ ...prevData, receita: applyCurrencyMask(prevData.receita) });
        else setGoalForm({ ...safeMetasPadrao, receita: applyCurrencyMask(safeMetasPadrao.receita) });
    };

    const monthNames = Object.keys(goalsDB).sort((a, b) => b.localeCompare(a));

    return (
        <div className="h-full flex flex-col animate-fade-in transition-colors">
            {!hasAccess ? (
                <div className="flex-1 flex items-center justify-center bg-neutral-50/50 dark:bg-neutral-900/50 rounded-2xl">
                    <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl shadow-lg border border-neutral-200 dark:border-neutral-800 max-w-sm text-center">
                        <Lock size={40} className="text-[#E3000F] mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">Acesso Restrito</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">Apenas contas de Gerente ou Sênior têm autorização para editar o espelho de metas.</p>
                        <button onClick={() => setAuthModal({ isOpen: true, pendingAction: null, pendingId: null, requiredRole: 'SENIOR' })} className="px-6 py-2.5 bg-[#E3000F] text-white font-medium rounded-xl hover:bg-red-700 transition-colors">Autenticar</button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col h-full bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                    <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 shrink-0">
                        <button onClick={() => setMetaActiveSubTab('DEFINIR')} className={`px-8 py-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${metaActiveSubTab === 'DEFINIR' ? 'border-[#E3000F] text-[#E3000F] bg-white dark:bg-neutral-900' : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'}`}>Definir Metas</button>
                        <button onClick={() => setMetaActiveSubTab('COMPARATIVO')} className={`px-8 py-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${metaActiveSubTab === 'COMPARATIVO' ? 'border-[#E3000F] text-[#E3000F] bg-white dark:bg-neutral-900' : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'}`}>Histórico Mês a Mês</button>
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
                                    <button type="button" onClick={handleCopyFromPreviousMonth} className="px-3 py-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-[#E3000F] hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">Puxar Mês Anterior</button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-neutral-50/30 dark:bg-neutral-950/50">
                                <form onSubmit={saveGoals} className="max-w-6xl mx-auto space-y-6 pb-12">
                                    <div className="lg:col-span-4 bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl p-6 border border-neutral-800 relative overflow-hidden group shadow-xl">
                                        <Target size={120} className="absolute -right-4 -bottom-4 text-white opacity-5 group-hover:opacity-10 transition-opacity" />
                                        <div className="flex items-center gap-2 mb-4"><div className="p-2 bg-green-500/20 text-green-400 rounded-lg"><MonitorPlay size={20} /></div><h3 className="font-bold text-white text-lg uppercase tracking-wide">Receita Global (R$)</h3></div>
                                        <div className="space-y-2"><label className="text-xs text-neutral-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-2">Receita Total</label><div className="relative max-w-md"><span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-white/50">R$</span><input type="text" name="receita" value={goalForm.receita} onChange={handleGoalChange} className="w-full bg-white/10 border border-white/20 text-white pl-12 pr-4 py-3.5 rounded-xl font-black text-2xl outline-none focus:border-green-400" /></div></div>
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
                                    <div className="flex justify-end pt-4 sticky bottom-4 z-20"><button type="submit" className="px-10 py-4 bg-[#E3000F] text-white font-bold rounded-2xl hover:bg-red-700 transition-colors shadow-2xl shadow-red-500/40 flex items-center gap-2 hover:-translate-y-1"><Save size={20} /> Atualizar e Publicar Metas</button></div>
                                </form>
                            </div>
                        </div>
                    )}

                    {metaActiveSubTab === 'COMPARATIVO' && (
                        <div className="flex-1 overflow-auto p-6 md:p-8 bg-neutral-50/50 dark:bg-neutral-950/50">
                            <div className="max-w-7xl mx-auto">
                                <div className="mb-6"><h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2"><LineChart className="text-[#E3000F]" /> Histórico Comparativo (Mês x Mês)</h2></div>
                                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-x-auto">
                                    <table className="w-full text-sm text-left whitespace-nowrap">
                                        <thead className="bg-neutral-800 dark:bg-neutral-950 text-white uppercase text-[10px] tracking-wider">
                                            <tr><th className="px-6 py-4 rounded-tl-2xl font-bold sticky left-0 z-10 bg-neutral-900 shadow-[2px_0_5px_rgba(0,0,0,0.2)]">Mês de Ref.</th><th className="px-6 py-4 font-bold text-green-400">Receita (R$)</th><th className="px-6 py-4 font-bold">Pós Total</th><th className="px-6 py-4 font-bold text-neutral-400">Pós Pago</th><th className="px-6 py-4 font-bold text-neutral-400">Controle</th><th className="px-6 py-4 font-bold">UR Total</th><th className="px-6 py-4 font-bold text-neutral-400">Fibra</th><th className="px-6 py-4 font-bold text-neutral-400">TV</th><th className="px-6 py-4 font-bold text-neutral-400">Fixo</th><th className="px-6 py-4 font-bold">Aparelhos</th><th className="px-6 py-4 font-bold">Acessórios</th><th className="px-6 py-4 font-bold">Películas</th><th className="px-6 py-4 font-bold">Seguro</th><th className="px-6 py-4 font-bold rounded-tr-2xl">M-Play</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                            {monthNames.map(month => {
                                                const m = goalsDB[month];
                                                const isCurrent = month === currentYYYYMM;
                                                return (
                                                    <tr key={month} className={`hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors ${isCurrent ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                                                        <td className={`px-6 py-4 font-bold tracking-wider sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_5px_rgba(0,0,0,0.2)] ${isCurrent ? 'bg-red-50 dark:bg-neutral-800 text-[#E3000F]' : 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100'}`}>{month} {isCurrent && <span className="ml-2 text-[9px] bg-[#E3000F] text-white px-2 py-0.5 rounded-full">Atual</span>}</td>
                                                        <td className="px-6 py-4 font-black text-neutral-800 dark:text-neutral-100">{applyCurrencyMask(m.receita)}</td><td className="px-6 py-4 font-bold text-neutral-800 dark:text-neutral-100">{m.posTotal}</td><td className="px-6 py-4 text-neutral-500 dark:text-neutral-400">{m.posPago}</td><td className="px-6 py-4 text-neutral-500 dark:text-neutral-400">{m.controle}</td><td className="px-6 py-4 font-bold text-neutral-800 dark:text-neutral-100">{m.urTotal}</td><td className="px-6 py-4 text-neutral-500 dark:text-neutral-400">{m.fibra}</td><td className="px-6 py-4 text-neutral-500 dark:text-neutral-400">{m.tv}</td><td className="px-6 py-4 text-neutral-500 dark:text-neutral-400">{m.fixo || 0}</td><td className="px-6 py-4 font-medium text-orange-600 dark:text-orange-400">{m.aparelho}</td><td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">{m.acessorio}</td><td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">{m.pelicula}</td><td className="px-6 py-4 font-medium text-blue-600 dark:text-blue-400">{m.seguro}</td><td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">{m.mplay}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
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