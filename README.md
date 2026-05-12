# Manual do Sistema - Painel Gestão Claro

Bem-vindo ao repositório oficial do **Painel de Gestão Claro**. 
Este sistema foi desenvolvido como uma Single Page Application (SPA) para revolucionar o acompanhamento de vendas, metas, escalas e auditorias de estoque em lojas e operações comerciais.

---

## 🚀 Tecnologias Utilizadas
- **Linguagem:** JavaScript (ES6+) / JSX
- **Framework/Biblioteca:** React.js
- **Bundler:** Vite (Extrema velocidade em HMR)
- **Estilização:** Tailwind CSS (Utility-first framework)
- **Ícones:** Lucide React
- **Persistência de Dados:** Firebase Firestore (Banco de Dados em Nuvem NoSQL em tempo real)

---

## 📌 Módulos do Sistema

A plataforma é dividida em módulos estratégicos baseados no Controle de Acesso Baseado em Função (RBAC - Gestor, Sênior/Equivalentes e Vendedor).

### 1. Vendas
O coração da operação. Permite o lançamento de vendas de aparelhos, acessórios, planos móveis e banda larga.
- *Diferenciais:* Auto-preenchimento restrito ao **Primeiro Nome** do Vendedor, cálculo dinâmico de comissionamento e bloqueio de preços para combinações padrão.
- *Recurso Adicional:* Exportação para planilhas **Excel (.xlsx)** e importação em lote inteligente para migração de históricos.

### 2. Resultado (Visão Global)
Acompanhamento macro da loja. Uma tabela gerencial que cruza todas as vendas por data e classifica em categorias complexas (Gross Dia, Migrações, Portabilidades). Permite o espelho instantâneo e a exportação do DRE em formato Excel.

### 3. Colaboradores (Dashboards Individuais)
Mostra relatórios automáticos (Meta vs Realizado) da produção diária e mensal de cada vendedor em tempo real. Esta aba retém a visualização do **Nome Completo** para fins gerenciais.

### 4. Metas
Módulo exclusivo da gerência para distribuir os alvos financeiros e quantitativos de Ativações Pós, Aparelhos, Controle e UR-Residencial, gerando o espelho que alimenta todo o painel.

### 5. Escala de Trabalho
Gerenciamento duplo (Semanal Fixo x Calendário Dinâmico) de horários, exibindo todos os usuários do sistema apenas pelo **Primeiro Nome** para visualização otimizada.
- *Diferenciais:* Cores de alerta para marcações de exceção como FALTA, ATESTADO, FÉRIAS, FERIADO e FOLGA. Dispõe de atalhos rápidos na edição como "Apagar Horário" ou "Voltar ao Padrão".

### 6. Controle Simcard (Estoque)
Gestão rigorosa de liberação de chips físicos e E-SIM, com amarração de autorização, dados de cliente, e regras rígidas contra exclusões não autorizadas (Modal de Cofre Master).
- *Diferenciais:* Inclusão "Em Lote" simultânea para simplificar o recebimento de inventários.

### 7. UR-Residencial, Reprovados & Propostas
- **Residencial:** Lança vendas automaticamente a partir da aba principal, separando a logística de agendamento e status de instalação (Pendentes, Conectados, Cancelados).
- **Reprovados:** Lida com vendas perdidas (viabilidade de CEP ou crédito) utilizando uma API Externa (`ViaCEP`) para preenchimento inteligente e automático de endereços no Estado de São Paulo.
- **Propostas:** Simulador de ofertas com cálculo de abatimento em combos (Single, Multi, Multi 3P). Integrado nativamente com botão de geração de orçamentos em formato **Imagem (PNG)** e atalho Flutuante de disparo pro **WhatsApp**.

---

## 🛡️ Usabilidade e Concorrência (Multi-usuários)
O sistema foi arquitetado para suportar múltiplos computadores operando simultaneamente no salão de vendas, garantindo uma experiência fluida e sem conflitos:
- **Isolamento Visual (Local State):** A navegação entre abas, preenchimento de formulários e abertura de modais ocorrem na memória local. A tela de um usuário nunca sofre interferência ou troca inesperada pelas ações de outro.
- **Sincronização Real-Time:** Apenas os dados confirmados (salvar, editar, excluir) são transmitidos via rede, atualizando as tabelas e o estoque da loja inteira em milissegundos sem a necessidade de recarregar a página (F5).
- **Timeout Inteligente:** A regra de expiração de sessão por inatividade (30 minutos) monitora o mouse e o teclado de *cada* máquina de forma completamente isolada.
- **Anti-Conflito:** Janelas flutuantes e modais de edição em uso são protegidos contra fechamentos abruptos caso os dados de fundo sejam alterados por terceiros.
- **Modo Noturno (Dark Mode):** Alternância instantânea de tema claro/escuro via ícones Sun/Moon, armazenada na máquina local (`localStorage`), focada na acessibilidade visual de quem passa horas operando o painel.

---

## ⚙️ Regras de Negócio Oficiais
Todas as regras, lógicas de bloqueio, cálculos de receita e travas sistêmicas estão minuciosamente documentadas no arquivo interno: `RegrasdeNegocio.md`. **Leitura obrigatória** antes de implementar novas Features.

---

## 💻 Como Rodar o Sistema Localmente

Este projeto exige Node.js instalado no seu ambiente de desenvolvimento.

1. Clone o repositório ou navegue até a pasta raiz `c:\PAINEL CLARO\painel-claro`.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
4. O painel estará disponível e atualizará automaticamente na porta indicada (geralmente `http://localhost:5173/`).

### Construir para Produção (Build)
Para gerar os artefatos otimizados, execute:
```bash
npm run build
```
Os arquivos consolidados ficarão dentro da pasta `/dist/`, prontos para serem hospedados (ex: Vercel, Netlify, AWS S3).

---

## 🗄️ Estrutura de Armazenamento
O sistema utiliza o **Firebase Firestore** na nuvem com uma arquitetura robusta de Múltiplas Coleções (garantindo escalabilidade infinita e fugindo do limite de 1MB por arquivo). As alterações são propagadas em Real-Time usando listeners (`onSnapshot`) e gravadas de forma otimizada via **Smart Diff** e **Batch Writes**, sendo sincronizadas instantaneamente em todas as telas da loja para que nenhum colaborador trabalhe com informações desatualizadas.
