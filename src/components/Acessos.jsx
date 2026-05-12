import React, { useState } from 'react';
import { Key, Lock, Unlock, ShieldAlert, Trash2, Edit3, X, Eye, EyeOff, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export function Acessos({ usersDB, setUsersDB, setScheduleData, setMonthlyOverrides, setReprovadosData, globalUser }) {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [masterPass, setMasterPass] = useState('');
    const [showPassword, setShowPassword] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUsername, setEditingUsername] = useState(null);
    const [formData, setFormData] = useState({ name: '', username: '', password: '', role: 'GERENTE', phone: '', email: '', birthDate: '' });

    const handleUnlock = (e) => {
        e.preventDefault();
        // Senha master para o desenvolvedor
        if (masterPass === 'DEV2026' || masterPass === 'MASTER') {
            setIsUnlocked(true);
            toast.success('Cofre de Acessos Desbloqueado!');
        } else {
            toast.error('Senha de desenvolvedor incorreta!');
        }
    };

    const handleLock = () => {
        setIsUnlocked(false);
        setMasterPass('');
    };

    const toggleShowPass = (user) => {
        setShowPassword(prev => ({ ...prev, [user]: !prev[user] }));
    };

    const openModal = (userKey = null) => {
        if (userKey) {
            setEditingUsername(userKey);
            setFormData({ ...usersDB[userKey], username: userKey, password: usersDB[userKey].pass, email: usersDB[userKey].email || '', birthDate: usersDB[userKey].birthDate || '' });
        } else {
            setEditingUsername(null);
            setFormData({ name: '', username: '', password: '', role: 'GERENTE', phone: '', email: '', birthDate: '' });
        }
        setIsModalOpen(true);
    };

    const handleDelete = (userKey) => {
        if (globalUser?.role !== 'GERENTE') {
            toast.error('Ação bloqueada. Apenas o Gerente possui permissão para excluir usuários.');
            return;
        }

        const userToDelete = usersDB[userKey];
        const userName = userToDelete?.name;
        const firstName = userName?.split(' ')[0];

        if (window.confirm(`Tem certeza que deseja apagar o usuário ${userKey}? Ele perderá o acesso instantaneamente.`)) {
            setUsersDB(prev => {
                const newDb = { ...prev };
                delete newDb[userKey];
                return newDb;
            });

            if (userName) {
                if (setScheduleData) {
                    setScheduleData(prev => {
                        const newData = { ...prev };
                        delete newData[userName];
                        if (firstName) delete newData[firstName];
                        return newData;
                    });
                }
                if (setMonthlyOverrides) {
                    setMonthlyOverrides(prev => {
                        const newData = { ...prev };
                        delete newData[userName];
                        if (firstName) delete newData[firstName];
                        return newData;
                    });
                }
                if (setReprovadosData) {
                    setReprovadosData(prev => prev.filter(item => item.vendedor !== userName && item.vendedor !== firstName));
                }
            }
            toast.success('Usuário apagado com sucesso!');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.username || !formData.password || !formData.email) {
            toast.error('Preencha os campos obrigatórios!');
            return;
        }

        if (!formData.email.toLowerCase().endsWith('@claro.com.br')) {
            toast.error('O e-mail deve ser corporativo (@claro.com.br).');
            return;
        }

        if (!editingUsername && usersDB[formData.username]) {
            toast.error('Este nome de usuário já existe no banco!');
            return;
        }

        setUsersDB(prev => {
            const newDb = { ...prev };
            // Se ele estiver editando e mudou o nome de usuário (Login), a gente apaga a chave velha
            if (editingUsername && editingUsername !== formData.username) {
                delete newDb[editingUsername];
            }
            newDb[formData.username] = {
                name: formData.name.toUpperCase(),
                role: formData.role,
                pass: formData.password,
                phone: formData.phone || '',
                email: formData.email.toLowerCase(),
                birthDate: formData.birthDate || ''
            };
            return newDb;
        });

        toast.success(editingUsername ? 'Usuário atualizado com sucesso!' : 'Conta criada com sucesso!');
        setIsModalOpen(false);
    };

    const getRoleStyle = (role) => {
        switch (role) {
            case 'GERENTE': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
            case 'SENIOR': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
            case 'ASSISTENTE RELACIONAMENTO': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
            case 'ADMINISTRAÇÃO': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
            case 'JOVEM APRENDIZ': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
            case 'GEEK': return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400';
            default: return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400';
        }
    };

    // --- BARREIRA DE SEGURANÇA (Apenas Gestor) ---
    if (globalUser?.role !== 'GERENTE') {
        return (
            <div className="h-full flex flex-col items-center justify-center animate-fade-in bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-6 transition-colors">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-[#E3000F] mb-4">
                    <ShieldAlert size={32} />
                </div>
                <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">Acesso Restrito</h2>
                <p className="text-neutral-500 dark:text-neutral-400 text-center max-w-md">Sua conta não possui privilégios para visualizar o Cofre de Acessos. Esta área é restrita à Gerência.</p>
            </div>
        );
    }

    // --- TELA DE BLOQUEIO (CADEADO) ---
    if (!isUnlocked) {
        return (
            <div className="h-full flex flex-col items-center justify-center animate-fade-in bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-6 transition-colors">
                <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center text-neutral-400 mb-4">
                    <Lock size={32} />
                </div>
                <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">Cofre de Acessos</h2>
                <p className="text-neutral-500 dark:text-neutral-400 mb-8 text-center max-w-md">Área restrita ao desenvolvedor e diretoria. Insira a chave mestre para gerenciar logins, senhas e criar contas de liderança no sistema.</p>
                
                <form onSubmit={handleUnlock} className="w-full max-w-sm space-y-4">
                    <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                        <input 
                            type="password" 
                            placeholder="Senha do Desenvolvedor" 
                            value={masterPass}
                            onChange={(e) => setMasterPass(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 rounded-xl outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all font-mono tracking-widest text-center"
                        />
                    </div>
                    <button type="submit" className="w-full py-3 bg-neutral-900 text-white font-bold rounded-xl hover:bg-black transition-colors shadow-lg flex items-center justify-center gap-2">
                        <Unlock size={18} /> Desbloquear Cofre
                    </button>
                </form>
            </div>
        );
    }

    const totalFuncionarios = Object.keys(usersDB || {}).length;
    const totalVendedores = Object.values(usersDB || {}).filter(u => u.role === 'VENDEDOR').length;

    // --- TELA DO COFRE DESBLOQUEADO (TABELA E EDIÇÃO) ---
    return (
        <div className="h-full flex flex-col bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-fade-in transition-colors">
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-neutral-900 dark:bg-neutral-950 text-white shrink-0">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                        <ShieldAlert size={22} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">Cofre de Acessos Desbloqueado</h2>
                        <p className="text-xs text-neutral-400 font-medium">Gestão de Usuários, Senhas e Lideranças</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center w-full md:w-auto gap-3">
                    <div className="flex gap-3 w-full sm:w-auto justify-between sm:justify-start sm:mr-2">
                        <div className="flex-1 sm:flex-none bg-neutral-800 dark:bg-neutral-900 px-4 py-1.5 rounded-lg border border-neutral-700 flex flex-col items-center justify-center shadow-sm">
                            <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider mb-0.5">Equipe</span>
                            <span className="text-sm font-black text-white leading-none">{totalFuncionarios}</span>
                        </div>
                        <div className="flex-1 sm:flex-none bg-neutral-800 dark:bg-neutral-900 px-4 py-1.5 rounded-lg border border-neutral-700 flex flex-col items-center justify-center shadow-sm">
                            <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider mb-0.5">Vendedores</span>
                            <span className="text-sm font-black text-white leading-none">{totalVendedores}</span>
                        </div>
                    </div>
                    <button onClick={() => openModal()} className="w-full sm:w-auto justify-center px-4 py-2 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm font-bold rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors shadow-sm flex items-center gap-2">
                        <UserPlus size={16} /> Criar Conta de Liderança
                    </button>
                    <button onClick={handleLock} className="w-full sm:w-auto justify-center px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors shadow-sm flex items-center gap-2">
                        <Lock size={16} /> Trancar Cofre
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4 sm:p-6 bg-neutral-50/50 dark:bg-neutral-950/50">
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-x-auto shadow-sm">
                    <table className="w-full text-left whitespace-nowrap text-sm min-w-max">
                        <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-bold uppercase text-[10px] tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Nome Completo</th>
                                <th className="px-6 py-4">Usuário (Login)</th>
                                <th className="px-6 py-4">E-mail Corporativo</th>
                                <th className="px-6 py-4">Senha</th>
                                <th className="px-6 py-4">Função / Nível</th>
                                <th className="px-6 py-4">Celular</th>
                                <th className="px-6 py-4">Nascimento</th>
                                <th className="px-6 py-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {!usersDB || Object.keys(usersDB).length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-neutral-400 dark:text-neutral-500">Nenhum usuário registrado no banco de dados.</td>
                                </tr>
                            ) : (
                                Object.entries(usersDB).map(([username, user]) => (
                                    <tr key={username} className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                                        <td className="px-6 py-3 font-bold text-neutral-800 dark:text-neutral-200">{user.name}</td>
                                        <td className="px-6 py-3 font-mono text-neutral-600 dark:text-neutral-400">{username}</td>
                                        <td className="px-6 py-3 text-neutral-500 dark:text-neutral-500">{user.email || '-'}</td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-neutral-700 dark:text-neutral-300 tracking-wider">
                                                    {showPassword[username] ? user.pass : '••••••••'}
                                                </span>
                                                <button onClick={() => toggleShowPass(username)} className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors">
                                                    {showPassword[username] ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getRoleStyle(user.role)}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 font-mono text-neutral-500 dark:text-neutral-400">{user.phone || '-'}</td>
                                        <td className="px-6 py-3 text-neutral-500 dark:text-neutral-400">{user.birthDate ? new Date(user.birthDate + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}</td>
                                        <td className="px-6 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => openModal(username)} className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Edit3 size={16} /></button>
                                                <button onClick={() => handleDelete(username)} className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL DE CRIAÇÃO / EDIÇÃO DE USUÁRIO */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center no-print">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in transition-colors">
                        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">{editingUsername ? 'Editar Conta' : 'Nova Conta de Liderança'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 dark:text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 p-1.5 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Nome Completo</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-neutral-900" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Usuário (Login)</label>
                                <input type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-neutral-900 font-mono" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">E-mail Corporativo <span className="text-[#E3000F]">*</span></label>
                                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-neutral-900" placeholder="exemplo@claro.com.br" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Senha de Acesso</label>
                                <input type="text" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-neutral-900 font-mono tracking-wider" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Nível de Acesso (Função)</label>
                                <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-neutral-900 font-bold">
                                    <option className="bg-white dark:bg-neutral-900" value="GERENTE">GERENTE</option>
                                    <option className="bg-white dark:bg-neutral-900" value="SENIOR">SÊNIOR</option>
                                    <option className="bg-white dark:bg-neutral-900" value="ASSISTENTE RELACIONAMENTO">ASSISTENTE RELACIONAMENTO</option>
                                    <option className="bg-white dark:bg-neutral-900" value="ADMINISTRAÇÃO">ADMINISTRAÇÃO</option>
                                    <option className="bg-white dark:bg-neutral-900" value="JOVEM APRENDIZ">JOVEM APRENDIZ</option>
                                    <option className="bg-white dark:bg-neutral-900" value="GEEK">GEEK</option>
                                    <option className="bg-white dark:bg-neutral-900" value="VENDEDOR">VENDEDOR</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Celular (Opcional)</label>
                                <input type="text" maxLength={15} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-neutral-900 font-mono" placeholder="+5511900000000" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Data de Nascimento (Opcional)</label>
                                <input type="date" value={formData.birthDate} onChange={e => setFormData({ ...formData, birthDate: e.target.value })} className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-neutral-900" />
                            </div>
                            <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-neutral-100 dark:border-neutral-800 mt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-5 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-medium rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancelar</button>
                                <button type="submit" className="w-full sm:w-auto justify-center px-6 py-2.5 bg-neutral-900 text-white font-medium rounded-xl hover:bg-black transition-colors shadow-lg flex items-center gap-2">Salvar Conta</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
