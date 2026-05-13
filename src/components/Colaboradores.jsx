import React, { useState } from 'react';
import { ArrowLeft, Smartphone, Home, Watch, ShieldCheck, Zap, MonitorPlay, Calendar, Lock, Users } from 'lucide-react';
import { applyCurrencyMask } from '../utils/masks';
import { ProgressBar } from './ProgressBar.jsx';
import toast from 'react-hot-toast';
import { METAS_PADRAO } from '../utils/constants';

export const Colaboradores = ({ selectedSeller, setSelectedSeller, isVendedor, globalUser, salesData, goalsDB = {}, usersDB = {}, setAuthModal, globalMonth, setGlobalMonth }) => {
    const safeVendedores = Object.values(usersDB)
        .filter(u => !u.role || u.role === 'VENDEDOR')
        .map(u => u.name)
        .filter(Boolean);

    const monthFilter = globalMonth;
    const setMonthFilter = setGlobalMonth;

    const activeMetas = goalsDB[monthFilter] || METAS_PADRAO || {};
    const numSellers = safeVendedores.length || 1;
    
    const individualMetas = {
        receita: (Number(activeMetas.receita) || 0) / numSellers,
        posTotal: Math.ceil((Number(activeMetas.posTotal) || 0) / numSellers),
        posPago: Math.ceil((Number(activeMetas.posPago) || 0) / numSellers),
        controle: Math.ceil((Number(activeMetas.controle) || 0) / numSellers),
        urTotal: Math.ceil((Number(activeMetas.urTotal) || 0) / numSellers),
        fibra: Math.ceil((Number(activeMetas.fibra) || 0) / numSellers),
        tv: Math.ceil((Number(activeMetas.tv) || 0) / numSellers),
        aparelho: Math.ceil((Number(activeMetas.aparelho) || 0) / numSellers),
        acessorio: Math.ceil((Number(activeMetas.acessorio) || 0) / numSellers),
        pelicula: Math.ceil((Number(activeMetas.pelicula) || 0) / numSellers),
        seguro: Math.ceil((Number(activeMetas.seguro) || 0) / numSellers),
        mplay: Math.ceil((Number(activeMetas.mplay) || 0) / numSellers),
        trocafy: Math.ceil((Number(activeMetas.trocafy) || 0) / numSellers),
        mesh: Math.ceil((Number(activeMetas.mesh) || 0) / numSellers),
    };

    const getSellerMetrics = (sellerName) => {
        const mySales = salesData.filter(s => {
            if (s.vendedor !== sellerName && s.vendedor !== sellerName.split(' ')[0]) return false;
            if (!s.data) return false;
            if (s.data.includes('/')) return `${s.data.split('/')[2]}-${s.data.split('/')[1]}` === monthFilter;
            if (s.data.includes('-')) return s.data.slice(0, 7) === monthFilter;
            return false;
        });
        let metrics = { totalReceita: 0, volControle: 0, volPosPago: 0, volPosTotal: 0, volFibra: 0, volTv: 0, volUrTotal: 0, volAparelho: 0, volAcessorio: 0, volPelicula: 0, volSeguro: 0, volMesh: 0, volTrocafy: 0, volMPlay: 0 };
        mySales.forEach(sale => {
            metrics.totalReceita += Number(sale.receita);
            const p = sale.produto.toUpperCase();
            const qtda = Number(sale.qtda);
            if (p.includes('CONTROLE')) metrics.volControle += qtda;
            if (p.includes('POS') || p.includes('DEPENDENTE') || p.includes('BANDA LARGA')) metrics.volPosPago += qtda;
            if (p.includes('POS') || p.includes('CONTROLE') || p.includes('DEPENDENTE') || p.includes('BANDA LARGA') || p.includes('FLEX')) metrics.volPosTotal += qtda;
            if (p.includes('FIBRA')) metrics.volFibra += qtda;
            if (p.includes('TV')) metrics.volTv += qtda;
            if (p.includes('APARELHO')) metrics.volAparelho += qtda;
            if (p.includes('ACESSORIO')) metrics.volAcessorio += qtda;
            if (p.includes('PELICULA')) metrics.volPelicula += qtda;
            if (p.includes('MESH')) metrics.volMesh += qtda;
            if (p.includes('SEGURO')) metrics.volSeguro += qtda;
            if (sale.adicionais && sale.adicionais.includes('TROCAFY')) metrics.volTrocafy += 1;
            if (sale.mplay === 'SIM') metrics.volMPlay += 1;
        });
        metrics.volUrTotal = metrics.volFibra + metrics.volTv;
        return metrics;
    };

    const handleSellerClick = (seller) => {
        if (isVendedor && seller !== globalUser.name && seller !== globalUser.name.split(' ')[0]) {
            toast.error("Acesso restrito! Solicite a senha do Gerente para visualizar outro colaborador.");
            setAuthModal({ isOpen: true, pendingAction: null, pendingId: null, requiredRole: 'GERENTE' });
        } else {
            setSelectedSeller(seller);
        }
    };

    return (
        <div className="flex flex-col min-h-full animate-fade-in transition-colors">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-[#E3000F]/10 flex items-center justify-center text-[#E3000F]">
                        <Users size={22} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">Desempenho da Equipe</h2>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Acompanhe o atingimento de metas mês a mês.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-800 p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 w-full sm:w-auto">
                    <Calendar size={18} className="text-neutral-500 dark:text-neutral-400 ml-2" />
                    <input 
                        type="month" 
                        value={monthFilter} 
                        onChange={(e) => setMonthFilter(e.target.value)}
                        className="bg-transparent text-sm font-bold text-neutral-700 dark:text-neutral-100 outline-none pr-2 cursor-pointer focus:text-[#E3000F] w-full sm:w-auto"
                    />
                </div>
            </div>

            {!selectedSeller ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {safeVendedores.map(seller => {
                            const isRestricted = isVendedor && seller !== globalUser.name;
                            const metrics = isRestricted ? null : getSellerMetrics(seller);
                            return (
                                <div key={seller} onClick={() => handleSellerClick(seller)} className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-lg hover:border-[#E3000F]/30 dark:hover:border-[#E3000F]/50 transition-all cursor-pointer group relative overflow-hidden">
                                    {isRestricted && (
                                        <div className="absolute top-4 right-4 text-neutral-300 dark:text-neutral-600 group-hover:text-[#E3000F] dark:group-hover:text-[#E3000F] transition-colors" title="Acesso Sigiloso">
                                            <Lock size={16} />
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-[#E3000F] font-bold text-lg group-hover:bg-[#E3000F] group-hover:text-white transition-colors">
                                            {seller.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-lg">{seller}</h3>
                                            <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">Consultor</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                        {isRestricted ? (
                                            <div className="flex flex-col items-center justify-center py-2 opacity-50">
                                                <Lock size={20} className="mb-1 text-neutral-400 dark:text-neutral-500" />
                                                <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">Acesso Sigiloso</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex justify-between items-end mb-2 gap-2">
                                                    <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase">Receita (Mês)</span>
                                                    <div className="text-right shrink-0">
                                                        <span className="text-xl font-bold text-neutral-800 dark:text-neutral-100">{applyCurrencyMask(metrics.totalReceita)}</span>
                                                        <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 ml-1">/ {applyCurrencyMask(individualMetas.receita)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-end gap-2">
                                                    <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase">Pós Total</span>
                                                    <div className="text-right shrink-0">
                                                        <span className="text-xl font-bold text-neutral-800 dark:text-neutral-100">{metrics.volPosTotal}</span>
                                                        <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 ml-1">/ {Number.isInteger(individualMetas.posTotal) ? individualMetas.posTotal : individualMetas.posTotal.toFixed(1)}</span>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : (
                <div className="flex flex-col h-full animate-fade-in transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm gap-4 shrink-0">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setSelectedSeller(null)} className="p-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full text-neutral-600 dark:text-neutral-300 transition-colors">
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">Desempenho: <span className="text-[#E3000F] uppercase">{selectedSeller}</span></h2>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Acompanhamento detalhado de Meta x Realizado.</p>
                            </div>
                        </div>
                        <div className="md:min-w-[300px] lg:min-w-[340px] w-full md:w-auto mt-2 md:mt-0">
                            <ProgressBar label="RECEITA TOTAL" realizado={getSellerMetrics(selectedSeller).totalReceita} meta={individualMetas.receita} isCurrency={true} isDark={false} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 pb-6 pr-2">
                        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm lg:col-span-2 flex flex-col relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none"><Smartphone size={150} /></div>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 bg-red-50 dark:bg-[#E3000F]/10 text-[#E3000F] rounded-lg"><Smartphone size={20} /></div>
                                <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-lg uppercase tracking-wide">GROSS TOTAL</h3>
                            </div>
                            <div className="mb-8">
                                <ProgressBar label="PÓS TOTAL (Pós + Controle + Dependentes + Flex)" realizado={getSellerMetrics(selectedSeller).volPosTotal} meta={individualMetas.posTotal} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-6 border-t border-neutral-100 dark:border-neutral-800 mt-auto">
                                <ProgressBar label="Individual: PÓS-PAGO" realizado={getSellerMetrics(selectedSeller).volPosPago} meta={individualMetas.posPago} />
                                <ProgressBar label="Individual: CONTROLE" realizado={getSellerMetrics(selectedSeller).volControle} meta={individualMetas.controle} />
                            </div>
                        </div>

                        <div className="bg-neutral-900 dark:bg-neutral-950 rounded-3xl p-6 shadow-sm text-white flex flex-col relative overflow-hidden">
                            <div className="absolute -bottom-4 -right-4 p-8 opacity-10 pointer-events-none"><Home size={120} /></div>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 bg-neutral-700 text-white rounded-lg"><Home size={20} /></div>
                                <h3 className="font-bold text-white text-lg uppercase tracking-wide">UR-Residencial</h3>
                            </div>
                            <div className="mb-8"><ProgressBar label="UR TOTAL (Fibra + TV)" realizado={getSellerMetrics(selectedSeller).volUrTotal} meta={individualMetas.urTotal} isDark={true} /></div>
                            <div className="grid grid-cols-2 gap-3 mt-auto pt-6 border-t border-neutral-700 dark:border-neutral-800">
                                <div className="flex flex-col justify-center bg-neutral-800/80 dark:bg-neutral-800 p-4 rounded-2xl border border-neutral-700/50 hover:bg-neutral-800 transition-colors">
                                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Zap size={14} className="text-[#E3000F]" />Fibras</span>
                                    <div className="flex items-baseline gap-1.5"><span className="text-4xl font-black text-white leading-none">{getSellerMetrics(selectedSeller).volFibra}</span><span className="text-sm font-bold text-neutral-500 dark:text-neutral-400 mb-1">/ {Number.isInteger(individualMetas.fibra) ? individualMetas.fibra : individualMetas.fibra.toFixed(1)}</span></div>
                                </div>
                                <div className="flex flex-col justify-center bg-neutral-800/80 dark:bg-neutral-800 p-4 rounded-2xl border border-neutral-700/50 hover:bg-neutral-800 transition-colors">
                                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><MonitorPlay size={14} className="text-[#E3000F]" /> TV BOX</span>
                                    <div className="flex items-baseline gap-1.5"><span className="text-4xl font-black text-white leading-none">{getSellerMetrics(selectedSeller).volTv}</span><span className="text-sm font-bold text-neutral-500 dark:text-neutral-400 mb-1">/ {Number.isInteger(individualMetas.tv) ? individualMetas.tv : individualMetas.tv.toFixed(1)}</span></div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-500 dark:text-orange-400 rounded-lg"><Watch size={20} /></div>
                                <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-sm uppercase tracking-wide">METAS APARELHOS & ACESSORIOS</h3>
                            </div>
                            <div className="space-y-6 mt-auto">
                                <ProgressBar label="Aparelhos" realizado={getSellerMetrics(selectedSeller).volAparelho} meta={individualMetas.aparelho} />
                                <ProgressBar label="Acessórios" realizado={getSellerMetrics(selectedSeller).volAcessorio} meta={individualMetas.acessorio} />
                                <ProgressBar label="Películas" realizado={getSellerMetrics(selectedSeller).volPelicula} meta={individualMetas.pelicula} />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm lg:col-span-2 flex flex-col">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 rounded-lg"><ShieldCheck size={20} /></div>
                                <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-sm uppercase tracking-wide">METAS SERVIÇOS ADICIONAIS</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-auto">
                                <ProgressBar label="Seguro (Proteção Móvel)" realizado={getSellerMetrics(selectedSeller).volSeguro} meta={individualMetas.seguro} />
                                <ProgressBar label="Anexação M-Play" realizado={getSellerMetrics(selectedSeller).volMPlay} meta={individualMetas.mplay} />
                                <ProgressBar label="Claro Trocafy" realizado={getSellerMetrics(selectedSeller).volTrocafy} meta={individualMetas.trocafy} />
                                <ProgressBar label="Equipamento MESH" realizado={getSellerMetrics(selectedSeller).volMesh} meta={individualMetas.mesh} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};