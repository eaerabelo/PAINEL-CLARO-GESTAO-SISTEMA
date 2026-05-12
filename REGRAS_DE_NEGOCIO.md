# DOCUMENTO DE REGRAS DE NEGÓCIO - PAINEL DE GESTÃO CLARO

## 1. SISTEMA DE AUTENTICAÇÃO E HIERARQUIA (RBAC)

- **REGRA 1:** O acesso ao sistema é protegido por uma tela de autenticação obrigatória. Nenhum módulo pode ser acessado sem que o usuário forneça uma credencial válida (matrícula e senha).
- **REGRA 1.1:** Novos usuários que não possuem acesso podem se registrar diretamente na tela de login, sendo-lhes atribuído automaticamente o nível de acesso "VENDEDOR".
- **REGRA 1.2:** A sessão de usuário sobrevive a recarregamentos de página (F5) mantendo a permanência na tela principal (Vendas). Ela expira em exatos 30 minutos ou se houver troca de navegador, obrigando novo login.
- **REGRA 1.3:** Para um registro bem-sucedido, a matrícula informada pelo colaborador DEVE obrigatoriamente iniciar com o número "9" ou com a letra "F".
- **REGRA 1.4:** O cadastro de novos usuários exige que o e-mail informado pertença obrigatoriamente à companhia, terminando com o domínio "@claro.com.br".
- **REGRA 2:** O sistema possui perfis de hierarquia de acesso: GESTOR, SENIOR (e equivalentes: ASSISTENTE RELACIONAMENTO, ADMINISTRAÇÃO, JOVEM APRENDIZ, GEEK) e VENDEDOR.
- **REGRA 2.1:** Nas telas operacionais (Venda, Controle Simcard, Reprovados, UR-Residencial), as listas de colaboradores exibem apenas o PRIMEIRO NOME do usuário e ocultam ativamente os usuários com cargos de GESTOR e SÊNIOR (exibindo apenas os Vendedores).
- **REGRA 3:** O GESTOR GERAL possui acesso irrestrito a todos os módulos, podendo editar, excluir e sobrepor qualquer dado do sistema.
- **REGRA 4:** Os perfis SÊNIOR e equivalentes possuem nível de supervisão e backoffice, com acesso livre ao controle de estoque, edição de escalas, definição de metas e exclusão de vendas de terceiros, não tendo acesso apenas ao Cofre de Acessos.
- **REGRA 5:** O VENDEDOR possui o menor nível de acesso. Não pode excluir vendas, não edita estoque, não visualiza a aba de Metas Globais e, na aba de equipe, é bloqueado de visualizar os resultados numéricos de outros vendedores.
- **REGRA 6:** A área "Cofre de Acessos" é oculta ativamente da barra lateral para perfis de Vendedor e Sênior. Somente o usuário GESTOR consegue visualizar a seção e, ainda assim, o sistema exige obrigatoriamente a credencial de desenvolvedor para desbloquear a tela.
- **REGRA 6.1:** Ao apagar um usuário registrado através do Cofre de Acessos (ação permitida apenas ao GESTOR), o sistema deve remover integralmente seu nome das listagens e limpar seus registros nas seções de Escala de Trabalho e Reprovados (buscando tanto pelo Nome Completo quanto pelo Primeiro Nome). O sistema DEVE manter exclusivamente o histórico de vendas atrelado a ele, para não corromper os registros contábeis da operação. A data de nascimento dos usuários também pode ser gerida por este módulo.
- **REGRA 6.2:** O Cofre de Acessos conta com identificação cromática onde cada um dos 7 níveis de acesso (Gerente, Sênior, Assistente, Administração, Jovem Aprendiz, Geek e Vendedor) possui uma "tag" de cor exclusiva para rápido reconhecimento visual da hierarquia.

## 2. MÓDULO DE VENDAS

