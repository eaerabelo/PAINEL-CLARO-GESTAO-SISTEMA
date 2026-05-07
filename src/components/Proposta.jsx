import React, { useState } from 'react';
import { Calculator, Smartphone, Wifi, Tv, Phone, Printer, User, FileText, CheckCircle2, Download, Router, Check } from 'lucide-react';
import { PRICING_MOVEL, FIBRA_OPTIONS, TV_BOX_OPTIONS, FIXO_OPTIONS, MESH_OPTIONS } from '../utils/constants';
import { applyCurrencyMask } from '../utils/masks';

export function Proposta({ globalUser }) {
    const [cliente, setCliente] = useState('');
    const [movel, setMovel] = useState('');
    const [fibra, setFibra] = useState('');
    const [tv, setTv] = useState('');
    const [fixo, setFixo] = useState('');
    const [mesh, setMesh] = useState('');

    // Extraindo as listas das constantes de forma segura
    const mobilePlans = Object.keys(PRICING_MOVEL || {});
    const fibraPlans = FIBRA_OPTIONS || [];
    const tvPlans = TV_BOX_OPTIONS || [];
    const fixoPlans = FIXO_OPTIONS || [];
    const meshPlans = MESH_OPTIONS || [];

    // --- LÓGICA DE CÁLCULO E COMBO ---
    // Define o tipo de combo baseado na combinação de produtos selecionados
    const numServices = (movel ? 1 : 0) + (fibra ? 1 : 0) + (tv ? 1 : 0);
    let comboType = 'SINGLE';
    if (movel && (fibra || tv)) {
        comboType = numServices >= 3 ? 'MULTI 3P' : 'MULTI';
    }

    // Função de busca de preço segura
    const getPrice = (cat, item) => {
        if (!item) return 0;
        if (cat === 'MOVEL') return PRICING_MOVEL[item]?.[comboType] || PRICING_MOVEL[item]?.['SINGLE'] || 0;
        if (cat === 'FIBRA') return fibraPlans.find(o => o.label === item)?.prices?.[comboType] || fibraPlans.find(o => o.label === item)?.prices?.['SINGLE'] || fibraPlans.find(o => o.label === item)?.prices?.UNICO || 0;
        if (cat === 'TV') return tvPlans.find(o => o.label === item)?.prices?.[comboType] || tvPlans.find(o => o.label === item)?.prices?.['SINGLE'] || tvPlans.find(o => o.label === item)?.prices?.UNICO || 0;
        if (cat === 'FIXO') return fixoPlans.find(o => o.label === item)?.prices?.UNICO || 0;
        if (cat === 'MESH') return meshPlans.find(o => o.label === item)?.prices?.UNICO || 0;
        return 0;
    };

    const valMovel = getPrice('MOVEL', movel);
    const valFibra = getPrice('FIBRA', fibra);
    const valTv = getPrice('TV', tv);
    const valFixo = getPrice('FIXO', fixo);
    const valMesh = getPrice('MESH', mesh);
    const valorTotal = valMovel + valFibra + valTv + valFixo + valMesh;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="h-full flex flex-col lg:flex-row gap-6 bg-transparent animate-fade-in print:block print:h-auto">
            
            {/* COLUNA ESQUERDA: FORMULÁRIO DE SIMULAÇÃO (Oculto na impressão) */}
            <div className="w-full lg:w-1/2 flex flex-col gap-4 no-print h-full overflow-y-auto pr-2 pb-8">
                <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 shrink-0">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-[#E3000F]">
                            <Calculator size={22} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-neutral-800">Simulador de Proposta</h2>
                            <p className="text-xs text-neutral-500 font-medium">Monte o combo e veja os descontos aplicados na hora.</p>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2"><User size={14} className="text-[#E3000F]" /> Nome do Cliente / Empresa</label>
                            <input type="text" value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Ex: João da Silva" className="w-full bg-neutral-50 border border-neutral-200 text-neutral-800 px-4 py-3 rounded-xl focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium" />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2"><Smartphone size={14} className="text-[#E3000F]" /> Plano Móvel (Pós ou Controle)</label>
                            <select value={movel} onChange={(e) => setMovel(e.target.value)} className="w-full bg-white border border-neutral-200 text-neutral-800 px-4 py-3 rounded-xl focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium cursor-pointer">
                                <option value="">Nenhum plano móvel selecionado</option>
                                {mobilePlans.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2"><Wifi size={14} className="text-[#E3000F]" /> Banda Larga (Fibra)</label>
                            <select value={fibra} onChange={(e) => setFibra(e.target.value)} className="w-full bg-white border border-neutral-200 text-neutral-800 px-4 py-3 rounded-xl focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium cursor-pointer">
                                <option value="">Nenhuma internet selecionada</option>
                                {fibraPlans.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2"><Tv size={14} className="text-[#E3000F]" /> Claro TV+</label>
                            <select value={tv} onChange={(e) => setTv(e.target.value)} className="w-full bg-white border border-neutral-200 text-neutral-800 px-4 py-3 rounded-xl focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium cursor-pointer">
                                <option value="">Nenhum plano de TV selecionado</option>
                                {tvPlans.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2"><Phone size={14} className="text-[#E3000F]" /> Fixo / Adicionais</label>
                            <select value={fixo} onChange={(e) => setFixo(e.target.value)} className="w-full bg-white border border-neutral-200 text-neutral-800 px-4 py-3 rounded-xl focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium cursor-pointer">
                                <option value="">Nenhum serviço adicional</option>
                                {fixoPlans.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2"><Router size={14} className="text-[#E3000F]" /> Rede Mesh / Wi-Fi</label>
                            <select value={mesh} onChange={(e) => setMesh(e.target.value)} className="w-full bg-white border border-neutral-200 text-neutral-800 px-4 py-3 rounded-xl focus:ring-1 focus:ring-[#E3000F] outline-none text-sm font-medium cursor-pointer">
                                <option value="">Nenhum equipamento extra</option>
                                {meshPlans.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* COLUNA DIREITA: VISUALIZAÇÃO DA PROPOSTA (O que será impresso) */}
            <div className="w-full lg:w-1/2 flex flex-col h-full items-center lg:items-start print:w-full print:block print:h-auto">
                <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-neutral-200 overflow-hidden relative print:shadow-none print:border-none print:max-w-full print:overflow-visible print:color-adjust-exact">
                    
                    {/* Cabeçalho da Proposta */}
                    <div className="bg-neutral-900 text-white p-8 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E3000F] via-red-500 to-[#E3000F]"></div>
                        <div className="w-16 h-16 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                            <span className="text-[#E3000F] font-black text-3xl">C</span>
                        </div>
                        <h2 className="text-2xl font-bold mb-1 tracking-tight">Proposta Comercial</h2>
                        <p className="text-neutral-400 text-sm font-medium">{new Date().toLocaleDateString('pt-BR')} - Validade: 5 dias</p>
                    </div>

                    {/* Corpo da Proposta */}
                    <div className="p-8">
                        <div className="mb-6 pb-6 border-b border-neutral-100 border-dashed">
                            <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Cliente</div>
                            <div className="text-lg font-bold text-neutral-800">{cliente || 'Cliente Não Informado'}</div>
                            {comboType !== 'SINGLE' && valorTotal > 0 && (
                                <div className="mt-3 inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-green-200">
                                    <CheckCircle2 size={12} /> Benefício {comboType} Aplicado
                                </div>
                            )}
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Serviços Selecionados</div>
                            
                            {movel && (
                                <div className="flex justify-between items-center group">
                                    <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-neutral-50 flex items-center justify-center text-neutral-600 border border-neutral-100"><Smartphone size={16} /></div><span className="text-sm font-bold text-neutral-700">{movel}</span></div>
                                    <span className="text-sm font-black text-neutral-900">{applyCurrencyMask(valMovel)}</span>
                                </div>
                            )}
                            {fibra && (
                                <div className="flex justify-between items-center group">
                                    <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-neutral-50 flex items-center justify-center text-neutral-600 border border-neutral-100"><Wifi size={16} /></div><span className="text-sm font-bold text-neutral-700">Fibra {fibra}</span></div>
                                    <span className="text-sm font-black text-neutral-900">{applyCurrencyMask(valFibra)}</span>
                                </div>
                            )}
                            {tv && (
                                <div className="flex justify-between items-center group">
                                    <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-neutral-50 flex items-center justify-center text-neutral-600 border border-neutral-100"><Tv size={16} /></div><span className="text-sm font-bold text-neutral-700">{tv}</span></div>
                                    <span className="text-sm font-black text-neutral-900">{applyCurrencyMask(valTv)}</span>
                                </div>
                            )}
                            {fixo && (
                                <div className="flex justify-between items-center group">
                                    <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-neutral-50 flex items-center justify-center text-neutral-600 border border-neutral-100"><Phone size={16} /></div><span className="text-sm font-bold text-neutral-700">{fixo}</span></div>
                                    <span className="text-sm font-black text-neutral-900">{applyCurrencyMask(valFixo)}</span>
                                </div>
                            )}
                            {mesh && (
                                <div className="flex justify-between items-center group">
                                    <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-neutral-50 flex items-center justify-center text-neutral-600 border border-neutral-100"><Router size={16} /></div><span className="text-sm font-bold text-neutral-700">{mesh}</span></div>
                                    <span className="text-sm font-black text-neutral-900">{applyCurrencyMask(valMesh)}</span>
                                </div>
                            )}

                            {valorTotal === 0 && (
                                <div className="text-center py-6 text-neutral-400 text-sm font-medium border-2 border-dashed border-neutral-100 rounded-xl bg-neutral-50/50">
                                    Nenhum serviço selecionado.
                                </div>
                            )}
                        </div>

                        {/* QUADRO DE VANTAGENS E CARACTERÍSTICAS (Gatilho Comercial) */}
                        {(movel || fibra || tv) && (
                            <div className="bg-green-50/50 border border-green-100 rounded-xl p-4 mb-6">
                                <div className="text-xs font-bold text-green-800 uppercase tracking-widest mb-3">Vantagens Inclusas</div>
                                <ul className="space-y-2">
                                    {movel && (
                                        <>
                                            <li className="flex items-start gap-2 text-sm text-green-700 font-medium"><Check size={16} className="text-green-600 shrink-0 mt-0.5" /> Ligações e SMS Ilimitados p/ qualquer operadora</li>
                                            <li className="flex items-start gap-2 text-sm text-green-700 font-medium"><Check size={16} className="text-green-600 shrink-0 mt-0.5" /> WhatsApp sem descontar da franquia</li>
                                            {(movel.includes('PÓS') || movel.includes('POS')) && <li className="flex items-start gap-2 text-sm text-green-700 font-medium"><Check size={16} className="text-green-600 shrink-0 mt-0.5" /> Roaming Internacional (Passaporte Américas)</li>}
                                        </>
                                    )}
                                    {fibra && (
                                        <li className="flex items-start gap-2 text-sm text-green-700 font-medium"><Check size={16} className="text-green-600 shrink-0 mt-0.5" /> Equipamento Wi-Fi e Instalação Grátis</li>
                                    )}
                                    {tv && (
                                        <li className="flex items-start gap-2 text-sm text-green-700 font-medium"><Check size={16} className="text-green-600 shrink-0 mt-0.5" /> Acesso gratuito ao app Claro tv+ (Celular e Smart TV)</li>
                                    )}
                                </ul>
                            </div>
                        )}

                        <div className="bg-neutral-50 rounded-xl p-5 border border-neutral-200">
                            <div className="flex justify-between items-end">
                                <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Valor Mensal</span>
                                <span className="text-3xl font-black text-[#E3000F]">{applyCurrencyMask(valorTotal)}</span>
                            </div>
                        </div>
                        
                        <div className="mt-8 text-center border-t border-neutral-100 pt-6">
                            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Consultor Responsável</div>
                            <div className="text-sm font-bold text-neutral-800">{globalUser?.name || 'Consultor Claro'}</div>
                            <div className="text-xs text-neutral-500">União Osasco - AT1M</div>
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-md mt-4 flex gap-3 no-print">
                    <button onClick={handlePrint} disabled={valorTotal === 0} className="w-full py-3.5 bg-[#E3000F] text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        <Download size={18} /> Gerar PDF / Imprimir
                    </button>
                </div>
            </div>

        </div>
    );
} 