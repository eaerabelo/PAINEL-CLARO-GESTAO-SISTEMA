import React, { useState, useEffect, useRef } from 'react';
import {
  Menu, X, Search, ChevronRight, UserPlus,
  Users, BarChart3, FileText, Database,
  Target, AlertOctagon, Phone, CreditCard, Briefcase, AlertCircle, Check, Lock,
  Key, CalendarDays, UserCircle, LogOut, Crown, Undo, Sun, Moon
} from 'lucide-react';

import toast, { Toaster } from 'react-hot-toast';

import { doc, onSnapshot, setDoc, collection, writeBatch } from 'firebase/firestore';
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
import { Login } from './components/Login.jsx';

const safeMetasPadrao = METAS_PADRAO || { receita: 0, posTotal: 0, posPago: 0, controle: 0, urTotal: 0, fibra: 0, tv: 0, fixo: 0, aparelho: 0, acessorio: 0, pelicula: 0, seguro: 0, mesh: 0, trocafy: 0, mplay: 0 };
const safeAppUsers = APP_USERS || {};

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  const [activeTab, setActiveTab] = useState('VENDA');

  // --- TEMA (LIGHT/DARK) ---
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme-preference');
      if (savedTheme) return savedTheme;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme-preference', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // --- ESTADOS DO SISTEMA DE LOGIN GLOBAL ---
  const [globalUser, setGlobalUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sessionUser');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Date.now() - parsed.loginTime < 30 * 60 * 1000) return parsed;
          localStorage.removeItem('sessionUser');
        } catch (e) { }
      }
    }
    return null;
  });
  const [authModal, setAuthModal] = useState({ isOpen: false, pendingAction: null, pendingId: null, requiredRole: null });
  const [authCredentials, setAuthCredentials] = useState({ user: '', password: '' });
  const [authError, setAuthError] = useState('');

  // --- ESTADOS DE GESTÃO DE METAS (MONTH-BY-MONTH) ---
  const currentYYYYMM = getTodaySP().slice(0, 7);
  const [goalsDB, setGoalsDB] = useState({});
  const activeMetas = goalsDB[currentYYYYMM] || safeMetasPadrao;

  // --- ESTADOS DO DASHBOARD DE VENDAS ---
  const [selectedSeller, setSelectedSeller] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sessionUser');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Date.now() - parsed.loginTime < 30 * 60 * 1000 && parsed.role === 'VENDEDOR') return parsed.name;
        } catch (e) { }
      }
    }
    return null;
  });

  // --- ESTADOS DE BANCO DE DADOS (NUVEM - FIREBASE) ---
  const [simcardsData, setSimcardsData] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [reprovadosData, setReprovadosData] = useState([]);
  const [usersDB, setUsersDB] = useState({});
  const [scheduleData, setScheduleData] = useState({});
  const [monthlyOverrides, setMonthlyOverrides] = useState({});
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  // Referência do último estado salvo na nuvem para não sobrescrever dados sem necessidade
  const cloudRefs = useRef({
    sales: [],
    simcards: [],
    reprovados: [],
    config: ''
  });

  // --- SISTEMA DE DESFAZER (UNDO / CTRL+Z) ---
  const [undoStack, setUndoStack] = useState([]);

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    
    const lastAction = undoStack[undoStack.length - 1];
    
    if (lastAction) {
      if (lastAction.type === 'salesData') setSalesData(lastAction.state);
      if (lastAction.type === 'simcardsData') setSimcardsData(lastAction.state);
      if (lastAction.type === 'reprovadosData') setReprovadosData(lastAction.state);
      toast.success('Ação desfeita com sucesso! Registro recuperado.');
    }
    
    setUndoStack(prevStack => prevStack.slice(0, -1));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        const isInputFocused = ['input', 'textarea', 'select'].includes(activeTag);

        if (!isInputFocused && undoStack.length > 0) {
          e.preventDefault();
          handleUndo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack]);

  // Interceptadores para detectar exclusões
  const handleSetSalesData = (action) => {
    setSalesData(prev => {
      const next = typeof action === 'function' ? action(prev) : action;
      if (Array.isArray(prev) && Array.isArray(next) && next.length < prev.length) {
        setUndoStack(s => [...s, { type: 'salesData', state: prev }]);
      }
      return next;
    });
  };

  const handleSetSimcardsData = (action) => {
    setSimcardsData(prev => {
      const next = typeof action === 'function' ? action(prev) : action;
      if (Array.isArray(prev) && Array.isArray(next) && next.length < prev.length) {
        setUndoStack(s => [...s, { type: 'simcardsData', state: prev }]);
      }
      return next;
    });
  };

  const handleSetReprovadosData = (action) => {
    setReprovadosData(prev => {
      const next = typeof action === 'function' ? action(prev) : action;
      if (Array.isArray(prev) && Array.isArray(next) && next.length < prev.length) {
        setUndoStack(s => [...s, { type: 'reprovadosData', state: prev }]);
      }
      return next;
    });
  };

  // 1. CARREGAMENTO REAL-TIME SEPARADO (ON-SNAPSHOT NAS COLEÇÕES)
  useEffect(() => {
    const unsubs = [];

    // CONFIGS GERAIS (Usuários, Metas, Escalas - Permanece como Documento Único pois é leve)
    unsubs.push(onSnapshot(doc(db, 'lojas', 'uniao_osasco_config'), (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        if (d.usersDB) setUsersDB(d.usersDB);
        if (d.goalsDB) setGoalsDB(d.goalsDB);
        if (d.scheduleData) setScheduleData(d.scheduleData);
        if (d.monthlyOverrides) setMonthlyOverrides(d.monthlyOverrides);

        cloudRefs.current.config = JSON.stringify({
          usersDB: d.usersDB || {},
          goalsDB: d.goalsDB || {},
          scheduleData: d.scheduleData || {},
          monthlyOverrides: d.monthlyOverrides || {}
        });
      } else {
        setGoalsDB({ [currentYYYYMM]: { ...safeMetasPadrao } });
      }
    }, (error) => console.error("Erro Configs:", error)));

    // VENDAS (Muda para Coleção separada para escalabilidade infinita)
    unsubs.push(onSnapshot(collection(db, 'vendas_uniao_osasco'), (snap) => {
      const data = snap.docs.map(d => d.data());
      data.sort((a, b) => b.id - a.id); // Ordena pelas mais recentes
      setSalesData(data);
      cloudRefs.current.sales = data;
    }));

    // ESTOQUE SIMCARDS (Muda para Coleção)
    unsubs.push(onSnapshot(collection(db, 'estoque_uniao_osasco'), (snap) => {
      const data = snap.docs.map(d => d.data());
      data.sort((a, b) => b.id - a.id);
      setSimcardsData(data);
      cloudRefs.current.simcards = data;
    }));

    // REPROVADOS (Muda para Coleção)
    unsubs.push(onSnapshot(collection(db, 'reprovados_uniao_osasco'), (snap) => {
      const data = snap.docs.map(d => d.data());
      data.sort((a, b) => b.id - a.id);
      setReprovadosData(data);
      cloudRefs.current.reprovados = data;
      
      // Marca como pronto quando carregar as coleções
      setIsFirebaseReady(true);
    }));

    return () => unsubs.forEach(unsub => unsub());
  }, [currentYYYYMM]);

  // 2. AUTO-SAVE NA NUVEM (Smart Diff - Salva apenas os documentos que foram alterados)
  useEffect(() => {
    if (!isFirebaseReady) return;
    const timeoutId = setTimeout(async () => {
      try {
        const batch = writeBatch(db);
        let hasChanges = false;
        let opsCount = 0; // Limite do batch do Firebase é 500 operações por vez

        const safeStr = (obj) => JSON.stringify(obj || {});

        // Função inteligente de comparação (Diff)
        const syncCollection = (localArray, cloudArray, collectionName) => {
          const localMap = new Map(localArray.map(item => [String(item.id), item]));
          const cloudMap = new Map(cloudArray.map(item => [String(item.id), item]));

          // 1. Identificar Novas inserções ou Edições feitas pelo usuário
          localMap.forEach((item, id) => {
            if (opsCount >= 490) return;
            const cloudItem = cloudMap.get(id);
            if (!cloudItem || safeStr(item) !== safeStr(cloudItem)) {
              batch.set(doc(db, collectionName, id), item);
              hasChanges = true;
              opsCount++;
            }
          });

          // 2. Identificar Exclusões (Botão de Excluir da Tabela)
          cloudMap.forEach((item, id) => {
            if (opsCount >= 490) return;
            if (!localMap.has(id)) {
              batch.delete(doc(db, collectionName, id));
              hasChanges = true;
              opsCount++;
            }
          });
        };

        syncCollection(salesData, cloudRefs.current.sales, 'vendas_uniao_osasco');
        syncCollection(simcardsData, cloudRefs.current.simcards, 'estoque_uniao_osasco');
        syncCollection(reprovadosData, cloudRefs.current.reprovados, 'reprovados_uniao_osasco');

        // 3. Salva Configurações Globais apenas se houver mudança nos privilégios
        const currentConfigStr = safeStr({ usersDB, goalsDB, scheduleData, monthlyOverrides });
        if (currentConfigStr !== cloudRefs.current.config) {
          batch.set(doc(db, 'lojas', 'uniao_osasco_config'), {
            usersDB, goalsDB, scheduleData, monthlyOverrides
          }, { merge: true });
          hasChanges = true;
          cloudRefs.current.config = currentConfigStr;
        }

        // 4. Dispara todas as diferenças para a nuvem de uma vez só!
        if (hasChanges) {
          await batch.commit();
          cloudRefs.current.sales = [...salesData];
          cloudRefs.current.simcards = [...simcardsData];
          cloudRefs.current.reprovados = [...reprovadosData];
        }
      } catch (error) {
        console.error("Erro no Auto-Save (Smart Diff):", error);
      }
    }, 1200); 
    return () => clearTimeout(timeoutId);
  }, [salesData, simcardsData, reprovadosData, goalsDB, scheduleData, monthlyOverrides, usersDB, isFirebaseReady]);

  // 3. TIMER DE SESSÃO EXPIRADA POR INATIVIDADE (30 MINUTOS)
  useEffect(() => {
    if (!globalUser) return;

    let timeoutId;

    const logout = () => {
      setGlobalUser(null);
      setSelectedSeller(null);
      localStorage.removeItem('sessionUser');
      setAuthModal({ isOpen: false, pendingAction: null, pendingId: null, requiredRole: null });
      toast.error('Sessão expirada por inatividade. Faça login novamente para continuar.', { duration: 5000 });
    };

    const resetTimer = () => {
      const saved = localStorage.getItem('sessionUser');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          parsed.loginTime = Date.now();
          localStorage.setItem('sessionUser', JSON.stringify(parsed));
        } catch (e) { }
      }

      clearTimeout(timeoutId);
      timeoutId = setTimeout(logout, 30 * 60 * 1000);
    };

    const timeLeft = (30 * 60 * 1000) - (Date.now() - globalUser.loginTime);
    if (timeLeft <= 0) {
      logout();
      return;
    }

    resetTimer();

    let isThrottled = false;
    const handleActivity = () => {
      if (!isThrottled) {
        resetTimer();
        isThrottled = true;
        setTimeout(() => { isThrottled = false; }, 60000); // Atualiza no máximo a cada 1 minuto
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, handleActivity));

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, handleActivity));
    };
  }, [globalUser]);

  // 4. SINCRONIZAÇÃO EM TEMPO REAL DAS PERMISSÕES DO USUÁRIO ATUAL
  useEffect(() => {
    if (globalUser && globalUser.username && isFirebaseReady) {
      const currentDbUser = usersDB[globalUser.username] || safeAppUsers[globalUser.username];
      if (currentDbUser && currentDbUser.role !== globalUser.role) {
        const updatedUser = { ...globalUser, role: currentDbUser.role, name: currentDbUser.name };
        setGlobalUser(updatedUser);
        localStorage.setItem('sessionUser', JSON.stringify(updatedUser));
        toast.success(`Atenção: Suas permissões foram atualizadas para ${currentDbUser.role}!`, { icon: '🔄' });
      }
    }
  }, [usersDB, globalUser?.role, globalUser?.username, isFirebaseReady]);

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
    { name: 'VENDA', icon: <CreditCard size={18} /> }
  ].sort((a, b) => a.name.localeCompare(b.name));

  // --- REGRAS DE HIERARQUIA DERIVADAS DO LOGIN ---
  const isGerente = globalUser?.role === 'GERENTE';
  const canModifySimcard = isGerente || globalUser?.role === 'SENIOR';
  const canEditSchedule = isGerente || globalUser?.role === 'SENIOR';
  const hasScheduleAccess = isGerente || globalUser?.role === 'SENIOR';
  const hasMetaAccess = isGerente || globalUser?.role === 'SENIOR';
  const isVendedor = globalUser?.role === 'VENDEDOR';

  // --- LÓGICA DE LOGIN ---
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    const userMatched = usersDB[authCredentials.user] || safeAppUsers[authCredentials.user];
    if (userMatched && userMatched.pass === authCredentials.password) {
      if (authModal.requiredRole && authModal.requiredRole !== userMatched.role) {
        if (authModal.requiredRole === 'SENIOR' && !['GERENTE', 'SENIOR'].includes(userMatched.role)) {
          setAuthError('Acesso negado. Requer permissão de Sênior ou Gerente.');
          return;
        }
        if (authModal.requiredRole === 'GERENTE' && userMatched.role !== 'GERENTE') {
          setAuthError('Acesso negado. Requer permissão de Gerente.');
          return;
        }
      }
      const userWithTime = { ...userMatched, username: authCredentials.user, loginTime: Date.now() };
      setGlobalUser(userWithTime);
      localStorage.setItem('sessionUser', JSON.stringify(userWithTime));
      setAuthError('');
      if (userMatched.role === 'VENDEDOR') setSelectedSeller(userMatched.name);
      if (authModal.pendingAction === 'DELETE' && authModal.pendingId !== null && (userMatched.role === 'GERENTE' || userMatched.role === 'SENIOR')) {
        handleSetSimcardsData(prev => prev.filter(item => item.id !== authModal.pendingId));
      }
      setAuthModal({ isOpen: false, pendingAction: null, pendingId: null, requiredRole: null });
      setAuthCredentials({ user: '', password: '' });
      if (activeTab === 'META' && !['GERENTE', 'SENIOR'].includes(userMatched.role)) setActiveTab('VENDA');
      if (activeTab === 'ESCALA DE TRABALHO' && !['GERENTE', 'SENIOR'].includes(userMatched.role)) setActiveTab('VENDA');
    } else {
      setAuthError('Usuário ou senha incorretos. Acesso negado.');
    }
  };

  const handleLogout = () => {
    setGlobalUser(null);
    setSelectedSeller(null);
    localStorage.removeItem('sessionUser');
    if (activeTab === 'META' || activeTab === 'ESCALA DE TRABALHO' || activeTab === 'ACESSOS') setActiveTab('VENDA');
  };


  // =========================================================
  // 🛡️ TELA DE BLOQUEIO INICIAL (LOGIN OBRIGATÓRIO)
  // =========================================================
  if (!isFirebaseReady) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-neutral-100 dark:bg-neutral-900 font-sans flex-col gap-4">
        <div className="w-12 h-12 border-4 border-[#E3000F] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-neutral-500 dark:text-neutral-400 font-medium text-sm animate-pulse">Conectando ao Firebase e Sincronizando com a Nuvem...</p>
      </div>
    );
  }

  if (!globalUser) {
    return (
      <>
        <Toaster position="top-right" />
        <Login 
          usersDB={{ ...safeAppUsers, ...usersDB }} 
          setUsersDB={setUsersDB} 
          onLogin={(userData, username) => {
            const userWithTime = { ...userData, username, loginTime: Date.now() };
            setGlobalUser(userWithTime);
            localStorage.setItem('sessionUser', JSON.stringify(userWithTime));
            if (userData.role === 'VENDEDOR') setSelectedSeller(userData.name);
            if (activeTab === 'META' && !['GERENTE', 'SENIOR'].includes(userData.role)) setActiveTab('VENDA');
            if (activeTab === 'ESCALA DE TRABALHO' && !['GERENTE', 'SENIOR'].includes(userData.role)) setActiveTab('VENDA');
          }} 
        />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-[#F5F5F5] dark:bg-neutral-950 font-sans overflow-hidden print:overflow-visible print:h-auto print:block text-neutral-800 dark:text-neutral-100 print:bg-white transition-colors">
      <Toaster position="top-right" />

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-20 md:hidden animate-fade-in backdrop-blur-sm no-print" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 md:w-0 md:translate-x-0'} no-print overflow-hidden shrink-0 transition-all duration-300 ease-in-out bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col z-30 fixed md:relative top-0 left-0 h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-none`}>
        <div className="h-16 flex items-center px-6 border-b border-neutral-100 dark:border-neutral-800 min-w-[16rem] shrink-0">
          <div className="flex items-center gap-2 text-[#E3000F] font-bold text-xl tracking-tight">
            <div className="w-6 h-6 rounded-full bg-[#E3000F] flex items-center justify-center text-white text-xs">C</div>
            Painel Gestão
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 min-w-[16rem] scrollbar-hide">
          <div className="px-4 mb-2 text-xs font-semibold text-neutral-400 dark:text-neutral-500 tracking-wider">MÓDULOS (A-Z)</div>
          <ul className="space-y-1 px-3">
            {sidebarSections.map((section) => {
              if (section.name === 'META' && !hasMetaAccess) return null;
              if (section.name === 'ESCALA DE TRABALHO' && !hasScheduleAccess) return null;
              if (section.name === 'ACESSOS' && !isGerente) return null;

              return (
                <li key={section.name}>
                  <button onClick={() => { setActiveTab(section.name); if (window.innerWidth < 768) setIsSidebarOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === section.name ? 'bg-red-50 dark:bg-[#E3000F]/10 text-[#E3000F]' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'}`}>
                    <div className="flex items-center gap-3"><span className={`${activeTab === section.name ? 'text-[#E3000F]' : 'text-neutral-400'}`}>{section.icon}</span>{section.name}</div>
                    {activeTab === section.name && <ChevronRight size={14} />}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden print:overflow-visible print:h-auto print:block bg-white dark:bg-neutral-950">

        <header className="h-16 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4 lg:px-8 shrink-0 no-print">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md text-neutral-500 dark:text-neutral-400 transition-colors"><Menu size={20} /></button>
            <h1 className="text-lg font-medium text-neutral-800 dark:text-neutral-100 hidden sm:block">{activeTab}</h1>
          </div>
          <div className="flex items-center gap-5">
            {undoStack.length > 0 && (
              <button 
                onClick={handleUndo} 
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-lg text-sm font-medium transition-colors animate-fade-in"
                title="Desfazer exclusão (Ctrl+Z)"
              >
                <Undo size={16} /> Desfazer
              </button>
            )}

            <button onClick={toggleTheme} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full text-neutral-500 dark:text-neutral-400 transition-colors" title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" size={16} />
              <input type="text" placeholder="Buscar CPF ou Contrato..." className="pl-9 pr-4 py-1.5 bg-neutral-100 dark:bg-neutral-800 border-transparent rounded-full text-sm focus:bg-white dark:focus:bg-neutral-900 focus:border-[#E3000F] focus:ring-1 focus:ring-[#E3000F] transition-all w-64 outline-none dark:text-neutral-100" />
            </div>

            <div className="hidden sm:flex items-center justify-center mx-2">
              <div className="text-[#E3000F] font-black text-xl tracking-tighter uppercase">CLARO UNIÃO OSASCO - AT1M</div>
            </div>

            <div className="pl-4 border-l border-neutral-200 dark:border-neutral-800">
              {globalUser && (
                <div className="flex items-center gap-3 group">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-neutral-800 dark:text-neutral-100 leading-tight">{globalUser.name}</div>
                    <div className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wide font-medium">{globalUser.role}</div>
                  </div>
                  <div className="relative cursor-pointer">
                    <div className="w-10 h-10 bg-red-50 dark:bg-[#E3000F]/10 text-[#E3000F] rounded-full flex items-center justify-center border border-red-100 dark:border-[#E3000F]/20 group-hover:bg-[#E3000F] group-hover:text-white transition-colors">
                      {isGerente ? <Crown size={18} /> : <UserCircle size={22} />}
                    </div>
                    <div onClick={handleLogout} className="absolute top-12 right-0 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-xl rounded-xl py-2 w-32 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex items-center justify-center gap-2 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 z-50">
                      <LogOut size={16} /> Sair
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto print:overflow-visible print:h-auto print:block print:p-0 print:bg-white p-2 sm:p-4 lg:p-8 bg-neutral-50 dark:bg-neutral-950 print-area-wrapper">

          {activeTab === 'META' ? (
            <Meta hasAccess={hasMetaAccess} setAuthModal={setAuthModal} goalsDB={goalsDB} setGoalsDB={setGoalsDB} currentYYYYMM={currentYYYYMM} usersDB={usersDB} />
          ) : activeTab === 'VENDA' ? (
            <Venda salesData={salesData} setSalesData={handleSetSalesData} isVendedor={isVendedor} globalUser={globalUser} usersDB={usersDB} />
          ) : activeTab === 'CONTROLE-SIMCARD' ? (
            <ControleSimcard simcardsData={simcardsData} setSimcardsData={handleSetSimcardsData} canModifySimcard={canModifySimcard} globalUser={globalUser} setAuthModal={setAuthModal} usersDB={usersDB} />
          ) : activeTab === 'COLABORADORES' ? (
            <Colaboradores selectedSeller={selectedSeller} setSelectedSeller={setSelectedSeller} isVendedor={isVendedor} globalUser={globalUser} salesData={salesData} goalsDB={goalsDB} usersDB={usersDB} setAuthModal={setAuthModal} />
          ) : activeTab === 'ESCALA DE TRABALHO' ? (
            <EscalaTrabalho canEditSchedule={canEditSchedule} scheduleData={scheduleData} setScheduleData={setScheduleData} monthlyOverrides={monthlyOverrides} setMonthlyOverrides={setMonthlyOverrides} hasAccess={hasScheduleAccess} setAuthModal={setAuthModal} usersDB={usersDB} />
          ) : activeTab === 'SISTEMAS CLARO' ? (
            <SistemasClaro />
          ) : activeTab === 'ACESSOS' ? (
            <Acessos usersDB={usersDB} setUsersDB={setUsersDB} setScheduleData={setScheduleData} setMonthlyOverrides={setMonthlyOverrides} setReprovadosData={handleSetReprovadosData} globalUser={globalUser} />
          ) : activeTab === 'UR-RESIDENCIAL' ? (
            <UrResidencial salesData={salesData} setSalesData={handleSetSalesData} globalUser={globalUser} isGerente={isGerente} usersDB={usersDB} />
          ) : activeTab === 'PROPOSTA' ? (
            <Proposta globalUser={globalUser} />
          ) : activeTab === 'REPROVADOS' ? (
            <Reprovados reprovadosData={reprovadosData} setReprovadosData={handleSetReprovadosData} globalUser={globalUser} isGerente={isGerente} isVendedor={isVendedor} usersDB={usersDB} />
          ) : activeTab === 'RESULTADO' ? (
            <Resultado salesData={salesData} goalsDB={goalsDB} usersDB={usersDB} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500 animate-fade-in border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl bg-white/50 dark:bg-neutral-900/50">
              <Database size={48} className="mb-4 text-neutral-300" />
              <h2 className="text-xl font-medium text-neutral-600 dark:text-neutral-400 mb-2">Módulo {activeTab}</h2>
            </div>
          )}
        </div>

        <footer className="w-full bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 py-3 shrink-0 no-print flex items-center justify-center">
          <p className="text-[10px] sm:text-xs text-neutral-400 font-semibold tracking-widest uppercase text-center px-4">
            &copy; {new Date().getFullYear()} Todos os direitos reservados <span className="text-[#E3000F] mx-1">-</span> Sistema de Gestão Claro
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
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in">
              <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-800 rounded-t-2xl">
                <div>
                  <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2"><Lock size={18} className="text-[#E3000F]" /> Login do Sistema</h2>
                </div>
                <button onClick={() => setAuthModal({ isOpen: false, pendingAction: null, pendingId: null, requiredRole: null })} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-600 text-neutral-600 dark:text-neutral-300 rounded-full transition-colors"><X size={18} /></button>
              </div>

              <form onSubmit={handleAuthSubmit} className="p-6 space-y-4 bg-white dark:bg-neutral-900 rounded-b-2xl">
                <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-4 leading-relaxed">
                  Acesse o painel para liberar permissões e customizar seu perfil de visualização de acordo com sua função.
                </div>

                {authError && (
                  <div className="bg-red-50 text-[#E3000F] text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-2">
                    <AlertCircle size={14} /> {authError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Matrícula / Usuário</label>
                  <input
                    type="text"
                    value={authCredentials.user}
                    onChange={e => setAuthCredentials({ ...authCredentials, user: e.target.value })}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg outline-none focus:ring-1 focus:ring-[#E3000F] font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Senha</label>
                  <input
                    type="password"
                    value={authCredentials.password}
                    onChange={e => setAuthCredentials({ ...authCredentials, password: e.target.value })}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-2.5 rounded-lg outline-none focus:ring-1 focus:ring-[#E3000F] tracking-widest"
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