- **REGRA 7:** Não é permitido registrar ou enviar vendas utilizando uma data futura. O limite máximo do calendário é o dia corrente.
- **REGRA 8:** Ao abrir o modal de "Nova Venda" com um usuário VENDEDOR logado, o campo "Vendedor" deve ser preenchido automaticamente com seu PRIMEIRO NOME e travado para edição.
- **REGRA 9:** Se a venda envolver produtos comissionados, o campo "Receita" muda sua lógica para ler o "Valor Bruto" da venda. A comissão é fracionada dinamicamente: 5% para Aparelhos Celulares (subindo para 6% se o adicional de "Seguro" estiver vinculado) e 15% para Acessórios e Películas. Serviços de Telecom (Pós, Controle, Fibra) computam 100% do valor para o Run Rate.
- **REGRA 10:** A Receita (preço) é preenchida e bloqueada automaticamente se a combinação de Produto + Tipo de Combo + Especificação for encontrada na tabela de preços do sistema. Caso contrário, o campo fica livre para digitação.
- **REGRA 11:** Vendas de produtos móveis (Pós, Controle, etc.) exigem obrigatoriamente que o usuário informe o "Tipo de Operação" (Ativação ou Migração), além dos campos de "M-Play" e "Portabilidade". Para outros produtos (Aparelhos, Acessórios, Fibra), esses campos são ocultos da interface e gravados automaticamente como "NÃO" para facilitar o lançamento.
- **REGRA 12:** A edição de uma venda já lançada (botão Lápis) ou a exclusão (botão Lixeira) só é permitida ao GESTOR, aos perfis de liderança/backoffice (SÊNIOR e equivalentes) ou ao VENDEDOR que foi o autor exato daquela venda. Se for outro vendedor, as ações ficam bloqueadas (Cadeado).
- **REGRA 13:** A tabela de visualização de vendas diárias sempre carrega por padrão as vendas correspondentes ao dia atual. Para consultar o histórico ou localizar registros específicos, o usuário deve utilizar o calendário combinado com a barra de pesquisa inteligente. O usuário também tem a opção de exportar os relatórios filtrados para Excel.
- **REGRA 13.1:** A importação e exportação de vendas em lote através de planilhas Excel são suportadas, porém os botões de ação são **exclusivos do perfil GESTOR** para proteção dos dados da loja. O sistema possui uma inteligência de mapeamento (Smart Mapper) que converte automaticamente formatações antigas e lê datas seriais, vinculando as receitas corretamente.

## 3. MÓDULO UR-RESIDENCIAL (ACOMPANHAMENTO)

- **REGRA 14:** O painel UR-Residencial é alimentado de forma passiva e automática. Toda venda cadastrada no módulo de "Vendas" que pertença à família de produtos residenciais (e possua contrato) é espelhada aqui. O formato de visualização segue estilo planilha (Excel), semelhante ao Controle de Simcards.
- **REGRA 15:** O campo "Data de Instalação" é o único calendário em todo o sistema liberado para selecionar datas futuras.
- **REGRA 16:** O campo "Status" possui 3 opções exclusivas e coloridas: PEND.DE INSTALAÇÃO (Amarelo), CONECTADO (Verde) ou CANCELADO (Vermelho). O campo "Agendamento" restringe-se a faixas (08:00 A 12:00, 12:00 A 15:00, 15:00 A 18:00). O campo "Ação" restringe-se a (REAGENDADO, RETENÇÃO EM FALTA, DESISTIU).
- **REGRA 17:** O GESTOR GERAL é o único perfil autorizado a apagar um registro de venda ou a modificar os dados do "Contrato" e do "CPF/CNPJ" do cliente por esta tela. Perfis menores encontram esses campos bloqueados (Cursor Not Allowed) e não visualizam o botão de apagar.
- **REGRA 18:** Os campos de "Produto" e "Vendedor" são travados com opções restritas. A aba conta com um filtro rápido por "Vendedor", formatação de CPF/CNPJ automática durante a edição e leitura de datas forçada no padrão brasileiro (DD/MM/AAAA).
- **REGRA 19:** A aba carrega dinamicamente as vendas do dia 1 a 30/31 do mês vigente. Após a virada do mês, o sistema salva as informações que podem ser consultadas a qualquer momento através do botão/filtro de meses salvo na página.

## 4. MÓDULO CONTROLE DE SIMCARDS E ESTOQUE

