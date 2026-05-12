import React, { useState } from 'react';
import { Edit2, Save, X, Search, Calendar, Filter, Trash2, Home } from 'lucide-react';
import toast from 'react-hot-toast';

export function UrResidencial({ salesData, setSalesData, globalUser, isGerente, usersDB = {} }) {
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
  
    // Filtro de mês que funciona também como "Botão de Consulta" para o histórico fechado do mês
    const [monthFilter, setMonthFilter] = useState(() => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    });

    // OPÇÕES TRAVADAS DO SISTEMA
    const STATUS_OPTIONS = ['PEND.DE INSTALAÇÃO', 'CONECTADO', 'CANCELADO'];
    const AGENDAMENTO_OPTIONS = ['08:00 A 12:00', '12:00 A 15:00', '15:00 A 18:00'];
    const ACAO_OPTIONS = ['REAGENDADO', 'RETENÇÃO EM FALTA', 'DESISTIU'];
    const VENDEDORES_OPTIONS = Object.values(usersDB || {})
        .filter(u => !u.role || u.role === 'VENDEDOR')
        .map(u => u.name.split(' ')[0])
        .filter(Boolean);
    const RESIDENTIAL_PRODUCTS = [
        'FIBRA 350 MEGAS', 'FIBRA 500 MEGAS', 'FIBRA 750 MEGAS', 'FIBRA 1 GIGA',
        'CLARO TV+', 'FIXO ILIMITADO BRASIL', 'PONTO ADICIONAL', 'MESH', 'EXTENSOR WIFI'
    ];

    // Identifica automaticamente se a venda possui caráter residencial
    const isResidential = (produto = '') => {
        const p = produto.toUpperCase();
        return p.includes('FIBRA') || p.includes('TV') || p.includes('FIXO') || p.includes('RESIDENCIAL') || p.includes('MESH');
    };

    // Filtrando a Base Central de Vendas para exibir somente UR-RESIDENCIAL no mês consultado
    const filteredData = salesData.filter(item => {
        if (!isResidential(item.produto)) return false;

        if (item.data) {
            const parts = item.data.split('/');
            if (parts.length === 3) {
                const itemMonth = `${parts[2]}-${parts[1]}`;
                if (itemMonth !== monthFilter) return false;
            }
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return (
                (item.contrato || '').toLowerCase().includes(term) ||
                (item.cpf || '').toLowerCase().includes(term) ||
                (item.nomeCliente || '').toLowerCase().includes(term) ||
                (item.cidade || '').toLowerCase().includes(term)
            );
        }
        return true;
    });

    const handleEdit = (item) => {
        setEditingId(item.id);
        setEditForm({ ...item });
    };

    const handleSave = () => {
        setSalesData(prev => prev.map(item => item.id === editingId ? { ...item, ...editForm } : item));
        setEditingId(null);
        toast.success('Dados residenciais atualizados!');
    };

    const handleDelete = (id) => {
        if (!isGerente) return;
        if (window.confirm('Atenção Gerente: Tem certeza que deseja apagar este registro de residencial?')) {
            setSalesData(prev => prev.filter(item => item.id !== id));
            toast.success('Registro apagado com sucesso!');
        }
    };

    const handleCancel = () => setEditingId(null);

    const handleChange = (e, field) => {
        setEditForm(prev => ({ ...prev, [field]: e.target.value }));
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'PEND.DE INSTALAÇÃO': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
            case 'CONECTADO': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
            case 'CANCELADO': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
            default: return 'bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700';
        }
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-fade-in transition-colors">
            {/* CABEÇALHO DA SEÇÃO */}
            <div className="p-4 md:p-6 border-b border-neutral-100 dark:border-neutral-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shrink-0 bg-neutral-50/50 dark:bg-neutral-800/50">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="w-10 h-10 rounded-xl bg-[#E3000F]/10 flex items-center justify-center text-[#E3000F]">
                        <Home size={22} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">Acompanhamento UR-Residencial</h2>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Controle de instalações e acompanhamento de Vendas Residenciais</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3">
                    <div className="relative w-full sm:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar Contrato, CPF..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-56 pl-9 pr-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-800 dark:text-neutral-100 outline-none focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] transition-all"
                        />
                    </div>
                    <div className="relative w-full sm:w-auto">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" size={16} />
                        <input
                            type="month"
                            value={monthFilter}
                            onChange={(e) => setMonthFilter(e.target.value)}
                            className="w-full sm:w-44 pl-9 pr-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-800 dark:text-neutral-100 outline-none focus:border-[#E3000F] transition-all cursor-pointer"
                            title="Consultar Histórico do Mês"
                        />
                    </div>
                </div>
            </div>

            {/* TABELA ESTILO EXCEL */}
            <div className="flex-1 overflow-auto p-4 bg-neutral-100/30 dark:bg-neutral-950/50">
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                            <thead className="bg-[#E3000F] text-white">
                                <tr>
                                    <th className="px-3 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">Contrato</th>
                                    <th className="px-3 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">Cidade</th>
                                    <th className="px-3 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">Data</th>
                                    <th className="px-3 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">Data Inst.</th>
                                    <th className="px-3 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">Vendedor</th>
                                    <th className="px-3 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">Produto</th>
                                    <th className="px-3 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">Qtda</th>
                                    <th className="px-3 py-3 font-bold uppercase tracking-wider border-r border-red-500/30 text-center">Status</th>
                                    <th className="px-3 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">Agendamento</th>
                                    <th className="px-3 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">Nome Cliente</th>
                                    <th className="px-3 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">CPF/CNPJ</th>
                                    <th className="px-3 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">Obs</th>
                                    <th className="px-3 py-3 font-bold uppercase tracking-wider border-r border-red-500/30">Ação</th>
                                    <th className="px-3 py-3 font-bold uppercase tracking-wider text-center sticky right-0 bg-[#E3000F] shadow-[-4px_0_10px_rgba(0,0,0,0.1)]">Editar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan="14" className="px-4 py-8 text-center text-neutral-400 dark:text-neutral-500 bg-white dark:bg-neutral-900">
                                            Nenhuma venda residencial registrada neste período.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData.map((item, index) => {
                                        const isEditing = editingId === item.id;
                                        return (
                                            <tr key={item.id || index} className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors bg-white dark:bg-neutral-900">
                                                {/* REGRAS DE BLOQUEIO DE CAMPO (GESTOR) APLICADOS AQUI */}
                                                <td className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 border-r border-neutral-100 dark:border-r-neutral-800">
                                                    {isEditing ? <input type="text" value={editForm.contrato || ''} onChange={(e) => handleChange(e, 'contrato')} disabled={!isGerente} className={`w-28 px-2 py-1 border rounded ${!isGerente ? 'bg-neutral-100 dark:bg-neutral-800 cursor-not-allowed text-neutral-500 dark:text-neutral-400 border-transparent' : 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 border-neutral-200 dark:border-neutral-700 focus:border-[#E3000F] outline-none'}`} /> : <span className="font-mono text-neutral-700 dark:text-neutral-300">{item.contrato || '-'}</span>}
                                                </td>
                                                <td className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 border-r border-neutral-100 dark:border-r-neutral-800">
                                                    {isEditing ? <input type="text" value={editForm.cidade || ''} onChange={(e) => handleChange(e, 'cidade')} className="w-24 px-2 py-1 border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 outline-none focus:border-[#E3000F]" /> : <span className="text-neutral-700 dark:text-neutral-300">{item.cidade || '-'}</span>}
                                                </td>
                                                <td className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 border-r border-neutral-100 dark:border-r-neutral-800">
                                                    {isEditing ? <input type="text" value={editForm.data || ''} onChange={(e) => handleChange(e, 'data')} className="w-24 px-2 py-1 border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 outline-none focus:border-[#E3000F]" /> : <span className="text-neutral-600 dark:text-neutral-400">{item.data}</span>}
                                                </td>
                                                <td className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 border-r border-neutral-100 dark:border-r-neutral-800">
                                                    {isEditing ? <input type="date" value={editForm.dataInstalacao || ''} onChange={(e) => handleChange(e, 'dataInstalacao')} className="w-32 px-2 py-1 border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 outline-none cursor-pointer focus:border-[#E3000F]" /> : <span className="text-neutral-700 dark:text-neutral-300">{item.dataInstalacao ? new Date(item.dataInstalacao).toLocaleDateString('pt-BR') : '-'}</span>}
                                                </td>
                                                <td className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 border-r border-neutral-100 dark:border-r-neutral-800">
                                                    {isEditing ? <select value={editForm.vendedor || ''} onChange={(e) => handleChange(e, 'vendedor')} className="w-28 px-1 py-1 border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 outline-none"><option className="bg-white dark:bg-neutral-900" value="">Selecione...</option>{VENDEDORES_OPTIONS.map(v => <option className="bg-white dark:bg-neutral-900" key={v} value={v}>{v}</option>)}</select> : <span className="font-medium text-neutral-800 dark:text-neutral-200">{item.vendedor}</span>}
                                                </td>
                                                <td className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 border-r border-neutral-100 dark:border-r-neutral-800">
                                                    {isEditing ? <select value={editForm.produto || ''} onChange={(e) => handleChange(e, 'produto')} className="w-36 px-1 py-1 border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 outline-none"><option className="bg-white dark:bg-neutral-900" value="">Selecione...</option>{RESIDENTIAL_PRODUCTS.map(p => <option className="bg-white dark:bg-neutral-900" key={p} value={p}>{p}</option>)}</select> : <span className="text-neutral-700 dark:text-neutral-300">{item.produto}</span>}
                                                </td>
                                                <td className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 border-r border-neutral-100 dark:border-r-neutral-800 text-center">
                                                    {isEditing ? <input type="number" value={editForm.qtda || ''} onChange={(e) => handleChange(e, 'qtda')} className="w-12 px-2 py-1 border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 outline-none" /> : <span className="font-medium dark:text-neutral-200">{item.qtda}</span>}
                                                </td>
                                                <td className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 border-r border-neutral-100 dark:border-r-neutral-800 text-center">
                                                    {isEditing ? <select value={editForm.statusUr || ''} onChange={(e) => handleChange(e, 'statusUr')} className="w-36 px-1 py-1 border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 outline-none font-semibold"><option className="bg-white dark:bg-neutral-900" value="">Selecione...</option>{STATUS_OPTIONS.map(s => <option className="bg-white dark:bg-neutral-900" key={s} value={s}>{s}</option>)}</select> : <span className={`px-2 py-1 rounded border text-[10px] font-bold tracking-wider ${getStatusStyle(item.statusUr || 'PEND.DE INSTALAÇÃO')}`}>{item.statusUr || 'PEND.DE INSTALAÇÃO'}</span>}
                                                </td>
                                                <td className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 border-r border-neutral-100 dark:border-r-neutral-800">
                                                    {isEditing ? <select value={editForm.agendamento || ''} onChange={(e) => handleChange(e, 'agendamento')} className="w-32 px-1 py-1 border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 outline-none"><option className="bg-white dark:bg-neutral-900" value="">Selecione...</option>{AGENDAMENTO_OPTIONS.map(a => <option className="bg-white dark:bg-neutral-900" key={a} value={a}>{a}</option>)}</select> : <span className="text-neutral-700 dark:text-neutral-300">{item.agendamento || '-'}</span>}
                                                </td>
                                                <td className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 border-r border-neutral-100 dark:border-r-neutral-800">
                                                    {isEditing ? <input type="text" value={editForm.nomeCliente || ''} onChange={(e) => handleChange(e, 'nomeCliente')} className="w-32 px-2 py-1 border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 outline-none" /> : <span className="text-neutral-800 dark:text-neutral-200">{item.nomeCliente || '-'}</span>}
                                                </td>
                                                <td className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 border-r border-neutral-100 dark:border-r-neutral-800">
                                                    {isEditing ? <input type="text" value={editForm.cpf || ''} onChange={(e) => handleChange(e, 'cpf')} disabled={!isGerente} className={`w-32 px-2 py-1 border rounded ${!isGerente ? 'bg-neutral-100 dark:bg-neutral-800 cursor-not-allowed text-neutral-500 dark:text-neutral-400 border-transparent' : 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 border-neutral-200 dark:border-neutral-700 outline-none'}`} /> : <span className="font-mono text-neutral-600 dark:text-neutral-400">{item.cpf || '-'}</span>}
                                                </td>
                                                <td className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 border-r border-neutral-100 dark:border-r-neutral-800">
                                                    {isEditing ? <input type="text" value={editForm.obsUr || ''} onChange={(e) => handleChange(e, 'obsUr')} className="w-36 px-2 py-1 border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 outline-none" /> : <span className="text-neutral-500 dark:text-neutral-400 truncate max-w-[150px] inline-block" title={item.obsUr}>{item.obsUr || '-'}</span>}
                                                </td>
                                                <td className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 border-r border-neutral-100 dark:border-r-neutral-800">
                                                    {isEditing ? <select value={editForm.acaoUr || ''} onChange={(e) => handleChange(e, 'acaoUr')} className="w-36 px-1 py-1 border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 outline-none"><option className="bg-white dark:bg-neutral-900" value="">Selecione...</option>{ACAO_OPTIONS.map(a => <option className="bg-white dark:bg-neutral-900" key={a} value={a}>{a}</option>)}</select> : <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">{item.acaoUr || '-'}</span>}
                                                </td>
                                                <td className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 text-center sticky right-0 shadow-[-4px_0_10px_rgba(0,0,0,0.03)] dark:shadow-[-4px_0_10px_rgba(0,0,0,0.2)] bg-white dark:bg-neutral-900 z-10">
                                                    {isEditing ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button onClick={handleSave} className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"><Save size={16} /></button>
                                                            <button onClick={handleCancel} className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><X size={16} /></button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                                            {isGerente && (
                                                                <button onClick={() => handleDelete(item.id)} className="p-1.5 text-neutral-400 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
} 