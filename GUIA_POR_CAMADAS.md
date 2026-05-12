# GUIA DE USO DO PAINEL CLARO (POR CAMADAS)

Este documento detalha o fluxo de uso da plataforma, dividido em camadas operacionais. Ele serve como manual de integração para novos consultores e como guia de administração para líderes.

---

## PARTE 1: GUIA DO CONSULTOR (VISÃO DO VENDEDOR)

### Camada 1: Autenticação e Acesso
- **Login Seguro:** O acesso é feito obrigatoriamente com a sua Matrícula (iniciada em 9 ou F) e sua senha pessoal.
- **Sessão Inteligente:** A plataforma mantém você logado enquanto trabalha, mas por segurança, sua sessão expira automaticamente se você ficar inativo por 30 minutos ou se trocar de navegador.
- **Modo Noturno:** Para quem atua horas no salão de vendas, clique no atalho de Sol/Lua para ativar a versão Escura do sistema. O tema realiza uma transição suave para não agredir os olhos e melhora a legibilidade de todas as tabelas.

### Camada 2: Lançamento e Caixa (Vendas)
- **Registro Rápido:** Você registra as vendas de todos os produtos: Aparelhos, Acessórios, Móvel e Fibra.
- **Automação Financeira:** Ao colocar o valor bruto da venda, o sistema calcula sua comissão instantaneamente (15% para Acessórios/Películas e 5% para Aparelhos, subindo para 6% se você vincular um Seguro).
- **Travas Anti-Erro:** Preços de combos tabelados são preenchidos e bloqueados automaticamente. Para facilitar o preenchimento, ao vender um "Aparelho" ou "Fibra", as caixas de "M-Play" e "Portabilidade" desaparecem, pulando direto para a Receita!
- **Seus Registros:** Você é dono das suas vendas. Seu nome é preenchido automaticamente (apenas o primeiro nome) e você pode consultar seus registros a qualquer momento pelo calendário.

### Camada 3: Atendimento e Negociação (Propostas)
- **Simulador de Combos:** Você pode montar orçamentos (SINGLE, MULTI e MULTI 3P) em tempo real enquanto atende o cliente.
- **Gatilhos de Venda:** Quando você monta um Combo Multi, o sistema cruza os descontos e emite um alerta na tela: *"Economia de R$ X ao ano!"*, ajudando a convencer o cliente.
- **Compartilhamento Turbo:** Use o botão flutuante para mandar a proposta escrita direto no **WhatsApp** do cliente, ou clique em "Baixar como Imagem" para ter o encarte bonitinho salvo no seu PC para envio.

### Camada 4: Acompanhamento Pessoal (Colaboradores e Escala)
- **Placar em Tempo Real:** Na aba "Colaboradores", você clica na sua própria foto para abrir seu Dashboard e ver exatamente quanto você já vendeu versus a sua meta individual do mês.
- **Sua Escala:** Você tem permissão de leitura na Escala de Trabalho, podendo verificar seus horários, folgas programadas da semana ou exceções cadastradas pelo seu gerente.

### Camada 5: Rotina e Processos (Reprovados)
- **Gestão de Inviabilidades:** Caso uma venda residencial caia por falta de crédito ou cabeamento, você a registra na aba de Reprovados.
- **Busca Mágica (ViaCEP):** Basta digitar o CEP do cliente (no estado de SP) que o sistema puxa o endereço na hora, poupando o seu tempo.

---

## PARTE 2: GUIA DA GESTÃO (GERENTES E SÊNIOR)

As camadas a seguir possuem privilégios escalados. O perfil Sênior tem forte viés logístico, enquanto o Gestor Geral possui acesso irrestrito de auditoria, exclusão e metas.

### Camada 1: Controle Estratégico (Metas e Resultado)
- **Distribuição Inteligente (Metas):** O Gestor informa apenas o "Bolo Total" (A meta global da loja no mês). O sistema divide esse valor matematicamente pela quantidade de consultores ativos.
- **Run Rate e DRE (Resultado):** O coração da operação. Visualize no formato nativo da aplicação ou utilize o botão verde "Exportar Excel" tanto nas abas de Venda ou Resultados para enviar as planilhas prontas para a Regional.
- **Traffic Target:** O cálculo da meta diária da loja é inteligente: Sábados e Domingos recebem "Peso 2", puxando mais meta para os dias de maior fluxo no shopping.

### Camada 2: Gestão de Pessoas (Colaboradores e Escalas)
- **Visão 360 (Colaboradores):** Diferente dos vendedores (que só veem a si mesmos), a Gestão visualiza a régua completa, com nomes completos e batimento de meta de 100% da equipe em tempo real.
- **Controle de Ponto (Escala):** Controle flexível das horas. Acesse um dia no calendário do mês para apontar faltas, férias, atestados ou utilizar os botões velozes: "Apagar Horário" para limpar a caixinha completamente, ou "Voltar ao Padrão" para cancelar um atestado já salvo e reativar a jornada fixa da semana.

### Camada 3: Auditoria de Vendas e Logística
- **Poder de Edição (Vendas):** Apenas Gestores e cargos equivalentes (Seniores, Assistentes, Admin) podem editar, estornar ou excluir vendas de terceiros no sistema, garantindo a lisura do processo.
- **UR-Residencial:** Instalações sobem para cá automaticamente. Utilize o filtro por "Vendedor" para visualizar rapidamente apenas a produção de um consultor. Na edição, CPFs e Datas já respeitam o modelo brasileiro de formatação.
- **Estoque (Controle de Simcards):** Gestores têm passe livre para dar entrada em "Lote" de chips físicos ou e-SIMs, travando o precificador unitário. Vendedores são bloqueados de apagar/editar linhas do estoque sem autorização (Modal de permissão).

### Camada 4: Cofre Administrativo e Segurança
*(Exclusivo do Perfil GESTOR)*
- **Cofre de Acessos Invisível:** A aba do Cofre exige uma Master Key para ser aberta. Na listagem de equipe, cada colaborador possui uma "Tag Colorida" identificando perfeitamente o seu nível de acesso.
- **Visibilidade Plena:** O Cofre revela as senhas de todos os usuários em texto puro (Plain-Text) e permite a elevação de cargo (promover vendedor a gerente).
- **Exclusão Segura:** Ao excluir um colaborador demitido, o sistema executa uma limpeza profunda, varrendo a Escala de Trabalho e o painel de Reprovados e apagando o nome do ex-funcionário em todos os formatos. Suas "Vendas Feitas" antigas, no entanto, são salvas para o histórico contábil da loja não corromper.