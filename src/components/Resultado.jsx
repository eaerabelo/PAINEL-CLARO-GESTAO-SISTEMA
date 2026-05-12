import React, { useState, useMemo } from 'react';
import { BarChart3, Calendar, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { getTodaySP, applyCurrencyMask } from '../utils/masks';
import { METAS_PADRAO } from '../utils/constants';

export function Resultado({ salesData, goalsDB, usersDB = {} }) {
    const currentYYYYMM = getTodaySP().slice(0, 7);
    const [monthFilter, setMonthFilter] = useState(currentYYYYMM);

    const activeMetas = goalsDB[monthFilter] || METAS_PADRAO || {};
    const safeVendedores = Object.values(usersDB)
        .filter(u => !u.role || u.role === 'VENDEDOR')
        .map(u => u.name)
        .filter(Boolean);
    const numSellers = safeVendedores.length || 1;

    // Cálculos de extração por Dia
    const { rows, totals } = useMemo(() => {
        const [yearStr, monthStr] = monthFilter.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);
        const daysInMonth = new Date(year, month, 0).getDate();
        const metaGross = (Number(activeMetas.posTotal) || 0) + (Number(activeMetas.controle) || 0); // Agora é a meta global direta

        let totalWeights = 0;
        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(year, month - 1, d);
            const dayOfWeek = dateObj.getDay();
            totalWeights += (dayOfWeek === 0 || dayOfWeek === 6) ? 2 : 1; // Sábado (6) e Domingo (0) com peso 2
        }

        let remainingMeta = metaGross;
        let remainingWeights = totalWeights;

        const generatedRows = [];
        let accumulatedGross = 0;
        
        const sumTotals = {
            grossDia: 0, metaDia: 0, total: 0, posTt: 0, depPg: 0, depGratis: 0, migracaoPos: 0, migracaoControle: 0, grossPme: 0,
            portabilidade: 0, bl: 0, flex: 0, receita: 0, fibra: 0, tvBox: 0, mplay: 0, mesh: 0, urPme: 0,
            totalRes: 0, aparelho: 0, receitaAparelho: 0, seguro: 0, acessorio: 0, trocafy: 0, pelicula: 0, claroUp: 0, receitaAcessorio: 0
        };

        for (let d = 1; d <= daysInMonth; d++) {
            const dayStr = String(d).padStart(2, '0');
            const dateIso = `${yearStr}-${monthStr}-${dayStr}`;
            const dateBr = `${dayStr}/${monthStr}/${yearStr}`;

            const dateObj = new Date(year, month - 1, d);
            const dayOfWeek = dateObj.getDay();
            const weight = (dayOfWeek === 0 || dayOfWeek === 6) ? 2 : 1; // Dobro do alvo para o final de semana
            
            let metaDia = 0;
            if (remainingWeights > 0) {
                metaDia = Math.round((remainingMeta / remainingWeights) * weight);
                remainingMeta -= metaDia;
                remainingWeights -= weight;
            }

            const dailySales = salesData.filter(s => {
                if (!s.data) return false;
                // Aceita ambos os formatos (YYYY-MM-DD ou DD/MM/YYYY)
                if (s.data.includes('-')) return s.data === dateIso;
                return s.data === dateBr;
            });

            let posTt = 0, depPg = 0, depGratis = 0, migracaoPos = 0, migracaoControle = 0, controleAtiv = 0, grossPme = 0, portabilidade = 0;
            let bl = 0, flex = 0, receita = 0, fibra = 0, tvBox = 0, mplay = 0, mesh = 0, urPme = 0, aparelho = 0;
            let receitaAparelho = 0, seguro = 0, acessorio = 0, trocafy = 0, pelicula = 0, claroUp = 0, receitaAcessorio = 0;

            dailySales.forEach(sale => {
                const pBase = (sale.produtoBase || sale.produto || '').toUpperCase();
                const op = (sale.tipoOperacao || sale.operacao || '').toUpperCase();
                const port = (sale.portabilidade || '').toUpperCase();
                const sub = (sale.subOption || sale.subtipo || '').toUpperCase();
                const rec = Number(sale.receita) || 0;
                const q = Number(sale.qtda) || 1;
                const adds = sale.adicionais || [];

                receita += rec;

                if (pBase.includes('PÓS PME') || pBase === 'PME' || pBase.includes('POS PME')) { grossPme += q; }
                else if (pBase.includes('PÓS') || pBase.includes('POS')) {
                    if (op.includes('MIGRA') || pBase.includes('MIGRA') || sub.includes('MIGRA')) migracaoPos += q;
                    else posTt += q; // Entra apenas Ativação pura como POS TT
                    if (port === 'SIM') portabilidade += q;
                }
                else if (pBase.includes('CONTROLE')) {
                    if (op.includes('MIGRA') || pBase.includes('MIGRA') || sub.includes('MIGRA')) migracaoControle += q;
                    else controleAtiv += q; 
                    if (port === 'SIM') portabilidade += q;
                }
                else if (pBase.includes('FLEX')) {
                    if (op.includes('MIGRA') || pBase.includes('MIGRA') || sub.includes('MIGRA')) migracaoControle += q;
                    else flex += q;
                }
                else if (pBase.includes('DEPENDENTE') || pBase.includes('DEP')) {
                    if (sub.includes('GRATUITO') || sub.includes('GRÁTIS') || sub.includes('GRATIS') || pBase.includes('GRÁTIS')) depGratis += q;
                    else depPg += q;
                }
                else if (pBase.includes('BANDA LARGA') || pBase === 'BL' || pBase.includes('CLARO NET VIRTUA')) bl += q;
                else if (pBase.includes('FIBRA PME') || pBase.includes('UR PME')) urPme += q;
                else if (pBase.includes('FIBRA') || pBase.includes('BANDA LARGA RESIDENCIAL')) fibra += q;
                else if (pBase.includes('TV-BOX') || pBase.includes('CLARO TV+') || pBase.includes('TV')) tvBox += q;
                else if (pBase.includes('MESH')) mesh += q;
                else if (pBase.includes('APARELHO')) { aparelho += q; receitaAparelho += rec; }
                else if (pBase.includes('SEGURO')) seguro += q;
                else if (pBase.includes('ACESSÓRIO') || pBase.includes('ACESSORIO')) { acessorio += q; receitaAcessorio += rec; }
                else if (pBase.includes('PELÍCULA') || pBase.includes('PELICULA')) { pelicula += q; receitaAcessorio += rec; }

                if (adds.includes('SEGURO')) seguro += 1;
                if (adds.includes('TROCAFY')) trocafy += 1;
                if (adds.includes('CLARO UP')) claroUp += 1;
                if (sale.mplay === 'SIM') mplay += 1;
            });

            // GROSS DIA consolida Pós, Controle (Ativ+Mig), BL, Flex, PME, Dependentes
            const grossDia = posTt + controleAtiv + depPg + depGratis + migracaoPos + migracaoControle + grossPme + bl + flex;
            accumulatedGross += grossDia;
            const totalRes = fibra + tvBox + urPme;

            generatedRows.push({
                data: dayStr, grossDia, metaDia, total: accumulatedGross, posTt, depPg, depGratis, migracaoPos,
                migracaoControle, grossPme, portabilidade, bl, flex, receita, fibra, tvBox, mplay, mesh,
                urPme, totalRes, aparelho, receitaAparelho, seguro, acessorio, trocafy, pelicula, claroUp, receitaAcessorio
            });

            sumTotals.grossDia += grossDia; sumTotals.metaDia += metaDia; sumTotals.posTt += posTt; sumTotals.depPg += depPg; sumTotals.depGratis += depGratis;
            sumTotals.migracaoPos += migracaoPos; sumTotals.migracaoControle += migracaoControle; sumTotals.grossPme += grossPme;
            sumTotals.portabilidade += portabilidade; sumTotals.bl += bl; sumTotals.flex += flex; sumTotals.receita += receita;
            sumTotals.fibra += fibra; sumTotals.tvBox += tvBox; sumTotals.mplay += mplay; sumTotals.mesh += mesh;
            sumTotals.urPme += urPme; sumTotals.totalRes += totalRes; sumTotals.aparelho += aparelho; sumTotals.receitaAparelho += receitaAparelho;
            sumTotals.seguro += seguro; sumTotals.acessorio += acessorio; sumTotals.trocafy += trocafy; sumTotals.pelicula += pelicula;
            sumTotals.claroUp += claroUp; sumTotals.receitaAcessorio += receitaAcessorio;
        }

        sumTotals.total = accumulatedGross;

        return { rows: generatedRows, totals: sumTotals };
    }, [salesData, monthFilter, activeMetas, numSellers]);

    const COLUMNS = [
        { key: 'grossDia', label: 'GROSS DIA', highlight: true }, { key: 'metaDia', label: 'META DIA', highlight: true }, { key: 'total', label: 'TOTAL', highlight: true },
        { key: 'posTt', label: 'POS TT' }, { key: 'depPg', label: 'DEP PG' }, { key: 'depGratis', label: 'DEP GRÁTIS' },
        { key: 'migracaoPos', label: 'MIGRAÇÃO-PÓS' }, { key: 'migracaoControle', label: 'MIGRAÇÃO-CONTROLE' }, { key: 'grossPme', label: 'GROSS PME' },
        { key: 'portabilidade', label: 'PORTAB. POS/CTRL' }, { key: 'bl', label: 'BL' }, { key: 'flex', label: 'FLEX' },
        { key: 'receita', label: 'RECEITA', isCurrency: true, highlight: true }, { key: 'fibra', label: 'FIBRA' }, { key: 'tvBox', label: 'TV+ BOX' },
        { key: 'mplay', label: 'M-PLAY' }, { key: 'mesh', label: 'MESH' }, { key: 'urPme', label: 'UR PME' },
        { key: 'totalRes', label: 'TOTAL RES.', highlight: true }, { key: 'aparelho', label: 'APARELHO' }, { key: 'receitaAparelho', label: 'REC. APARELHOS', isCurrency: true },
        { key: 'seguro', label: 'SEGURO' }, { key: 'acessorio', label: 'ACESSÓRIO' }, { key: 'trocafy', label: 'TROCAFY' },
        { key: 'pelicula', label: 'PELÍCULA' }, { key: 'claroUp', label: 'CLARO UP' }, { key: 'receitaAcessorio', label: 'REC. ACESSÓRIOS', isCurrency: true }
    ];

    const renderValue = (val, isCurrency) => {
        if (val === 0) return <span className="text-neutral-400 dark:text-neutral-600">-</span>;
        return isCurrency ? applyCurrencyMask(val) : val;
    };

    const metaGrossTotal = (Number(activeMetas.posTotal) || 0) + (Number(activeMetas.controle) || 0);
    const metaLoja = {
        grossDia: metaGrossTotal,
        metaDia: metaGrossTotal,
        total: metaGrossTotal,
        posTt: Number(activeMetas.posPago) || 0,
        receita: Number(activeMetas.receita) || 0,
        fibra: Number(activeMetas.fibra) || 0,
        tvBox: Number(activeMetas.tv) || 0,
        totalRes: Number(activeMetas.urTotal) || 0,
        aparelho: Number(activeMetas.aparelho) || 0,
        seguro: Number(activeMetas.seguro) || 0,
        acessorio: Number(activeMetas.acessorio) || 0,
        trocafy: Number(activeMetas.trocafy) || 0,
        pelicula: Number(activeMetas.pelicula) || 0,
        mplay: Number(activeMetas.mplay) || 0,
        mesh: Number(activeMetas.mesh) || 0,
    };

    const handleExportExcel = () => {
        if (rows.length === 0) {
            toast.error('Nenhum dado para exportar.');
            return;
        }

        const dataToExport = rows.map(row => {
            const rowData = { 'DATA': row.data };
            COLUMNS.forEach(col => { rowData[col.label] = row[col.key]; });
            return rowData;
        });

        const totalsRow = { 'DATA': 'TOTAL' };
        COLUMNS.forEach(col => { totalsRow[col.label] = totals[col.key]; });
        dataToExport.push(totalsRow);

        const metaRow = { 'DATA': 'META LOJA' };
        COLUMNS.forEach(col => { 
            const hasMeta = metaLoja[col.key] !== undefined && metaLoja[col.key] > 0;
            metaRow[col.label] = hasMeta ? metaLoja[col.key] : '-'; 
        });
        dataToExport.push(metaRow);

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Resultado");
        XLSX.writeFile(workbook, `Resultado_Consolidado_${monthFilter}.xlsx`);
        toast.success('Relatório gerencial exportado com sucesso!');
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-fade-in transition-colors">
            {/* CABEÇALHO */}
            <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center bg-neutral-50/80 dark:bg-neutral-900/80 shrink-0">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="w-10 h-10 rounded-xl bg-[#E3000F]/10 flex items-center justify-center text-[#E3000F]">
                        <BarChart3 size={22} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">Resultado Consolidado</h2>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium flex items-center gap-1"><TrendingUp size={12} /> Acompanhamento Mensal e Run Rate (Somente Leitura)</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-2">
                    <div className="flex items-center gap-3 bg-white dark:bg-neutral-800 p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm w-full sm:w-auto justify-between sm:justify-start">
                        <Calendar size={16} className="text-neutral-400 ml-2" />
                        <input 
                            type="month" 
                            value={monthFilter} 
                            onChange={(e) => setMonthFilter(e.target.value)}
                            className="bg-transparent text-sm font-bold text-neutral-700 dark:text-neutral-100 outline-none pr-2 cursor-pointer focus:text-[#E3000F] w-full sm:w-auto text-right sm:text-left"
                        />
                    </div>
                    <button onClick={handleExportExcel} className="w-full sm:w-auto px-4 py-2 bg-[#107c41] text-white text-sm font-medium rounded-lg hover:bg-[#0c5e31] transition-colors shadow-sm shadow-green-700/30 justify-center flex">
                        Exportar Excel
                    </button>
                </div>
            </div>

            {/* TABELA ESTILO EXCEL */}
            <div className="flex-1 overflow-auto bg-white dark:bg-neutral-900 scrollbar-thin">
                <table className="w-full text-center border-collapse text-[10px] whitespace-nowrap min-w-max">
                    <thead className="bg-neutral-800 dark:bg-neutral-950 text-white uppercase tracking-wider sticky top-0 z-20">
                        <tr>
                            <th className="border border-neutral-700 dark:border-neutral-800 px-3 py-2.5 font-bold sticky left-0 bg-neutral-900 dark:bg-neutral-950 shadow-[2px_0_5px_rgba(0,0,0,0.2)] z-30">DATA</th>
                            {COLUMNS.map(col => (
                                <th key={col.key} className={`border border-neutral-700 dark:border-neutral-800 px-3 py-2.5 font-bold ${col.highlight ? 'bg-neutral-900 dark:bg-black text-yellow-500' : ''}`}>
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium">
                        {rows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                                <td className="border border-neutral-200 dark:border-neutral-800 px-3 py-1.5 sticky left-0 bg-white dark:bg-neutral-900 font-bold text-neutral-900 dark:text-neutral-100 shadow-[2px_0_5px_rgba(0,0,0,0.05)] z-10">{row.data}</td>
                                {COLUMNS.map(col => (
                                    <td key={col.key} className={`border border-neutral-200 dark:border-neutral-800 px-3 py-1.5 ${col.highlight ? 'bg-yellow-50/30 dark:bg-yellow-900/10 font-bold' : ''}`}>
                                        {renderValue(row[col.key], col.isCurrency)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-neutral-50 dark:bg-neutral-900 sticky bottom-0 z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                        {/* LINHA DE TOTAIS REALIZADOS */}
                        <tr className="text-neutral-900 dark:text-neutral-100 font-black uppercase text-[11px]">
                            <td className="border-t-2 border-b border-neutral-300 dark:border-neutral-700 px-3 py-3 sticky left-0 bg-neutral-100 dark:bg-neutral-800 shadow-[2px_0_5px_rgba(0,0,0,0.05)] z-30 text-[#E3000F]">TOTAL</td>
                            {COLUMNS.map(col => (
                                <td key={col.key} className={`border-t-2 border-b border-neutral-300 dark:border-neutral-700 px-3 py-3 ${col.highlight ? 'bg-yellow-100/50 dark:bg-yellow-900/20' : 'bg-neutral-50 dark:bg-neutral-900'}`}>
                                    {renderValue(totals[col.key], col.isCurrency)}
                                </td>
                            ))}
                        </tr>
                        {/* LINHA DE METAS LOJA */}
                        <tr className="text-neutral-900 dark:text-neutral-100 font-black uppercase text-[11px]">
                            <td className="border-b border-neutral-300 dark:border-neutral-700 px-3 py-3 sticky left-0 bg-neutral-100 dark:bg-neutral-800 shadow-[2px_0_5px_rgba(0,0,0,0.05)] z-30 text-blue-600">META LOJA</td>
                            {COLUMNS.map(col => {
                                const hasMeta = metaLoja[col.key] !== undefined && metaLoja[col.key] > 0;
                                return (
                                    <td key={`meta-${col.key}`} className={`border-b border-neutral-300 dark:border-neutral-700 px-3 py-3 ${col.highlight ? 'bg-yellow-100/50 dark:bg-yellow-900/20' : 'bg-neutral-50 dark:bg-neutral-900'}`}>
                                        {hasMeta ? renderValue(metaLoja[col.key], col.isCurrency) : <span className="text-neutral-400 dark:text-neutral-600">-</span>}
                                    </td>
                                );
                            })}
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
} 