import React, { useState, useRef, useEffect } from 'react';
import { Plus, MonitorPlay, AlertCircle, X, Check, Lock, Briefcase, Trash2, Edit3, Calendar, Search, Upload, FileDown } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { PRICING_MOVEL, FIBRA_OPTIONS, TV_BOX_OPTIONS, FIXO_OPTIONS, MESH_OPTIONS, SEGURO_OPTIONS, DEPENDENTE_OPTIONS, PRODUTOS_CONTRATO_OBRIGATORIO, PRODUTOS } from '../utils/constants';
import { applyCpfCnpjMask, applyContratoMask, applyCurrencyMask, parseCurrencyToFloat, getTodaySP } from '../utils/masks';
import { parseExcelSales } from '../utils/excelImporter';

const safeProdutos = Array.isArray(PRODUTOS) ? PRODUTOS : [];

export const Venda = ({ salesData, setSalesData, isVendedor, globalUser, usersDB = {}, globalMonth }) => {
    const safeVendedores = Object.values(usersDB)
        .filter(u => !u.role || u.role === 'VENDEDOR')
        .map(u => u.name.split(' ')[0])
        .filter(Boolean);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formError, setFormError] = useState('');
    const [filterDate, setFilterDate] = useState(getTodaySP());
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        vendedor: '', data: getTodaySP(), qtda: 1, portabilidade: '',
        combo: 'SINGLE', produto: '', subOption: '', receita: '', isReceitaReadonly: false,
        cpf: '', contrato: '', mplay: '', adicionais: [], tipoOperacao: '', seguroOption: ''
    });

    useEffect(() => {
        if (filterDate && !filterDate.startsWith(globalMonth)) {
            setFilterDate('');
        }
    }, [globalMonth]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isModalOpen) {
                setIsModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isModalOpen]);

    const isComissionado = ['APARELHO', 'ACESSORIO', 'PELICULA'].includes(formData?.produto || '');
    const requiresContrato = PRODUTOS_CONTRATO_OBRIGATORIO.includes(formData?.produto || '');
    const isMovel = ['POS', 'PÓS', 'CONTROLE', 'FLEX', 'PRÉ', 'PRE', 'DEPENDENTE'].some(term => (formData?.produto || '').toUpperCase().includes(term));
    const showMplay = isMovel || ['FIBRA', 'TV-BOX', 'FIXO', 'MESH'].includes(formData?.produto || '');

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
        setFormData({ vendedor: isVendedor && globalUser ? globalUser.name.split(' ')[0] : '', data: filterDate || getTodaySP(), qtda: 1, portabilidade: '', combo: 'SINGLE', produto: '', subOption: '', receita: '', isReceitaReadonly: false, cpf: '', contrato: '', mplay: '', adicionais: [], tipoOperacao: '', seguroOption: '' });
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
            tipoOperacao: sale.tipoOperacao || '',
            seguroOption: ''
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
        
        const finalPortabilidade = isMovel ? portabilidade : 'NÃO';
        const finalMplay = showMplay ? mplay : 'NÃO';

        if (!vendedor || !data || !qtda || !produto || receita === '' || !cpf || (isMovel && !portabilidade) || (showMplay && !mplay)) { setFormError('Atenção: Você precisa preencher todas as informações obrigatórias para incluir a venda.'); return; }
        if (getSubOptions().length > 0 && !subOption) { setFormError('Atenção: Selecione a especificação (Plano/Velocidade) do produto.'); return; }
        if ((produto.includes('POS') || produto.includes('CONTROLE')) && !tipoOperacao) { setFormError('Atenção: Selecione se a operação móvel é Ativação ou Migração.'); return; }
        if (requiresContrato && !contrato) { setFormError(`O campo Contrato é obrigatório para a venda de ${produto}.`); return; }

        if (produto === 'APARELHO' && adicionais.includes('SEGURO') && !formData.seguroOption) {
            setFormError('Atenção: Selecione a especificação do Seguro do Aparelho.');
            return;
        }

        let cidadeAuto = '';
        if (requiresContrato && contrato) {
            const prefix = String(contrato).replace(/\D/g, '').substring(0, 3);
            if (prefix === '924') cidadeAuto = 'OSASCO';
            else if (prefix === '003') cidadeAuto = 'SÃO PAULO';
            else if (prefix === '443') cidadeAuto = 'BARUERI';
            else if (prefix === '533') cidadeAuto = 'CARAPICUIBA';
        }

        const receitaFloat = parseCurrencyToFloat(receita);
        const valorParaGravar = isComissionado ? calcularComissaoDinamica(produto, adicionais, receitaFloat) : receitaFloat;
        const novaVenda = {
            id: editingId || Date.now(),
            ...formData,
            produtoBase: formData.produto,
            subOption: formData.subOption,
            produto: formData.subOption ? `${formData.produto} (${formData.subOption})` : formData.produto,
            receita: valorParaGravar,
            contrato: requiresContrato ? contrato : '-',
            portabilidade: finalPortabilidade,
            mplay: finalMplay,
            ...(cidadeAuto && !editingId ? { cidade: cidadeAuto } : {})
        };

        if (editingId) {
            setSalesData(prev => prev.map(s => s.id === editingId ? { ...s, ...novaVenda } : s));
            toast.success('Alterações salvas com sucesso!');
        } else {
            const novasVendas = [novaVenda];
            
            if (produto === 'APARELHO' && adicionais.includes('SEGURO') && formData.seguroOption) {
                const precoSeguro = calculatePrice('SEGURO', 'SINGLE', formData.seguroOption) || 0;
                const vendaSeguro = {
                    ...formData,
                    id: Date.now() + 1,
                    produtoBase: 'SEGURO',
                    subOption: formData.seguroOption,
                    produto: `SEGURO (${formData.seguroOption})`,
                    receita: precoSeguro,
                    contrato: '-',
                    portabilidade: 'NÃO',
                    mplay: 'NÃO',
                    adicionais: [],
                    qtda: 1,
                    combo: 'SINGLE',
                    tipoOperacao: ''
                };
                novasVendas.unshift(vendaSeguro);
            }

            setSalesData([...novasVendas, ...salesData]);
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
                (sale.produto || '').toLowerCase().includes(term) ||
                (sale.portabilidade || '').toLowerCase().includes(term) ||
                (sale.portabilidade === 'SIM' && 'portabilidade'.includes(term)) ||
                (sale.mplay || '').toLowerCase().includes(term) ||
                (sale.mplay === 'SIM' && ('mplay'.includes(term) || 'm-play'.includes(term))) ||
                (sale.combo || '').toLowerCase().includes(term) ||
                (sale.tipoOperacao || '').toLowerCase().includes(term) ||
                (sale.cpf || '').toLowerCase().includes(term) ||
                (sale.contrato || '').toLowerCase().includes(term) ||
                (sale.adicionais && sale.adicionais.join(' ').toLowerCase().includes(term));
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
            'Operação': sale.tipoOperacao || '-',
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

    const handleDownloadTemplate = () => {
        const templateData = [{
            'Data': '20/12/2024',
            'Vendedor': 'NOME (Apenas o 1º Nome)',
            'Produto': 'POS 50GB',
            'Tipo': 'SINGLE (Ou MULTI)',
            'Quantidade': 1,
            'Portabilidade': 'NÃO',
            'Receita (R$)': 124.90,
            'CPF/CNPJ': '000.000.000-00',
            'Contrato': 'Opcional',
            'M-Play': 'NÃO',
            'Adicionais': 'SEGURO, TROCAFY',
            'Operação': 'ATIVAÇÃO'
        }];
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Modelo_Importacao");
        XLSX.writeFile(workbook, "Modelo_Importacao_Vendas.xlsx");
        toast.success('Planilha modelo baixada com sucesso!');
    };

    const handleImportExcelClick = () => {
        fileInputRef.current.click();
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        parseExcelSales(file)
            .then(newSales => {
                setSalesData(prev => [...newSales, ...prev]);
                toast.success(`${newSales.length} vendas importadas com sucesso!`);
            })
            .catch(error => {
                toast.error(error.message);
            })
            .finally(() => {
                e.target.value = null; // Limpa o input para poder importar o mesmo arquivo novamente
            });
    };

    return (
        <>
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col h-full animate-fade-in transition-colors">
                <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex flex-col md:flex-row gap-3 justify-between items-start md:items-center bg-white dark:bg-neutral-900 shrink-0">
                    <h2 className="font-semibold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">Registro de Vendas Diárias <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-xs px-2 py-0.5 rounded-full font-normal">{filteredSales.length} registros</span></h2>
                    <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-center w-full md:w-auto">
                        <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar Vendedor, Produto, CPF, Adicionais..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:w-56 pl-9 pr-4 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 rounded-lg text-sm outline-none focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer">
                            <Calendar size={16} className="text-neutral-500" />
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                max={getTodaySP()}
                                className="text-sm text-neutral-700 dark:text-neutral-300 outline-none bg-transparent font-medium cursor-pointer w-full"
                                title="Filtrar por data"
                            />
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            {/* Input Oculto e Botões de Importar/Exportar (Apenas Gerente) */}
                            {globalUser?.role === 'GERENTE' && (
                                <>
                                    <input type="file" accept=".xlsx, .xls" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileUpload} />
                                    <button onClick={handleDownloadTemplate} className="flex-1 sm:flex-none px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm font-medium rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors shadow-sm justify-center flex items-center whitespace-nowrap gap-1" title="Baixar Planilha Modelo"><FileDown size={16} /> Modelo</button>
                                    <button onClick={handleImportExcelClick} className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-sm shadow-blue-700/30 justify-center flex items-center whitespace-nowrap gap-1"><Upload size={16} /> Importar</button>
                                    <button onClick={handleExportExcel} className="flex-1 sm:flex-none px-4 py-2 bg-[#107c41] text-white text-sm font-medium rounded-lg hover:bg-[#0c5e31] transition-colors shadow-sm shadow-green-700/30 justify-center flex items-center whitespace-nowrap gap-1">Exportar</button>
                                </>
                            )}
                            <button onClick={openNovaVendaModal} className="flex-1 sm:flex-none px-4 py-2 bg-[#E3000F] text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm shadow-red-500/30 flex items-center justify-center gap-1 whitespace-nowrap"><Plus size={16} /> Nova Venda</button>
                        </div>
                    </div>
                </div>
                <div className="overflow-auto flex-1">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="text-xs text-neutral-500 dark:text-neutral-400 uppercase bg-neutral-50/80 dark:bg-neutral-800/80 sticky top-0 border-b border-neutral-200 dark:border-neutral-800 z-10">
                            <tr><th className="px-6 py-4 font-medium tracking-wider">Vendedor</th><th className="px-6 py-4 font-medium tracking-wider">Data</th><th className="px-6 py-4 font-medium tracking-wider">Produto</th><th className="px-6 py-4 font-medium tracking-wider">Tipo</th><th className="px-6 py-4 font-medium tracking-wider text-center">Qtda</th><th className="px-6 py-4 font-medium tracking-wider">Portabilidade</th><th className="px-6 py-4 font-medium tracking-wider text-center">Operação</th><th className="px-6 py-4 font-medium tracking-wider">Receita (R$)</th><th className="px-6 py-4 font-medium tracking-wider">CPF/CNPJ</th><th className="px-6 py-4 font-medium tracking-wider">Contrato</th><th className="px-6 py-4 font-medium tracking-wider">M-Play</th><th className="px-6 py-4 font-medium tracking-wider text-center">Adicional</th><th className="px-6 py-4 font-medium tracking-wider text-center">Ações</th></tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {filteredSales.map((sale, index) => (
                                <tr key={sale.id || index} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors group cursor-pointer">
                                    <td className="px-6 py-3 font-medium text-neutral-800 dark:text-neutral-200">{sale.vendedor}</td>
                                    <td className="px-6 py-3 text-neutral-500 dark:text-neutral-400">{sale.data.includes('-') ? new Date(sale.data + 'T12:00:00').toLocaleDateString('pt-BR') : sale.data}</td>
                                    <td className="px-6 py-3 text-neutral-700 dark:text-neutral-300 font-medium">{sale.produto}</td>
                                    <td className="px-6 py-3"><span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">{sale.combo}</span></td>
                                    <td className="px-6 py-3 text-center"><span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2 py-1 rounded-md text-xs">{sale.qtda}</span></td>
                                    <td className="px-6 py-3"><span className={`px-2 py-1 rounded-md text-xs font-medium ${sale.portabilidade === 'SIM' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>{sale.portabilidade}</span></td>
                                    <td className="px-6 py-3 text-center"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${sale.tipoOperacao === 'ATIVAÇÃO' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : sale.tipoOperacao === 'MIGRAÇÃO' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400' : 'text-neutral-400'}`}>{sale.tipoOperacao || '-'}</span></td>
                                    <td className="px-6 py-3 font-medium text-neutral-800 dark:text-neutral-200">{applyCurrencyMask(sale.receita)}</td>
                                    <td className="px-6 py-3 text-neutral-500 dark:text-neutral-400 font-mono text-xs">{sale.cpf}</td><td className="px-6 py-3 text-neutral-500 dark:text-neutral-400 font-mono text-xs">{sale.contrato}</td>
                                    <td className="px-6 py-3"><span className={`flex items-center gap-1.5 text-xs font-medium ${sale.mplay === 'SIM' ? 'text-[#E3000F]' : 'text-neutral-400 dark:text-neutral-500'}`}>{sale.mplay === 'SIM' ? <MonitorPlay size={14} /> : <div className="w-3.5 h-3.5 rounded-full border border-neutral-300 dark:border-neutral-600"></div>}{sale.mplay}</span></td>
                                    <td className="px-6 py-3 text-center">{sale.adicionais && sale.adicionais.length > 0 ? (<div className="flex justify-center gap-1.5 flex-wrap">{sale.adicionais.map(ad => (<span key={ad} className="bg-[#E3000F]/10 text-[#E3000F] px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">{ad}</span>))}</div>) : <span className="text-neutral-300 text-xs">-</span>}</td>
                                    <td className="px-6 py-3 text-center">
                                        {(!isVendedor || sale.vendedor === globalUser?.name || sale.vendedor === globalUser?.name.split(' ')[0]) ? (
                                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={(e) => { e.stopPropagation(); handleEditSale(sale); }} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors" title="Editar Venda"><Edit3 size={16} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteSale(sale.id); }} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors" title="Excluir Venda"><Trash2 size={16} /></button>
                                            </div>
                                        ) : (
                                            <span className="text-neutral-300 dark:text-neutral-600"><Lock size={14} className="mx-auto" /></span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50 text-xs text-neutral-500 dark:text-neutral-400 flex justify-between items-center shrink-0">
                    <span>Mostrando 1 a {filteredSales.length} de {filteredSales.length} registros</span>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 no-print">
                    <div className="flex min-h-full items-center justify-center">
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-4xl animate-fade-in transition-colors">
                            <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 p-6 flex justify-between items-center z-10 rounded-t-2xl">
                                <div><h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">{editingId ? 'Editar Venda' : 'Registrar Nova Venda'}</h2><p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Regras automáticas e cálculos de comissão ativados.</p></div>
                                <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-full transition-colors"><X size={18} /></button>
                            </div>
                            <form onSubmit={handleSubmitSale} className="p-4 sm:p-6 space-y-6">
                                {formError && (<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-[#E3000F] px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium animate-fade-in"><AlertCircle size={18} className="shrink-0" />{formError}</div>)}
                                <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row md:items-center gap-4 justify-between"><div><h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-100 uppercase tracking-wide">Contexto da Venda</h3><p className="text-xs text-neutral-500 dark:text-neutral-400">Selecione o formato para calcular a receita corretamente.</p></div><div className="flex flex-wrap sm:flex-nowrap bg-white dark:bg-neutral-900 rounded-lg p-1 border border-neutral-200 dark:border-neutral-700 shadow-sm w-full md:w-auto">{['SINGLE', 'MULTI', 'MULTI 3P'].map(tipo => (<button key={tipo} type="button" onClick={() => handleFormChange({ target: { name: 'combo', value: tipo } })} className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-md transition-all ${formData.combo === tipo ? 'bg-[#E3000F] text-white shadow-md' : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}>{tipo}</button>))}</div></div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                                    <div className="space-y-1.5 relative"><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex justify-between"><span>Vendedor <span className="text-[#E3000F]">*</span></span>{isVendedor && <Lock size={12} className="text-[#E3000F]" />}</label><select name="vendedor" value={formData.vendedor} onChange={handleFormChange} disabled={isVendedor} className={`w-full border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium ${isVendedor ? 'bg-neutral-100 dark:bg-neutral-800 cursor-not-allowed text-[#E3000F]' : 'bg-neutral-50 dark:bg-neutral-800/50'}`}><option className="bg-white dark:bg-neutral-900" value="">Selecione o vendedor</option>{safeVendedores.map(v => <option className="bg-white dark:bg-neutral-900" key={v} value={v}>{v}</option>)}</select></div>
                                    <div className="space-y-1.5"><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Data <span className="text-[#E3000F]">*</span></label><input type="date" name="data" max={getTodaySP()} value={formData.data} onChange={handleFormChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm" /></div>
                                    <div className="space-y-1.5"><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Produto Principal <span className="text-[#E3000F]">*</span></label><select name="produto" value={formData.produto} onChange={handleFormChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium"><option className="bg-white dark:bg-neutral-900" value="">Selecione o produto</option>{safeProdutos.map(p => <option className="bg-white dark:bg-neutral-900" key={p} value={p}>{p}</option>)}</select></div>
                                    {getSubOptions().length > 0 && (<div className="space-y-1.5 animate-fade-in bg-yellow-50/50 dark:bg-yellow-900/20 p-2 -m-2 rounded-lg border border-yellow-100 dark:border-yellow-800"><label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1">Especificação <span className="text-[#E3000F]">*</span></label><select name="subOption" value={formData.subOption} onChange={handleFormChange} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-bold text-[#E3000F]"><option className="bg-white dark:bg-neutral-900" value="">Selecione a opção</option>{getSubOptions().map(o => <option className="bg-white dark:bg-neutral-900" key={o.label} value={o.label}>{o.label}</option>)}</select></div>)}
                                    {(formData.produto.includes('POS') || formData.produto.includes('CONTROLE')) && (<div className="space-y-1.5 animate-fade-in bg-purple-50/50 dark:bg-purple-900/20 p-2 -m-2 rounded-lg border border-purple-100 dark:border-purple-800"><label className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1">Tipo de Operação <span className="text-[#E3000F]">*</span></label><select name="tipoOperacao" value={formData.tipoOperacao} onChange={handleFormChange} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-bold text-purple-700 dark:text-purple-400"><option className="bg-white dark:bg-neutral-900" value="">Selecione</option><option className="bg-white dark:bg-neutral-900" value="ATIVAÇÃO">ATIVAÇÃO</option><option className="bg-white dark:bg-neutral-900" value="MIGRAÇÃO">MIGRAÇÃO</option></select></div>)}
                                    <div className="space-y-1.5"><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center justify-between"><span>{isComissionado ? 'Valor Bruto da Venda (R$)' : 'Receita (R$)'} <span className="text-[#E3000F]">*</span></span>{formData.isReceitaReadonly && <span className="text-[10px] bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 px-1.5 py-0.5 rounded flex items-center gap-1"><Check size={10} /> Automático</span>}</label>{formData.isReceitaReadonly ? (<input type="text" readOnly value={formData.receita} className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 px-3 py-2.5 rounded-lg outline-none text-sm font-bold cursor-not-allowed" />) : (<input type="text" name="receita" value={formData.receita} onChange={handleFormChange} placeholder="R$ 0,00" className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] focus:border-[#E3000F] outline-none text-sm font-bold" />)}{isComissionado && formData.receita && (<div className="text-[11px] text-green-700 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded border border-green-200 dark:border-green-800 mt-1 flex justify-between items-center animate-fade-in"><span>Comissão a registrar:</span><span>{applyCurrencyMask(calcularComissaoDinamica(formData.produto, formData.adicionais, parseCurrencyToFloat(formData.receita)))}</span></div>)}</div>
                                    <div className="space-y-1.5"><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Qtda <span className="text-[#E3000F]">*</span></label><input type="number" min="1" name="qtda" value={formData.qtda} onChange={handleFormChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm" /></div>
                                    {isMovel && (<div className="space-y-1.5 animate-fade-in"><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Portabilidade <span className="text-[#E3000F]">*</span></label><select name="portabilidade" value={formData.portabilidade} onChange={handleFormChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm"><option className="bg-white dark:bg-neutral-900" value="">Selecione</option><option className="bg-white dark:bg-neutral-900" value="SIM">SIM</option><option className="bg-white dark:bg-neutral-900" value="NÃO">NÃO</option></select></div>)}
                                    <div className="space-y-1.5"><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">CPF / CNPJ <span className="text-[#E3000F]">*</span></label><input type="text" name="cpf" value={formData.cpf} onChange={handleFormChange} placeholder="000.000.000-00" className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-mono" /></div>
                                    <div className="space-y-1.5 relative"><label className={`text-xs font-bold uppercase tracking-wider flex justify-between ${requiresContrato ? 'text-neutral-500 dark:text-neutral-400' : 'text-neutral-400 dark:text-neutral-500'}`}><span>Contrato {requiresContrato && <span className="text-[#E3000F]">*</span>}</span>{!requiresContrato && <Lock size={12} />}</label><input type="text" name="contrato" value={formData.contrato} onChange={handleFormChange} placeholder={requiresContrato ? "Ex: 000/000000000" : "Não aplicável"} disabled={!requiresContrato} className={`w-full px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-mono border ${requiresContrato ? 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100' : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'}`} /></div>
                                    {showMplay && (<div className="space-y-1.5 animate-fade-in"><label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">M-Play <span className="text-[#E3000F]">*</span></label><select name="mplay" value={formData.mplay} onChange={handleFormChange} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-[#E3000F] outline-none text-sm"><option className="bg-white dark:bg-neutral-900" value="">Selecione</option><option className="bg-white dark:bg-neutral-900" value="SIM">SIM</option><option className="bg-white dark:bg-neutral-900" value="NÃO">NÃO</option></select></div>)}
                                </div>
                                <div className="mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-800">
                                    <label className="text-sm font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2 mb-4"><Briefcase size={16} className="text-[#E3000F]" /> A Venda possui algum programa adicional?</label>
                                    <div className="flex flex-wrap gap-4">
                                        <label className={`flex items-center gap-3 px-5 py-3 border rounded-xl cursor-pointer transition-all ${formData.adicionais.length === 0 ? 'border-[#E3000F] bg-red-50 dark:bg-[#E3000F]/10 text-[#E3000F]' : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 text-neutral-600 dark:text-neutral-400'}`}><input type="checkbox" checked={formData.adicionais.length === 0} onChange={() => handleAdicionalToggle('NENHUM')} className="hidden" /><div className={`w-4 h-4 rounded flex items-center justify-center ${formData.adicionais.length === 0 ? 'bg-[#E3000F] border-[#E3000F]' : 'border-2 border-neutral-300 dark:border-neutral-600'}`}>{formData.adicionais.length === 0 && <Check size={12} className="text-white" />}</div><span className="text-sm font-bold tracking-wide">NENHUM</span></label>
                                        {['TROCAFY', 'CLARO UP', 'SEGURO'].map((op) => (
                                            <label key={op} className={`flex items-center gap-3 px-5 py-3 border rounded-xl cursor-pointer transition-all ${formData.adicionais.includes(op) ? 'border-[#E3000F] bg-red-50 dark:bg-[#E3000F]/10 text-[#E3000F]' : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 text-neutral-600 dark:text-neutral-400'}`}><input type="checkbox" checked={formData.adicionais.includes(op)} onChange={() => handleAdicionalToggle(op)} className="hidden" /><div className={`w-4 h-4 rounded flex items-center justify-center ${formData.adicionais.includes(op) ? 'bg-[#E3000F] border-[#E3000F]' : 'border-2 border-neutral-300 dark:border-neutral-600'}`}>{formData.adicionais.includes(op) && <Check size={12} className="text-white" />}</div><span className="text-sm font-bold tracking-wide">{op}</span></label>
                                        ))}
                                    </div>
                                    {formData.produto === 'APARELHO' && formData.adicionais.includes('SEGURO') && (
                                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl animate-fade-in">
                                            <label className="text-sm font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-2">
                                                Qual o plano do Seguro contratado? <span className="text-[#E3000F]">*</span>
                                            </label>
                                            <select name="seguroOption" value={formData.seguroOption} onChange={handleFormChange} className="w-full bg-white dark:bg-neutral-900 border border-blue-200 dark:border-blue-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-sm font-bold text-blue-700 dark:text-blue-400">
                                                <option className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100" value="">Selecione o valor do seguro...</option>
                                                {SEGURO_OPTIONS.map(o => <option className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100" key={o.label} value={o.label}>{o.label}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </div>
                                <div className="pt-6 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-neutral-100 dark:border-neutral-800 mt-6"><button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-6 py-2.5 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-medium rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancelar</button><button type="submit" className="w-full sm:w-auto px-8 py-2.5 bg-[#E3000F] text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30 flex items-center justify-center gap-2">{editingId ? 'Salvar Alterações' : 'Confirmar Venda'}</button></div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};