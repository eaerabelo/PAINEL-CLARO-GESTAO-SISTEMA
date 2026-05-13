# Documentação Técnica - Painel Gestão Claro

Bem-vindo à documentação oficial para desenvolvedores do **Painel de Gestão Claro**. Este documento serve como guia arquitetural para engenheiros de software que assumirão a manutenção, escalabilidade e implementação de novas features neste sistema.

---

## 1. Arquitetura Base (Tech Stack)
*   **Core:** React.js (via Vite)
*   **Estilização:** Tailwind CSS (Utility-First)
*   **Acessibilidade Visual:** Configuração adaptativa do Tailwind `darkMode: 'class'` integrado ao `localStorage`, com transições globais de tema mapeadas em `duration-500` e paletas cromáticas exclusivas por Role.
*   **Ícones:** `lucide-react`
*   **Notificações Visuais:** `react-hot-toast`
*   **Geração de Relatórios e Midia:** `xlsx` (Excel), `html2canvas` (Geração de propostas visuais por Imagem) e envio API-URI `WhatsApp`.
*   **Banco de Dados:** Firebase Firestore (NoSQL, Client-Side).

---

## 2. Estrutura do Banco de Dados (Firestore)
A aplicação utiliza uma arquitetura escalável de **Múltiplas Coleções Separadas (Collections)**, garantindo crescimento infinito sem esbarrar em limites de tamanho por documento.

*   **Coleções Principais:** `vendas_uniao_osasco`, `estoque_uniao_osasco`, `reprovados_uniao_osasco`
*   **Documento de Configuração:** `lojas/uniao_osasco_config` (Para usuários, escalas e metas)

**Fluxo de Sincronização (`App.jsx`):**
1.  O sistema estabelece listeners ativos (`onSnapshot`) para cada coleção. Se outro cliente alterar uma venda, o listener atualiza o React State instantaneamente e ordena os dados.
2.  A consulta usa queries filtradas por datas com base no seletor do usuário (`where('data', '>=', startStr)` e `where('data', '<=', endStr)`), garantindo que um **Carregamento Sob Demanda** poupe limites diários do plano gratuito. O retorno local é organizado através de uma Função de Ordenação Cronológica customizada.
3.  Para evitar excesso de gravações (Writes), há um algoritmo de **Smart Diff com Batch Write e Debounce de 1.500ms**. A aplicação compara o estado local com a última referência da nuvem e envia (`writeBatch`) *apenas* os documentos exatos alterados.

### ✅ Tech Debt Resolvido (Escalabilidade)
O limite hard de **1 MiB por documento** do Firestore foi contornado. A divisão em subcoleções escaláveis suporta grande volume de registros, enquanto as leituras foram enxugadas para buscar dados fragmentados por ciclos de meses.

---

## 3. Autenticação e RBAC (Role-Based Access Control)
O sistema não utiliza o Firebase Authentication por padrão para dar flexibilidade de auto-registro ("Código de Vendedor"). Os usuários vivem dentro da key `usersDB` no Firestore.

**Níveis de Acesso:**
*   `GESTOR`: Acesso irrestrito (CRUD total em todos os módulos).
*   `SENIOR` (e equivalentes: ASSISTENTE RELACIONAMENTO, ADMINISTRAÇÃO, JOVEM APRENDIZ, GEEK): Acesso avançado com permissões semelhantes ao Gestor para manuseio da Escala, Metas e do Estoque, bem como exclusão de vendas de terceiros.
*   `VENDEDOR`: Leitura/Escrita limitada aos próprios registros. Podem editar ou excluir exclusivamente as vendas onde eles são os autores (via verificação de nome).

**Filtros de Exibição de Nomes:**
A aplicação possui uma regra em que todas as seções operacionais (Venda, Escala, Reprovados) extraem apenas o `name.split(' ')[0]` (Primeiro Nome) do usuário. Apenas os painéis de "Colaboradores" e "Cofre" mantêm a renderização dos Nomes Completos. Além disso, as opções de Vendedores nas selects das telas operacionais filtram ativamente `role === 'VENDEDOR'`, ocultando os cargos superiores.

**Cofre de Acessos (`Acessos.jsx`):**
A aba é visível no menu EXCLUSIVAMENTE para usuários com perfil de `GESTOR`, e adicionalmente bloqueada por uma "Master Key" (hardcoded no estado inicial) com valor padrão `DEV2026`. Serve para destravar a visualização das senhas em plain-text e permitir a elevação de cargo de vendedores para Gestores.

Quando o botão de apagar usuário é ativado (validado internamente para `role === 'GESTOR'`), a exclusão mapeia tanto a string de `Nome Completo` quanto a string de `Primeiro Nome` para garantir que exceções não fiquem órfãs e aplica as mudanças no DB sem uso de merge para forçar a deleção na nuvem. A listagem agora adota um design visual cromático por "Badge" baseada no Nível de Acesso da pessoa.

