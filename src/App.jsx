import React, { useState, useEffect } from 'react';
import {
  Menu, X, Search, ChevronRight, UserPlus,
  Users, BarChart3, FileText, Database,
  Target, AlertOctagon, Phone, CreditCard, Briefcase, AlertCircle, Check, Lock,
  Key, CalendarDays, UserCircle, LogOut, Crown
} from 'lucide-react';

import { Toaster } from 'react-hot-toast';

import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase.js';

import {
  METAS_PADRAO, APP_USERS
} from './utils/constants';

import {
  getTodaySP
} from './utils/masks';

import { SistemasClaro } from './components/SistemasClaro.jsx';
import { EscalaTrabalho } from './components/EscalaTrabalho.jsx';
import { Acessos } from './components/Acessos.jsx';
import { Colaboradores } from './components/Colaboradores.jsx';
import { ControleSimcard } from './components/ControleSimcard.jsx';
import { Meta } from './components/Meta.jsx';
import { Venda } from './components/Venda.jsx';
import { Proposta } from './components/Proposta.jsx';
import { UrResidencial } from './components/UrResidencial.jsx';
import { Reprovados } from './components/Reprovados.jsx';
import { Resultado } from './components/Resultado.jsx';

const safeMetasPadrao = METAS_PADRAO || { receita: 0, posTotal: 0, posPago: 0, controle: 0, urTotal: 0, fibra: 0, tv: 0, fixo: 0, aparelho: 0, acessorio: 0, pelicula: 0, seguro: 0, mesh: 0, trocafy: 0, mplay: 0 };
const safeAppUsers = APP_USERS || {};

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  const [activeTab, setActiveTab] = useState('VENDA');

  // --- ESTADOS DO SISTEMA DE LOGIN GLOBAL ---
  const [globalUser, setGlobalUser] = useState(null);
  const [authModal, setAuthModal] = useState({ isOpen: false, pendingAction: null, pendingId: null, requiredRole: null });
  const [authCredentials, setAuthCredentials] = useState({ user: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [regForm, setRegForm] = useState({ name: '', username: '', password: '', confirmPassword: '', sellerCode: '' });

  // --- ESTADOS DE GESTÃO DE METAS (MONTH-BY-MONTH) ---
  const currentYYYYMM = getTodaySP().slice(0, 7);
  const [goalsDB, setGoalsDB] = useState({});
  const activeMetas = goalsDB[currentYYYYMM] || safeMetasPadrao;

  // --- ESTADOS DO DASHBOARD DE VENDAS ---
  const [selectedSeller, setSelectedSeller] = useState(null);

  // --- ESTADOS DE BANCO DE DADOS (NUVEM - FIREBASE) ---
  const [simcardsData, setSimcardsData] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [reprovadosData, setReprovadosData] = useState([]);
  const [usersDB, setUsersDB] = useState({});
  const [scheduleData, setScheduleData] = useState({});
  const [monthlyOverrides, setMonthlyOverrides] = useState({});
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  // 1. CARREGAMENTO REAL-TIME (ON-SNAPSHOT)
  useEffect(() => {
    const docRef = doc(db, 'painel_claro', 'loja_uniao_osasco');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.salesData) setSalesData(data.salesData);
        if (data.simcardsData) setSimcardsData(data.simcardsData);
        if (data.reprovadosData) setReprovadosData(data.reprovadosData);
        if (data.goalsDB) setGoalsDB(data.goalsDB);
        if (data.scheduleData) setScheduleData(data.scheduleData);
        if (data.monthlyOverrides) setMonthlyOverrides(data.monthlyOverrides);
        if (data.usersDB) setUsersDB(data.usersDB);
      } else {
        setGoalsDB({ [currentYYYYMM]: { ...safeMetasPadrao } });
      }
      setIsFirebaseReady(true);
    }, (error) => {
      console.error("Erro Firebase:", error);
      setIsFirebaseReady(true);
    });
    return () => unsubscribe();
  }, [currentYYYYMM]);

  // 2. AUTO-SAVE NA NUVEM COM DEBOUNCE (Garante performance de rede)
  useEffect(() => {
    if (!isFirebaseReady) return;
    const timeoutId = setTimeout(() => {
      const docRef = doc(db, 'painel_claro', 'loja_uniao_osasco');
      setDoc(docRef, {
        salesData, simcardsData, reprovadosData, goalsDB, scheduleData, monthlyOverrides, usersDB
      }, { merge: true });
    }, 1200); // Aguarda 1.2 segundos após o usuário terminar de mexer para subir os dados
    return () => clearTimeout(timeoutId);
  }, [salesData, simcardsData, reprovadosData, goalsDB, scheduleData, monthlyOverrides, usersDB, isFirebaseReady]);

  // 3. TIMER DE SESSÃO EXPIRADA (30 MINUTOS)
  useEffect(() => {
    let sessionTimer;
    if (globalUser) {
      sessionTimer = setTimeout(() => {
        setGlobalUser(null);
        setSelectedSeller(null);
        setAuthModal({ isOpen: false, pendingAction: null, pendingId: null, requiredRole: null });
        toast.error('Sessão de 30 minutos expirada. Faça login novamente para continuar.', { duration: 5000 });
      }, 30 * 60 * 1000);
    }
    return () => clearTimeout(sessionTimer);
  }, [globalUser]);

  const sidebarSections = [
    { name: 'ACESSOS', icon: <Key size={18} /> },
    { name: 'COLABORADORES', icon: <Users size={18} /> },
    { name: 'CONTROLE-SIMCARD', icon: <Phone size={18} /> },
    { name: 'ESCALA DE TRABALHO', icon: <CalendarDays size={18} /> },
    { name: 'META', icon: <Target size={18} /> },
    { name: 'PROPOSTA', icon: <FileText size={18} /> },
    { name: 'REPROVADOS', icon: <AlertOctagon size={18} /> },
    { name: 'RESULTADO', icon: <BarChart3 size={18} /> },
    { name: 'SISTEMAS CLARO', icon: <Database size={18} /> },
    { name: 'UR-RESIDENCIAL', icon: <Briefcase size={18} /> },
    { name: 'VENDA', icon: <CreditCard size={18} /> },
    { name: 'VENDA ACUMULADO', icon: <BarChart3 size={18} /> },
  ].sort((a, b) => a.name.localeCompare(b.name));

  // --- REGRAS DE HIERARQUIA DERIVADAS DO LOGIN ---
  const isGestor = globalUser?.role === 'GESTOR';
  const canModifySimcard = isGestor || globalUser?.role === 'ENCARREGADO';
  const canEditSchedule = isGestor;
  const isVendedor = globalUser?.role === 'VENDEDOR';

  // --- LÓGICA DE LOGIN ---
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    const userMatched = usersDB[authCredentials.user] || safeAppUsers[authCredentials.user];
    if (userMatched && userMatched.pass === authCredentials.password) {
      if (authModal.requiredRole && authModal.requiredRole !== userMatched.role) {
        setAuthError(`Acesso negado. Requer permissão de ${authModal.requiredRole}.`);
        return;
      }
      setGlobalUser(userMatched);
      setAuthError('');
      if (userMatched.role === 'VENDEDOR') setSelectedSeller(userMatched.name);
      if (authModal.pendingAction === 'DELETE' && authModal.pendingId !== null && (userMatched.role === 'GESTOR' || userMatched.role === 'ENCARREGADO')) {
        setSimcardsData(prev => prev.filter(item => item.id !== authModal.pendingId));
      }
      setAuthModal({ isOpen: false, pendingAction: null, pendingId: null, requiredRole: null });
      setAuthCredentials({ user: '', password: '' });
      if (activeTab === 'META' && userMatched.role !== 'GESTOR') setActiveTab('VENDA');
    } else {
      setAuthError('Usuário ou senha incorretos. Acesso negado.');
    }
  };

  const handleLogout = () => {
    setGlobalUser(null);
    setSelectedSeller(null);
    if (activeTab === 'META') setActiveTab('VENDA');
  };

  // --- LÓGICA DE REGISTRO ---
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!regForm.name || !regForm.username || !regForm.password || !regForm.confirmPassword || !regForm.sellerCode) {
      setAuthError('Preencha todos os campos do registro.');
      return;
    }
    if (regForm.password !== regForm.confirmPassword) {
      setAuthError('A senha e a confirmação não coincidem.');
      return;
    }
    if (usersDB[regForm.username] || safeAppUsers[regForm.username]) {
      setAuthError('Este nome de usuário já está em uso.');
      return;
    }

    const newUser = {
      name: regForm.name.toUpperCase(),
      role: 'VENDEDOR',
      pass: regForm.password,
      sellerCode: regForm.sellerCode.toUpperCase()
    };

    setUsersDB(prev => ({ ...prev, [regForm.username]: newUser }));
    toast.success('Conta criada com sucesso! Você já pode fazer o login.');
    setIsRegistering(false);
    setRegForm({ name: '', username: '', password: '', confirmPassword: '', sellerCode: '' });
    setAuthError('');
  };

  // =========================================================
  // 🛡️ TELA DE BLOQUEIO INICIAL (LOGIN OBRIGATÓRIO)
  // =========================================================
  if (!isFirebaseReady) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-neutral-100 font-sans flex-col gap-4">
        <div className="w-12 h-12 border-4 border-[#E3000F] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-neutral-500 font-medium text-sm animate-pulse">Conectando ao Firebase e Sincronizando com a Nuvem...</p>
      </div>
    );
  }

  if (!globalUser) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-neutral-100 font-sans">
        <Toaster position="top-right" />
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in border border-neutral-200 my-8">
          <div className="p-6 border-b border-neutral-100 flex flex-col items-center text-center">
            <div className="flex items-center gap-2 text-[#E3000F] font-bold text-xl tracking-tight mb-2">
              <div className="w-7 h-7 rounded-full bg-[#E3000F] flex items-center justify-center text-white text-sm font-black">C</div>
              Painel Gestão Claro
            </div>
            <p className="text-sm text-neutral-500">{isRegistering ? 'Cadastro de Novo Vendedor' : 'União Osasco - AT1M'}</p>
          </div>

          {!isRegistering ? (
            <form onSubmit={handleAuthSubmit} className="p-6 space-y-4">
              {authError && (
                <div className="bg-red-50 text-[#E3000F] text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-2">
                  <AlertCircle size={14} /> {authError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Matrícula / Usuário</label>
                <input
                  type="text"
                  value={authCredentials.user}
                  onChange={e => setAuthCredentials({ ...authCredentials, user: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-200 text-neutral-800 px-3 py-2.5 rounded-lg outline-none focus:ring-1 focus:ring-[#E3000F] font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Senha</label>
                <input
                  type="password"
                  value={authCredentials.password}
                  onChange={e => setAuthCredentials({ ...authCredentials, password: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-200 text-neutral-800 px-3 py-2.5 rounded-lg outline-none focus:ring-1 focus:ring-[#E3000F] tracking-widest"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="submit" className="w-full py-3 bg-[#E3000F] text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30 flex items-center justify-center gap-2">
                  <Check size={16} /> Confirmar Acesso
                </button>
              </div>
              <div className="text-center pt-2">
                <button type="button" onClick={() => { setIsRegistering(true); setAuthError(''); }} className="text-xs text-[#E3000F] font-bold hover:underline">
                  Novo por aqui? Criar conta de Vendedor
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
              {authError && (
                <div className="bg-red-50 text-[#E3000F] text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-2">
                  <AlertCircle size={14} /> {authError}
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Nome Completo</label>
                <input type="text" value={regForm.name} onChange={e => setRegForm({ ...regForm, name: e.target.value })} className="w-full bg-neutral-50 border border-neutral-200 text-neutral-800 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-[#E3000F] text-sm" placeholder="Ex: João da Silva" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Nome de Usuário (Login)</label>
                <input type="text" value={regForm.username} onChange={e => setRegForm({ ...regForm, username: e.target.value })} className="w-full bg-neutral-50 border border-neutral-200 text-neutral-800 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-[#E3000F] text-sm font-mono" placeholder="Ex: joao.silva" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Senha</label>
                  <input type="password" value={regForm.password} onChange={e => setRegForm({ ...regForm, password: e.target.value })} className="w-full bg-neutral-50 border border-neutral-200 text-neutral-800 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-[#E3000F] text-sm tracking-widest" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Repetir Senha</label>
                  <input type="password" value={regForm.confirmPassword} onChange={e => setRegForm({ ...regForm, confirmPassword: e.target.value })} className="w-full bg-neutral-50 border border-neutral-200 text-neutral-800 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-[#E3000F] text-sm tracking-widest" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Código de Vendedor</label>
                <input type="text" maxLength={6} value={regForm.sellerCode} onChange={e => setRegForm({ ...regForm, sellerCode: e.target.value })} className="w-full bg-neutral-50 border border-neutral-200 text-neutral-800 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-[#E3000F] text-sm font-mono uppercase" placeholder="Máx 6 caracteres" />
              </div>
              <div className="pt-4 flex flex-col gap-3">
                <button type="submit" className="w-full py-3 bg-neutral-900 text-white font-medium rounded-xl hover:bg-black transition-colors shadow-lg flex items-center justify-center gap-2">
                  <UserPlus size={16} /> Registrar Usuário
                </button>
                <button type="button" onClick={() => { setIsRegistering(false); setAuthError(''); }} className="text-xs text-neutral-500 font-bold hover:underline text-center">
                  Já tem uma conta? Faça login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F5F5F5] font-sans overflow-hidden print:overflow-visible print:h-auto print:block text-neutral-800 print:bg-white">
      <Toaster position="top-right" />

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-10 md:hidden animate-fade-in backdrop-blur-sm no-print" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0'} no-print overflow-hidden shrink-0 transition-all duration-300 ease-in-out bg-white border-r border-neutral-200 flex flex-col z-20 absolute md:relative h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)]`}>
        <div className="h-16 flex items-center px-6 border-b border-neutral-100 min-w-[16rem] shrink-0">
          <div className="flex items-center gap-2 text-[#E3000F] font-bold text-xl tracking-tight">
            <div className="w-6 h-6 rounded-full bg-[#E3000F] flex items-center justify-center text-white text-xs">C</div>
            Painel Gestão
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 min-w-[16rem] scrollbar-hide">
          <div className="px-4 mb-2 text-xs font-semibold text-neutral-400 tracking-wider">MÓDULOS (A-Z)</div>
          <ul className="space-y-1 px-3">
            {sidebarSections.map((section) => {
              if (section.name === 'META' && !isGestor) return null;

              return (
                <li key={section.name}>
                  <button onClick={() => { setActiveTab(section.name); if(window.innerWidth < 768) setIsSidebarOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === section.name ? 'bg-red-50 text-[#E3000F]' : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'}`}>
                    <div className="flex items-center gap-3"><span className={`${activeTab === section.name ? 'text-[#E3000F]' : 'text-neutral-400'}`}>{section.icon}</span>{section.name}</div>
                    {activeTab === section.name && <ChevronRight size={14} />}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden print:overflow-visible print:h-auto print:block bg-white">

        <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-4 lg:px-8 shrink-0 no-print">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-neutral-100 rounded-md text-neutral-500 transition-colors"><Menu size={20} /></button>
            <h1 className="text-lg font-medium text-neutral-800 hidden sm:block">{activeTab}</h1>
          </div>
          <div className="flex items-center gap-5">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
              <input type="text" placeholder="Buscar CPF ou Contrato..." className="pl-9 pr-4 py-1.5 bg-neutral-100 border-transparent rounded-full text-sm focus:bg-white focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] transition-all w-64 outline-none" />
            </div>

            <div className="hidden sm:flex items-center justify-center mx-2">
              <div className="text-[#E3000F] font-black text-xl tracking-tighter uppercase">CLARO UNIÃO OSASCO - AT1M</div>
            </div>

            <div className="pl-4 border-l border-neutral-200">
              {globalUser && (
                <div className="flex items-center gap-3 group">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-neutral-800 leading-tight">{globalUser.name}</div>
                    <div className="text-[10px] text-neutral-500 uppercase tracking-wide font-medium">{globalUser.role}</div>
                  </div>
                  <div className="relative cursor-pointer">
                    <div className="w-10 h-10 bg-red-50 text-[#E3000F] rounded-full flex items-center justify-center border border-red-100 group-hover:bg-[#E3000F] group-hover:text-white transition-colors">
                      {isGestor ? <Crown size={18} /> : <UserCircle size={22} />}
                    </div>
                    <div onClick={handleLogout} className="absolute top-12 right-0 bg-white border border-neutral-200 shadow-xl rounded-xl py-2 w-32 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex items-center justify-center gap-2 text-sm font-bold text-red-600 hover:bg-red-50 z-50">
                      <LogOut size={16} /> Sair
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto print:overflow-visible print:h-auto print:block print:p-0 print:bg-white p-2 sm:p-4 lg:p-8 bg-neutral-50 print-area-wrapper">

          {activeTab === 'META' ? (
            <Meta isGestor={isGestor} setAuthModal={setAuthModal} goalsDB={goalsDB} setGoalsDB={setGoalsDB} currentYYYYMM={currentYYYYMM} />
          ) : activeTab === 'VENDA' ? (
            <Venda salesData={salesData} setSalesData={setSalesData} isVendedor={isVendedor} globalUser={globalUser} />
          ) : activeTab === 'CONTROLE-SIMCARD' ? (
            <ControleSimcard simcardsData={simcardsData} setSimcardsData={setSimcardsData} canModifySimcard={canModifySimcard} globalUser={globalUser} setAuthModal={setAuthModal} />
          ) : activeTab === 'COLABORADORES' ? (
            <Colaboradores selectedSeller={selectedSeller} setSelectedSeller={setSelectedSeller} isVendedor={isVendedor} globalUser={globalUser} salesData={salesData} activeMetas={activeMetas} />
          ) : activeTab === 'ESCALA DE TRABALHO' ? (
            <EscalaTrabalho canEditSchedule={canEditSchedule} scheduleData={scheduleData} setScheduleData={setScheduleData} monthlyOverrides={monthlyOverrides} setMonthlyOverrides={setMonthlyOverrides} />
          ) : activeTab === 'SISTEMAS CLARO' ? (
            <SistemasClaro />
          ) : activeTab === 'ACESSOS' ? (
            <Acessos usersDB={usersDB} setUsersDB={setUsersDB} />
          ) : activeTab === 'UR-RESIDENCIAL' ? (
            <UrResidencial salesData={salesData} setSalesData={setSalesData} globalUser={globalUser} isGestor={isGestor} />
          ) : activeTab === 'PROPOSTA' ? (
            <Proposta globalUser={globalUser} />
          ) : activeTab === 'REPROVADOS' ? (
            <Reprovados reprovadosData={reprovadosData} setReprovadosData={setReprovadosData} globalUser={globalUser} isGestor={isGestor} isVendedor={isVendedor} />
          ) : activeTab === 'RESULTADO' ? (
            <Resultado salesData={salesData} goalsDB={goalsDB} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-neutral-400 animate-fade-in border-2 border-dashed border-neutral-200 rounded-xl bg-white/50">
              <Database size={48} className="mb-4 text-neutral-300" />
              <h2 className="text-xl font-medium text-neutral-600 mb-2">Módulo {activeTab}</h2>
            </div>
          )}
        </div>

        <footer className="w-full bg-white border-t border-neutral-200 py-3 shrink-0 no-print flex items-center justify-center">
          <p className="text-[10px] sm:text-xs text-neutral-400 font-semibold tracking-widest uppercase text-center px-4">
            &copy; {new Date().getFullYear()} Todos os direitos reservados <span className="text-[#E3000F] mx-1">-</span> Desenvolvido por Matheus Rabelo <span className="text-[#E3000F] mx-1">-</span> Developer Front-End
          </p>
        </footer>
      </main>

      {/* ========================================================= */}
      {/* 🛡️ MÓDULO 7: MODAIS GLOBAIS DE SISTEMA */}
      {/* ========================================================= */}

      {/* MODAL DE AUTENTICAÇÃO DO SISTEMA (LOGIN GLOBAL) */}
      {authModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 no-print">
          <div className="flex min-h-full items-center justify-center">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in">
              <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50 rounded-t-2xl">
                <div>
                  <h2 className="text-lg font-bold text-neutral-800 flex items-center gap-2"><Lock size={18} className="text-[#E3000F]" /> Login do Sistema</h2>
                </div>
                <button onClick={() => setAuthModal({ isOpen: false, pendingAction: null, pendingId: null, requiredRole: null })} className="w-8 h-8 flex items-center justify-center bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-600 rounded-full transition-colors"><X size={18} /></button>
              </div>

              <form onSubmit={handleAuthSubmit} className="p-6 space-y-4">
                <div className="text-sm text-neutral-500 mb-4 leading-relaxed">
                  Acesse o painel para liberar permissões e customizar seu perfil de visualização de acordo com sua função.
                </div>

                {authError && (
                  <div className="bg-red-50 text-[#E3000F] text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-2">
                    <AlertCircle size={14} /> {authError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Matrícula / Usuário</label>
                  <input
                    type="text"
                    value={authCredentials.user}
                    onChange={e => setAuthCredentials({ ...authCredentials, user: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 text-neutral-800 px-3 py-2.5 rounded-lg outline-none focus:ring-1 focus:ring-[#E3000F] font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Senha</label>
                  <input
                    type="password"
                    value={authCredentials.password}
                    onChange={e => setAuthCredentials({ ...authCredentials, password: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 text-neutral-800 px-3 py-2.5 rounded-lg outline-none focus:ring-1 focus:ring-[#E3000F] tracking-widest"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="submit" className="w-full py-3 bg-[#E3000F] text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30 flex items-center justify-center gap-2">
                    <Check size={16} /> Confirmar Acesso
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
} ''