import React, { useState, useMemo } from 'react';
import { Calculator, User, DollarSign, Target, TrendingUp, AlertCircle, Award, Lock, CheckCircle2 } from 'lucide-react';
import { applyCurrencyMask } from '../utils/masks';
import { METAS_PADRAO } from '../utils/constants';
import { calcularFatorRV, aplicarRegrasDeProduto } from '../utils/rules';

export const FatorRvv = ({ globalUser, salesData = [], goalsDB = {}, usersDB = {}, globalMonth }) => {
    const isVendedor = globalUser?.role === 'VENDEDOR';
    const loggedName = String(globalUser?.name || '').split(' ')[0];

    const safeVendedores = Object.values(usersDB || {})
        .filter(u => !u?.role || u?.role === 'VENDEDOR')
        .map(u => String(u?.name || '').split(' ')[0])
        .filter(Boolean);

    const [selectedSeller, setSelectedSeller] = useState(isVendedor ? loggedName : (safeVendedores[0] || ''));

    const metrics = useMemo(() => {
        if (!selectedSeller) return null;

        const activeMetas = (goalsDB || {})[globalMonth] || METAS_PADRAO || {};
        const numSellers = safeVendedores.length || 1;

        // 1. Isola as vendas do mês
        const monthSales = salesData.filter(s => {
            if (typeof s.data !== 'string') return false;
            if (s.data.includes('/')) {
                const parts = s.data.split('/');
                if (parts.length === 3) return `${parts[2]}-${parts[1]}` === globalMonth;
            }
            if (s.data.includes('-')) return s.data.slice(0, 7) === globalMonth;
            return false;
        });

        // 2. Isola as vendas individuais do vendedor
        const sellerSales = monthSales.filter(s => s.vendedor === selectedSeller || s.vendedor === String(selectedSeller || '').split(' ')[0]);

        let sellerTotalReceita = 0;
        sellerSales.forEach(s => {
            sellerTotalReceita += Number(s.valorBruto || s.receita) || 0;
        });

        const metaReceita = (Number(activeMetas.receita) || 0) / numSellers;

        // 3. Calcula o Fator Multiplicador baseado no atingimento INDIVIDUAL
        const automaticMultiPct = metaReceita > 0 ? (sellerTotalReceita / metaReceita) * 100 : 0;

        let fatorMultiplicador = 1.2;
        if (automaticMultiPct >= 160.00) fatorMultiplicador = 1.8;
        else if (automaticMultiPct >= 130.00) fatorMultiplicador = 1.6;
        else if (automaticMultiPct >= 100.00) fatorMultiplicador = 1.4;

        let totalReceita = 0;
        let totalComissao = 0;
        let totalVendas = sellerSales.length;
        let totalPos = 0;
        let totalUr = 0;
        let volPosPago = 0;
        let volFibra = 0;
        let volTv = 0;
        let volPortabilidade = 0;
        let volMulti = 0;
        let volPme = 0;

        sellerSales.forEach(sale => {
            const pBase = String(sale.produtoBase || sale.produto || '').toUpperCase();
            const q = Number(sale.qtda) || 1;
            const combo = String(sale.combo || '').toUpperCase();
            const port = String(sale.portabilidade || '').toUpperCase();
            
            if (port === 'SIM') volPortabilidade += q;
            if (combo.includes('MULTI')) volMulti += q;
            if (pBase.includes('PME')) volPme += q;

            if ((pBase.includes('POS') || pBase.includes('PÓS') || pBase.includes('CONTROLE') || pBase.includes('FLEX') || pBase.includes('DEPENDENTE') || pBase.includes('DEP') || pBase.includes('BANDA LARGA') || pBase === 'BL') && !pBase.includes('PME') && pBase !== 'PME') {
                totalPos += q;
            }
            
            if (pBase.includes('FIBRA') || pBase.includes('TV') || pBase.includes('FIXO') || pBase.includes('MESH')) {
                totalUr += q;
            }
            
            if ((pBase.includes('POS') || pBase.includes('PÓS') || pBase.includes('DEPENDENTE') || pBase.includes('DEP') || pBase.includes('BANDA LARGA') || pBase === 'BL') && !pBase.includes('PME') && pBase !== 'PME') {
                volPosPago += q;
            }
            if (pBase.includes('FIBRA') || pBase.includes('BANDA LARGA RESIDENCIAL')) {
                volFibra += q;
            }
            if (pBase.includes('CLARO TV+') || pBase.includes('TV')) {
                volTv += q;
            }

            totalReceita += Number(sale.valorBruto || sale.receita) || 0;
            // MODIFICADO: Aplica portabilidade e acelerador Multi na matemática
            totalComissao += aplicarRegrasDeProduto(sale, { pctAtingimentoMulti: automaticMultiPct });
        });

        const metaPos = (Number(activeMetas.posTotal) || 0) / numSellers;
        const metaUr = (Number(activeMetas.urTotal) || 0) / numSellers;
        
        const metaPosPago = Math.ceil((Number(activeMetas.posPago) || 0) / numSellers);
        const metaFibra = Math.ceil((Number(activeMetas.fibra) || 0) / numSellers);
        const metaTv = Math.ceil((Number(activeMetas.tv) || 0) / numSellers);

        const pctAtingimento = metaReceita > 0 ? (totalComissao / metaReceita) * 100 : 0;
        const pctAtingimentoPos = metaPos > 0 ? (totalPos / metaPos) * 100 : 0;
        const pctAtingimentoUr = metaUr > 0 ? (totalUr / metaUr) * 100 : 0;

        // Cálculo de RV sendo importado do arquivo isolado de regras
        const resultRV = calcularFatorRV(pctAtingimento, totalComissao, { 
            totalVendas,
            pctAtingimentoPos,
            pctAtingimentoUr,
            notaNps: 0,
            volPosPago,
            metaPosPago,
            volFibra,
            metaFibra,
            volTv,
            metaTv
        });

        return {
            totalReceita,
            totalComissao,
            totalVendas,
            totalPos,
            totalUr,
            metaReceita,
            metaPos,
            metaUr,
            pctAtingimento,
            pctAtingimentoPos,
            pctAtingimentoUr,
            previaPagamento: resultRV.previaPagamento,
            fatorSimulado: resultRV.fatorAplicado,
            elegivel: resultRV.elegivel,
            bonusUnitario: resultRV.bonusUnitario,
            automaticMultiPct,
            fatorMultiplicador,
            volPortabilidade,
            volMulti,
            volPme
        };
    }, [salesData, selectedSeller, globalMonth, goalsDB, safeVendedores.length, isVendedor]);

    return (
        <div className="h-full flex flex-col animate-fade-in transition-colors">
            {/* Cabeçalho */}
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex flex-col md:flex-row items-start md:items-center justify-between bg-white dark:bg-neutral-900 rounded-t-2xl shrink-0 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-[#E3000F]/10 flex items-center justify-center text-[#E3000F]">
                        <Calculator size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">Painel Fator RV</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Prévia de Remuneração Variável e Atingimento.</p>
                    </div>
                </div>
                
                {/* Seletor de Vendedor para Gestão */}
                <div className="w-full md:w-auto flex items-center gap-3 bg-neutral-50 dark:bg-neutral-800/50 p-2 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <User size={18} className="text-neutral-500 ml-2 shrink-0" />
                    <select 
                        value={selectedSeller} 
                        onChange={(e) => setSelectedSeller(e.target.value)}
                        disabled={isVendedor}
                        className="bg-transparent text-sm font-bold text-neutral-700 dark:text-neutral-100 outline-none pr-2 py-1 cursor-pointer w-full md:min-w-[180px] appearance-none disabled:opacity-80 disabled:cursor-not-allowed"
                    >
                        <option value="" disabled>Selecione um consultor</option>
                        {safeVendedores.map(v => (
                            <option key={v} value={v} className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100">{v}</option>
                        ))}
                    </select>
                    {isVendedor && <Lock size={14} className="text-[#E3000F] mr-2 shrink-0" title="Você só pode ver seus próprios dados." />}
                </div>
            </div>

            {/* Corpo do Dashboard */}
            <div className="flex-1 overflow-auto p-6 bg-neutral-50/50 dark:bg-neutral-950/50 rounded-b-2xl">
                {!selectedSeller ? (
                    <div className="flex flex-col items-center justify-center h-full text-neutral-400 dark:text-neutral-600">
                        <User size={48} className="mb-4 opacity-20" />
                        <p>Selecione um vendedor para visualizar o Dashboard.</p>
                    </div>
                ) : metrics ? (
                    <div className="max-w-6xl mx-auto space-y-6">
                        
                        {/* Alerta de Regra Aplicada */}
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl flex items-start gap-3 text-sm font-medium">
                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                            <div>
                                <strong className="block mb-0.5">Regras Oficiais do IW Aplicadas</strong>
                                O comissionamento (Teto de R$ 6.000,00) está atrelado à elegibilidade: O Vendedor só recebe o pagamento se bater no mínimo 80% simultaneamente em 3 indicadores (Receita, Gross Total e Residencial).
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Card 1: Prévia Principal */}
                            <div className="md:col-span-3 bg-gradient-to-br from-neutral-900 to-black rounded-3xl p-8 border border-neutral-800 shadow-2xl relative overflow-hidden group text-white">
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-5 group-hover:opacity-10 transition-opacity duration-500 mr-8 pointer-events-none">
                                    <DollarSign size={200} />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Award className="text-yellow-500" size={18} /> Prévia de Remuneração Variável
                                    </h3>
                                    <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-2">
                                        {applyCurrencyMask(metrics.previaPagamento)}
                                    </div>
                                    <p className="text-sm text-neutral-500 font-medium">
                                        Baseado no atingimento de <strong className="text-neutral-300">{metrics.pctAtingimento.toFixed(1)}%</strong> da meta (Fator Simulado: {metrics.fatorSimulado * 100}%).
                                    </p>
                                </div>
                            </div>

                            {/* Card 2: Atingimento das 3 Metas (Elegibilidade) */}
                            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
                                <div>
                                    <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Target size={16} className="text-[#E3000F]" /> Elegibilidade (Mín. 80%)
                                    </h3>
                                    
                                    {/* Meta 1: Receita */}
                                    <div className="mb-4">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Receita ({applyCurrencyMask(metrics.totalComissao)})</span>
                                            <span className={`text-xs font-black ${metrics.pctAtingimento >= 80 ? 'text-green-500' : 'text-[#E3000F]'}`}>
                                                {metrics.pctAtingimento.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-1000 ${metrics.pctAtingimento >= 80 ? 'bg-green-500' : 'bg-[#E3000F]'}`} style={{ width: `${Math.min(metrics.pctAtingimento, 100)}%` }}></div>
                                        </div>
                                    </div>

                                    {/* Meta 2: Gross Total */}
                                    <div className="mb-4">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Gross Total ({metrics.totalPos} un)</span>
                                            <span className={`text-xs font-black ${metrics.pctAtingimentoPos >= 80 ? 'text-green-500' : 'text-[#E3000F]'}`}>
                                                {metrics.pctAtingimentoPos.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-1000 ${metrics.pctAtingimentoPos >= 80 ? 'bg-green-500' : 'bg-[#E3000F]'}`} style={{ width: `${Math.min(metrics.pctAtingimentoPos, 100)}%` }}></div>
                                        </div>
                                    </div>

                                    {/* Meta 3: Residencial */}
                                    <div>
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Residencial ({metrics.totalUr} un)</span>
                                            <span className={`text-xs font-black ${metrics.pctAtingimentoUr >= 80 ? 'text-green-500' : 'text-[#E3000F]'}`}>
                                                {metrics.pctAtingimentoUr.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-1000 ${metrics.pctAtingimentoUr >= 80 ? 'bg-green-500' : 'bg-[#E3000F]'}`} style={{ width: `${Math.min(metrics.pctAtingimentoUr, 100)}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                    <div className={`text-[10px] font-bold text-center py-2 rounded-xl uppercase tracking-wider ${metrics.elegivel ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-[#E3000F] dark:bg-red-900/20'}`}>
                                        {metrics.elegivel ? '✅ Elegível para Recebimento' : '❌ Não Elegível (Falta Atingimento)'}
                                    </div>
                                </div>
                            </div>

                            {/* Card 3: Dicas e Foco */}
                            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
                                <div>
                                    <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <TrendingUp size={16} className="text-[#E3000F]" /> Dicas de Foco
                                    </h3>
                                    <div className="space-y-3">
                                        {metrics.pctAtingimento < 100 && (
                                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 p-3 rounded-xl">
                                                <h4 className="text-[11px] font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider mb-1">Foco na Receita</h4>
                                                <p className="text-[10px] text-blue-600 dark:text-blue-300 leading-relaxed">Você está quase lá! Foque em planos de maior valor, combos Claro Multi e oferte seguros e acessórios para alavancar sua receita.</p>
                                            </div>
                                        )}
                                        {metrics.pctAtingimentoPos < 100 && (
                                            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30 p-3 rounded-xl">
                                                <h4 className="text-[11px] font-bold text-purple-800 dark:text-purple-400 uppercase tracking-wider mb-1">Acelere o Gross (Móvel)</h4>
                                                <p className="text-[10px] text-purple-600 dark:text-purple-300 leading-relaxed">Sempre ofereça a portabilidade para trazer o número do cliente e lembre de perguntar se mais alguém da família precisa de um plano novo. Cada linha faz a diferença!</p>
                                            </div>
                                        )}
                                        {metrics.pctAtingimentoUr < 100 && (
                                            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30 p-3 rounded-xl">
                                                <h4 className="text-[11px] font-bold text-orange-800 dark:text-orange-400 uppercase tracking-wider mb-1">Venda mais Residencial</h4>
                                                <p className="text-[10px] text-orange-600 dark:text-orange-300 leading-relaxed">Convergência é o segredo. Todo cliente móvel é um potencial cliente de Fibra ou Claro TV+. Explore a venda casada!</p>
                                            </div>
                                        )}
                                        {metrics.pctAtingimento >= 100 && metrics.pctAtingimentoPos >= 100 && metrics.pctAtingimentoUr >= 100 && (
                                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 p-4 rounded-xl text-center">
                                                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mx-auto mb-2">
                                                    <Award size={20} />
                                                </div>
                                                <h4 className="text-[11px] font-bold text-green-800 dark:text-green-400 uppercase tracking-wider mb-1">Excelente Trabalho!</h4>
                                                <p className="text-[10px] text-green-600 dark:text-green-300 leading-relaxed">Você atingiu 100% em todas as metas de elegibilidade principais. Continue vendendo para maximizar seu bônus unitário e fatores aceleradores!</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Card 4: Simulador de Aceleradores */}
                            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
                                <div className="w-full flex flex-col text-left">
                                    <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <TrendingUp size={16} className="text-[#E3000F]" /> Aceleradores e Bônus
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between items-end mb-1">
                                                <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Atingimento Claro Multi (Individual)</span>
                                                <span className={`text-xs font-black ${metrics.automaticMultiPct >= 100 ? 'text-green-500' : 'text-[#E3000F]'}`}>{metrics.automaticMultiPct.toFixed(1)}%</span>
                                            </div>
                                            <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden mb-2">
                                                <div className={`h-full rounded-full transition-all duration-1000 ${metrics.automaticMultiPct >= 100 ? 'bg-green-500' : 'bg-[#E3000F]'}`} style={{ width: `${Math.min(metrics.automaticMultiPct, 100)}%` }}></div>
                                            </div>
                                            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium leading-tight">Fator Automático Aplicado: <strong className="text-neutral-700 dark:text-neutral-300">{metrics.fatorMultiplicador}x</strong> nas vendas Combo.</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
                                    <div className="flex items-center justify-between text-xs font-medium">
                                        <span className="text-neutral-600 dark:text-neutral-400">Bônus Unitário (Acima Meta):</span>
                                        <span className={`font-bold ${metrics.bonusUnitario > 0 ? 'text-green-600 dark:text-green-500' : 'text-neutral-500'}`}>
                                            {metrics.bonusUnitario > 0 ? `+${applyCurrencyMask(metrics.bonusUnitario)}` : 'R$ 0,00'}
                                        </span>
                                    </div>
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-xl border border-yellow-100 dark:border-yellow-800">
                                        <p className="text-[11px] text-yellow-700 dark:text-yellow-400 font-medium leading-relaxed"><strong className="block mb-1 flex items-center gap-1"><Award size={12} /> Como ativar este Bônus?</strong> Ao ultrapassar 100% da meta de TV, Fibra ou Pós-Pago, você recebe entre <strong>R$ 10,00 e R$ 15,00</strong> extras por cada venda adicional!</p>
                                    </div>
                                </div>
                            </div>

                            {/* Detalhamento de Composição */}
                            <div className="md:col-span-3 bg-white dark:bg-neutral-900 rounded-3xl p-6 md:p-8 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                                <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-100 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <TrendingUp size={18} className="text-[#E3000F]" /> O que está sendo computado na sua Receita
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                                    <div className="space-y-1">
                                        <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Portabilidades (+30%)</span>
                                        <div className="text-2xl font-black text-neutral-800 dark:text-neutral-100">{metrics.volPortabilidade} <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500">linhas</span></div>
                                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-snug mt-1">Linhas trazidas de outra operadora recebem bônus sobre o valor do plano.</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Produtos Multi (Acelerador)</span>
                                        <div className="text-2xl font-black text-neutral-800 dark:text-neutral-100">{metrics.volMulti} <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500">itens</span></div>
                                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-snug mt-1">Vendas dentro do combo multiplicam a receita de 1.2x até 1.8x.</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Vendas PME (100% Receita)</span>
                                        <div className="text-2xl font-black text-neutral-800 dark:text-neutral-100">{metrics.volPme} <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500">planos</span></div>
                                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-snug mt-1">Planos PJ não entram na meta quantitativa (Gross), mas somam integralmente na receita.</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Regras de Operação</span>
                                        <div className="text-2xl font-black text-neutral-800 dark:text-neutral-100 flex items-center gap-2">Automático <CheckCircle2 size={16} className="text-green-500" /></div>
                                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-snug mt-1">Upgrades (50%) e Sidegrades (25%) já estão sendo calculados automaticamente no valor final.</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};