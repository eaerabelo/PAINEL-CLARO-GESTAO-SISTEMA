/**
 * Arquivo centralizado de Regras de Negócio e Comissionamento da Claro.
 * As regras refletem a cartilha de pagamento em Faixas e Teto Máximo.
 */

// Constantes Base da Operação
export const TETO_RV_VENDEDOR = 6000.00;

export const FATORES_CLARO_MULTI = {
    FAIXA_1: 1.2, // 0.00% até 99.99% de Meta Multi
    FAIXA_2: 1.4, // 100.00% até 129.99%
    FAIXA_3: 1.6, // 130.00% até 159.99%
    FAIXA_4: 1.8  // A partir de 160.00%
};

/**
 * Aplica os aceleradores e redutores por produto individualmente.
 * (Ex: Portabilidade, Fator Multi).
 */
export const aplicarRegrasDeProduto = (sale, metricasLoja = {}) => {
    let receitaBase = Number(sale.comissao !== undefined ? sale.comissao : sale.receita) || 0;
    let isMovel = false;
    let isResidencial = false;
    
    const pBase = String(sale.produtoBase || sale.produto || '').toUpperCase();
    const sub = String(sale.subOption || sale.subtipo || '').toUpperCase();
    const combo = String(sale.combo || '').toUpperCase();
    const portabilidade = String(sale.portabilidade || '').toUpperCase();
    
    if (pBase.includes('POS') || pBase.includes('PÓS') || pBase.includes('CONTROLE') || 
        pBase.includes('BANDA LARGA') || pBase === 'BL' || pBase.includes('FLEX') || 
        pBase.includes('DEPENDENTE') || pBase.includes('DEP')) {
        isMovel = true;
    }
    
    if (pBase.includes('FIBRA') || pBase.includes('TV') || pBase.includes('FIXO') || pBase.includes('MESH') || pBase.includes('RESIDENCIAL')) {
        isResidencial = true;
    }

    // --- 2. REGRAS DOS PRODUTOS E SERVIÇOS MÓVEIS ---
    if (isMovel) {
        // Dependentes Gratuitas não geram valor monetário na receita
        if (pBase.includes('DEP') && (sub.includes('GRÁTIS') || sub.includes('GRATUITO'))) {
            receitaBase = 0;
        }

        // Portabilidade: Bonificação de 30% adicionais na receita
        if (portabilidade === 'SIM') {
            receitaBase *= 1.30;
        }

        // Fatores Claro Multi (Acelerador Múltiplo)
        if (combo.includes('MULTI')) {
            const pctMulti = metricasLoja.pctAtingimentoMulti || 0;
            let fatorMulti = FATORES_CLARO_MULTI.FAIXA_1; // Fator Base 1.2 (Abaixo de 100%)
            
            if (pctMulti >= 160.00) fatorMulti = FATORES_CLARO_MULTI.FAIXA_4; // Fator 1.8
            else if (pctMulti >= 130.00) fatorMulti = FATORES_CLARO_MULTI.FAIXA_3; // Fator 1.6
            else if (pctMulti >= 100.00) fatorMulti = FATORES_CLARO_MULTI.FAIXA_2; // Fator 1.4

            receitaBase *= fatorMulti;
        } else {
            // Vendas Single (Fator fixo de 1.0 - Sem bônus Multi)
            receitaBase *= 1.0;
        }
    }

    // --- 3. REGRAS DOS PRODUTOS E SERVIÇOS RESIDENCIAIS (FIXOS) ---
    if (isResidencial) {
        // Claro TV+APP: As instalações deste produto não são computadas para o cálculo de RV em nenhuma das etapas
        if (pBase.replace(/\s/g, '').includes('TV+APP') || sub.replace(/\s/g, '').includes('TV+APP') || sub === 'APP') {
            receitaBase = 0;
        }

        // Fatores Claro Multi Residencial (Mesmos multiplicadores do Móvel de 1.2 a 1.8)
        if (combo.includes('MULTI')) {
            const pctMulti = metricasLoja.pctAtingimentoMulti || 0;
            let fatorMulti = FATORES_CLARO_MULTI.FAIXA_1; // Fator Base 1.2 (Abaixo de 100%)
            
            if (pctMulti >= 160.00) fatorMulti = FATORES_CLARO_MULTI.FAIXA_4; // Fator 1.8
            else if (pctMulti >= 130.00) fatorMulti = FATORES_CLARO_MULTI.FAIXA_3; // Fator 1.6
            else if (pctMulti >= 100.00) fatorMulti = FATORES_CLARO_MULTI.FAIXA_2; // Fator 1.4

            receitaBase *= fatorMulti;
        } else {
            // Vendas residenciais no modelo "single" possuem fator fixo de 1.0
            receitaBase *= 1.0;
        }
    }

    // --- REGRAS DE OPERAÇÃO (UPGRADE / SIDEGRADE / DOWNGRADE) ---
    // Aplicável tanto para Móvel quanto para Residencial
    const tipoOp = String(sale.tipoOperacao || sale.operacao || '').toUpperCase();
    if (tipoOp === 'UPGRADE') {
        receitaBase *= 0.50; // Gera receita de 50% sobre o valor comercial do novo produto
    } else if (tipoOp === 'SIDEGRADE') {
        receitaBase *= 0.25; // Gera receita de 25% sobre o valor comercial
    } else if (tipoOp === 'DOWNGRADE') {
        receitaBase = 0; // Não gera nenhuma remuneração na RV
    }

    return receitaBase;
};

