import React, { useState } from 'react';
import { Plus, MonitorPlay, AlertCircle, X, Check, Lock, Briefcase, Trash2, Edit3, Calendar, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { PRICING_MOVEL, FIBRA_OPTIONS, TV_BOX_OPTIONS, FIXO_OPTIONS, MESH_OPTIONS, SEGURO_OPTIONS, DEPENDENTE_OPTIONS, PRODUTOS_CONTRATO_OBRIGATORIO, PRODUTOS } from '../utils/constants';
import { applyCpfCnpjMask, applyContratoMask, applyCurrencyMask, parseCurrencyToFloat, getTodaySP } from '../utils/masks';

const safeProdutos = Array.isArray(PRODUTOS) ? PRODUTOS : [];

export const Venda = ({ salesData, setSalesData, isVendedor, globalUser, usersDB = {} }) => {
    const safeVendedores = Object.values(usersDB)
        .filter(u => !u.role || u.role === 'VENDEDOR')
        .map(u => u.name.split(' ')[0])
        .filter(Boolean);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formError, setFormError] = useState('');
    const [filterDate, setFilterDate] = useState(getTodaySP());
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        vendedor: '', data: getTodaySP(), qtda: 1, portabilidade: '',
        combo: 'SINGLE', produto: '', subOption: '', receita: '', isReceitaReadonly: false,
        cpf: '', contrato: '', mplay: '', adicionais: [], tipoOperacao: ''
    });

    const isComissionado = ['APARELHO', 'ACESSORIO', 'PELICULA'].includes(formData?.produto || '');
    const requiresContrato = PRODUTOS_CONTRATO_OBRIGATORIO.includes(formData?.produto || '');

    const calcularComissaoDinamica = (produto, adicionaisList, valorBruto) => {
        const valor = parseFloat(valorBruto || 0);
        if (isNaN(valor)) return 0;
        if (produto === 'APARELHO') return adicionaisList.includes('SEGURO') ? valor * 0.06 : valor * 0.05;
        if (produto === 'ACESSORIO' || produto === 'PELICULA') return valor * 0.15;
        return valor;
    };

    const calculatePrice = (produto, combo, subOption) => {
        if (PRICING_MOVEL[produto]) return PRICING_MOVEL[produto][combo] || PRICING_MOVEL[produto]['SINGLE'];
        if (produto === 'FIBRA' && subOption) return FIBRA_OPTIONS.find(o => o.label === subOption)?.prices?.[combo] || FIBRA_OPTIONS.find(o => o.label === subOption)?.prices?.['SINGLE'] || FIBRA_OPTIONS.find(o => o.label === subOption)?.prices?.UNICO;
        if (produto === 'TV-BOX' && subOption) return TV_BOX_OPTIONS.find(o => o.label === subOption)?.prices?.[combo] || TV_BOX_OPTIONS.find(o => o.label === subOption)?.prices?.['SINGLE'] || TV_BOX_OPTIONS.find(o => o.label === subOption)?.prices?.UNICO;
        if (produto === 'FIXO' && subOption) return FIXO_OPTIONS.find(o => o.label === subOption)?.prices?.UNICO;
        if (produto === 'MESH' && subOption) return MESH_OPTIONS.find(o => o.label === subOption)?.prices?.UNICO;
        if (produto === 'SEGURO' && subOption) return SEGURO_OPTIONS.find(o => o.label === subOption)?.prices?.UNICO;
        if (produto === 'DEPENDENTE' && subOption) return DEPENDENTE_OPTIONS.find(o => o.label === subOption)?.prices?.UNICO;
        return null;
    };

    const getSubOptions = () => {
        if (formData.produto === 'FIBRA') return FIBRA_OPTIONS;
        if (formData.produto === 'TV-BOX') return TV_BOX_OPTIONS;
        if (formData.produto === 'FIXO') return FIXO_OPTIONS;
        if (formData.produto === 'MESH') return MESH_OPTIONS;
        if (formData.produto === 'SEGURO') return SEGURO_OPTIONS;
        if (formData.produto === 'DEPENDENTE') return DEPENDENTE_OPTIONS;
        return [];
    };

    const openNovaVendaModal = () => {
        setFormError('');
        setEditingId(null);
        setFormData({ vendedor: isVendedor && globalUser ? globalUser.name.split(' ')[0] : '', data: filterDate || getTodaySP(), qtda: 1, portabilidade: '', combo: 'SINGLE', produto: '', subOption: '', receita: '', isReceitaReadonly: false, cpf: '', contrato: '', mplay: '', adicionais: [], tipoOperacao: '' });
        setIsModalOpen(true);
    };

    const handleEditSale = (sale) => {
        setFormError('');
        setEditingId(sale.id);
        setFormData({
            vendedor: sale.vendedor || '',
            data: sale.data.includes('/') ? sale.data.split('/').reverse().join('-') : sale.data,
            qtda: sale.qtda || 1,
            portabilidade: sale.portabilidade || '',
            combo: sale.combo || 'SINGLE',
            produto: sale.produtoBase || (sale.produto.includes(' (') ? sale.produto.split(' (')[0] : sale.produto),
            subOption: sale.subOption || (sale.produto.includes('(') ? sale.produto.split('(')[1].replace(')', '') : ''),
            receita: applyCurrencyMask(sale.receita),
            isReceitaReadonly: false,
            cpf: sale.cpf || '',
            contrato: sale.contrato === '-' ? '' : sale.contrato,
            mplay: sale.mplay || '',
            adicionais: sale.adicionais || [],
            tipoOperacao: sale.tipoOperacao || ''
        });
        setIsModalOpen(true);
    };

    const handleDeleteSale = (id) => {
        if (window.confirm('Tem certeza que deseja excluir este registro de venda?')) {
            setSalesData(prev => prev.filter(sale => sale.id !== id));
            toast.success('Venda excluída com sucesso!');
        }
    };

    const handleFormChange = (e) => {
        let { name, value } = e.target;
        if (name === 'cpf') value = applyCpfCnpjMask(value);
        if (name === 'contrato') value = applyContratoMask(value);
        if (name === 'receita') value = applyCurrencyMask(value);
        setFormData(prev => {
            let next = { ...prev, [name]: value };
            if (['produto', 'combo', 'subOption'].includes(name)) {
                if (name === 'produto') {
                    next.contrato = '';
                    if (value === 'FIBRA') next.subOption = '250 MEGA'; else if (value === 'TV-BOX') next.subOption = 'TV BOX'; else if (value === 'FIXO') next.subOption = 'FIXO MUNDO'; else if (value === 'MESH') next.subOption = 'MESH 2UN'; else if (value === 'SEGURO') next.subOption = 'SEGURO R$ 14,00'; else if (value === 'DEPENDENTE') next.subOption = 'GRATUITO'; else next.subOption = '';
                    if (!value.includes('POS') && !value.includes('CONTROLE')) next.tipoOperacao = '';
                }
                const price = calculatePrice(next.produto, next.combo, next.subOption);
                if (price !== null && price !== undefined) { next.receita = applyCurrencyMask(price); next.isReceitaReadonly = true; } else { next.isReceitaReadonly = false; if (name === 'produto') next.receita = ''; }
            }
            return next;
        });
        if (formError) setFormError('');
    };

    const handleAdicionalToggle = (op) => {
        setFormData(prev => {
            let nextAdicionais = [...prev.adicionais];
            if (op === 'NENHUM') nextAdicionais = []; else { if (nextAdicionais.includes(op)) nextAdicionais = nextAdicionais.filter(item => item !== op); else nextAdicionais.push(op); }
            return { ...prev, adicionais: nextAdicionais };
        });
    };

    const handleSubmitSale = (e) => {
        e.preventDefault();
        const { vendedor, data, qtda, portabilidade, produto, receita, cpf, contrato, mplay, adicionais, tipoOperacao, subOption } = formData;
        if (!vendedor || !data || !qtda || !portabilidade || !produto || receita === '' || !cpf || !mplay) { setFormError('Atenção: Você precisa preencher todas as informações obrigatórias para incluir a venda.'); return; }
        if (getSubOptions().length > 0 && !subOption) { setFormError('Atenção: Selecione a especificação (Plano/Velocidade) do produto.'); return; }
        if ((produto.includes('POS') || produto.includes('CONTROLE')) && !tipoOperacao) { setFormError('Atenção: Selecione se a operação móvel é Ativação ou Migração.'); return; }
        if (requiresContrato && !contrato) { setFormError(`O campo Contrato é obrigatório para a venda de ${produto}.`); return; }

        const receitaFloat = parseCurrencyToFloat(receita);
        const valorParaGravar = isComissionado ? calcularComissaoDinamica(produto, adicionais, receitaFloat) : receitaFloat;
        const novaVenda = {
            id: editingId || Date.now(),
            ...formData,
            produtoBase: formData.produto,
            subOption: formData.subOption,
            produto: formData.subOption ? `${formData.produto} (${formData.subOption})` : formData.produto,
            receita: valorParaGravar,
            contrato: requiresContrato ? contrato : '-'
        };

        if (editingId) {
            setSalesData(prev => prev.map(s => s.id === editingId ? novaVenda : s));
            toast.success('Alterações salvas com sucesso!');
        } else {
            setSalesData([novaVenda, ...salesData]);
            toast.success('Venda registrada com sucesso!');
        }
        setIsModalOpen(false);
    };

    const parseDateToISO = (dateStr) => {
        if (!dateStr) return '';
        if (dateStr.includes('-')) return dateStr;
        const [dd, mm, yyyy] = dateStr.split('/');
        return `${yyyy}-${mm}-${dd}`;
    };

    const filteredSales = salesData.filter(sale => {
        let matchDate = true;
        if (filterDate) matchDate = parseDateToISO(sale.data) === filterDate;
        
        let matchSearch = true;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            matchSearch = (sale.vendedor || '').toLowerCase().includes(term) ||
                (sale.produto || '').toLowerCase().includes(term);
        }
        return matchDate && matchSearch;
    });

    const handleExportExcel = () => {
        if (filteredSales.length === 0) {
            toast.error('Nenhum dado para exportar no período selecionado.');
            return;
        }
        
        const dataToExport = filteredSales.map(sale => ({
            'Vendedor': sale.vendedor,
            'Data': sale.data,
            'Produto': sale.produto,
            'Tipo': sale.combo,
            'Quantidade': sale.qtda,
            'Portabilidade': sale.portabilidade,
            'Receita (R$)': sale.receita,
            'CPF/CNPJ': sale.cpf,
            'Contrato': sale.contrato,
            'M-Play': sale.mplay,
            'Adicionais': sale.adicionais ? sale.adicionais.join(', ') : ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Vendas");
        XLSX.writeFile(workbook, `Relatorio_Vendas_${filterDate || 'Geral'}.xlsx`);
        toast.success('Relatório exportado com sucesso!');
    };

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden flex flex-col h-full animate-fade-in">
                <div className="p-4 border-b border-neutral-100 flex flex-col md:flex-row gap-3 justify-between items-start md:items-center bg-white shrink-0">
                    <h2 className="font-semibold text-neutral-800 flex items-center gap-2">Registro de Vendas Diárias <span className="bg-neutral-100 text-neutral-500 text-xs px-2 py-0.5 rounded-full font-normal">{filteredSales.length} registros</span></h2>
                    <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-center w-full md:w-auto">
                        <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar Vendedor ou Produto..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:w-56 pl-9 pr-4 py-1.5 bg-white border border-neutral-200 rounded-lg text-sm outline-none focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer">
                            <Calendar size={16} className="text-neutral-500" />
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                max={getTodaySP()}
                                className="text-sm text-neutral-700 outline-none bg-transparent font-medium cursor-pointer w-full"
                                title="Filtrar por data"
                            />
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button onClick={handleExportExcel} className="flex-1 sm:flex-none px-4 py-2 bg-[#107c41] text-white text-sm font-medium rounded-lg hover:bg-[#0c5e31] transition-colors shadow-sm shadow-green-700/30 justify-center flex items-center whitespace-nowrap">Exportar Excel</button>
                            <button onClick={openNovaVendaModal} className="flex-1 sm:flex-none px-4 py-2 bg-[#E3000F] text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm shadow-red-500/30 flex items-center justify-center gap-1 whitespace-nowrap"><Plus size={16} /> Nova Venda</button>
                        </div>
                    </div>
                </div>
                <div className="overflow-auto flex-1">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="text-xs text-neutral-500 uppercase bg-neutral-50/80 sticky top-0 border-b border-neutral-200 z-10">
                            <tr><th className="px-6 py-4 font-medium tracking-wider">Vendedor</th><th className="px-6 py-4 font-medium tracking-wider">Data</th><th className="px-6 py-4 font-medium tracking-wider">Produto</th><th className="px-6 py-4 font-medium tracking-wider">Tipo</th><th className="px-6 py-4 font-medium tracking-wider text-center">Qtda</th><th className="px-6 py-4 font-medium tracking-wider">Portabilidade</th><th className="px-6 py-4 font-medium tracking-wider">Receita (R$)</th><th className="px-6 py-4 font-medium tracking-wider">CPF/CNPJ</th><th className="px-6 py-4 font-medium tracking-wider">Contrato</th><th className="px-6 py-4 font-medium tracking-wider">M-Play</th><th className="px-6 py-4 font-medium tracking-wider text-center">Adicional</th><th className="px-6 py-4 font-medium tracking-wider text-center">Ações</th></tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {filteredSales.map((sale, index) => (
                                <tr key={sale.id || index} className="hover:bg-neutral-50/50 transition-colors group cursor-pointer">
                                    <td className="px-6 py-3 font-medium text-neutral-800">{sale.vendedor}</td>
                                    <td className="px-6 py-3 text-neutral-500">{sale.data.includes('-') ? new Date(sale.data + 'T12:00:00').toLocaleDateString('pt-BR') : sale.data}</td>
                                    <td className="px-6 py-3 text-neutral-700 font-medium">{sale.produto}</td>
                                    <td className="px-6 py-3"><span className="bg-neutral-100 text-neutral-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">{sale.combo}</span></td>
                                    <td className="px-6 py-3 text-center"><span className="bg-neutral-100 text-neutral-700 px-2 py-1 rounded-md text-xs">{sale.qtda}</span></td>
                                    <td className="px-6 py-3"><span className={`px-2 py-1 rounded-md text-xs font-medium ${sale.portabilidade === 'SIM' ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-600'}`}>{sale.portabilidade}</span></td>
                                    <td className="px-6 py-3 font-medium text-neutral-800">{applyCurrencyMask(sale.receita)}</td>
                                    <td className="px-6 py-3 text-neutral-500 font-mono text-xs">{sale.cpf}</td><td className="px-6 py-3 text-neutral-500 font-mono text-xs">{sale.contrato}</td>
                                    <td className="px-6 py-3"><span className={`flex items-center gap-1.5 text-xs font-medium ${sale.mplay === 'SIM' ? 'text-[#E3000F]' : 'text-neutral-400'}`}>{sale.mplay === 'SIM' ? <MonitorPlay size={14} /> : <div className="w-3.5 h-3.5 rounded-full border border-neutral-300"></div>}{sale.mplay}</span></td>
                                    <td className="px-6 py-3 text-center">{sale.adicionais && sale.adicionais.length > 0 ? (<div className="flex justify-center gap-1.5 flex-wrap">{sale.adicionais.map(ad => (<span key={ad} className="bg-[#E3000F]/10 text-[#E3000F] px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">{ad}</span>))}</div>) : <span className="text-neutral-300 text-xs">-</span>}</td>
                                    <td className="px-6 py-3 text-center">
                                        {(!isVendedor || sale.vendedor === globalUser?.name || sale.vendedor === globalUser?.name.split(' ')[0]) ? (
                                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={(e) => { e.stopPropagation(); handleEditSale(sale); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Editar Venda"><Edit3 size={16} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteSale(sale.id); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Excluir Venda"><Trash2 size={16} /></button>
                                            </div>
                                        ) : (
                                            <span className="text-neutral-300"><Lock size={14} className="mx-auto" /></span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-neutral-100 bg-neutral-50/50 text-xs text-neutral-500 flex justify-between items-center shrink-0">
                    <span>Mostrando 1 a {filteredSales.length} de {filteredSales.length} registros</span>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 no-print">
                    <div className="flex min-h-full items-center justify-center">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl animate-fade-in">
                            <div className="sticky top-0 bg-white border-b border-neutral-100 p-6 flex justify-between items-center z-10 rounded-t-2xl">
                                <div><h2 className="text-xl font-bold text-neutral-800">{editingId ? 'Editar Venda' : 'Registrar Nova Venda'}</h2><p className="text-sm text-neutral-500 mt-1">Regras automáticas e cálculos de comissão ativados.</p></div>
                                <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-full transition-colors"><X size={18} /></button>
                            </div>
                            <form onSubmit={handleSubmitSale} className="p-4 sm:p-6 space-y-6">
                                {formError && (<div className="bg-red-50 border border-red-200 text-[#E3000F] px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium animate-fade-in"><AlertCircle size={18} className="shrink-0" />{formError}</div>)}
                                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 flex flex-col md:flex-row md:items-center gap-4 justify-between"><div><h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wide">Contexto da Venda</h3><p className="text-xs text-neutral-500">Selecione o formato para calcular a receita corretamente.</p></div><div className="flex flex-wrap sm:flex-nowrap bg-white rounded-lg p-1 border border-neutral-200 shadow-sm w-full md:w-auto">{['SINGLE', 'MULTI', 'MULTI 3P'].map(tipo => (<button key={tipo} type="button" onClick={() => handleFormChange({ target: { name: 'combo', value: tipo } })} className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-md transition-all ${formData.combo === tipo ? 'bg-[#E3000F] text-white shadow-md' : 'text-neutral-500 hover:bg-neutral-50'}`}>{tipo}</button>))}</div></div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                                    <div className="space-y-1.5 relative"><label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex justify-between"><span>Vendedor <span className="text-[#E3000F]">*</span></span>{isVendedor && <Lock size={12} className="text-[#E3000F]" />}</label><select name="vendedor" value={formData.vendedor} onChange={handleFormChange} disabled={isVendedor} className={`w-full border border-neutral-200 text-neutral-800 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium ${isVendedor ? 'bg-neutral-100 cursor-not-allowed text-[#E3000F]' : 'bg-neutral-50'}`}><option value="">Selecione o vendedor</option>{safeVendedores.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                                    <div className="space-y-1.5"><label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Data <span className="text-[#E3000F]">*</span></label><input type="date" name="data" max={getTodaySP()} value={formData.data} onChange={handleFormChange} className="w-full bg-neutral-50 border border-neutral-200 text-neutral-800 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm" /></div>
                                    <div className="space-y-1.5"><label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Produto Principal <span className="text-[#E3000F]">*</span></label><select name="produto" value={formData.produto} onChange={handleFormChange} className="w-full bg-neutral-50 border border-neutral-200 text-neutral-800 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium"><option value="">Selecione o produto</option>{safeProdutos.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                                    {getSubOptions().length > 0 && (<div className="space-y-1.5 animate-fade-in bg-yellow-50/50 p-2 -m-2 rounded-lg border border-yellow-100"><label className="text-xs font-bold text-neutral-600 uppercase tracking-wider flex items-center gap-1">Especificação <span className="text-[#E3000F]">*</span></label><select name="subOption" value={formData.subOption} onChange={handleFormChange} className="w-full bg-white border border-neutral-200 text-neutral-800 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-bold text-[#E3000F]"><option value="">Selecione a opção</option>{getSubOptions().map(o => <option key={o.label} value={o.label}>{o.label}</option>)}</select></div>)}
                                    {(formData.produto.includes('POS') || formData.produto.includes('CONTROLE')) && (<div className="space-y-1.5 animate-fade-in bg-purple-50/50 p-2 -m-2 rounded-lg border border-purple-100"><label className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1">Tipo de Operação <span className="text-[#E3000F]">*</span></label><select name="tipoOperacao" value={formData.tipoOperacao} onChange={handleFormChange} className="w-full bg-white border border-neutral-200 text-neutral-800 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-bold text-purple-700"><option value="">Selecione</option><option value="ATIVAÇÃO">ATIVAÇÃO</option><option value="MIGRAÇÃO">MIGRAÇÃO</option></select></div>)}
                                    <div className="space-y-1.5"><label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center justify-between"><span>{isComissionado ? 'Valor Bruto da Venda (R$)' : 'Receita (R$)'} <span className="text-[#E3000F]">*</span></span>{formData.isReceitaReadonly && <span className="text-[10px] bg-neutral-200 text-neutral-600 px-1.5 py-0.5 rounded flex items-center gap-1"><Check size={10} /> Automático</span>}</label>{formData.isReceitaReadonly ? (<input type="text" readOnly value={formData.receita} className="w-full bg-neutral-100 border border-neutral-200 text-neutral-500 px-3 py-2.5 rounded-lg outline-none text-sm font-bold cursor-not-allowed" />) : (<input type="text" name="receita" value={formData.receita} onChange={handleFormChange} placeholder="R$ 0,00" className="w-full bg-white border border-neutral-300 text-neutral-800 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] focus:border-[#E3000F] outline-none text-sm font-bold" />)}{isComissionado && formData.receita && (<div className="text-[11px] text-green-700 font-bold bg-green-50 px-2 py-1 rounded border border-green-200 mt-1 flex justify-between items-center animate-fade-in"><span>Comissão a registrar:</span><span>{applyCurrencyMask(calcularComissaoDinamica(formData.produto, formData.adicionais, parseCurrencyToFloat(formData.receita)))}</span></div>)}</div>
                                    <div className="space-y-1.5"><label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Qtda <span className="text-[#E3000F]">*</span></label><input type="number" min="1" name="qtda" value={formData.qtda} onChange={handleFormChange} className="w-full bg-neutral-50 border border-neutral-200 text-neutral-800 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm" /></div>
                                    <div className="space-y-1.5"><label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Portabilidade <span className="text-[#E3000F]">*</span></label><select name="portabilidade" value={formData.portabilidade} onChange={handleFormChange} className="w-full bg-neutral-50 border border-neutral-200 text-neutral-800 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm"><option value="">Selecione</option><option value="SIM">SIM</option><option value="NÃO">NÃO</option></select></div>
                                    <div className="space-y-1.5"><label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">CPF / CNPJ <span className="text-[#E3000F]">*</span></label><input type="text" name="cpf" value={formData.cpf} onChange={handleFormChange} placeholder="000.000.000-00" className="w-full bg-neutral-50 border border-neutral-200 text-neutral-800 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-mono" /></div>
                                    <div className="space-y-1.5 relative"><label className={`text-xs font-bold uppercase tracking-wider flex justify-between ${requiresContrato ? 'text-neutral-500' : 'text-neutral-400'}`}><span>Contrato {requiresContrato && <span className="text-[#E3000F]">*</span>}</span>{!requiresContrato && <Lock size={12} />}</label><input type="text" name="contrato" value={formData.contrato} onChange={handleFormChange} placeholder={requiresContrato ? "Ex: 000/000000000" : "Não aplicável"} disabled={!requiresContrato} className={`w-full px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-mono border ${requiresContrato ? 'bg-neutral-50 border-neutral-200 text-neutral-800' : 'bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed'}`} /></div>
                                    <div className="space-y-1.5"><label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">M-Play <span className="text-[#E3000F]">*</span></label><select name="mplay" value={formData.mplay} onChange={handleFormChange} className="w-full bg-neutral-50 border border-neutral-200 text-neutral-800 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm"><option value="">Selecione</option><option value="SIM">SIM</option><option value="NÃO">NÃO</option></select></div>
                                </div>
                                <div className="mt-6 pt-6 border-t border-neutral-100">
                                    <label className="text-sm font-bold text-neutral-800 flex items-center gap-2 mb-4"><Briefcase size={16} className="text-[#E3000F]" /> A Venda possui algum programa adicional?</label>
                                    <div className="flex flex-wrap gap-4">
                                        <label className={`flex items-center gap-3 px-5 py-3 border rounded-xl cursor-pointer transition-all ${formData.adicionais.length === 0 ? 'border-[#E3000F] bg-red-50 text-[#E3000F]' : 'border-neutral-200 hover:border-neutral-300 text-neutral-600'}`}><input type="checkbox" checked={formData.adicionais.length === 0} onChange={() => handleAdicionalToggle('NENHUM')} className="hidden" /><div className={`w-4 h-4 rounded flex items-center justify-center ${formData.adicionais.length === 0 ? 'bg-[#E3000F] border-[#E3000F]' : 'border-2 border-neutral-300'}`}>{formData.adicionais.length === 0 && <Check size={12} className="text-white" />}</div><span className="text-sm font-bold tracking-wide">NENHUM</span></label>
                                        {['TROCAFY', 'CLARO UP', 'SEGURO'].map((op) => (
                                            <label key={op} className={`flex items-center gap-3 px-5 py-3 border rounded-xl cursor-pointer transition-all ${formData.adicionais.includes(op) ? 'border-[#E3000F] bg-red-50 text-[#E3000F]' : 'border-neutral-200 hover:border-neutral-300 text-neutral-600'}`}><input type="checkbox" checked={formData.adicionais.includes(op)} onChange={() => handleAdicionalToggle(op)} className="hidden" /><div className={`w-4 h-4 rounded flex items-center justify-center ${formData.adicionais.includes(op) ? 'bg-[#E3000F] border-[#E3000F]' : 'border-2 border-neutral-300'}`}>{formData.adicionais.includes(op) && <Check size={12} className="text-white" />}</div><span className="text-sm font-bold tracking-wide">{op}</span></label>
                                        ))}
                                    </div>
                                </div>
                                <div className="pt-6 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-neutral-100 mt-6"><button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-6 py-2.5 border border-neutral-200 text-neutral-600 font-medium rounded-lg hover:bg-neutral-50 transition-colors">Cancelar</button><button type="submit" className="w-full sm:w-auto px-8 py-2.5 bg-[#E3000F] text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30 flex items-center justify-center gap-2">{editingId ? 'Salvar Alterações' : 'Confirmar Venda'}</button></div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};