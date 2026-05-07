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
- **Persistência de Dados (MVP):** LocalStorage API (Armazenamento Client-side em tempo real)

---

## 📌 Módulos do Sistema

A plataforma é dividida em módulos estratégicos baseados no Controle de Acesso Baseado em Função (RBAC - Gestor, Encarregado e Vendedor).

### 1. Vendas
O coração da operação. Permite o lançamento de vendas de aparelhos, acessórios, planos móveis e banda larga.
- *Diferenciais:* Travas de regras de negócios, cálculo dinâmico de comissionamento de acessórios e bloqueio de preços para combinações padrão, além de busca inteligente de histórico e filtro de dias.

### 2. Resultado (Visão Global)
Acompanhamento macro da loja. Uma tabela em estilo Excel que cruza todas as vendas por data e classifica em categorias complexas como Gross Dia, Migrações, Portabilidades e Total Residencial. Calcula e distribui automaticamente a meta diária (peso em dobro nos finais de semana).

### 3. Colaboradores (Dashboards Individuais)
Mostra relatórios automáticos (Meta vs Realizado) da produção diária e mensal de cada vendedor em tempo real, baseando-se nos apontamentos e cruzando-os com as metas distribuídas para a equipe.

### 4. Metas
Módulo exclusivo da gerência para distribuir os alvos financeiros e quantitativos de Ativações Pós, Aparelhos, Controle e UR-Residencial, gerando o espelho que alimenta todo o painel.

### 5. Escala de Trabalho
Gerenciamento duplo (Semanal Fixo x Calendário Dinâmico) para visualização de horas de entrada, saídas, folgas e plantões da equipe, com bloqueios de edição para não-gestores.

### 6. Controle Simcard (Estoque)
Gestão rigorosa de liberação de chips físicos e E-SIM, com amarração de autorização, dados de cliente, e regras rígidas contra exclusões não autorizadas (Modal de Cofre Master).

### 7. UR-Residencial & Reprovados
- **Residencial:** Lança vendas automaticamente a partir da aba principal, separando a logística de agendamento e status de instalação (Pendentes, Conectados, Cancelados).
- **Reprovados:** Lida com vendas perdidas (viabilidade de CEP ou crédito) utilizando uma API Externa (`ViaCEP`) para preenchimento inteligente e automático de endereços no Estado de São Paulo.

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
Nesta versão MVP (Minimum Viable Product), não dependemos de um banco de dados hospedado em nuvem (Backend). Todos os estados são consolidados na memória do navegador do próprio usuário via **`localStorage`**. Fechar abas, desligar o computador ou atualizar a página **não resulta em perda de dados**.