export const calcularFatorRV = (pctAtingimento, totalComissao, metricasExtras = {}) => {
    
    let fator = 0;
    let elegivel = true;

    // --- 1. REGRAS GERAIS E ELEGIBILIDADE ---
    // Mínimo de 80,00% em três metas: Receita, Gross Total e Residencial (UR)
    const pctPos = metricasExtras.pctAtingimentoPos || 0;
    const pctUr = metricasExtras.pctAtingimentoUr || 0;

    // --- 6. FAIXAS DE COMISSIONAMENTO SOBRE A RECEITA (ETAPA 2) ---
    // O percentual pago ao vendedor é definido pelo atingimento da sua meta de receita realizada
    if (pctAtingimento < 80.00 || pctPos < 80.00 || pctUr < 80.00) {
        elegivel = false;
        fator = 0.00; // Faixa 0 — 0,00% de comissão sobre a receita realizada.
    } else if (pctAtingimento >= 80.00 && pctAtingimento < 100.00) {
        fator = 0.045; // Faixa 1 — 4,50% de comissão sobre a receita realizada.
    } else if (pctAtingimento >= 100.00 && pctAtingimento < 120.00) {
        fator = 0.07; // Faixa 2 — 7,00% de comissão sobre a receita realizada.
    } else if (pctAtingimento >= 120.00 && pctAtingimento < 150.00) {
        fator = 0.09; // Faixa 3 — 9,00% de comissão sobre a receita realizada.
    } else {
        fator = 0.11; // Faixa 4 — 11,00% de comissão sobre a receita realizada.
    }

    let previaPagamento = totalComissao * fator;

    // --- 5. BÔNUS DE SATISFAÇÃO (SMS) ---
    // Se a nota média for >= 8, ganha um bônus de 5,00% sobre o valor apurado na Etapa 2
    if (metricasExtras.notaNps && metricasExtras.notaNps >= 8) {
        previaPagamento += (previaPagamento * 0.05);
    }

    // --- 5.1 BÔNUS UNITÁRIO ACIMA DA META (ETAPA 3) ---
    // Bônus fixo para cada unidade vendida acima da meta de TV, Fibra ou Pós-Pago
    let bonusUnitario = 0;
    const calcularBonusProduto = (vol, meta) => {
        if (!meta || meta <= 0) return 0;
        const pct = (vol / meta) * 100;
        if (pct >= 100) {
            const adicionais = vol - meta;
            if (adicionais > 0) {
                if (pct >= 115.00) return adicionais * 15.00;
                else if (pct >= 100.00) return adicionais * 10.00;
            }
        }
        return 0;
    };

    const bonusPos = calcularBonusProduto(metricasExtras.volPosPago || 0, metricasExtras.metaPosPago || 0);
    const bonusFibra = calcularBonusProduto(metricasExtras.volFibra || 0, metricasExtras.metaFibra || 0);
    const bonusTv = calcularBonusProduto(metricasExtras.volTv || 0, metricasExtras.metaTv || 0);

    bonusUnitario = bonusPos + bonusFibra + bonusTv;
    previaPagamento += bonusUnitario;

    // --- 1. TETO MÁXIMO DE PAGAMENTO ---
    // O teto máximo (limite monetário) de pagamento de RV para o cargo de Vendedor Lojas é de R$ 6.000,00.
    if (previaPagamento > TETO_RV_VENDEDOR) {
        previaPagamento = TETO_RV_VENDEDOR;
    }

    return {
        fatorAplicado: fator,
        previaPagamento: previaPagamento,
        elegivel: elegivel,
        bonusUnitario: bonusUnitario
    };
};