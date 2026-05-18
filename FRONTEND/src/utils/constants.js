export const PRICING_MOVEL = {
    'POS 50GB': { SINGLE: 124.90, MULTI: 80.00 },
    'POS 50GB GAMING': { SINGLE: 164.90, MULTI: 120.00 },
    'POS 100GB': { SINGLE: 179.90, MULTI: 125.00 },
    'POS 150GB': { SINGLE: 239.90, MULTI: 180.00 },
    'POS 200GB': { SINGLE: 339.90, MULTI: 240.00 },
    'POS 500GB': { SINGLE: 849.90, MULTI: 800.00 },
    'CONTROLE 15GB': { SINGLE: 59.90, MULTI: 49.90 },
    'CONTROLE 35GB': { SINGLE: 69.90, MULTI: 69.90 },
    'CONTROLE 35GB GAMING': { SINGLE: 99.90, MULTI: 99.90 },
};

export const FIBRA_OPTIONS = [
    { label: '250 MEGA', prices: { UNICO: 99.90 } },
    { label: '500 MEGA', prices: { SINGLE: 119.90, MULTI: 99.90 } },
    { label: '1 GIGA', prices: { SINGLE: 199.90, MULTI: 149.90 } },
    { label: '5 GIGA', prices: { SINGLE: 499.90, MULTI: 449.90 } },
    { label: '10 GIGA', prices: { SINGLE: 1999.90, MULTI: 1949.90 } },
];

export const TV_BOX_OPTIONS = [
    { label: 'TV BOX', prices: { SINGLE: 134.90, MULTI: 124.90, 'MULTI 3P': 99.90 } },
    { label: 'TV BOX CABO', prices: { SINGLE: 164.90, MULTI: 154.90 } },
    { label: 'TV SOUNDBOX', prices: { UNICO: 174.90 } },
];

export const FIXO_OPTIONS = [
    { label: 'FIXO MUNDO', prices: { UNICO: 65.00 } },
    { label: 'FIXO BRASIL', prices: { UNICO: 35.00 } },
    { label: 'FIXO MULTI 3P', prices: { UNICO: 5.00 } },
];

export const MESH_OPTIONS = [
    { label: 'MESH 1UN', prices: { UNICO: 15.00 } },
    { label: 'MESH 2UN', prices: { UNICO: 30.00 } },
    { label: 'MESH 3UN', prices: { UNICO: 45.00 } },
    { label: 'MESH 4UN', prices: { UNICO: 60.00 } },
];

export const SEGURO_OPTIONS = [
    { label: 'SEGURO R$ 14,00', prices: { UNICO: 14.00 } },
    { label: 'SEGURO R$ 18,00', prices: { UNICO: 18.00 } },
    { label: 'SEGURO R$ 22,00', prices: { UNICO: 22.00 } },
    { label: 'SEGURO R$ 24,00', prices: { UNICO: 24.00 } },
];

export const DEPENDENTE_OPTIONS = [
    { label: 'GRATUITO', prices: { UNICO: 0.00 } },
    { label: 'PAGO', prices: { UNICO: 55.00 } },
    { label: 'DEP BL', prices: { UNICO: 29.90 } },
];

export const PRODUTOS_CONTRATO_OBRIGATORIO = ['FIBRA', 'TV-BOX', 'MESH', 'FIXO', 'FIBRA PME'];

export const SISTEMAS_LINKS = [
    { name: 'SIMPLIFICA', url: 'https://vendasapp.claro.com.br/SVCv2/posicionamento/resultado-pesquisa' },
    { name: 'IW', url: 'https://iw.claro.com.br/v2/wvd/lojapropria/atendersenhas' },
    { name: 'SOLAR', url: 'https://cec.claro.com.br/' },
    { name: 'MOBILE', url: 'http://mtaweb.claro.com.br:20010/docroot/login/login.jsp' },
    { name: 'ESTOQUE', url: 'http://clarounifica/portal/' },
    { name: 'NET-SALES', url: 'https://netsalesapp.claro.com.br/' },
    { name: 'NET-SMS', url: 'https://netsmsapp.claro.com.br/Citrix/NetsmsEPSWeb/' },
    { name: 'GED 2.0', url: 'https://www.novoged.claro.com.br/login' },
    { name: 'SIMULADOR', url: 'https://produtos.claro.com.br/simular-precos' },
    { name: 'CONEXÃO', url: 'https://app.conexaoclarobrasil.com.br/login?' },
    { name: 'NEGOCIA FACIL', url: 'https://claro.negociafacil.com.br/' },
    { name: 'CLARO FLEX', url: 'https://flex.claro.com.br' },
    { name: 'PS8', url: 'http://ps8web:8080/psp/p01ps1/?cmd=login&languageCd=POR' },
    { name: 'CLARO AUTENTICA', url: 'https://claro-link.brsafe.com.br/#/' },
    { name: 'WPP-PRE-PAGO', url: 'https://wppnacional.claro.com.br/wpp/login.jsp' },
    { name: 'FEV', url: 'http://feu.claro.com.br/portal/site/vendas/Autenticador' },
    { name: 'TROCAFY', url: 'https://sav.wooza.com.br/claro/negotiations-exchanges/negotiations-trade-in' },
    { name: 'SPS WEB', url: 'https://spsweb.claro.com.br/' },
    { name: 'PORTAL RCV', url: 'https://atendchat.claro.com.br/RCV/login/' },
    { name: 'IGA (IBM)', url: 'https://iga-claro.identitynow.com/ui/d/mysailpoint' },
    { name: 'PORTAL CONTROLE', url: 'http://auto-controle/autocontrole/login.jsp' },
    { name: 'CLARO CLUBE', url: 'http://claroclube/home.jsp?mensagem=' },
    { name: 'GED ANTIGO', url: 'https://ged.claro.com.br/autenticar.php' },
];

export const VENDEDORES = ['MATHEUS', 'GISELE', 'BRUNA', 'DANILO', 'DAVID'];

export const PRODUTOS = [
    'POS 50GB', 'POS 50GB GAMING', 'POS 100GB', 'POS 150GB', 'POS 200GB', 'POS 500GB',
    'CONTROLE 15GB', 'CONTROLE 35GB', 'CONTROLE 35GB GAMING', 'FIBRA', 'TV-BOX',
    'FIXO', 'CLARO FLEX', 'MESH', 'POS PME', 'FIBRA PME', 'SEGURO',
    'APARELHO', 'ACESSORIO', 'PELICULA', 'DEPENDENTE', 'BANDA LARGA'
];

export const METAS_PADRAO = {
    receita: 15000.00, posTotal: 50, posPago: 30, controle: 20, urTotal: 15,
    fibra: 10, tv: 5, fixo: 2, aparelho: 5, acessorio: 15, pelicula: 10, seguro: 10,
    mesh: 5, trocafy: 4, mplay: 15
};

export const SIMCARD_TABS = ['GESTAO', 'SOBREPOSIÇÃO', 'FALTA ESTOQUE', ...VENDEDORES, 'APARELHO & ACESSORIO'];

export const APP_USERS = {
    'adm': { pass: 'DEV2026', role: 'GESTOR', name: 'Desenvolvedor Master' },
    '1234567': { pass: '00332890', role: 'ENCARREGADO', name: 'Encarregado Lider' },
    '123654': { pass: '00332890', role: 'VENDEDOR', name: 'MATHEUS' },
};

export const HORARIOS_PADRAO = [
    '09:00 - 18:00', '10:00 - 19:00', '13:00 - 22:00',
    '14:00 - 22:00', 'FOLGA', 'FERIADO', 'FÉRIAS', 'ATESTADO'
];