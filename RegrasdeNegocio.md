DOCUMENTO DE REGRAS DE NEGÓCIO - PAINEL DE GESTÃO CLARO

1. SISTEMA DE AUTENTICAÇÃO E HIERARQUIA (RBAC)

REGRA 1: O acesso ao sistema é protegido por uma tela de autenticação obrigatória. Nenhum módulo pode ser acessado sem que o usuário forneça uma credencial válida (matrícula e senha).
REGRA 1.1: Novos usuários que não possuem acesso podem se registrar diretamente na tela de login, sendo-lhes atribuído automaticamente o nível de acesso "VENDEDOR".
REGRA 1.2: A sessão de usuário possui uma trava de segurança e expira em exatos 30 minutos após o login. Decorrido esse tempo, o usuário é desconectado automaticamente.
REGRA 2: O sistema possui três perfis de hierarquia de acesso: GESTOR GERAL, ENCARREGADO LÍDER e VENDEDOR.
REGRA 3: O GESTOR GERAL possui acesso irrestrito a todos os módulos, podendo editar, excluir e sobrepor qualquer dado do sistema.
REGRA 4: O ENCARREGADO possui nível de supervisão, com acesso livre ao controle de estoque de chips e visualização da equipe, mas sem permissão para alterar Metas ou a Escala de Trabalho.
REGRA 5: O VENDEDOR possui o menor nível de acesso. Não pode excluir vendas, não edita estoque, não visualiza a aba de Metas Globais e, na aba de equipe, é bloqueado de visualizar os resultados numéricos de outros vendedores.
REGRA 6: A área "Cofre de Acessos" exige uma credencial de desenvolvedor (senha: DEV2026) para ser desbloqueada. Uma vez acessada, permite gerenciar todas as credenciais do sistema, incluindo visualizar senhas, apagar usuários registrados e criar contas de Liderança (GESTOR e ENCARREGADO).

2. MÓDULO DE VENDAS

REGRA 7: Não é permitido registrar ou enviar vendas utilizando uma data futura. O limite máximo do calendário é o dia corrente.
REGRA 8: Ao abrir o modal de "Nova Venda" com um usuário VENDEDOR logado, o campo "Vendedor" deve ser preenchido automaticamente com seu nome e travado para edição.
REGRA 9: Se a venda envolver produtos comissionados específicos (Aparelhos, Acessórios ou Películas), o campo Receita muda sua lógica para ler "Valor Bruto" e a comissão é calculada dinamicamente nos bastidores, ativando uma taxa diferenciada caso exista a proteção do "Seguro".
REGRA 10: A Receita (preço) é preenchida e bloqueada automaticamente se a combinação de Produto + Tipo de Combo + Especificação for encontrada na tabela de preços do sistema. Caso contrário, o campo fica livre para digitação.
REGRA 11: Vendas de produtos móveis (Pós e Controle) exigem obrigatoriamente que o usuário informe o "Tipo de Operação" (Ativação ou Migração).
REGRA 12: A edição de uma venda já lançada (botão Lápis) ou a exclusão (botão Lixeira) só é permitida ao GESTOR, ao ENCARREGADO ou ao VENDEDOR que foi o autor exato daquela venda. Se for outro vendedor, as ações ficam bloqueadas (Cadeado).
REGRA 13: A tabela de visualização de vendas diárias sempre carrega por padrão as vendas correspondentes ao dia atual. Para consultar o histórico ou localizar registros específicos, o usuário deve utilizar o calendário combinado com a barra de pesquisa inteligente (que filtra em tempo real por Vendedor ou Produto).

3. MÓDULO UR-RESIDENCIAL (ACOMPANHAMENTO)

REGRA 14: O painel UR-Residencial é alimentado de forma passiva e automática. Toda venda cadastrada no módulo de "Vendas" que pertença à família de produtos residenciais (e possua contrato) é espelhada aqui. O formato de visualização segue estilo planilha (Excel), semelhante ao Controle de Simcards.
REGRA 15: O campo "Data de Instalação" é o único calendário em todo o sistema liberado para selecionar datas futuras.
REGRA 16: O campo "Status" possui 3 opções exclusivas e coloridas: PEND.DE INSTALAÇÃO (Amarelo), CONECTADO (Verde) ou CANCELADO (Vermelho). O campo "Agendamento" restringe-se a faixas (08:00 A 12:00, 12:00 A 15:00, 15:00 A 18:00). O campo "Ação" restringe-se a (REAGENDADO, RETENÇÃO EM FALTA, DESISTIU).
REGRA 17: O GESTOR GERAL é o único perfil autorizado a apagar um registro de venda ou a modificar os dados do "Contrato" e do "CPF/CNPJ" do cliente por esta tela. Perfis menores encontram esses campos bloqueados (Cursor Not Allowed) e não visualizam o botão de apagar.
REGRA 18: Os campos de "Produto" e "Vendedor" no acompanhamento residencial são travados com opções de escolha restritas espelhadas do sistema base.
REGRA 19: A aba carrega dinamicamente as vendas do dia 1 a 30/31 do mês vigente. Após a virada do mês, o sistema salva as informações que podem ser consultadas a qualquer momento através do botão/filtro de meses salvo na página.

4. MÓDULO CONTROLE DE SIMCARDS E ESTOQUE