---

## 4. Componentes e Lógicas Específicas

### `Venda.jsx` (Lançamento)
*   Trata as comissões através da função `calcularComissaoDinamica()`.
*   Acessórios e películas possuem `15%`, enquanto Aparelhos possuem `5%` ou `6%` (caso tenha o adicional "Seguro" anexado no array `adicionais`).
*   **Nova Funcionalidade:** Caso "SEGURO" esteja marcado em um APARELHO, a página automaticamente desmembra o pacote salvando a Venda de Seguro como um registro individual no state.
*   **Barra de Pesquisa Global:** Pesquisa termos não apenas por CPF ou Vendedor, mas busca registros por propriedades de Combos, Serviços M-Play atrelados e Serviços Operacionais (Ativação vs Migração).
*   Bloqueia a edição do campo "Receita" caso a matriz de produtos (`PRICING_MOVEL` no `constants.js`) possua um valor tabelado.
*   Para otimizar o tempo (UX), campos como M-Play e Portabilidade ficam inativos (NÃO) se o produto selecionado não for Móvel.
*   Importação/Exportação do Excel foram blindadas exclusivamente para `globalUser?.role === 'GERENTE'`. A lógica de importação foi abstraída para `excelImporter.js` (Smart Mapping).

### `UrResidencial.jsx` (Auditoria Logística)
*   A tabela incorpora a função utilitária `applyCpfCnpjMask` dinamicamente no `onChange` de edição. O layout de data usa fuso compensado (`T12:00:00`) para renderizar precisamente em padrão `pt-BR`. Contém um seletor unificado para filtrar o acompanhamento focado em um Vendedor específico.

### `Resultado.jsx` (DRE/Run Rate)
*   O coração financeiro do sistema. Utiliza `useMemo` pesados para varrer a array completa de vendas e alocá-las nos devidos "baldes" (Migração, Pós Total, Dependentes) via varredura por `includes()` e RegExp de texto no Produto/TipoOperação.
*   A "Meta Diária" calcula de forma dinâmica os dias úteis. Finais de semana (Sábados e Domingos) recebem o dobro de "peso" (weight = 2) na distribuição fracionada da meta gerencial para acompanhar o fluxo de shopping.

### `ParcialFechamento.jsx` (DRE Intraday)
*   Restrito ao gerente. Transita por todas as vendas registradas com a data correspondente ao dia de hoje (em variadas formatações compatíveis) e alimenta dois quadros centrais.
*   As equações embutidas não apenas contam serviços como também executam contas de KPIs (Key Performance Indicators) sob a forma de Ticket Médio, Conversão em Porcentagem, Anexação, etc.
*   Emprega funções de escape para web de URL (`encodeURIComponent`) concatenadas com a API não-oficial de deep linking do WhatsApp (`wa.me`).

### `Proposta.jsx` (Simulador)
*   Utiliza o objeto do estado global para cruzar os produtos. 
*   Regra vital: Se houver Móvel + Fibra/TV, o `comboType` transita de `SINGLE` para `MULTI`, ativando gatilhos comerciais na tela e renderizando um ticket otimizado via CSS puro (`@media print`).

### `EscalaTrabalho.jsx` (Gestão de RH)
*   Mantém 2 dicionários de estados. `scheduleData` é o espelho padrão da semana fixa. `monthlyOverrides` hospeda as exceções do mês. O botão de exclusão injeta um fallback de controle `__DEFAULT__`, que serve para deletar a chave correspondente do Override, permitindo que a regra semanal volte a ditar o horário daquele dia sem sobras no backend.

### `Reprovados.jsx` (Integração)
*   Contém a única requisição HTTP (Fetch API) externa do projeto. Consome a API pública `ViaCEP` para validação e preenchimento de inviabilidades de endereço, focando na UF SP.

---

## 5. Manutenção e Integrações (Guia Rápido e Leve)

### 📧 Troca de Credenciais do EmailJS (Recuperação de Senha)
O envio de e-mails para recuperação de senha não utiliza backend, é feito de forma direta (Client-Side) utilizando o **EmailJS**. Se você precisar trocar a conta ou o template, siga os passos:
1. Acesse o arquivo `src/components/Login.jsx`.
2. Localize a função assíncrona `handleForgotRequest`.
3. Você verá a linha de execução: `emailjs.send('service_kpr1ksb', 'template_6wuyizw', templateParams, 'tRgcNBg8P036AeS_l');`
4. Substitua esses valores de acordo com o painel do seu EmailJS: `emailjs.send('SEU_SERVICE_ID', 'SEU_TEMPLATE_ID', templateParams, 'SUA_PUBLIC_KEY')`.

