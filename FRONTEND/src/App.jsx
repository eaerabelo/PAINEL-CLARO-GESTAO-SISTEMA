// Importações de Hooks nativos do React utilizados para gerenciar ciclo de vida, estado e referências
import React, { useState, useEffect, useRef } from 'react';

// Importação de Ícones da biblioteca lucide-react para utilizar na interface
import {
  Menu, X, Search, ChevronRight, UserPlus,
  Users, BarChart3, FileText, Database,
  Target, AlertOctagon, Phone, CreditCard, Briefcase, AlertCircle, Check, Lock,
  Key, CalendarDays, UserCircle, LogOut, Crown, Undo, Sun, Moon, ClipboardCheck, Cpu, Bell, Wifi, Copy, Calculator, Megaphone
} from 'lucide-react';

// Importação de biblioteca de Toasts para feedback visual de ações em tela
import toast, { Toaster } from 'react-hot-toast';

// O Frontend agora é 100% blindado e alimentado pelo Backend via API.
// O acesso direto ao Firebase foi completamente removido do React!

// Importação do Socket.io para comunicação em Tempo Real com o Node.js
import { io } from 'socket.io-client';

// Importações de constantes como usuários padrões e base para as metas
import {
  METAS_PADRAO, APP_USERS
} from './utils/constants';

// Importação de função utilitária para capturar data ajustada ao fuso horário
import {
  getTodaySP
} from './utils/masks';

// Importações de Módulos (Componentes) que constroem as telas do Sistema
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
import { ParcialFechamento } from './components/ParcialFechamento.jsx';
import { Geek } from './components/Geek.jsx';
import { Scripts } from './components/Scripts.jsx';
import { FatorRvv } from './components/FatorRvv.jsx';
import { Campanha } from './components/Campanha.jsx';
import qrWifiImg from './assets/qr-wifi.png';

// URL base da API configurada via variável de ambiente (Vite) ou fallback para localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Variáveis seguras (Fallback) caso as constantes falhem ou estejam ausentes
const safeMetasPadrao = METAS_PADRAO || { receita: 0, posTotal: 0, posPago: 0, controle: 0, urTotal: 0, fibra: 0, tv: 0, fixo: 0, aparelho: 0, acessorio: 0, pelicula: 0, seguro: 0, mesh: 0, trocafy: 0, mplay: 0 };
const safeAppUsers = APP_USERS || {};