- **REGRA 20:** Apenas contas de GESTOR ou SÊNIOR (e equivalentes) podem excluir uma linha inteira da planilha de chips ou editar os campos de número de série (Físico ou E-SIM). Se um vendedor tentar clicar nessas áreas, um modal será aberto exigindo que um superior autorize a edição.
- **REGRA 21:** Na inclusão de Lote, os ICCIDs de chip Físico e E-SIM inseridos simultaneamente ocupam a mesma linha de cadastro se suas quebras de linha forem correspondentes.
- **REGRA 22:** Todo novo lote de chip criado carrega a regra automática de precificação unitária base padronizada e travada (valor fixo inserido por padrão no banco).
- **REGRA 23:** O campo de "Plano" exibe em cascata exatamente as mesmas opções cadastradas ativamente nas tabelas da loja (Móveis, Dependentes, Flex, etc).
- **REGRA 24:** O campo de "Pagamento" é bloqueado para receber apenas os canais aceitos no caixa (Cartões, Pix, Dinheiro, Lpay, Link).

## 5. MÓDULO DE METAS GLOBAIS E COLABORADORES

- **REGRA 25:** O preenchimento da matriz de metas globais da loja é de acesso exclusivo do GESTOR.
- **REGRA 26:** A construção do painel de metas é feita com base na META TOTAL DA LOJA. O gestor informa o montante global da operação para aquele mês, e o sistema se encarrega de dividir matematicamente pela quantidade de consultores ativos no painel para estipular as metas individuais.
- **REGRA 27:** O Dashboard individual da equipe (aba Colaboradores) gera relatórios "Meta vs Realizado" em tempo real. Esta aba é uma das únicas que exibe o Nome Completo dos usuários para fins de gestão.
- **REGRA 28:** Perfis de Vendedor acessam a aba Colaboradores sob uma barreira de restrição: eles conseguem abrir somente a própria foto para visualizar o próprio placar de vendas.

## 6. MÓDULO DE ESCALA DE TRABALHO

- **REGRA 29:** A escala tem dois painéis paralelos. O painel superior lida com os horários fixos semanais. O painel inferior espelha um calendário do mês corrido, utilizado para registrar ausências ou exceções à regra semanal.
- **REGRA 30:** Qualquer perfil possui autorização de leitura da escala (Somente Leitura) para checar seus dias de trabalho.
- **REGRA 31:** Somente o perfil de GESTOR detém o privilégio de edição (clique ativo nas células) para sobrepor horários, cadastrar folgas, férias ou atestados médicos de qualquer colaborador.
- **REGRA 31.1:** A Escala exibe todos os colaboradores registrados (incluindo Gestores e Seniores), mas formata a listagem utilizando apenas o Primeiro Nome para deixar a interface enxuta.
- **REGRA 31.2:** Ao editar um dia no mês, a Gestão possui dois atalhos rápidos: "Apagar Horário" (salva a célula como vazia) e "Voltar ao Padrão" (remove a exceção e resgata automaticamente a regra fixa semanal atrelada àquele dia da semana).
- **REGRA 31.1:** O calendário de exceções do mês sobrepõe a regra padrão semanal sempre que status como "FALTA", "ATESTADO", "FÉRIAS", "FERIADO" ou "FOLGA" são informados. O sistema pinta essas ocorrências com cores de alerta específicas.

## 7. BANCO DE DADOS E ARMAZENAMENTO

- **REGRA 32:** O sistema utiliza o Firebase Firestore (Google) como Banco de Dados NoSQL em nuvem. A arquitetura é dividida em múltiplas coleções (`vendas_uniao_osasco`, `estoque_uniao_osasco`, `reprovados_uniao_osasco`) para garantir escalabilidade infinita e evitar o limite estrutural de 1 Megabyte.
- **REGRA 33:** As ações de salvar, editar e excluir disparam a função de autossave para a nuvem. Há um sistema de "Smart Diff com Debounce" que aguarda 1,2 segundos de inatividade, compara as mudanças locais com a nuvem, e envia apenas as atualizações exatas em lotes (`writeBatch`) para economizar drasticamente as requisições de rede.
- **REGRA 34:** A plataforma opera com Sincronização em Tempo Real (onSnapshot). Qualquer alteração feita por um vendedor na loja é propagada automaticamente e instantaneamente para a tela do Gestor e dos outros computadores conectados.
- **REGRA 35:** Ao ser carregado, o sistema bloqueia a interface de login até que a resposta da nuvem seja concluída, garantindo que o colaborador nunca trabalhe sobre tabelas em branco ou dados desatualizados.

## 8. MÓDULO DE REPROVADOS (RESIDENCIAL)