REGRA 20: Apenas contas de GESTOR ou ENCARREGADO podem excluir uma linha inteira da planilha de chips ou editar os campos de número de série (Físico ou E-SIM). Se um vendedor tentar clicar nessas áreas, um modal será aberto exigindo que um superior autorize a edição.
REGRA 21: Na inclusão de Lote, os ICCIDs de chip Físico e E-SIM inseridos simultaneamente ocupam a mesma linha de cadastro se suas quebras de linha forem correspondentes.
REGRA 22: Todo novo lote de chip criado carrega a regra automática de precificação unitária base padronizada e travada (valor fixo inserido por padrão no banco).
REGRA 23: O campo de "Plano" exibe em cascata exatamente as mesmas opções cadastradas ativamente nas tabelas da loja (Móveis, Dependentes, Flex, etc).
REGRA 24: O campo de "Pagamento" é bloqueado para receber apenas os canais aceitos no caixa (Cartões, Pix, Dinheiro, Lpay, Link).

5. MÓDULO DE METAS GLOBAIS E COLABORADORES

REGRA 25: O preenchimento da matriz de metas globais da loja é de acesso exclusivo do GESTOR.
REGRA 26: A construção do painel do mês atual inicia com as metas padrão do sistema (METAS_PADRAO) preenchidas automaticamente, exigindo apenas ajustes manuais finos por parte do gestor.
REGRA 27: O Dashboard individual da equipe (aba Colaboradores) gera relatórios "Meta vs Realizado" em tempo real somando automaticamente as linhas enviadas pela equipe no módulo "Vendas".
REGRA 28: Perfis de Vendedor acessam a aba Colaboradores sob uma barreira de restrição: eles conseguem abrir somente a própria foto para visualizar o próprio placar de vendas.

6. MÓDULO DE ESCALA DE TRABALHO

REGRA 29: A escala tem dois painéis paralelos. O painel superior lida com os horários fixos semanais. O painel inferior espelha um calendário do mês corrido, utilizado para registrar ausências ou exceções à regra semanal.
REGRA 30: Qualquer perfil possui autorização de leitura da escala (Somente Leitura) para checar seus dias de trabalho.
REGRA 31: Somente o perfil de GESTOR detém o privilégio de edição (clique ativo nas células) para sobrepor horários, cadastrar folgas, férias ou atestados médicos de qualquer colaborador.

7. BANCO DE DADOS E ARMAZENAMENTO (ESTRUTURA MVP)

REGRA 32: O sistema utiliza o Firebase Firestore (Google) como Banco de Dados NoSQL em nuvem. Todos os módulos leem e escrevem centralizadamente em um único documento espelhado (loja_uniao_osasco / banco_principal).
REGRA 33: As ações de salvar, editar e excluir disparam a função de autossave para a nuvem. Há um sistema de "Debounce" inteligente que retarda a gravação no banco de dados em 1,2 segundos para evitar sobrecarga de requisições de rede ao digitar rapidamente.
REGRA 34: A plataforma opera com Sincronização em Tempo Real (onSnapshot). Qualquer alteração feita por um vendedor na loja é propagada automaticamente e instantaneamente para a tela do Gestor e dos outros computadores conectados.
REGRA 35: Ao ser carregado, o sistema bloqueia a interface de login até que a resposta da nuvem seja concluída, garantindo que o colaborador nunca trabalhe sobre tabelas em branco ou dados desatualizados.

8. MÓDULO DE REPROVADOS (RESIDENCIAL)

REGRA 36: A aba de "Reprovados" armazena propostas de vendas de serviços residenciais que não puderam ser concluídas por motivos técnicos ou de crédito.
REGRA 37: O campo "Motivos" é rigidamente restrito às opções: CRÉDITO REPROVADO, REPROVADO, CABEAMENTO ou SOMENTE HFC.
REGRA 38: O formulário conta com preenchimento inteligente de CEP via integração (API ViaCEP), que preenche automaticamente o Logradouro, focado preferencialmente no estado de São Paulo.
REGRA 39: A criação e edição de um registro respeita a hierarquia do usuário logado (O Vendedor tem seu nome travado na inclusão e não pode excluir ou alterar registros de outros usuários).

9. MÓDULO RESULTADO (VISÃO GERAL)

REGRA 40: O módulo "Resultado" é de acesso público (Somente Leitura) para todos os perfis, servindo como um extrato diário no formato "Mês a Mês" de todas as vendas da loja.
REGRA 41: A tabela estilo Excel agrupa automaticamente as vendas diárias com cálculos aprofundados: 
  - POS TT: Somente Ativações de "Pós" e "Pós Multi" (exclui Migrações).
  - MIGRAÇÃO-PÓS: Vendas de "Pós" e "Pós Multi" classificadas como Migração.
  - MIGRAÇÃO-CONTROLE: Vendas de "Controle" e "Flex" com subtipo Migração.
  - DEP PG / DEP GRÁTIS: Contagem separada de dependentes pagos e gratuitos.
  - PORTAB. POS/CTRL: Total de vendas móveis (Pós/Controle) com Portabilidade = SIM.
  - REC. ACESSÓRIOS / REC. APARELHOS: Consolida a receita exata proveniente dessas categorias (com ou sem seguro).
  - BL: Soma todas as vendas correspondentes a BL ou BANDA LARGA.
  - GROSS DIA: Calcula todos os serviços móveis do dia (Pós, Controle, Dependentes, Flex, Banda Larga e PME), sem misturar com Residencial ou Aparelhos.
REGRA 42: No rodapé do módulo, duas linhas fixas ("TOTAL" e "META LOJA") consolidam os resultados totais do mês corrente, estabelecendo um espelho comparativo em tempo real para acompanhamento gerencial.

10. MÓDULO DE PROPOSTAS (SIMULADOR)

REGRA 43: A aba de propostas atua como uma "Calculadora de Combos" para o Vendedor realizar orçamentos rápidos para os clientes.
REGRA 44: O cálculo identifica automaticamente os cenários de desconto cruzando as opções escolhidas. Exemplo: Ao marcar Móvel + Fibra, o sistema troca as bases de cálculo isoladas (SINGLE) para a matriz de descontos promocionais (MULTI), reduzindo o valor na ponta instantaneamente.