### 🗄️ Passo a Passo para Futura Troca de Banco de Dados
Se a operação crescer a ponto de precisar migrar do Firebase para um banco relacional (ex: PostgreSQL) estruturado em um backend próprio (Node.js/Python), o sistema está desacoplado para facilitar:
1. **Remova a Dependência:** Exclua a importação do `firebase.js` no arquivo `App.jsx`.
2. **Troque a Leitura (GET):** No `App.jsx`, há um `useEffect` central utilizando o `onSnapshot` (Firebase). Substitua-o por um `fetch()` ou `axios.get('/api/dados')` logo na montagem (`[]`), e alimente os estados existentes (`setSalesData`, `setUsersDB`).
3. **Troque a Gravação (POST/PUT):** Logo abaixo da leitura, há um `useEffect` que executa o **Auto-Save (Smart Diff e Debounce de 1.2s)** através do comando `writeBatch`. Altere esta lógica para realizar envios via requisições (POST para criar, PUT para editar, DELETE para excluir) na sua nova API. A estrutura de dados do React continuará intacta!

---

## 6. Deploy e Setup de Ambiente

**1. Para rodar localmente:**
```bash
npm install
npm run dev
```

**2. Variáveis de Ambiente:**
Na versão MVP, o `firebaseConfig` foi fixado em `src/firebase.js`. Para migração a ambientes corporativos, transferir as chaves para arquivos `.env`:
```env
VITE_FIREBASE_API_KEY="xxx"
VITE_FIREBASE_AUTH_DOMAIN="xxx"
...
```
E chamar no app através de `import.meta.env.VITE_FIREBASE_API_KEY`.

**3. Build para Produção:**
```bash
npm run build
```
O Vite criará uma pasta `dist/` estática. O App é 100% Client-Side Rendered e compatível com Vercel, Netlify, Github Pages ou AWS S3 (sem necessidade de backend em Node/Python).

---

## 7. Mapa de Arquivos (Directory Tree)

Para facilitar a navegação pelo projeto, abaixo está a estrutura de pastas e a responsabilidade de cada diretório.

```text
painel-claro/
├── public/                   # Arquivos públicos e estáticos (favicon, ícones)
├── src/                      # Código-fonte principal da aplicação (React)
│   ├── components/           # Componentes modulares e Telas do sistema
│   │   ├── Acessos.jsx       # Cofre de acessos e senhas (exclusivo Gestor)
│   │   ├── Colaboradores.jsx # Dashboards individuais (Meta vs Realizado)
│   │   ├── ControleSimcard.jsx # Tabela de gestão de estoque de Chips (Físico/ESIM)
│   │   ├── EscalaTrabalho.jsx # Painel duplo de gestão de horários e folgas
│   │   ├── Login.jsx         # Tela de autenticação, registro e EmailJS
│   │   ├── Meta.jsx          # Distribuição mensal de metas da loja
│   │   ├── Proposta.jsx      # Simulador de combos e gerador do layout para PDF
│   │   ├── ParcialFechamento.jsx # Consolidação automática de KPIs do dia e envio de WhatsApp
│   │   ├── Reprovados.jsx    # Controle de vendas não concluídas e ViaCEP
│   │   ├── Resultado.jsx     # Cálculo macro da loja (Run Rate, Excel-like)
│   │   ├── SistemasClaro.jsx # Atalhos rápidos
│   │   ├── UrResidencial.jsx # Acompanhamento logístico e contratos
│   │   └── Venda.jsx         # Tela principal de lançamento e fluxo de caixa
│   │
│   ├── utils/                # Funções globais e utilitários
│   │   ├── constants.js      # Tabelas de preços, regras fixas, horários e dropdowns
│   │   └── masks.js          # Funções de formatação (CPF, Moeda, Telefone, Datas)
│   │
│   ├── App.jsx               # Componente Raiz, Roteamento das Abas e Lógicas Cloud (onSnapshot/setDoc)
│   ├── firebase.js           # Inicialização e conexão com o Google Firestore
│   ├── index.css             # Estilos globais (Tailwind) e injeções de impressão (@media print)
│   └── main.jsx              # Ponto de entrada do DOM do React
│
├── .env.local                # [OCULTO] Variáveis de ambiente seguras (API Keys)
├── DocumentacaoDesenvolvedor.md # Este documento de arquitetura
├── REGRAS_DE_NEGOCIO.md      # Manual obrigatório de regras e travas de usabilidade
├── README.md                 # Landing Page do repositório para o GitHub
├── package.json              # Mapeamento de dependências e comandos de build
└── vite.config.js            # Configuração do empacotador veloz do React (Vite)
```

---

*Mantenha a integridade deste código viva. Evite pacotes npm desnecessários e priorize o carregamento rápido.*