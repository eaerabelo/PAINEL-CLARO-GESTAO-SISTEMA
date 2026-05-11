import React, { useState } from 'react';
import { Key, Lock, Unlock, ShieldAlert, Trash2, Edit3, X, Eye, EyeOff, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export function Acessos({ usersDB, setUsersDB, setScheduleData, setMonthlyOverrides, setReprovadosData }) {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [masterPass, setMasterPass] = useState('');
    const [showPassword, setShowPassword] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUsername, setEditingUsername] = useState(null);
    const [formData, setFormData] = useState({ name: '', username: '', password: '', role: 'GERENTE', phone: '', email: '' });

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
            setFormData({ ...usersDB[userKey], username: userKey, password: usersDB[userKey].pass, email: usersDB[userKey].email || '' });
        } else {
            setEditingUsername(null);
            setFormData({ name: '', username: '', password: '', role: 'GERENTE', phone: '', email: '' });
        }
        setIsModalOpen(true);
    };

    const handleDelete = (userKey) => {
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
                email: formData.email.toLowerCase()
            };
            return newDb;
        });

        toast.success(editingUsername ? 'Usuário atualizado com sucesso!' : 'Conta criada com sucesso!');
        setIsModalOpen(false);
    };

    // --- TELA DE BLOQUEIO (CADEADO) ---
    if (!isUnlocked) {
        return (
            <div className="h-full flex flex-col items-center justify-center animate-fade-in bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-400 mb-4">
                    <Lock size={32} />
                </div>
                <h2 className="text-2xl font-bold text-neutral-800 mb-2">Cofre de Acessos</h2>
                <p className="text-neutral-500 mb-8 text-center max-w-md">Área restrita ao desenvolvedor e diretoria. Insira a chave mestre para gerenciar logins, senhas e criar contas de liderança no sistema.</p>
                
                <form onSubmit={handleUnlock} className="w-full max-w-sm space-y-4">
                    <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                        <input 
                            type="password" 
                            placeholder="Senha do Desenvolvedor" 
                            value={masterPass}
                            onChange={(e) => setMasterPass(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all font-mono tracking-widest text-center"
                        />
                    </div>
                    <button type="submit" className="w-full py-3 bg-neutral-900 text-white font-bold rounded-xl hover:bg-black transition-colors shadow-lg flex items-center justify-center gap-2">
                        <Unlock size={18} /> Desbloquear Cofre
                    </button>
                </form>
            </div>
        );
    }

    // --- TELA DO COFRE DESBLOQUEADO (TABELA E EDIÇÃO) ---
    return (
        <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-neutral-100 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-neutral-900 text-white shrink-0">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                        <ShieldAlert size={22} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">Cofre de Acessos Desbloqueado</h2>
                        <p className="text-xs text-neutral-400 font-medium">Gestão de Usuários, Senhas e Lideranças</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                    <button onClick={() => openModal()} className="w-full sm:w-auto justify-center px-4 py-2 bg-white text-neutral-900 text-sm font-bold rounded-xl hover:bg-neutral-200 transition-colors shadow-sm flex items-center gap-2">
                        <UserPlus size={16} /> Criar Conta de Liderança
                    </button>
                    <button onClick={handleLock} className="w-full sm:w-auto justify-center px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors shadow-sm flex items-center gap-2">
                        <Lock size={16} /> Trancar Cofre
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6 bg-neutral-50/50">
                <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left whitespace-nowrap text-sm">
                        <thead className="bg-neutral-100 text-neutral-600 font-bold uppercase text-[10px] tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Nome Completo</th>
                                <th className="px-6 py-4">Usuário (Login)</th>
                                <th className="px-6 py-4">E-mail Corporativo</th>
                                <th className="px-6 py-4">Senha</th>
                                <th className="px-6 py-4">Função / Nível</th>
                                <th className="px-6 py-4">Celular</th>
                                <th className="px-6 py-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {!usersDB || Object.keys(usersDB).length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-neutral-400">Nenhum usuário registrado no banco de dados.</td>
                                </tr>
                            ) : (
                                Object.entries(usersDB).map(([username, user]) => (
                                    <tr key={username} className="hover:bg-neutral-50 transition-colors">
                                        <td className="px-6 py-3 font-bold text-neutral-800">{user.name}</td>
                                        <td className="px-6 py-3 font-mono text-neutral-600">{username}</td>
                                        <td className="px-6 py-3 text-neutral-500">{user.email || '-'}</td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono bg-neutral-100 px-2 py-1 rounded text-neutral-700 tracking-wider">
                                                    {showPassword[username] ? user.pass : '••••••••'}
                                                </span>
                                                <button onClick={() => toggleShowPass(username)} className="text-neutral-400 hover:text-neutral-700 transition-colors">
                                                    {showPassword[username] ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${user.role === 'GERENTE' ? 'bg-red-100 text-red-700' :
                                                user.role === 'SENIOR' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-neutral-100 text-neutral-600'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 font-mono text-neutral-500">{user.phone || '-'}</td>
                                        <td className="px-6 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => openModal(username)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit3 size={16} /></button>
                                                <button onClick={() => handleDelete(username)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
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
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
                        <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-neutral-800">{editingUsername ? 'Editar Conta' : 'Nova Conta de Liderança'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:bg-neutral-100 p-1.5 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Nome Completo</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-neutral-50 border border-neutral-200 text-neutral-800 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-neutral-900" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Usuário (Login)</label>
                                <input type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className="w-full bg-neutral-50 border border-neutral-200 text-neutral-800 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-neutral-900 font-mono" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">E-mail Corporativo <span className="text-[#E3000F]">*</span></label>
                                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-neutral-50 border border-neutral-200 text-neutral-800 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-neutral-900" placeholder="exemplo@claro.com.br" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Senha de Acesso</label>
                                <input type="text" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full bg-neutral-50 border border-neutral-200 text-neutral-800 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-neutral-900 font-mono tracking-wider" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Nível de Acesso (Função)</label>
                                <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full bg-neutral-50 border border-neutral-200 text-neutral-800 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-neutral-900 font-bold">
                                    <option value="GERENTE">GERENTE</option>
                                    <option value="SENIOR">SÊNIOR</option>
                                    <option value="VENDEDOR">VENDEDOR</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Celular (Opcional)</label>
                                <input type="text" maxLength={15} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-neutral-50 border border-neutral-200 text-neutral-800 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-neutral-900 font-mono" placeholder="+5511900000000" />
                            </div>
                            <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-neutral-100 mt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-5 py-2.5 bg-white border border-neutral-200 text-neutral-600 font-medium rounded-xl hover:bg-neutral-50 transition-colors">Cancelar</button>
                                <button type="submit" className="w-full sm:w-auto justify-center px-6 py-2.5 bg-neutral-900 text-white font-medium rounded-xl hover:bg-black transition-colors shadow-lg flex items-center gap-2">Salvar Conta</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
