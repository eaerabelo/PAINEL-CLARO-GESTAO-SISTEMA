# Documentação Técnica - Painel Gestão Claro

Bem-vindo à documentação oficial para desenvolvedores do **Painel de Gestão Claro**. Este documento serve como guia arquitetural para engenheiros de software que assumirão a manutenção, escalabilidade e implementação de novas features neste sistema.

---

## 1. Arquitetura Base (Tech Stack)
*   **Core:** React.js (via Vite)
*   **Estilização:** Tailwind CSS (Utility-First)
*   **Ícones:** `lucide-react`
*   **Notificações Visuais:** `react-hot-toast`
*   **Geração de Relatórios:** `xlsx` (Excel) e funções nativas de impressão do browser (PDF).
*   **Banco de Dados:** Firebase Firestore (NoSQL, Client-Side).

---

## 2. Estrutura do Banco de Dados (Firestore)
Nesta fase de MVP (Minimum Viable Product), a aplicação utiliza uma arquitetura de **"Documento Único Sincronizado" (Single Document Sync)**.

*   **Collection:** `painel_claro`
*   **Document:** `loja_uniao_osasco`

**Fluxo de Sincronização (`App.jsx`):**
1.  O sistema estabelece um listener ativo (`onSnapshot`) que observa esse documento. Se outro cliente na rede alterar uma venda, o listener atualiza o React State instantaneamente.
2.  Para evitar excesso de gravações (Writes) e estourar a cota gratuita do Firebase, há um **Debounce de 1.200ms** na função `setDoc`. Apenas quando a árvore de estados da aplicação fica inativa por 1.2s, a plataforma empacota os dados e faz o merge na nuvem.

### ⚠️ Tech Debt (Atenção para o Futuro)
O Firestore possui um limite hard de **1 MiB por documento**. Como todas as entidades (`salesData`, `usersDB`, `simcardsData`, etc.) estão aninhadas no mesmo documento, a aplicação funcionará perfeitamente por meses. No entanto, à medida que a base de dados de vendas crescer exponencialmente, a leitura inicial do app ficará lenta. 
**Próximo Passo de Escalabilidade:** O futuro dev deve refatorar o banco, transformando `salesData`, `usersDB`, etc., em **Subcoleções** separadas, requisitando apenas os dados paginados/necessários da data atual.

---

## 3. Autenticação e RBAC (Role-Based Access Control)
O sistema não utiliza o Firebase Authentication por padrão para dar flexibilidade de auto-registro ("Código de Vendedor"). Os usuários vivem dentro da key `usersDB` no Firestore.

**Níveis de Acesso:**
*   `GESTOR`: Acesso irrestrito (CRUD total em todos os módulos).
*   `ENCARREGADO`: Leitura/Edição restrita a estoque (Simcards) e visualização global de colaboradores.
*   `VENDEDOR`: Leitura/Escrita limitada aos próprios registros. Vendedores não podem excluir os próprios lançamentos de vendas, necessitando estornar a operação fisicamente com a gestão.

**Cofre de Acessos (`Acessos.jsx`):**
Há uma "Master Key" (hardcoded no estado inicial) com valor padrão `DEV2026` para destravar a visualização das senhas em plain-text e permitir a elevação de cargo de vendedores para Gestores, caso a hierarquia da loja mude.

---

## 4. Componentes e Lógicas Específicas

### `Venda.jsx` (Lançamento)
*   Trata as comissões através da função `calcularComissaoDinamica()`.
*   Acessórios e películas possuem `15%`, enquanto Aparelhos possuem `5%` ou `6%` (caso tenha o adicional "Seguro" anexado no array `adicionais`).
*   Bloqueia a edição do campo "Receita" caso a matriz de produtos (`PRICING_MOVEL` no `constants.js`) possua um valor tabelado.

### `Resultado.jsx` (DRE/Run Rate)
*   O coração financeiro do sistema. Utiliza `useMemo` pesados para varrer a array completa de vendas e alocá-las nos devidos "baldes" (Migração, Pós Total, Dependentes) via varredura por `includes()` e RegExp de texto no Produto/TipoOperação.
*   A "Meta Diária" calcula de forma dinâmica os dias úteis. Finais de semana (Sábados e Domingos) recebem o dobro de "peso" (weight = 2) na distribuição fracionada da meta gerencial para acompanhar o fluxo de shopping.

### `Proposta.jsx` (Simulador)
*   Utiliza o objeto do estado global para cruzar os produtos. 
*   Regra vital: Se houver Móvel + Fibra/TV, o `comboType` transita de `SINGLE` para `MULTI`, ativando gatilhos comerciais na tela e renderizando um ticket otimizado via CSS puro (`@media print`).

### `EscalaTrabalho.jsx` (Gestão de RH)
*   Mantém 2 arrays de estados. `scheduleData` é o espelho padrão da semana fixa. `monthlyOverrides` são as chaves de exceção. Se o colaborador tirou atestado numa Terça-feira específica, o override sobrepõe o `scheduleData` sem destruir a regra matriz da pessoa.

### `Reprovados.jsx` (Integração)
*   Contém a única requisição HTTP (Fetch API) externa do projeto. Consome a API pública `ViaCEP` para validação e preenchimento de inviabilidades de endereço, focando na UF SP.

---

## 5. Deploy e Setup de Ambiente

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

*Mantenha a integridade deste código viva. Evite pacotes npm desnecessários e priorize o carregamento rápido.*