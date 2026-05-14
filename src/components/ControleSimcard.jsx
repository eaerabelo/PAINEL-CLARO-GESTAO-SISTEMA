import React, { useState, useEffect } from 'react';
import { Lock, Unlock, FileSpreadsheet, Trash2, X } from 'lucide-react';
import { applyDateShortMask, applyOvMask, applyCpfCnpjMask, applyCurrencyMask, getTodaySP } from '../utils/masks';

export const ControleSimcard = ({ simcardsData, setSimcardsData, canModifySimcard, globalUser, setAuthModal, usersDB = {} }) => {
    const safeVendedores = Object.values(usersDB || {})
        .filter(u => !u?.role || u?.role === 'VENDEDOR')
        .map(u => String(u?.name || '').split(' ')[0])
        .filter(Boolean);

    const [simcardActiveTab, setSimcardActiveTab] = useState(() => {
        if (globalUser?.role === 'VENDEDOR' && globalUser?.name) {
            const sellerFirstName = String(globalUser.name || '').split(' ')[0];
            if (safeVendedores.includes(sellerFirstName)) return sellerFirstName;
        }
        return 'GESTAO';
    });
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
    const [batchData, setBatchData] = useState({ fisicos: '', esims: '', data: getTodaySP() });

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isBatchModalOpen) {
                setIsBatchModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isBatchModalOpen]);

    const dynamicTabs = ['GESTAO', ...safeVendedores, 'SOBREPOSIÇÃO'];
    const currentTab = dynamicTabs.includes(simcardActiveTab) ? simcardActiveTab : (dynamicTabs[0] || 'GESTAO');

    const handleBatchSubmit = (e) => {
        e.preventDefault();
        const linhasFisico = batchData.fisicos.split('\n').map(l => l.trim().replace(/\D/g, '').slice(0, 20)).filter(l => l);
        const linhasEsim = batchData.esims.split('\n').map(l => l.trim().replace(/\D/g, '').slice(0, 20)).filter(l => l);

        if (linhasFisico.length === 0 && linhasEsim.length === 0) return;

        let shortDate = '';
        if (batchData.data) {
            const [yyyy, mm, dd] = batchData.data.split('-');
            if (yyyy && mm && dd) shortDate = `${dd}/${mm}/${yyyy.slice(2)}`;
        }

        const novosRegistros = [];
        const baseId = -Date.now() * 1000;
        
        linhasFisico.forEach((linha, i) => {
            novosRegistros.push({
                id: baseId - i,
                owner: currentTab,
                simcardFisico: linha,
                simcardEsim: '',
                data: shortDate, ov: '', codAutorizacao: '', cpf: '', plano: '', cliente: '', pagamento: '', valor: 'R$ 15,00', observacao: '',
                dataPortin: '', numPortado: '', numProvisorio: ''
            });
        });

        linhasEsim.forEach((linha, i) => {
            novosRegistros.push({
                id: baseId - linhasFisico.length - i,
                owner: currentTab,
                simcardFisico: '',
                simcardEsim: linha,
                data: shortDate, ov: '', codAutorizacao: '', cpf: '', plano: '', cliente: '', pagamento: '', valor: 'R$ 15,00', observacao: '',
                dataPortin: '', numPortado: '', numProvisorio: ''
            });
        });

        setSimcardsData(prev => [...prev, ...novosRegistros]);
        setIsBatchModalOpen(false);
        setBatchData({ fisicos: '', esims: '', data: getTodaySP() });
    };

    const handleInlineChange = (id, field, value) => {
        if ((field === 'simcardFisico' || field === 'simcardEsim') && !canModifySimcard) return;
        setSimcardsData(prev => prev.map(item => {
            if (item.id === id) {
                let newValue = value;
                if (field === 'cpf') newValue = applyCpfCnpjMask(value);
                if (field === 'valor') newValue = applyCurrencyMask(value);
                if (field === 'simcardFisico' || field === 'simcardEsim') newValue = value.replace(/\D/g, '').slice(0, 20);
                if (field === 'data') newValue = applyDateShortMask(value);
                if (field === 'ov' || field === 'plano') newValue = value.toUpperCase();
                if (field === 'dataPortin') {
                    let v = value.replace(/\D/g, '');
                    if (v.length > 10) v = v.slice(0, 10);
                    let masked = v;
                    if (v.length > 8) {
                        masked = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4, 6)} ${v.slice(6, 8)}:${v.slice(8, 10)}`;
                    } else if (v.length > 6) {
                        masked = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4, 6)} ${v.slice(6)}`;
                    } else if (v.length > 4) {
                        masked = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
                    } else if (v.length > 2) {
                        masked = `${v.slice(0, 2)}/${v.slice(2)}`;
                    }
                    newValue = masked;
                }
                if (field === 'numPortado' || field === 'numProvisorio') {
                    let v = value.replace(/\D/g, '');
                    if (v.length > 11) v = v.slice(0, 11);
                    let masked = v;
                    if (v.length > 7) {
                        masked = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
                    } else if (v.length > 2) {
                        masked = `(${v.slice(0, 2)}) ${v.slice(2)}`;
                    }
                    newValue = masked;
                }
                return { ...item, [field]: newValue };
            }
            return item;
        }));
    };

    const handleDeleteRequest = (id) => {
        if (canModifySimcard) { setSimcardsData(prev => prev.filter(item => item.id !== id)); }
        else { setAuthModal({ isOpen: true, pendingAction: 'DELETE', pendingId: id }); }
    };

    const handleProtectedClick = () => {
        if (!canModifySimcard) setAuthModal({ isOpen: true, pendingAction: 'UNLOCK', pendingId: null });
    };

    return (
        <>
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col h-full animate-fade-in transition-colors">
                <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex flex-wrap gap-3 justify-between items-center bg-white dark:bg-neutral-900 shrink-0">
                    <h2 className="font-semibold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                        Controle de Estoque e SIM Cards
                        {canModifySimcard ? (
                            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] px-2 py-0.5 rounded flex items-center gap-1 font-bold uppercase ml-2"><Unlock size={12} /> Gestor Liberado</span>
                        ) : (
                            <span onClick={handleProtectedClick} className="bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-[10px] px-2 py-0.5 rounded flex items-center gap-1 font-bold uppercase ml-2 cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors" title="Desbloquear Edição"><Lock size={12} /> Acesso Restrito</span>
                        )}
                    </h2>
                    <div className="flex gap-2">
                        {!globalUser && (
                            <button onClick={() => setAuthModal({ isOpen: true, pendingAction: null, pendingId: null })} className="px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 text-sm font-medium rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex items-center gap-1"><Lock size={14} /> Autenticar</button>
                        )}
                        {canModifySimcard && (
                            <button onClick={() => setIsBatchModalOpen(true)} className="px-4 py-2 bg-[#E3000F] text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm shadow-red-500/30 flex items-center gap-2"><FileSpreadsheet size={16} /> + Lote de Simcards</button>
                        )}
                    </div>
                </div>

                <div className="flex overflow-x-auto bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800 scrollbar-hide shrink-0">
                    {dynamicTabs.map(tab => (
                        <button key={tab} onClick={() => setSimcardActiveTab(tab)} className={`px-5 py-3 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors border-b-[3px] ${currentTab === tab ? 'border-[#E3000F] text-[#E3000F] bg-white dark:bg-neutral-900' : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}>{tab}</button>
                    ))}
                </div>

                <div className="overflow-auto flex-1 bg-neutral-50/20 dark:bg-neutral-950/50 flex flex-col">
                    {['FÍSICO', 'VIRTUAL (E-SIM)'].map((tipoLote, idx) => {
                        const isFisico = tipoLote === 'FÍSICO';
                        const filteredData = (simcardsData || []).filter(item => {
                            if (item.owner !== currentTab) return false;
                            if (isFisico) {
                                return item.simcardFisico || (!item.simcardFisico && !item.simcardEsim);
                            } else {
                                return item.simcardEsim && !item.simcardFisico;
                            }
                        });

                        return (
                            <div key={tipoLote} className={`${idx > 0 ? 'mt-8' : ''}`}>
                                <div className="bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-4 py-2 font-bold uppercase text-xs sticky left-0 border-y border-neutral-300 dark:border-neutral-700 shadow-sm">
                                    ICCID: {tipoLote}
                                </div>
                                <table className="w-full text-sm text-left whitespace-nowrap border-collapse border border-neutral-300 dark:border-neutral-800">
                                    <thead className="text-[11px] text-white uppercase bg-[#C00000] dark:bg-red-900 sticky top-0 z-10 shadow-sm">
                                        {currentTab === 'SOBREPOSIÇÃO' ? (
                                            <tr>
                                                <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider w-44 min-w-[176px]">{isFisico ? 'SIMCARD Físico' : 'E-SIM Virtual'}</th>
                                                <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider w-24 min-w-[96px]">Data</th>
                                                <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider w-36 min-w-[144px]">Data Portin</th>
                                                <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider w-32 min-w-[128px]">Nº Portado</th>
                                                <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider w-32 min-w-[128px]">Nº Provisório</th>
                                                <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider w-32 min-w-[128px]">OV</th>
                                                <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider w-24 min-w-[96px]">Cód. Aut.</th>
                                                <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider w-32 min-w-[128px]">CPF | CNPJ</th>
                                                <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider w-32 min-w-[128px]">Plano</th>
                                                <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider w-64 min-w-[256px]">Cliente</th>
                                                <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider w-64 min-w-[256px]">Observação</th>
                                                <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-16 min-w-[64px]">Excluir</th>
                                            </tr>
                                        ) : (
                                            <tr>
                                                <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider w-44 min-w-[176px]">{isFisico ? 'SIMCARD Físico' : 'E-SIM Virtual'}</th>
                                                <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider w-24 min-w-[96px]">Data</th>
                                                <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider w-32 min-w-[128px]">OV</th>
                                                <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider w-24 min-w-[96px]">Cód. Aut.</th>
                                                <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider w-32 min-w-[128px]">CPF | CNPJ</th>
                                                <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider w-32 min-w-[128px]">Plano</th>
                                                <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider w-64 min-w-[256px]">Cliente</th>
                                                <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider w-28 min-w-[112px]">Pagamento</th>
                                                <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider w-24 min-w-[96px]">Valor</th>
                                                <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider w-64 min-w-[256px]">Observação</th>
                                                <th className="border border-[#A00000] dark:border-red-950 px-3 py-2.5 font-bold tracking-wider text-center w-16 min-w-[64px]">Excluir</th>
                                            </tr>
                                        )}
                                    </thead>
                                    <tbody className="bg-white dark:bg-neutral-900">
                                        {filteredData.length === 0 ? (
                                            <tr>
                                                <td colSpan="12" className="text-center py-6 text-neutral-400 dark:text-neutral-500 bg-white dark:bg-neutral-900 font-medium">Nenhum registro encontrado nesta seção.</td>
                                            </tr>
                                        ) : (
                                            filteredData.map((item) => (
                                                <tr key={item.id} className="hover:bg-blue-50/40 dark:hover:bg-blue-900/20 transition-colors group">
                                                    <td className={`border border-neutral-200 dark:border-neutral-800 p-0 relative ${!canModifySimcard ? 'bg-neutral-100/50 dark:bg-neutral-800/50' : ''}`}><input type="text" value={isFisico ? item.simcardFisico : item.simcardEsim} onChange={e => handleInlineChange(item.id, isFisico ? 'simcardFisico' : 'simcardEsim', e.target.value)} readOnly={!canModifySimcard} className={`w-full h-full min-h-[36px] px-3 py-1.5 bg-transparent outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:ring-inset focus:ring-1 focus:ring-[#E3000F] font-mono text-xs ${!canModifySimcard ? 'text-neutral-500 dark:text-neutral-400' : 'text-neutral-800 dark:text-neutral-200'}`} />{!canModifySimcard && (isFisico ? item.simcardFisico : item.simcardEsim) && <Lock size={12} onClick={handleProtectedClick} title="Desbloquear Edição" className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 cursor-pointer hover:text-[#E3000F] transition-colors" />}</td>
                                                    <td className="border border-neutral-200 dark:border-neutral-800 p-0 relative w-24"><input type="text" value={item.data} onChange={e => handleInlineChange(item.id, 'data', e.target.value)} placeholder="DD/MM/AA" className="w-full h-full min-h-[36px] px-3 py-1.5 bg-transparent outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:ring-inset focus:ring-1 focus:ring-[#E3000F] text-xs text-neutral-600 dark:text-neutral-400 text-center" /></td>
                                                
                                                    {currentTab === 'SOBREPOSIÇÃO' && (
                                                        <>
                                                            <td className="border border-neutral-200 dark:border-neutral-800 p-0 relative"><input type="text" value={item.dataPortin || ''} onChange={e => handleInlineChange(item.id, 'dataPortin', e.target.value)} placeholder="DD/MM/AA HH:MM" className="w-full h-full min-h-[36px] px-3 py-1.5 bg-transparent outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:ring-inset focus:ring-1 focus:ring-[#E3000F] font-mono text-xs text-neutral-800 dark:text-neutral-200 text-center" /></td>
                                                            <td className="border border-neutral-200 dark:border-neutral-800 p-0 relative"><input type="text" value={item.numPortado || ''} onChange={e => handleInlineChange(item.id, 'numPortado', e.target.value)} placeholder="(11) 90000-0000" className="w-full h-full min-h-[36px] px-3 py-1.5 bg-transparent outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:ring-inset focus:ring-1 focus:ring-[#E3000F] font-mono text-xs text-neutral-800 dark:text-neutral-200" /></td>
                                                            <td className="border border-neutral-200 dark:border-neutral-800 p-0 relative"><input type="text" value={item.numProvisorio || ''} onChange={e => handleInlineChange(item.id, 'numProvisorio', e.target.value)} placeholder="(11) 90000-0000" className="w-full h-full min-h-[36px] px-3 py-1.5 bg-transparent outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:ring-inset focus:ring-1 focus:ring-[#E3000F] font-mono text-xs text-neutral-800 dark:text-neutral-200" /></td>
                                                        </>
                                                    )}

                                                    <td className="border border-neutral-200 dark:border-neutral-800 p-0 relative"><input type="text" value={item.ov} onChange={e => handleInlineChange(item.id, 'ov', e.target.value)} className="w-full h-full min-h-[36px] px-3 py-1.5 bg-transparent outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:ring-inset focus:ring-1 focus:ring-[#E3000F] font-mono text-xs text-neutral-800 dark:text-neutral-200" /></td>
                                                    <td className="border border-neutral-200 dark:border-neutral-800 p-0 relative"><input type="text" value={item.codAutorizacao} onChange={e => handleInlineChange(item.id, 'codAutorizacao', e.target.value)} className="w-full h-full min-h-[36px] px-3 py-1.5 bg-transparent outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:ring-inset focus:ring-1 focus:ring-[#E3000F] font-mono text-xs text-neutral-800 dark:text-neutral-200" /></td>
                                                    <td className="border border-neutral-200 dark:border-neutral-800 p-0 relative"><input type="text" value={item.cpf} onChange={e => handleInlineChange(item.id, 'cpf', e.target.value)} className="w-full h-full min-h-[36px] px-3 py-1.5 bg-transparent outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:ring-inset focus:ring-1 focus:ring-[#E3000F] font-mono text-xs text-neutral-800 dark:text-neutral-200" /></td>
                                                    <td className="border border-neutral-200 dark:border-neutral-800 p-0 relative"><input type="text" value={item.plano} onChange={e => handleInlineChange(item.id, 'plano', e.target.value)} className="w-full h-full min-h-[36px] px-3 py-1.5 bg-transparent outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:ring-inset focus:ring-1 focus:ring-[#E3000F] text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase" /></td>
                                                    <td className="border border-neutral-200 dark:border-neutral-800 p-0 relative"><input type="text" value={item.cliente} onChange={e => handleInlineChange(item.id, 'cliente', e.target.value)} className="w-full h-full min-h-[36px] px-3 py-1.5 bg-transparent outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:ring-inset focus:ring-1 focus:ring-[#E3000F] text-xs text-neutral-800 dark:text-neutral-200 uppercase" /></td>
                                                
                                                    {currentTab !== 'SOBREPOSIÇÃO' && (
                                                        <>
                                                            <td className="border border-neutral-200 dark:border-neutral-800 p-0 relative">
                                                                <select value={item.pagamento} onChange={e => handleInlineChange(item.id, 'pagamento', e.target.value)} className="w-full h-full min-h-[36px] px-2 py-1.5 bg-transparent outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:ring-inset focus:ring-1 focus:ring-[#E3000F] text-[10px] font-bold text-neutral-700 dark:text-neutral-300 uppercase"><option className="bg-white dark:bg-neutral-900" value=""></option><option className="bg-white dark:bg-neutral-900" value="LPAY">LPAY</option><option className="bg-white dark:bg-neutral-900" value="PIX">PIX</option><option className="bg-white dark:bg-neutral-900" value="LINK DE PAGAMENTO">LINK DE PAGAMENTO</option><option className="bg-white dark:bg-neutral-900" value="DINHEIRO">DINHEIRO</option><option className="bg-white dark:bg-neutral-900" value="DOA">DOA</option></select>
                                                            </td>
                                                            <td className="border border-neutral-200 dark:border-neutral-800 p-0 relative"><input type="text" value={item.valor} onChange={e => handleInlineChange(item.id, 'valor', e.target.value)} placeholder="R$ 0,00" className="w-full h-full min-h-[36px] px-3 py-1.5 bg-transparent outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:ring-inset focus:ring-1 focus:ring-[#E3000F] text-xs font-bold text-neutral-800 dark:text-neutral-200" /></td>
                                                        </>
                                                    )}

                                                    <td className="border border-neutral-200 dark:border-neutral-800 p-0 relative"><input type="text" value={item.observacao} onChange={e => handleInlineChange(item.id, 'observacao', e.target.value)} className="w-full h-full min-h-[36px] px-3 py-1.5 bg-transparent outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:ring-inset focus:ring-1 focus:ring-[#E3000F] text-xs text-neutral-600 dark:text-neutral-400" /></td>
                                                    <td className="border border-neutral-200 dark:border-neutral-800 p-0 text-center align-middle">
                                                        <button onClick={() => handleDeleteRequest(item.id)} className={`w-full h-full min-h-[36px] flex items-center justify-center transition-colors ${canModifySimcard ? 'text-neutral-400 dark:text-neutral-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-neutral-300 dark:text-neutral-600 hover:text-neutral-500 dark:hover:text-neutral-400'}`} title={canModifySimcard ? "Excluir Linha" : "Autenticação Necessária"}>{canModifySimcard ? <Trash2 size={14} /> : <Lock size={12} />}</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })}
                </div>
            </div>

            {isBatchModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 no-print">
                    <div className="flex min-h-full items-center justify-center">
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-3xl animate-fade-in transition-colors">
                            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-800 rounded-t-2xl">
                                <div><h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">Cadastro em Lote</h2><p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Insira os códigos para criar as linhas na seção <strong className="text-[#E3000F]">{currentTab}</strong>.</p></div>
                                <button onClick={() => setIsBatchModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-600 text-neutral-600 dark:text-neutral-300 rounded-full transition-colors"><X size={18} /></button>
                            </div>
                            <div className="p-6 space-y-6">
                                <div><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Data do Lote</label><input type="date" value={batchData.data} onChange={e => setBatchData({ ...batchData, data: e.target.value })} className="w-full md:w-1/2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg mt-1 outline-none focus:ring-1 focus:ring-[#E3000F]" /></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                                    <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-neutral-200 dark:bg-neutral-700 -translate-x-1/2"></div>
                                    <div className="md:pr-3"><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex justify-between items-end mb-1"><span>Lote Físico (ICCID)</span><span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-400 dark:text-neutral-500">Um por linha</span></label><textarea value={batchData.fisicos} onChange={e => setBatchData({ ...batchData, fisicos: e.target.value })} rows={8} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-3 rounded-lg outline-none focus:ring-1 focus:ring-[#E3000F] font-mono text-sm resize-none" placeholder="Ex:&#10;89550532010074916929&#10;89550532010074916930" /></div>
                                    <div className="md:pl-3 pt-6 md:pt-0 border-t border-neutral-200 dark:border-neutral-700 md:border-0"><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex justify-between items-end mb-1"><span>Lote Virtual (E-SIM)</span><span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-400 dark:text-neutral-500">Um por linha</span></label><textarea value={batchData.esims} onChange={e => setBatchData({ ...batchData, esims: e.target.value })} rows={8} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-3 rounded-lg outline-none focus:ring-1 focus:ring-[#E3000F] font-mono text-sm resize-none" placeholder="Ex:&#10;89550532010074916929&#10;89550532010074916930" /></div>
                                </div>
                                <div className="pt-2 flex justify-end gap-3"><button type="button" onClick={() => setIsBatchModalOpen(false)} className="px-6 py-3 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-medium rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancelar</button><button onClick={handleBatchSubmit} className="px-8 py-3 bg-[#E3000F] text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30 flex items-center gap-2">Adicionar à Planilha</button></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};