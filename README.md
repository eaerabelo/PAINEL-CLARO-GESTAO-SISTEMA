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
- *Diferenciais:* Auto-preenchimento restrito ao **Primeiro Nome** do Vendedor, cálculo dinâmico de comissionamento e bloqueio de preços para combinações padrão. Nova funcionalidade de **Venda Múltipla (Combo)** agindo como um carrinho inteligente para registrar vários serviços ao mesmo tempo, além de desmembrar automaticamente o Seguro de Aparelhos.
- *Recurso Adicional:* Ocultação inteligente de campos irrelevantes baseado no produto. Exportação/importação inteligente de planilhas Excel (Restrito à Gerência).

### 2. Resultado (Visão Global)
Acompanhamento macro da loja. Uma tabela gerencial que cruza todas as vendas por data e classifica em categorias complexas (Gross Dia, Migrações, Portabilidades). Permite o espelho instantâneo e a exportação do DRE em formato Excel. Conta com agrupamentos unificados para Pós-Pago Total e exibe volumes de aparelhos/acessórios fiéis ao estoque físico.

### 3. Colaboradores (Dashboards Individuais)
Mostra relatórios automáticos (Meta vs Realizado) da produção diária e mensal de cada vendedor em tempo real. Esta aba retém a visualização do **Nome Completo** para fins gerenciais.
- *Diferenciais:* Sistema nativo de Gamificação (**Hall da Fama**) que avalia e premia visivelmente o Top 1 em Receita e o Destaque em vendas Pós-Pago para engajamento da equipe, incluindo visão panorâmica de UR Total.

### 4. Metas
Módulo exclusivo da gerência para distribuir os alvos financeiros e quantitativos de Ativações Pós, Aparelhos, Controle e UR-Residencial, gerando o espelho que alimenta todo o painel.

### 5. Escala de Trabalho
Gerenciamento duplo (Semanal Fixo x Calendário Dinâmico) de horários, exibindo todos os usuários do sistema apenas pelo **Primeiro Nome** para visualização otimizada.
- *Diferenciais:* Cores de alerta para marcações de exceção como FALTA, ATESTADO, FÉRIAS, FERIADO e FOLGA. Dispõe de atalhos rápidos na edição como "Apagar Horário" ou "Voltar ao Padrão".

### 6. Controle Simcard (Estoque)
Gestão rigorosa de liberação de chips físicos e E-SIM, com amarração de autorização, dados de cliente, e regras rígidas contra exclusões não autorizadas (Modal de Cofre Master).
- *Diferenciais:* Inclusão "Em Lote" simultânea para simplificar o recebimento de inventários. Foco automático na aba do Vendedor quando ele acessa a tela, removendo atritos.

### 6. Fator RV (Remuneração Variável)
Painel de projeção financeira (IW) do vendedor. Calcula a elegibilidade tríplice (80% em Receita, Gross e Residencial) e as comissões por faixas.
- *Diferenciais:* Motor avançado (`rules.js`) que processa matematicamente regras como: Fatores Claro Multi (1.2x a 1.8x), Portabilidade (+30%), Upgrades, Bônus Acima da Meta (Etapa 3) e Isenções do PME de forma autônoma. Traz Dicas de Foco baseadas nos indicadores faltantes para bater a meta.

### 7. UR-Residencial, Reprovados & Propostas
- **Residencial:** Acompanhamento logístico refinado com filtro exclusivo por Vendedores, formatação nativa de datas (BR) e máscara de edição para documentos (CPF/CNPJ).
- **Reprovados:** Lida com vendas perdidas (viabilidade de CEP ou crédito) utilizando uma API Externa (`ViaCEP`) para preenchimento inteligente e automático de endereços no Estado de São Paulo.
- **Propostas:** Simulador de ofertas com cálculo de abatimento em combos (Single, Multi, Multi 3P). Integrado nativamente com botão de geração de orçamentos em formato **Imagem (PNG)** e atalho Flutuante de disparo pro **WhatsApp**.

### 8. Scripts (Textos Padrões)
Módulo de produtividade contendo textos padronizados e pré-montados para facilitar o registro de observações e solicitações em sistemas da Claro.
- *Diferenciais:* Assinatura dinâmica que preenche automaticamente o nome e cargo do usuário logado (ex: "MATHEUS RABELO / GERENTE"), botão de cópia rápida (1-click) para a área de transferência.

---

## 🛡️ Usabilidade e Concorrência (Multi-usuários)
O sistema foi arquitetado para suportar múltiplos computadores operando simultaneamente no salão de vendas, garantindo uma experiência fluida e sem conflitos:
- **Isolamento Visual (Local State):** A navegação entre abas, preenchimento de formulários e abertura de modais ocorrem na memória local. A tela de um usuário nunca sofre interferência ou troca inesperada pelas ações de outro.
- **Notificações Globais:** Um "Sininho" de lembretes no topo da interface alerta os vendedores caso o Gestor altere as metas do mês atual, e notifica o gestor sobre os prazos fixos para envio da Parcial.
- **Tolerância a Falhas (WSoD Proof):** Programação defensiva avançada com `Error Boundary` e checagens rígidas de tipo (Type-Safety), garantindo que bancos de dados mal preenchidos ou "sujos" não consigam derrubar o React.
- **Sincronização Real-Time:** Apenas os dados confirmados (salvar, editar, excluir) são transmitidos via rede, atualizando as tabelas e o estoque da loja inteira em milissegundos sem a necessidade de recarregar a página (F5).
- **Timeout Inteligente:** A regra de expiração de sessão por inatividade (30 minutos) monitora o mouse e o teclado de *cada* máquina de forma completamente isolada.
- **Anti-Conflito:** Janelas flutuantes e modais de edição em uso são protegidos contra fechamentos abruptos caso os dados de fundo sejam alterados por terceiros.
- **Modo Noturno (Dark Mode):** Alternância com transição suave (500ms) de tema claro/escuro via ícones Sun/Moon, armazenada na máquina local, com contraste rigoroso de tabelas e leitura limpa das listagens.
- **Acesso Rápido Wi-Fi:** Modal centralizado exibindo o QR Code da rede Wi-Fi da loja, disponível a qualquer momento no cabeçalho do painel para facilitar a conexão dos clientes na loja.

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

### 📝 Documentação Estrutura de Dados do Sistema