// Função / Componente Principal do Aplicativo (Ponto de Entrada)
export default function App() {
  // Define se o menu lateral estará aberto (Por padrão abre para PC e fecha para mobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  // Aba ativa selecionada no painel principal
  const [activeTab, setActiveTab] = useState('VENDA');

  // --- TEMA (LIGHT/DARK) ---
  // Recupera o tema do localStorage e define o tema atual da interface
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme-preference');
      if (savedTheme) return savedTheme;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Aplica as classes do Tailwind no root do HTML toda vez que o tema mudar
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme-preference', theme);
  }, [theme]);

  // Função simples para alternar entre Dark / Light
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // --- ESTADOS DO SISTEMA DE LOGIN GLOBAL ---
  // Carrega o usuário da sessão a partir do LocalStorage com validade de 30 minutos
  const [globalUser, setGlobalUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sessionUser');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Só mantém o login se não passou de 30 minutos sem atividade
          if (Date.now() - parsed.loginTime < 30 * 60 * 1000) return parsed;
          localStorage.removeItem('sessionUser');
        } catch (e) { }
      }
    }
    return null;
  });

  // Estado do Modal de Autenticação (quando ação crítica é exigida)
  const [authModal, setAuthModal] = useState({ isOpen: false, pendingAction: null, pendingId: null, requiredRole: null });
  const [authCredentials, setAuthCredentials] = useState({ user: '', password: '' });
  const [authError, setAuthError] = useState('');

  // --- NOTIFICAÇÕES GLOBAIS (SININHO) ---
  // Estado responsável por carregar/salvar alertas do sininho no cabeçalho
  const [notifications, setNotifications] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user_notifications');
      if (saved) {
        try { 
          const parsed = JSON.parse(saved); 
          if (Array.isArray(parsed)) return parsed;
        } catch (e) { }
      }
    }
    return [];
  });
  // Controle de visibilidade do popover das notificações
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  // Conta notificações não lidas
  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.read).length : 0;

  // Estado do Modal de Wi-Fi
  const [isWifiModalOpen, setIsWifiModalOpen] = useState(false);

  // Persiste as notificações localmente a cada atualização
  useEffect(() => {
    localStorage.setItem('user_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Marca tudo como lido quando o usuário abre o popover de notificações
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // --- ALERTA DE PARCIAL DE VENDAS (GESTOR) ---
  useEffect(() => {
    if (!['GERENTE', 'SENIOR', 'GEEK', 'ASSISTENTE RELACIONAMENTO', 'ADMINISTRAÇÃO'].includes(globalUser?.role)) return;

    const checkParcialTime = () => {
      const now = new Date();
      const h = now.getHours();
      
      // Horários designados para parciais
      const targetHours = [10, 12, 14, 16, 18, 20];
      if (targetHours.includes(h)) {
        const lastHour = localStorage.getItem('lastParcialHour');
        const lastDate = localStorage.getItem('lastParcialDate');
        const todayDate = now.toLocaleDateString('pt-BR');

        if (lastHour !== String(h) || lastDate !== todayDate) {
          
          // Usa o Toast nativo para garantir que a notificação apareça sempre no topo, livre de problemas visuais
          toast.custom((t) => (
            <div className={`${t.visible ? 'animate-fade-in' : 'opacity-0'} max-w-md w-full bg-white dark:bg-neutral-900 shadow-2xl rounded-xl border-l-4 border-[#E3000F] pointer-events-auto flex ring-1 ring-black/5 dark:ring-white/5 transition-all duration-300`}>
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-[#E3000F] shrink-0">
                    <AlertCircle size={22} />
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">Atenção Gestor!</p>
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      Já é hora de enviar a <strong className="text-[#E3000F]">Parcial de Vendas</strong> no grupo do WhatsApp da equipe.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-neutral-100 dark:border-neutral-800">
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="w-full border border-transparent rounded-none rounded-r-xl p-4 flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          ), { duration: 60000, position: 'top-center', id: `parcial-toast-${h}` });

          // Adiciona as parciais dentro do log de Notificações
          setNotifications(prev => {
            const newNotif = {
              id: `parcial-${todayDate}-${h}`,
              title: `Lembrete: Enviar Parcial`,
              desc: `Já é hora de enviar a parcial de vendas das ${h}h.`,
              time: Date.now(),
              read: false,
              type: 'parcial'
            };
            return [newNotif, ...(Array.isArray(prev) ? prev : []).filter(n => n.id !== newNotif.id)].slice(0, 20);
          });

          localStorage.setItem('lastParcialHour', String(h));
          localStorage.setItem('lastParcialDate', todayDate);
        }
      }
    };

    const interval = setInterval(checkParcialTime, 60000);
    checkParcialTime();

    return () => clearInterval(interval);
  }, [globalUser?.role]);

  // --- ESTADOS DE BANCO DE DADOS (NUVEM - FIREBASE) ---
  // Armazena todos os registros do Banco de Dados sincronizados em Real-Time
  const [simcardsData, setSimcardsData] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [reprovadosData, setReprovadosData] = useState([]);
  const [geekDocs, setGeekDocs] = useState([]);
  const [campanhasData, setCampanhasData] = useState([]);
  const [usersDB, setUsersDB] = useState({});
  const [scheduleData, setScheduleData] = useState({});
  const [monthlyOverrides, setMonthlyOverrides] = useState({});
  // Define se o primeiro carregamento da Nuvem já foi finalizado
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  // --- ESTADOS DE GESTÃO DE METAS (MONTH-BY-MONTH) ---
  // Filtro de Mês e Metas
  const currentYYYYMM = getTodaySP().slice(0, 7);
  const [globalMonth, setGlobalMonth] = useState(currentYYYYMM);
  const [goalsDB, setGoalsDB] = useState({});
  const activeMetas = (goalsDB || {})[currentYYYYMM] || safeMetasPadrao;

  // Adiciona notificação global se o Administrador atualizar as Metas de Vendas do mês vigente
  useEffect(() => {
    const metasLastUpdated = (goalsDB || {})[currentYYYYMM]?.lastUpdated;
    if (metasLastUpdated && isFirebaseReady) {
      const savedLastUpdated = localStorage.getItem('last_seen_metas_update');
      if (!savedLastUpdated || metasLastUpdated > parseInt(savedLastUpdated, 10)) {
        if (savedLastUpdated) { 
          setNotifications(prev => {
            const newNotif = {
              id: `metas-${metasLastUpdated}`,
              title: `Novas Metas Definidas!`,
              desc: `O espelho de metas para o mês foi atualizado pela Gestão.`,
              time: metasLastUpdated,
              read: false,
              type: 'meta'
            };
            return [newNotif, ...(Array.isArray(prev) ? prev : []).filter(n => n.id !== newNotif.id)].slice(0, 20);
          });
        }
        localStorage.setItem('last_seen_metas_update', String(metasLastUpdated));
      }
    }
  }, [goalsDB, currentYYYYMM, isFirebaseReady]);

  // --- ESTADOS DO DASHBOARD DE VENDAS ---
  // Seleção e visualização global de determinado colaborador
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

  // Referência do último estado salvo na nuvem para não sobrescrever dados sem necessidade
  const cloudRefs = useRef({
    sales: [],
    simcards: [],
    reprovados: [],
    geekDocs: [],
    campanhas: [],
    config: ''
  });

  // --- SISTEMA DE DESFAZER (UNDO / CTRL+Z) ---
  // Stack local do estado que armazena os últimos "Delete" efetuados
  const [undoStack, setUndoStack] = useState([]);

  // Função para retornar a última versão dos dados (CTRL+Z/Desfazer)
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    
    const lastAction = undoStack[undoStack.length - 1];
    
    if (lastAction) {
      if (lastAction.type === 'salesData') setSalesData(lastAction.state);
      if (lastAction.type === 'simcardsData') setSimcardsData(lastAction.state);
      if (lastAction.type === 'reprovadosData') setReprovadosData(lastAction.state);
      if (lastAction.type === 'geekDocs') setGeekDocs(lastAction.state);
      if (lastAction.type === 'campanhasData') setCampanhasData(lastAction.state);
      toast.success('Ação desfeita com sucesso! Registro recuperado.');
    }
    
    setUndoStack(prevStack => prevStack.slice(0, -1));
  };

  // Listener para capturar o atalho de teclado Control+Z
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
      if (e.key === 'Escape' && authModal.isOpen) {
        setAuthModal({ isOpen: false, pendingAction: null, pendingId: null, requiredRole: null });
      }
      if (e.key === 'Escape' && isWifiModalOpen) {
        setIsWifiModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, authModal.isOpen, isWifiModalOpen]);

  // Listener para fechar o popover das notificações ao clicar fora dele
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isNotificationsOpen && !e.target.closest('.notification-container')) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationsOpen]);

  // Interceptadores (Wrappers) para detectar exclusões e criar o backup automático na Stack (para o Undo)
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

  const handleSetGeekDocs = (action) => {
    setGeekDocs(prev => {
      const next = typeof action === 'function' ? action(prev) : action;
      if (Array.isArray(prev) && Array.isArray(next) && next.length < prev.length) {
        setUndoStack(s => [...s, { type: 'geekDocs', state: prev }]);
      }
      return next;
    });
  };

  const handleSetCampanhasData = (action) => {
    setCampanhasData(prev => {
      const next = typeof action === 'function' ? action(prev) : action;
      if (Array.isArray(prev) && Array.isArray(next) && next.length < prev.length) {
        setUndoStack(s => [...s, { type: 'campanhasData', state: prev }]);
      }
      return next;
    });
  };

  // 1. CARREGAMENTO REAL-TIME SEPARADO (ON-SNAPSHOT NAS COLEÇÕES)
  // Estabelece a conexão com o Firebase do Google
  useEffect(() => {
    // 🚀 PASSO 0: CONFIGURAÇÕES GLOBAIS BUSCADAS VIA API REST (Cofre, Senhas, Metas, Escala)
    const fetchConfigAPI = async () => {
      try {
        const response = await fetch(`${API_URL}/api/config`);
        const d = await response.json();
        
        // 🛡️ SISTEMA DE RECUPERAÇÃO E PROTEÇÃO
        // Se o banco foi apagado acidentalmente, restauramos do arquivo local de segurança
        const recoveredUsers = (d && d.usersDB && Object.keys(d.usersDB).length > 0) ? d.usersDB : safeAppUsers;
        const recoveredGoals = (d && d.goalsDB && Object.keys(d.goalsDB).length > 0) ? d.goalsDB : { [currentYYYYMM]: { ...safeMetasPadrao } };

        setUsersDB(recoveredUsers);
        setGoalsDB(recoveredGoals);
        if (d && d.scheduleData) setScheduleData(d.scheduleData);
        if (d && d.monthlyOverrides) setMonthlyOverrides(d.monthlyOverrides);

        cloudRefs.current.config = JSON.stringify({
          usersDB: recoveredUsers,
          goalsDB: recoveredGoals,
          scheduleData: d?.scheduleData || {},
          monthlyOverrides: d?.monthlyOverrides || {}
        });

        if (!isFirebaseReady) setIsFirebaseReady(true);
      } catch (error) {
        console.error("Erro Configs API:", error);
        setIsFirebaseReady(true);
      }
    };
    fetchConfigAPI();

    const startStr = `${globalMonth}-01`;
    const endStr = `${globalMonth}-31T23:59:59`; // Garante a captura até o último segundo do dia 31

    // 🚀 INICIANDO O TÚNEL DE TEMPO REAL
    const socket = io(API_URL);
    socket.on('connect', () => {
      console.log('🟢 Conectado ao Servidor em Tempo Real!');
    });

    socket.on('config-atualizada', () => {
      fetchConfigAPI();
    });

    // Função de ordenação cronológica inteligente para evitar "embaralhar"
    const sortChronologically = (a, b) => {
      const getTime = (d) => (typeof d === 'string') ? new Date(d.includes('/') ? d.split('/').reverse().join('-') : d.substring(0, 10)).getTime() : 0;
      const timeA = getTime(a.data);
      const timeB = getTime(b.data);
      if (timeA !== timeB) return timeB - timeA; // Datas mais recentes sempre no topo
      return (b.id || 0) - (a.id || 0); // Desempate pela ordem de registro (ID) caso sejam do mesmo dia
    };

    // 🚀 PASSO 1: VENDAS BUSCADAS VIA API REST DO BACKEND (Node.js)
    // Substituímos o onSnapshot direto do Firebase por uma requisição HTTP limpa
    const fetchVendasAPI = async () => {
      try {
        const response = await fetch(`${API_URL}/api/vendas?start=${startStr}&end=${endStr}`);
        const data = await response.json();
        data.sort(sortChronologically);
        setSalesData(data);
        cloudRefs.current.sales = data;
      } catch (error) {
        console.error("Erro ao conectar com a API de Vendas do Backend:", error);
      }
    };
    fetchVendasAPI();

    // Ouve o servidor. Se alguém salvar uma venda na loja, o React refaz o fetch sozinho!
    socket.on('vendas-atualizadas', () => {
      console.log('🔄 Nova venda detectada no servidor! Atualizando tela...');
      fetchVendasAPI();
    });

    // 🚀 PASSO 2: ESTOQUE BUSCADO VIA API REST DO BACKEND (Node.js)
    const fetchSimcardsAPI = async () => {
      try {
        const response = await fetch(`${API_URL}/api/simcards`);
        const data = await response.json();
        data.sort((a, b) => b.id - a.id);
        setSimcardsData(data);
        cloudRefs.current.simcards = data;
      } catch (error) {
        console.error("Erro ao conectar com a API de Simcards do Backend:", error);
      }
    };
    fetchSimcardsAPI();

    socket.on('simcards-atualizados', () => {
      console.log('🔄 Estoque atualizado no servidor! Atualizando tela...');
      fetchSimcardsAPI();
    });

    // 🚀 PASSO 3: REPROVADOS BUSCADOS VIA API REST
    const fetchReprovadosAPI = async () => {
      try {
        const response = await fetch(`${API_URL}/api/reprovados?start=${startStr}&end=${endStr}`);
        const data = await response.json();
        data.sort(sortChronologically);
        setReprovadosData(data);
        cloudRefs.current.reprovados = data;
      } catch (error) {
        console.error("Erro ao conectar com a API de Reprovados:", error);
      }
    };
    fetchReprovadosAPI();

    socket.on('reprovados-atualizados', () => {
      fetchReprovadosAPI();
    });

    // 🚀 PASSO 4: GEEK DOCS BUSCADOS VIA API REST
    const fetchGeekDocsAPI = async () => {
      try {
        const response = await fetch(`${API_URL}/api/geek-docs`);
        const data = await response.json();
        data.sort((a, b) => b.id - a.id);
        setGeekDocs(data);
        cloudRefs.current.geekDocs = data;
      } catch (error) {
        console.error("Erro ao conectar com a API de Geek Docs:", error);
      }
    };
    fetchGeekDocsAPI();

    socket.on('geek-docs-atualizados', () => {
      fetchGeekDocsAPI();
    });

    // 🚀 PASSO 5: CAMPANHAS BUSCADAS VIA API REST
    const fetchCampanhasAPI = async () => {
      try {
        const response = await fetch(`${API_URL}/api/campanhas`);
        const data = await response.json();
        data.sort((a, b) => b.id - a.id);
        setCampanhasData(data);
        cloudRefs.current.campanhas = data;
      } catch (error) {
        console.error("Erro ao conectar com a API de Campanhas:", error);
      }
    };
    fetchCampanhasAPI();

    socket.on('campanhas-atualizadas', () => {
      fetchCampanhasAPI();
    });

    return () => {
      socket.disconnect(); // Desconecta ao mudar de mês para evitar túneis duplicados
    };
  }, [globalMonth]);

  // 2. AUTO-SAVE NA NUVEM (Smart Diff - Salva apenas os documentos que foram alterados)
  useEffect(() => {
    if (!isFirebaseReady) return;
    const timeoutId = setTimeout(async () => {
      try {
        let hasChanges = false;

        const safeStr = (obj) => JSON.stringify(obj || {});

        // Função inteligente de comparação (Diff)
        const syncCollectionAPI = async (localArray, cloudArray, syncEndpoint) => {
          const localMap = new Map((localArray || []).map(item => [String(item.id), item]));
          const cloudMap = new Map((cloudArray || []).map(item => [String(item.id), item]));

          const apiUpserts = [];
          const apiDeletes = [];

          // 1. Identificar Novas inserções ou Edições feitas pelo usuário
          localMap.forEach((item, id) => {
            const cloudItem = cloudMap.get(id);
            if (!cloudItem || safeStr(item) !== safeStr(cloudItem)) {
              apiUpserts.push(item);
            }
          });

          // 2. Identificar Exclusões (Botão de Excluir da Tabela)
          cloudMap.forEach((item, id) => {
            if (!localMap.has(id)) {
              apiDeletes.push(id);
            }
          });

          // 3. Despacha para a nossa API no Backend
          if (apiUpserts.length > 0 || apiDeletes.length > 0) {
            try {
              await fetch(`${API_URL}${syncEndpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ upserts: apiUpserts, deletes: apiDeletes })
              });
              hasChanges = true;
            } catch (error) {
              console.error(`Erro na Sincronização API (${syncEndpoint}):`, error);
            }
          }
        };

        await syncCollectionAPI(salesData, cloudRefs.current.sales, '/api/vendas/sync');
        await syncCollectionAPI(simcardsData, cloudRefs.current.simcards, '/api/simcards/sync');
        await syncCollectionAPI(reprovadosData, cloudRefs.current.reprovados, '/api/reprovados/sync');
        await syncCollectionAPI(geekDocs, cloudRefs.current.geekDocs, '/api/geek-docs/sync');
        await syncCollectionAPI(campanhasData, cloudRefs.current.campanhas, '/api/campanhas/sync');

        // 3. Salva Configurações Globais apenas se houver mudança nos privilégios
        const currentConfigStr = safeStr({ usersDB, goalsDB, scheduleData, monthlyOverrides });
        // 🛡️ TRAVA DE SEGURANÇA: Só envia se já carregou da nuvem com sucesso (cloudRefs não está vazio)
        if (cloudRefs.current.config !== '' && currentConfigStr !== cloudRefs.current.config) {
          try {
            await fetch(`${API_URL}/api/config/sync`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: currentConfigStr
            });
            cloudRefs.current.config = currentConfigStr;
          } catch (error) {
            console.error("Erro na Sincronização API (Configurações):", error);
          }
        }

        // 4. Dispara todas as diferenças para a nuvem de uma vez só!
        if (hasChanges) {
          cloudRefs.current.sales = [...salesData];
          cloudRefs.current.simcards = [...simcardsData];
          cloudRefs.current.reprovados = [...reprovadosData];
          cloudRefs.current.geekDocs = [...geekDocs];
          cloudRefs.current.campanhas = [...campanhasData];
        }
      } catch (error) {
        console.error("Erro no Auto-Save (Smart Diff):", error);
      }
    }, 1500); 
    return () => clearTimeout(timeoutId);
  }, [salesData, simcardsData, reprovadosData, geekDocs, campanhasData, goalsDB, scheduleData, monthlyOverrides, usersDB, isFirebaseReady]);

  // 3. TIMER DE SESSÃO EXPIRADA POR INATIVIDADE (30 MINUTOS)
  // Monitoramento de inatividade global do usuário, fazendo Logout automático caso ocioso
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
  // Observa caso os cargos do usuário logado mudem no Banco e os desloga/altera na hora
  useEffect(() => {
    if (globalUser && globalUser.username && isFirebaseReady) {
      const currentDbUser = (usersDB || {})[globalUser.username] || safeAppUsers[globalUser.username];
      if (currentDbUser && currentDbUser.role !== globalUser.role) {
        if (currentDbUser.role === 'SUSPENDER') {
          setGlobalUser(null);
          setSelectedSeller(null);
          localStorage.removeItem('sessionUser');
          setActiveTab('VENDA');
          toast.error('Sua conta foi suspensa temporariamente.', { duration: 6000 });
          return;
        }
        const updatedUser = { ...globalUser, role: currentDbUser.role, name: currentDbUser.name };
        setGlobalUser(updatedUser);
        localStorage.setItem('sessionUser', JSON.stringify(updatedUser));
        toast.success(`Atenção: Suas permissões foram atualizadas para ${currentDbUser.role}!`, { icon: '🔄' });
      }
    }
  }, [usersDB, globalUser?.role, globalUser?.username, isFirebaseReady]);

  // Abas Dinâmicas de acordo com o Menu Lateral
  const sidebarSections = [
    { name: 'ACESSOS', icon: <Key size={18} /> },
    { name: 'CAMPANHAS', icon: <Megaphone size={18} /> },
    { name: 'COLABORADORES', icon: <Users size={18} /> },
    { name: 'CONTROLE-SIMCARD', icon: <Phone size={18} /> },
    { name: 'ESCALA DE TRABALHO', icon: <CalendarDays size={18} /> },
    { name: 'FATOR RV', icon: <Calculator size={18} /> },
    { name: 'META', icon: <Target size={18} /> },
    { name: 'PROPOSTA', icon: <FileText size={18} /> },
    { name: 'REPROVADOS', icon: <AlertOctagon size={18} /> },
    { name: 'RESULTADO', icon: <BarChart3 size={18} /> },
    { name: 'SCRIPTS', icon: <Copy size={18} /> },
    { name: 'SISTEMAS CLARO', icon: <Database size={18} /> },
    { name: 'UR-RESIDENCIAL', icon: <Briefcase size={18} /> },
    { name: 'VENDA', icon: <CreditCard size={18} /> },
    { name: 'PARCIAL & FECHAMENTO', icon: <ClipboardCheck size={18} /> },
    { name: 'GEEK', icon: <Cpu size={18} /> }
  ].sort((a, b) => a.name.localeCompare(b.name));

  // --- REGRAS DE HIERARQUIA DERIVADAS DO LOGIN ---
  // Determina através de variáveis booleanas as permissões de acordo com os cargos
  const isGerente = globalUser?.role === 'GERENTE';
  const isSeniorEquivalent = ['SENIOR', 'ASSISTENTE RELACIONAMENTO', 'ADMINISTRAÇÃO', 'JOVEM APRENDIZ', 'GEEK'].includes(globalUser?.role);
  
  const canModifySimcard = ['GERENTE', 'SENIOR', 'ADMINISTRAÇÃO', 'JOVEM APRENDIZ', 'GEEK'].includes(globalUser?.role);
  const canEditSchedule = isGerente;
  const hasScheduleAccess = ['GERENTE', 'SENIOR', 'ADMINISTRAÇÃO', 'GEEK'].includes(globalUser?.role);
  const hasMetaAccess = ['GERENTE', 'SENIOR', 'ADMINISTRAÇÃO', 'GEEK', 'JOVEM APRENDIZ', 'ASSISTENTE RELACIONAMENTO'].includes(globalUser?.role);
  const canEditMeta = ['GERENTE', 'SENIOR'].includes(globalUser?.role);
  const hasParcialAccess = ['GERENTE', 'SENIOR', 'GEEK', 'ASSISTENTE RELACIONAMENTO', 'ADMINISTRAÇÃO'].includes(globalUser?.role);
  const isVendedor = globalUser?.role === 'VENDEDOR';

  // --- LÓGICA DE LOGIN ---
  // Envio do formulário de autenticação global e/ou de senhas específicas
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    const userMatched = (usersDB || {})[authCredentials.user] || safeAppUsers[authCredentials.user];
    if (userMatched && userMatched.pass === authCredentials.password) {
      if (userMatched.role === 'SUSPENDER') {
        setAuthError('Conta suspensa temporariamente. Procure o Gerente.');
        return;
      }
      if (authModal.requiredRole && authModal.requiredRole !== userMatched.role) {
        if (authModal.requiredRole === 'SENIOR' && !['GERENTE', 'SENIOR', 'ADMINISTRAÇÃO', 'GEEK'].includes(userMatched.role)) {
          setAuthError('Acesso negado. Requer permissão de Sênior ou superior.');
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
      if (authModal.pendingAction === 'DELETE' && authModal.pendingId !== null && ['GERENTE', 'SENIOR', 'ADMINISTRAÇÃO', 'JOVEM APRENDIZ', 'GEEK'].includes(userMatched.role)) {
        handleSetSimcardsData(prev => prev.filter(item => item.id !== authModal.pendingId));
      }
      setAuthModal({ isOpen: false, pendingAction: null, pendingId: null, requiredRole: null });
      setAuthCredentials({ user: '', password: '' });
      if (activeTab === 'META' && !['GERENTE', 'SENIOR', 'ADMINISTRAÇÃO', 'GEEK', 'JOVEM APRENDIZ', 'ASSISTENTE RELACIONAMENTO'].includes(userMatched.role)) setActiveTab('VENDA');
      if (activeTab === 'ESCALA DE TRABALHO' && !['GERENTE', 'SENIOR', 'ADMINISTRAÇÃO', 'GEEK'].includes(userMatched.role)) setActiveTab('VENDA');
      if (activeTab === 'PARCIAL & FECHAMENTO' && !['GERENTE', 'SENIOR', 'GEEK', 'ASSISTENTE RELACIONAMENTO', 'ADMINISTRAÇÃO'].includes(userMatched.role)) setActiveTab('VENDA');
    } else {
      setAuthError('Usuário ou senha incorretos. Acesso negado.');
    }
  };

  // Logout manual e remoção de credenciais
  const handleLogout = () => {
    setGlobalUser(null);
    setSelectedSeller(null);
    localStorage.removeItem('sessionUser');
    if (activeTab === 'META' || activeTab === 'ESCALA DE TRABALHO' || activeTab === 'ACESSOS' || activeTab === 'PARCIAL & FECHAMENTO') setActiveTab('VENDA');
  };


  // =========================================================
  // 🛡️ TELA DE BLOQUEIO INICIAL (LOGIN OBRIGATÓRIO)
  // =========================================================
  // Renderiza tela de Loading enquanto as Collections não estão preparadas
  if (!isFirebaseReady) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-neutral-100 dark:bg-neutral-900 font-sans flex-col gap-4">
        <div className="w-12 h-12 border-4 border-[#E3000F] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-neutral-500 dark:text-neutral-400 font-medium text-sm animate-pulse">Conectando ao Firebase e Sincronizando com a Nuvem...</p>
      </div>
    );
  }

  // Se o usuário não está logado globalmente, exibe a tela de Login
  if (!globalUser) {
    return (
      <>
        <Toaster position="top-right" />
        <Login 
          usersDB={{ ...safeAppUsers, ...(usersDB || {}) }} 
          setUsersDB={setUsersDB} 
          onLogin={(userData, username) => {
            const userWithTime = { ...userData, username, loginTime: Date.now() };

            localStorage.setItem('sessionUser', JSON.stringify(userWithTime));
                
            toast.loading('Iniciando e buscando atualizações...', { duration: 1500 });
            setTimeout(() => {
              window.location.reload();
            }, 1200);
          }} 
        />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-[#F5F5F5] dark:bg-neutral-950 font-sans overflow-hidden print:overflow-visible print:h-auto print:block text-neutral-800 dark:text-neutral-100 print:bg-white transition-colors duration-500">
      <Toaster position="top-right" />

      {/* Overlay da Barra Lateral em dispositivos Mobile */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-20 md:hidden animate-fade-in backdrop-blur-sm no-print" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar - Menu de Navegação Esquerdo */}
      <aside className={`${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 md:w-0 md:translate-x-0'} no-print overflow-hidden shrink-0 transition-all duration-500 ease-in-out bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col z-30 fixed md:relative top-0 left-0 h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-none`}>
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
              if (section.name === 'PARCIAL & FECHAMENTO' && !hasParcialAccess) return null;

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

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden print:overflow-visible print:h-auto print:block bg-white dark:bg-neutral-950">

        {/* Cabeçalho de Ações e Informações */}
        <header className="h-16 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4 lg:px-8 shrink-0 no-print transition-colors duration-500">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md text-neutral-500 dark:text-neutral-400 transition-colors"><Menu size={20} /></button>
            <h1 className="text-lg font-medium text-neutral-800 dark:text-neutral-100 hidden sm:block">{activeTab}</h1>
          </div>
          <div className="flex items-center gap-5">

            {/* Botão de Desfazer Exclusão */}
            {undoStack.length > 0 && (
              <button 
                onClick={handleUndo} 
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-lg text-sm font-medium transition-colors animate-fade-in"
                title="Desfazer exclusão (Ctrl+Z)"
              >
                <Undo size={16} /> Desfazer
              </button>
            )}
            
            {/* Seletor Global de Mês */}
            <div className="hidden md:flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm animate-fade-in">
              <CalendarDays size={16} className="text-[#E3000F]" />
              <input 
                type="month" 
                value={globalMonth}
                onChange={(e) => setGlobalMonth(e.target.value)}
                className="bg-transparent text-sm font-bold text-neutral-700 dark:text-neutral-100 outline-none cursor-pointer"
                title="Mês de Busca (Carregamento Sob Demanda)"
              />
            </div>

            {/* Botão Wi-Fi para Clientes */}
            <button 
              onClick={() => setIsWifiModalOpen(true)} 
              className="hidden sm:flex p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full text-neutral-500 dark:text-neutral-400 transition-colors" 
              title="Wi-Fi para Clientes"
            >
              <Wifi size={20} />
            </button>

            {/* Seletor do Theme Light/Dark */}
            <button onClick={toggleTheme} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full text-neutral-500 dark:text-neutral-400 transition-colors" title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* SINO DE NOTIFICAÇÕES */}
            {/* Dropdown/Popover das Notificações Recebidas */}
            <div className="relative notification-container">
              <button 
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  if (unreadCount > 0 && !isNotificationsOpen) markAllAsRead();
                }} 
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full text-neutral-500 dark:text-neutral-400 transition-colors relative"
                title="Notificações"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E3000F] rounded-full ring-2 ring-white dark:ring-neutral-900 animate-pulse"></span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute top-12 right-0 md:-right-4 w-80 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-2xl rounded-2xl overflow-hidden z-50 animate-fade-in origin-top-right">
                  <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-800/50">
                    <h3 className="font-bold text-neutral-800 dark:text-neutral-100">Notificações</h3>
                    {notifications.length > 0 && (
                      <button onClick={() => setNotifications([])} className="text-[10px] font-bold text-neutral-500 hover:text-[#E3000F] uppercase tracking-wider">Limpar tudo</button>
                    )}
                  </div>
                  <div className="max-h-[350px] overflow-y-auto scrollbar-thin">
                    {(!Array.isArray(notifications) || notifications.length === 0) ? (
                      <div className="p-6 text-center text-neutral-500 dark:text-neutral-400">
                        <Bell size={32} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">Nenhuma notificação nova.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {notifications.map(notif => (
                          <div key={notif.id} className={`p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors ${!notif.read ? 'bg-red-50/30 dark:bg-[#E3000F]/5' : ''}`}>
                            <div className="flex gap-3">
                              <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${notif.type === 'parcial' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-red-100 text-[#E3000F] dark:bg-red-900/30'}`}>
                                {notif.type === 'parcial' ? <ClipboardCheck size={16} /> : <Target size={16} />}
                              </div>
                              <div>
                                <h4 className={`text-sm mb-0.5 ${!notif.read ? 'font-bold text-neutral-900 dark:text-white' : 'font-medium text-neutral-700 dark:text-neutral-300'}`}>{notif.title}</h4>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-snug">{notif.desc}</p>
                                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mt-2 block">
                                  {new Date(notif.time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Identificação de Empresa */}
            <div className="hidden sm:flex items-center justify-center mx-2">
              <div className="text-[#E3000F] font-black text-xl tracking-tighter uppercase">CLARO UNIÃO OSASCO - AT1M</div>
            </div>

            {/* Dropdown/Perfil do Usuário Global Logado */}
            <div className="pl-4 border-l border-neutral-200 dark:border-neutral-800">
              {globalUser && (
                <div className="flex items-center gap-3 group">
                  <div className="text-right flex flex-col justify-center">
                    <div className="text-sm font-bold text-neutral-800 dark:text-neutral-100 leading-tight hidden sm:block">{globalUser?.name || 'Usuário'}</div>
                    <div className="text-sm font-bold text-neutral-800 dark:text-neutral-100 leading-tight sm:hidden">{String(globalUser?.name || '').split(' ')[0] || 'Usuário'}</div>
                    <div className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wide font-medium">{globalUser?.role || ''}</div>
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

        <div className="flex-1 overflow-auto print:overflow-visible print:h-auto print:block print:p-0 print:bg-white p-2 sm:p-4 lg:p-8 bg-neutral-50 dark:bg-neutral-950 print-area-wrapper transition-colors duration-500">

          {/* Roteador/Renderizador do Conteúdo Principal conforme as Abas ativas */}
          {activeTab === 'META' ? (
            <Meta hasAccess={hasMetaAccess} canEdit={canEditMeta} setAuthModal={setAuthModal} goalsDB={goalsDB} setGoalsDB={setGoalsDB} currentYYYYMM={currentYYYYMM} usersDB={usersDB} salesData={salesData} globalMonth={globalMonth} />
          ) : activeTab === 'VENDA' ? (
            <Venda salesData={salesData} setSalesData={handleSetSalesData} isVendedor={isVendedor} globalUser={globalUser} usersDB={usersDB} globalMonth={globalMonth} />
          ) : activeTab === 'CONTROLE-SIMCARD' ? (
            <ControleSimcard simcardsData={simcardsData} setSimcardsData={handleSetSimcardsData} canModifySimcard={canModifySimcard} globalUser={globalUser} setAuthModal={setAuthModal} usersDB={usersDB} />
          ) : activeTab === 'COLABORADORES' ? (
            <Colaboradores selectedSeller={selectedSeller} setSelectedSeller={setSelectedSeller} isVendedor={isVendedor} globalUser={globalUser} salesData={salesData} goalsDB={goalsDB} usersDB={usersDB} setAuthModal={setAuthModal} globalMonth={globalMonth} setGlobalMonth={setGlobalMonth} />
          ) : activeTab === 'ESCALA DE TRABALHO' ? (
            <EscalaTrabalho canEditSchedule={canEditSchedule} scheduleData={scheduleData} setScheduleData={setScheduleData} monthlyOverrides={monthlyOverrides} setMonthlyOverrides={setMonthlyOverrides} hasAccess={hasScheduleAccess} setAuthModal={setAuthModal} usersDB={usersDB} />
          ) : activeTab === 'SISTEMAS CLARO' ? (
            <SistemasClaro />
          ) : activeTab === 'ACESSOS' ? (
            <Acessos usersDB={usersDB} setUsersDB={setUsersDB} setScheduleData={setScheduleData} setMonthlyOverrides={setMonthlyOverrides} setReprovadosData={handleSetReprovadosData} globalUser={globalUser} />
          ) : activeTab === 'UR-RESIDENCIAL' ? (
            <UrResidencial salesData={salesData} setSalesData={handleSetSalesData} globalUser={globalUser} isGerente={isGerente} usersDB={usersDB} globalMonth={globalMonth} setGlobalMonth={setGlobalMonth} />
          ) : activeTab === 'PROPOSTA' ? (
            <Proposta globalUser={globalUser} />
          ) : activeTab === 'REPROVADOS' ? (
            <Reprovados reprovadosData={reprovadosData} setReprovadosData={handleSetReprovadosData} globalUser={globalUser} isGerente={isGerente} isVendedor={isVendedor} usersDB={usersDB} globalMonth={globalMonth} />
          ) : activeTab === 'RESULTADO' ? (
            <Resultado salesData={salesData} goalsDB={goalsDB} usersDB={usersDB} globalMonth={globalMonth} setGlobalMonth={setGlobalMonth} />
          ) : activeTab === 'PARCIAL & FECHAMENTO' ? (
            <ParcialFechamento hasAccess={hasParcialAccess} salesData={salesData} goalsDB={goalsDB} globalMonth={globalMonth} />
          ) : activeTab === 'GEEK' ? (
            <Geek geekDocs={geekDocs} setGeekDocs={handleSetGeekDocs} isGerente={isGerente} globalUser={globalUser} />
          ) : activeTab === 'SCRIPTS' ? (
            <Scripts globalUser={globalUser} />
          ) : activeTab === 'CAMPANHAS' ? (
            <Campanha globalUser={globalUser} campanhasData={campanhasData} setCampanhasData={handleSetCampanhasData} />
          ) : activeTab === 'FATOR RV' ? (
            <FatorRvv globalUser={globalUser} salesData={salesData} goalsDB={goalsDB} usersDB={usersDB} globalMonth={globalMonth} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500 animate-fade-in border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl bg-white/50 dark:bg-neutral-900/50">
              <Database size={48} className="mb-4 text-neutral-300" />
              <h2 className="text-xl font-medium text-neutral-600 dark:text-neutral-400 mb-2">Módulo {activeTab}</h2>
            </div>
          )}
        </div>

        <footer className="w-full bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 py-3 shrink-0 no-print flex items-center justify-center transition-colors duration-500">
          <p className="text-[10px] sm:text-xs text-neutral-400 font-semibold tracking-widest uppercase text-center px-4 whitespace-nowrap">
            <span className="hidden sm:inline">&copy; {new Date().getFullYear()} Todos os direitos reservados <span className="text-[#E3000F] mx-1">-</span> Desenvolvido por Matheus Rabelo <span className="text-[#E3000F] mx-1">-</span> Developer FullStack</span>
            <span className="sm:hidden">&copy; {new Date().getFullYear()} Dev: Matheus Rabelo</span>
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

      {/* MODAL DE WI-FI PARA CLIENTES */}
      {isWifiModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 no-print flex items-center justify-center" onClick={() => setIsWifiModalOpen(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm animate-fade-in flex flex-col items-center p-8 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-50 dark:bg-[#E3000F]/10 rounded-full flex items-center justify-center text-[#E3000F] mb-4">
              <Wifi size={32} />
            </div>
            
            <h2 className="text-2xl font-black text-neutral-800 dark:text-neutral-100 mb-2 tracking-tight">Wi-Fi CLARO_CLIENTE</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed">
              Escaneie o QR Code abaixo para se conectar à internet automaticamente.
            </p>
            
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 mb-6 w-full max-w-[280px] aspect-square">
              <img 
                src={qrWifiImg} 
                alt="QR Code Wi-Fi" 
                className="w-full h-full object-contain rounded-xl" 
                onError={(e) => e.target.src = 'https://via.placeholder.com/256?text=QR+Code+Wi-Fi'} 
              />
            </div>

            <button onClick={() => setIsWifiModalOpen(false)} className="w-full py-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl transition-colors">
              Fechar
            </button>
          </div>
        </div>
      )}

    </div>
  );
} 