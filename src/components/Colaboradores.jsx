import React from 'react';
import { ArrowLeft, Smartphone, Home, Watch, ShieldCheck, Zap, MonitorPlay } from 'lucide-react';
import { VENDEDORES } from '../utils/constants';
import { applyCurrencyMask } from '../utils/masks';
import { ProgressBar } from './ProgressBar.jsx';

const safeVendedores = Array.isArray(VENDEDORES) ? VENDEDORES : [];

export const Colaboradores = ({ selectedSeller, setSelectedSeller, isVendedor, globalUser, salesData, activeMetas }) => {

    const getSellerMetrics = (sellerName) => {
        const mySales = salesData.filter(s => s.vendedor === sellerName);
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
            if (sale.adicionais && sale.adicionais.includes('SEGURO')) metrics.volSeguro += 1;
            if (sale.adicionais && sale.adicionais.includes('TROCAFY')) metrics.volTrocafy += 1;
            if (sale.mplay === 'SIM') metrics.volMPlay += 1;
        });
        metrics.volUrTotal = metrics.volFibra + metrics.volTv;
        return metrics;
    };

    return (
        <div className="flex flex-col min-h-full animate-fade-in">
            {!selectedSeller || (isVendedor && selectedSeller !== globalUser.name) ? (
                <>
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-neutral-800">Equipe de Vendas</h2>
                        <p className="text-sm text-neutral-500">
                            {isVendedor
                                ? 'Você está visualizando apenas seus dados de acesso restrito.'
                                : 'Selecione um colaborador para ver o detalhamento individual de metas.'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {safeVendedores.filter(s => isVendedor ? s === globalUser.name : true).map(seller => {
                            const metrics = getSellerMetrics(seller);
                            return (
                                <div key={seller} onClick={() => setSelectedSeller(seller)} className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm hover:shadow-lg hover:border-[#E3000F]/30 transition-all cursor-pointer group">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-[#E3000F] font-bold text-lg group-hover:bg-[#E3000F] group-hover:text-white transition-colors">
                                            {seller.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-neutral-800 text-lg">{seller}</h3>
                                            <span className="text-xs font-medium text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded">Consultor</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3 pt-4 border-t border-neutral-100">
                                        <div className="flex justify-between items-end">
                                            <span className="text-xs font-semibold text-neutral-500 uppercase">Receita (Mês)</span>
                                            <span className="font-bold text-neutral-800">{applyCurrencyMask(metrics.totalReceita)}</span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <span className="text-xs font-semibold text-neutral-500 uppercase">Pós Total</span>
                                            <span className="font-bold text-neutral-800">{metrics.volPosTotal} pts</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : (
                <div className="flex flex-col h-full animate-fade-in">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm gap-4 shrink-0">
                        <div className="flex items-center gap-4">
                            {!isVendedor && (
                                <button onClick={() => setSelectedSeller(null)} className="p-2 bg-neutral-100 hover:bg-neutral-200 rounded-full text-neutral-600 transition-colors">
                                    <ArrowLeft size={20} />
                                </button>
                            )}
                            <div>
                                <h2 className="text-xl font-bold text-neutral-800 flex items-center gap-2">Desempenho: <span className="text-[#E3000F] uppercase">{selectedSeller}</span></h2>
                                <p className="text-xs text-neutral-500 font-medium">Acompanhamento detalhado de Meta x Realizado.</p>
                            </div>
                        </div>
                        <div className="md:min-w-[300px]">
                            <ProgressBar label="Receita Total Acumulada" realizado={getSellerMetrics(selectedSeller).totalReceita} meta={activeMetas.receita} isCurrency={true} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 pb-6 pr-2">
                        <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-sm lg:col-span-2 flex flex-col relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none"><Smartphone size={150} /></div>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 bg-red-50 text-[#E3000F] rounded-lg"><Smartphone size={20} /></div>
                                <h3 className="font-bold text-neutral-800 text-lg uppercase tracking-wide">Segmento Móvel</h3>
                            </div>
                            <div className="mb-8">
                                <ProgressBar label="PÓS TOTAL (Pós + Controle + Dependentes + Flex)" realizado={getSellerMetrics(selectedSeller).volPosTotal} meta={activeMetas.posTotal} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-6 border-t border-neutral-100 mt-auto">
                                <ProgressBar label="Individual: PÓS-PAGO" realizado={getSellerMetrics(selectedSeller).volPosPago} meta={activeMetas.posPago} />
                                <ProgressBar label="Individual: CONTROLE" realizado={getSellerMetrics(selectedSeller).volControle} meta={activeMetas.controle} />
                            </div>
                        </div>

                        <div className="bg-neutral-900 rounded-3xl p-6 shadow-sm text-white flex flex-col relative overflow-hidden">
                            <div className="absolute -bottom-4 -right-4 p-8 opacity-10 pointer-events-none"><Home size={120} /></div>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 bg-neutral-700 text-white rounded-lg"><Home size={20} /></div>
                                <h3 className="font-bold text-white text-lg uppercase tracking-wide">UR-Residencial</h3>
                            </div>
                            <div className="mb-8"><ProgressBar label="UR TOTAL (Fibra + TV)" realizado={getSellerMetrics(selectedSeller).volUrTotal} meta={activeMetas.urTotal} isDark={true} /></div>
                            <div className="grid grid-cols-2 gap-3 mt-auto pt-6 border-t border-neutral-700">
                                <div className="flex flex-col justify-center bg-neutral-800/80 p-4 rounded-2xl border border-neutral-700/50 hover:bg-neutral-800 transition-colors">
                                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Zap size={12} className="text-[#E3000F]" /> Fibra Óptica</span>
                                    <div className="flex items-baseline gap-1"><span className="text-3xl font-black text-white leading-none">{getSellerMetrics(selectedSeller).volFibra}</span><span className="text-[10px] font-medium text-neutral-500 mb-1">/ {activeMetas.fibra}</span></div>
                                </div>
                                <div className="flex flex-col justify-center bg-neutral-800/80 p-4 rounded-2xl border border-neutral-700/50 hover:bg-neutral-800 transition-colors">
                                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><MonitorPlay size={12} className="text-[#E3000F]" /> TV Assinatura</span>
                                    <div className="flex items-baseline gap-1"><span className="text-3xl font-black text-white leading-none">{getSellerMetrics(selectedSeller).volTv}</span><span className="text-[10px] font-medium text-neutral-500 mb-1">/ {activeMetas.tv}</span></div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-sm flex flex-col">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 bg-orange-50 text-orange-500 rounded-lg"><Watch size={20} /></div>
                                <h3 className="font-bold text-neutral-800 text-sm uppercase tracking-wide">Hardware</h3>
                            </div>
                            <div className="space-y-6 mt-auto">
                                <ProgressBar label="Aparelhos" realizado={getSellerMetrics(selectedSeller).volAparelho} meta={activeMetas.aparelho} />
                                <ProgressBar label="Acessórios" realizado={getSellerMetrics(selectedSeller).volAcessorio} meta={activeMetas.acessorio} />
                                <ProgressBar label="Películas" realizado={getSellerMetrics(selectedSeller).volPelicula} meta={activeMetas.pelicula} />
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-sm lg:col-span-2 flex flex-col">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 bg-blue-50 text-blue-500 rounded-lg"><ShieldCheck size={20} /></div>
                                <h3 className="font-bold text-neutral-800 text-sm uppercase tracking-wide">Serviços, Extras & Conectividade</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-auto">
                                <ProgressBar label="Seguro (Proteção Móvel)" realizado={getSellerMetrics(selectedSeller).volSeguro} meta={activeMetas.seguro} />
                                <ProgressBar label="Anexação M-Play" realizado={getSellerMetrics(selectedSeller).volMPlay} meta={activeMetas.mplay} />
                                <ProgressBar label="Claro Trocafy" realizado={getSellerMetrics(selectedSeller).volTrocafy} meta={activeMetas.trocafy} />
                                <ProgressBar label="Equipamento MESH" realizado={getSellerMetrics(selectedSeller).volMesh} meta={activeMetas.mesh} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};