- **REGRA 36:** A aba de "Reprovados" armazena propostas de vendas de serviços residenciais que não puderam ser concluídas por motivos técnicos ou de crédito.
- **REGRA 37:** O campo "Motivos" é rigidamente restrito às opções: CRÉDITO REPROVADO, REPROVADO, CABEAMENTO ou SOMENTE HFC.
- **REGRA 38:** O formulário conta com preenchimento inteligente de CEP via integração (API ViaCEP), que preenche automaticamente o Logradouro, focado preferencialmente no estado de São Paulo.
- **REGRA 38.1:** Se o CEP pertencer a outro estado (UF diferente de 'SP'), o sistema alerta através de um pop-up que o endereço "Não pertence ao estado de SP", embora permita a digitação.
- **REGRA 38.2:** O campo "Vendedor" nesta tela lista apenas os Vendedores (ocultando Gestão) identificados pelo Primeiro Nome.
- **REGRA 39:** A criação e edição de um registro respeita a hierarquia do usuário logado (O Vendedor tem seu nome travado na inclusão e não pode excluir ou alterar registros de outros usuários).

## 9. MÓDULO RESULTADO (VISÃO GERAL)

- **REGRA 40:** O módulo "Resultado" é de acesso público (Somente Leitura) para todos os perfis, servindo como um extrato diário no formato "Mês a Mês" de todas as vendas da loja. A distribuição da meta por dia no cálculo do "Run Rate" obedece à regra de "Traffic Target": Peso 1 de Segunda a Sexta e Peso 2 aos Sábados e Domingos.
- **REGRA 41:** A tabela estilo Excel agrupa automaticamente as vendas diárias com cálculos aprofundados: 
  - **POS TT:** Somente Ativações de "Pós" e "Pós Multi" (exclui Migrações).
  - **MIGRAÇÃO-PÓS:** Vendas de "Pós" e "Pós Multi" classificadas como Migração.
  - **MIGRAÇÃO-CONTROLE:** Vendas de "Controle" e "Flex" com subtipo Migração.
  - **DEP PG / DEP GRÁTIS:** Contagem separada de dependentes pagos e gratuitos.
  - **PORTAB. POS/CTRL:** Total de vendas móveis (Pós/Controle) com Portabilidade = SIM.
  - **REC. ACESSÓRIOS / REC. APARELHOS:** Consolida a receita exata proveniente dessas categorias (com ou sem seguro).
  - **BL:** Soma todas as vendas correspondentes a BL ou BANDA LARGA.
  - **GROSS DIA:** Calcula todos os serviços móveis do dia (Pós, Controle, Dependentes, Flex, Banda Larga e PME), sem misturar com Residencial ou Aparelhos.
- **REGRA 42:** No rodapé do módulo, duas linhas fixas ("TOTAL" e "META LOJA") consolidam os resultados totais do mês corrente. A visão completa pode ser exportada para um arquivo nativo `.xlsx` (Excel) para controle de diretoria.

## 10. MÓDULO DE PROPOSTAS (SIMULADOR)

- **REGRA 43:** A aba de propostas atua como uma "Calculadora de Combos" para o Vendedor realizar orçamentos rápidos para os clientes.
- **REGRA 44:** O cálculo identifica automaticamente o modelo do combo: SINGLE (um único serviço), MULTI (Móvel + 1 Serviço Residencial) ou MULTI 3P (Móvel + 2 Serviços Residenciais).
- **REGRA 45:** O Simulador utiliza gatilhos visuais de conversão. Se uma proposta forma um pacote MULTI, o sistema assume que o preço tabelado solto seria 35% mais caro e multiplica a diferença projetada por 12 meses, emitindo o alerta "Economia de R$ X ao ano!".
- **REGRA 46:** As propostas podem ser renderizadas localmente e baixadas como Imagens de alta resolução (via html2canvas) ou enviadas diretamente via WhatsApp contendo uma formatação de texto comercial amigável.

## 11. INTERFACE E ACESSIBILIDADE
- **REGRA 47:** O sistema possui suporte nativo ao Modo Noturno (Dark Mode) com transição de cores suave (500ms). A preferência do usuário é salva no `localStorage` do navegador e aplica um CSS adaptativo em todas as telas, rodapés de tabelas de resultado, modais e caixas de seleção, preservando a visibilidade e o conforto visual.