import React, { useState } from 'react';
import { Lock, Unlock, FileSpreadsheet, Trash2, Watch, X } from 'lucide-react';
import { SIMCARD_TABS } from '../utils/constants';
import { applyDateShortMask, applyOvMask, applyCpfCnpjMask, applyCurrencyMask, getTodaySP } from '../utils/masks';

const safeSimcardTabs = Array.isArray(SIMCARD_TABS) ? SIMCARD_TABS : ['GESTAO', 'APARELHO & ACESSORIO'];

export const ControleSimcard = ({ simcardsData, setSimcardsData, canModifySimcard, globalUser, setAuthModal }) => {
    const [simcardActiveTab, setSimcardActiveTab] = useState('GESTAO');
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
    const [batchData, setBatchData] = useState({ fisicos: '', esims: '', data: getTodaySP() });

    const handleBatchSubmit = (e) => {
        e.preventDefault();
        const linhasFisico = batchData.fisicos.split('\n').map(l => l.trim().replace(/\D/g, '').slice(0, 20)).filter(l => l);
        const linhasEsim = batchData.esims.split('\n').map(l => l.trim().replace(/\D/g, '').slice(0, 20)).filter(l => l);

        const totalLinhas = Math.max(linhasFisico.length, linhasEsim.length);
        if (totalLinhas === 0) return;

        let shortDate = '';
        if (batchData.data) {
            const [yyyy, mm, dd] = batchData.data.split('-');
            if (yyyy && mm && dd) shortDate = `${dd}/${mm}/${yyyy.slice(2)}`;
        }

        const novosRegistros = [];
        for (let i = 0; i < totalLinhas; i++) {
            novosRegistros.push({
                id: Date.now() + i,
                owner: simcardActiveTab,
                simcardFisico: linhasFisico[i] || '',
                simcardEsim: linhasEsim[i] || '',
                data: shortDate, ov: '', codAutorizacao: '', cpf: '', plano: '', cliente: '', pagamento: '', valor: 'R$ 15,00', observacao: ''
            });
        }

        setSimcardsData(prev => [...novosRegistros, ...prev]);
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
                if (field === 'ov') newValue = applyOvMask(value);
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
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden flex flex-col h-full animate-fade-in">
                <div className="p-4 border-b border-neutral-100 flex flex-wrap gap-3 justify-between items-center bg-white shrink-0">
                    <h2 className="font-semibold text-neutral-800 flex items-center gap-2">
                        Controle de Estoque e SIM Cards
                        {canModifySimcard ? (
                            <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded flex items-center gap-1 font-bold uppercase ml-2"><Unlock size={12} /> Gestor Liberado</span>
                        ) : (
                            <span className="bg-neutral-100 text-neutral-500 text-[10px] px-2 py-0.5 rounded flex items-center gap-1 font-bold uppercase ml-2"><Lock size={12} /> Acesso Restrito</span>
                        )}
                    </h2>
                    <div className="flex gap-2">
                        {!globalUser && (
                            <button onClick={() => setAuthModal({ isOpen: true, pendingAction: null, pendingId: null })} className="px-3 py-2 bg-neutral-100 border border-neutral-200 text-neutral-600 text-sm font-medium rounded-lg hover:bg-neutral-200 transition-colors flex items-center gap-1"><Lock size={14} /> Autenticar</button>
                        )}
                        {canModifySimcard && (
                            <button onClick={() => setIsBatchModalOpen(true)} className="px-4 py-2 bg-[#E3000F] text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm shadow-red-500/30 flex items-center gap-2"><FileSpreadsheet size={16} /> + Lote de Simcards</button>
                        )}
                    </div>
                </div>

                <div className="flex overflow-x-auto bg-neutral-50 border-b border-neutral-200 scrollbar-hide shrink-0">
                    {safeSimcardTabs.map(tab => (
                        <button key={tab} onClick={() => setSimcardActiveTab(tab)} className={`px-5 py-3 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors border-b-[3px] ${simcardActiveTab === tab ? 'border-[#E3000F] text-[#E3000F] bg-white' : 'border-transparent text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100'}`}>{tab}</button>
                    ))}
                </div>

                {simcardActiveTab === 'APARELHO & ACESSORIO' ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 p-8 bg-neutral-50/50">
                        <Watch size={48} className="mb-4 text-neutral-300" />
                        <h3 className="text-xl font-medium text-neutral-600 mb-2">Controle de Aparelhos e Acessórios</h3>
                        <p className="text-sm">Esta seção possui layout e regras específicas. Módulo em desenvolvimento.</p>
                    </div>
                ) : (
                    <div className="overflow-auto flex-1 bg-neutral-50/20">
                        <table className="w-full text-sm text-left whitespace-nowrap border-collapse border border-neutral-300">
                            <thead className="text-[11px] text-white uppercase bg-[#C00000] sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="border border-[#A00000] px-3 py-2.5 font-bold tracking-wider w-40 min-w-[160px]">SIMCARD Físico</th>
                                    <th className="border border-[#A00000] px-3 py-2.5 font-bold tracking-wider w-40 min-w-[160px]">E-SIM Virtual</th>
                                    <th className="border border-[#A00000] px-3 py-2.5 font-bold tracking-wider w-24 min-w-[96px]">Data</th>
                                    <th className="border border-[#A00000] px-3 py-2.5 font-bold tracking-wider w-36 min-w-[144px]">OV</th>
                                    <th className="border border-[#A00000] px-3 py-2.5 font-bold tracking-wider w-24 min-w-[96px]">Cód. Aut.</th>
                                    <th className="border border-[#A00000] px-3 py-2.5 font-bold tracking-wider w-32 min-w-[128px]">CPF | CNPJ</th>
                                    <th className="border border-[#A00000] px-3 py-2.5 font-bold tracking-wider w-32 min-w-[128px]">Plano</th>
                                    <th className="border border-[#A00000] px-3 py-2.5 font-bold tracking-wider w-56 min-w-[224px]">Cliente</th>
                                    <th className="border border-[#A00000] px-3 py-2.5 font-bold tracking-wider w-28 min-w-[112px]">Pagamento</th>
                                    <th className="border border-[#A00000] px-3 py-2.5 font-bold tracking-wider w-24 min-w-[96px]">Valor</th>
                                    <th className="border border-[#A00000] px-3 py-2.5 font-bold tracking-wider w-48 min-w-[192px]">Observação</th>
                                    <th className="border border-[#A00000] px-3 py-2.5 font-bold tracking-wider text-center w-16 min-w-[64px]">Excluir</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {simcardsData.filter(item => item.owner === simcardActiveTab).map((item) => (
                                    <tr key={item.id} className="hover:bg-blue-50/40 transition-colors group">
                                        <td className={`border border-neutral-200 p-0 relative ${!canModifySimcard ? 'bg-neutral-100/50' : ''}`}><input type="text" value={item.simcardFisico} onChange={e => handleInlineChange(item.id, 'simcardFisico', e.target.value)} readOnly={!canModifySimcard} onClick={handleProtectedClick} className={`w-full h-full min-h-[36px] px-3 py-1.5 bg-transparent outline-none focus:bg-blue-50 focus:ring-inset focus:ring-1 focus:ring-[#E3000F] font-mono text-xs ${!canModifySimcard ? 'text-neutral-500 cursor-not-allowed' : 'text-neutral-800'}`} />{!canModifySimcard && item.simcardFisico && <Lock size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />}</td>
                                        <td className={`border border-neutral-200 p-0 relative ${!canModifySimcard ? 'bg-neutral-100/50' : ''}`}><input type="text" value={item.simcardEsim} onChange={e => handleInlineChange(item.id, 'simcardEsim', e.target.value)} readOnly={!canModifySimcard} onClick={handleProtectedClick} className={`w-full h-full min-h-[36px] px-3 py-1.5 bg-transparent outline-none focus:bg-blue-50 focus:ring-inset focus:ring-1 focus:ring-[#E3000F] font-mono text-xs ${!canModifySimcard ? 'text-neutral-500 cursor-not-allowed' : 'text-neutral-800'}`} />{!canModifySimcard && item.simcardEsim && <Lock size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />}</td>
                                        <td className="border border-neutral-200 p-0 relative w-24"><input type="text" value={item.data} onChange={e => handleInlineChange(item.id, 'data', e.target.value)} placeholder="DD/MM/AA" className="w-full h-full min-h-[36px] px-3 py-1.5 bg-transparent outline-none focus:bg-blue-50 focus:ring-inset focus:ring-1 focus:ring-[#E3000F] text-xs text-neutral-600 text-center" /></td>
                                        <td className="border border-neutral-200 p-0 relative"><input type="text" value={item.ov} onChange={e => handleInlineChange(item.id, 'ov', e.target.value)} className="w-full h-full min-h-[36px] px-3 py-1.5 bg-transparent outline-none focus:bg-blue-50 focus:ring-inset focus:ring-1 focus:ring-[#E3000F] font-mono text-xs text-neutral-800" /></td>
                                        <td className="border border-neutral-200 p-0 relative"><input type="text" value={item.codAutorizacao} onChange={e => handleInlineChange(item.id, 'codAutorizacao', e.target.value)} className="w-full h-full min-h-[36px] px-3 py-1.5 bg-transparent outline-none focus:bg-blue-50 focus:ring-inset focus:ring-1 focus:ring-[#E3000F] font-mono text-xs text-neutral-800" /></td>
                                        <td className="border border-neutral-200 p-0 relative"><input type="text" value={item.cpf} onChange={e => handleInlineChange(item.id, 'cpf', e.target.value)} placeholder="000.000.000-00" className="w-full h-full min-h-[36px] px-3 py-1.5 bg-transparent outline-none focus:bg-blue-50 focus:ring-inset focus:ring-1 focus:ring-[#E3000F] font-mono text-xs text-neutral-800" /></td>
                                        <td className="border border-neutral-200 p-0 relative">
                                            <select value={item.plano} onChange={e => handleInlineChange(item.id, 'plano', e.target.value)} className="w-full h-full min-h-[36px] px-2 py-1.5 bg-transparent outline-none focus:bg-blue-50 focus:ring-inset focus:ring-1 focus:ring-[#E3000F] text-[10px] font-bold text-neutral-800 uppercase"><option value=""></option><option value="PÓS">PÓS</option><option value="CONTROLE">CONTROLE</option><option value="PÓS PME">PÓS PME</option><option value="FLEX">FLEX</option><option value="PÓS MULTI">PÓS MULTI</option><option value="PRÉ-PAGO">PRÉ-PAGO</option></select>
                                        </td>
                                        <td className="border border-neutral-200 p-0 relative"><input type="text" value={item.cliente} onChange={e => handleInlineChange(item.id, 'cliente', e.target.value)} className="w-full h-full min-h-[36px] px-3 py-1.5 bg-transparent outline-none focus:bg-blue-50 focus:ring-inset focus:ring-1 focus:ring-[#E3000F] text-xs text-neutral-800 uppercase" /></td>
                                        <td className="border border-neutral-200 p-0 relative">
                                            <select value={item.pagamento} onChange={e => handleInlineChange(item.id, 'pagamento', e.target.value)} className="w-full h-full min-h-[36px] px-2 py-1.5 bg-transparent outline-none focus:bg-blue-50 focus:ring-inset focus:ring-1 focus:ring-[#E3000F] text-[10px] font-bold text-neutral-700 uppercase"><option value=""></option><option value="LPAY">LPAY</option><option value="PIX">PIX</option><option value="LINK DE PAGAMENTO">LINK DE PAGAMENTO</option><option value="DINHEIRO">DINHEIRO</option></select>
                                        </td>
                                        <td className="border border-neutral-200 p-0 relative"><input type="text" value={item.valor} onChange={e => handleInlineChange(item.id, 'valor', e.target.value)} placeholder="R$ 0,00" className="w-full h-full min-h-[36px] px-3 py-1.5 bg-transparent outline-none focus:bg-blue-50 focus:ring-inset focus:ring-1 focus:ring-[#E3000F] text-xs font-bold text-neutral-800" /></td>
                                        <td className="border border-neutral-200 p-0 relative"><input type="text" value={item.observacao} onChange={e => handleInlineChange(item.id, 'observacao', e.target.value)} className="w-full h-full min-h-[36px] px-3 py-1.5 bg-transparent outline-none focus:bg-blue-50 focus:ring-inset focus:ring-1 focus:ring-[#E3000F] text-xs text-neutral-600" /></td>
                                        <td className="border border-neutral-200 p-0 text-center align-middle">
                                            <button onClick={() => handleDeleteRequest(item.id)} className={`w-full h-full min-h-[36px] flex items-center justify-center transition-colors ${canModifySimcard ? 'text-neutral-400 hover:text-red-600 hover:bg-red-50' : 'text-neutral-300 hover:text-neutral-500'}`} title={canModifySimcard ? "Excluir Linha" : "Autenticação Necessária"}>{canModifySimcard ? <Trash2 size={14} /> : <Lock size={12} />}</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isBatchModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 no-print">
                    <div className="flex min-h-full items-center justify-center">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl animate-fade-in">
                            <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50 rounded-t-2xl">
                                <div><h2 className="text-xl font-bold text-neutral-800">Cadastro em Lote</h2><p className="text-sm text-neutral-500 mt-1">Insira os códigos para criar as linhas na seção <strong className="text-[#E3000F]">{simcardActiveTab}</strong>.</p></div>
                                <button onClick={() => setIsBatchModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-600 rounded-full transition-colors"><X size={18} /></button>
                            </div>
                            <div className="p-6 space-y-6">
                                <div><label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Data do Lote</label><input type="date" value={batchData.data} onChange={e => setBatchData({ ...batchData, data: e.target.value })} className="w-full md:w-1/2 bg-neutral-50 border border-neutral-200 text-neutral-800 px-3 py-2.5 rounded-lg mt-1 outline-none focus:ring-1 focus:ring-[#E3000F]" /></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div><label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex justify-between items-end"><span>Lote Físico (ICCID)</span><span className="text-[10px] bg-neutral-100 px-2 py-0.5 rounded text-neutral-400">Um por linha</span></label><textarea value={batchData.fisicos} onChange={e => setBatchData({ ...batchData, fisicos: e.target.value })} rows={8} className="w-full bg-neutral-50 border border-neutral-200 text-neutral-800 px-3 py-3 rounded-lg mt-1 outline-none focus:ring-1 focus:ring-[#E3000F] font-mono text-sm resize-none" placeholder="Ex:&#10;89550532010074916929&#10;89550532010074916930" /></div>
                                    <div><label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex justify-between items-end"><span>Lote Virtual (E-SIM)</span><span className="text-[10px] bg-neutral-100 px-2 py-0.5 rounded text-neutral-400">Um por linha</span></label><textarea value={batchData.esims} onChange={e => setBatchData({ ...batchData, esims: e.target.value })} rows={8} className="w-full bg-neutral-50 border border-neutral-200 text-neutral-800 px-3 py-3 rounded-lg mt-1 outline-none focus:ring-1 focus:ring-[#E3000F] font-mono text-sm resize-none" placeholder="Ex:&#10;89550532010074916929&#10;89550532010074916930" /></div>
                                </div>
                                <div className="pt-2 flex justify-end gap-3"><button type="button" onClick={() => setIsBatchModalOpen(false)} className="px-6 py-3 border border-neutral-200 text-neutral-600 font-medium rounded-xl hover:bg-neutral-50 transition-colors">Cancelar</button><button onClick={handleBatchSubmit} className="px-8 py-3 bg-[#E3000F] text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30 flex items-center gap-2">Adicionar à Planilha</button></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};