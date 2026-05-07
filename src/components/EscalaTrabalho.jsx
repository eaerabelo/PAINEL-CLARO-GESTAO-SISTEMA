import React, { useState, useEffect } from 'react';
import { Unlock, Lock, Printer, Edit3, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { VENDEDORES, HORARIOS_PADRAO } from '../utils/constants';

const LOCAL_WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const getLocalDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const SAFE_VENDEDORES = Array.isArray(VENDEDORES) ? VENDEDORES : [];
const SAFE_HORARIOS = Array.isArray(HORARIOS_PADRAO) ? HORARIOS_PADRAO : ['09:00 - 18:00', '10:00 - 19:00', '13:00 - 22:00', 'FOLGA'];

export const EscalaTrabalho = ({ canEditSchedule, scheduleData, setScheduleData, monthlyOverrides, setMonthlyOverrides }) => {
    const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
    const [editScheduleCell, setEditScheduleCell] = useState(null);
    const [editScheduleValue, setEditScheduleValue] = useState('');


    const getDailySchedule = (seller, year, month, day) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (monthlyOverrides[seller] && monthlyOverrides[seller][dateStr] !== undefined) {
            return monthlyOverrides[seller][dateStr];
        }
        const dateObj = new Date(year, month, day);
        const weekDayStr = LOCAL_WEEKDAYS[dateObj.getDay()];
        return scheduleData[seller]?.[weekDayStr] || '';
    };

    const handleScheduleClick = (seller, key, type, dateStr = null) => {
        if (!canEditSchedule) return;
        setEditScheduleCell({ seller, key, type, dateStr });
        if (type === 'WEEKLY') {
            setEditScheduleValue(scheduleData[seller][key] || '');
        } else {
            const year = currentMonthDate.getFullYear();
            const month = currentMonthDate.getMonth();
            setEditScheduleValue(getDailySchedule(seller, year, month, key));
        }
    };

    const handleSaveScheduleCell = (e) => {
        e.preventDefault();
        if (!editScheduleCell) return;
        if (editScheduleCell.type === 'WEEKLY') {
            setScheduleData(prev => ({
                ...prev,
                [editScheduleCell.seller]: { ...prev[editScheduleCell.seller], [editScheduleCell.key]: editScheduleValue }
            }));
        } else {
            setMonthlyOverrides(prev => ({
                ...prev,
                [editScheduleCell.seller]: { ...(prev[editScheduleCell.seller] || {}), [editScheduleCell.dateStr]: editScheduleValue }
            }));
        }
        setEditScheduleCell(null);
    };

    const handlePrintSchedule = () => window.print();

    const formatScheduleCell = (val) => {
        if (!val) return <span className="text-neutral-300">-</span>;
        const v = String(val).toUpperCase();
        if (v === 'FOLGA') return <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded text-[10px] font-bold tracking-wide block">FOLGA</span>;
        if (v === 'FERIADO') return <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded text-[10px] font-bold tracking-wide block">FERIADO</span>;
        if (v === 'FÉRIAS' || v === 'ATESTADO') return <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded text-[10px] font-bold tracking-wide block">{v}</span>;
        return <span className="text-neutral-800 font-bold text-[10px] leading-tight block">{v.replace(' - ', '\n')}</span>;
    };

    const goToPrevMonth = () => setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1));
    const goToNextMonth = () => setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1));

    return (
        <>
            <div className="flex flex-col min-h-full animate-fade-in print-schedule gap-6">

                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden flex flex-col shrink-0">
                    <div className="p-4 border-b border-neutral-100 flex flex-col md:flex-row gap-3 justify-between items-start md:items-center bg-white">
                        <h2 className="font-semibold text-neutral-800 flex flex-wrap items-center gap-2">
                            <span className="w-full sm:w-auto">Quadro Padrão de Escala Semanal</span>
                            {canEditSchedule ? (
                                <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded flex items-center gap-1 font-bold uppercase sm:ml-2 no-print"><Unlock size={12} /> Edição Liberada (Gestor)</span>
                            ) : (
                                <span className="bg-neutral-100 text-neutral-500 text-[10px] px-2 py-0.5 rounded flex items-center gap-1 font-bold uppercase sm:ml-2 no-print"><Lock size={12} /> Somente Leitura</span>
                            )}
                        </h2>
                        <div className="flex w-full md:w-auto gap-2 no-print">
                            <button onClick={handlePrintSchedule} className="w-full sm:w-auto justify-center px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-black transition-colors shadow-sm flex items-center gap-2" title="Use 'Salvar como PDF' na tela de impressão">
                                <Printer size={16} /> Exportar / Imprimir
                            </button>
                        </div>
                    </div>

                    <div className="overflow-auto bg-neutral-50/30 p-4">
                        <table className="w-full text-sm text-center whitespace-nowrap border-collapse border border-neutral-300 shadow-sm">
                            <thead className="text-[11px] text-white uppercase bg-neutral-900">
                                <tr>
                                    <th className="border border-neutral-700 px-4 py-3 font-bold tracking-wider text-left bg-neutral-800 w-48">Colaborador</th>
                                    <th className="border border-neutral-700 px-4 py-3 font-bold tracking-wider">Segunda-feira</th>
                                    <th className="border border-neutral-700 px-4 py-3 font-bold tracking-wider">Terça-feira</th>
                                    <th className="border border-neutral-700 px-4 py-3 font-bold tracking-wider">Quarta-feira</th>
                                    <th className="border border-neutral-700 px-4 py-3 font-bold tracking-wider">Quinta-feira</th>
                                    <th className="border border-neutral-700 px-4 py-3 font-bold tracking-wider">Sexta-feira</th>
                                    <th className="border border-neutral-700 px-4 py-3 font-bold tracking-wider text-[#E3000F] bg-neutral-800">Sábado</th>
                                    <th className="border border-neutral-700 px-4 py-3 font-bold tracking-wider text-[#E3000F] bg-neutral-800">Domingo</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {SAFE_VENDEDORES.map((seller) => (
                                    <tr key={`weekly-${seller}`} className="hover:bg-neutral-50 transition-colors">
                                        <td className="border border-neutral-200 px-4 py-3 font-bold text-neutral-800 text-left bg-neutral-50/50">
                                            {seller}
                                        </td>
                                        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map(day => (
                                            <td
                                                key={`weekly-${seller}-${day}`}
                                                onClick={() => handleScheduleClick(seller, day, 'WEEKLY')}
                                                className={`border border-neutral-200 px-3 py-3 relative ${canEditSchedule ? 'cursor-pointer hover:bg-blue-50/50 group' : ''}`}
                                            >
                                                {formatScheduleCell(scheduleData[seller]?.[day])}
                                                {canEditSchedule && (
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-blue-50/80 transition-opacity no-print">
                                                        <Edit3 size={16} className="text-blue-600" />
                                                    </div>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden flex flex-col flex-1 shrink-0">
                    <div className="p-4 border-b border-neutral-100 flex flex-col md:flex-row gap-3 justify-between items-start md:items-center bg-white">
                        <div className="w-full md:w-auto">
                            <h2 className="font-semibold text-neutral-800 flex items-center gap-2">
                                Escala Detalhada do Mês
                            </h2>
                            <p className="text-xs text-neutral-500 mt-1">Visão diária. Clique em um dia para adicionar exceções à regra semanal (ex: Feriados, Férias).</p>
                        </div>
                        <div className="flex w-full sm:w-auto justify-between items-center gap-3 bg-white border border-neutral-200 rounded-lg p-1 shadow-sm">
                            <button onClick={goToPrevMonth} className="p-1.5 hover:bg-neutral-100 rounded-md text-neutral-600 transition-colors flex-shrink-0">
                                <ChevronLeft size={18} />
                            </button>
                            <span className="font-bold text-sm text-[#E3000F] uppercase tracking-wider min-w-[120px] text-center truncate">
                                {currentMonthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                            </span>
                            <button onClick={goToNextMonth} className="p-1.5 hover:bg-neutral-100 rounded-md text-neutral-600 transition-colors flex-shrink-0">
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-auto flex-1 bg-white p-4">
                        <table className="w-full text-sm text-center whitespace-nowrap border-collapse border border-neutral-300 shadow-sm min-w-max">
                            <thead className="text-[11px] text-white uppercase bg-neutral-800 sticky top-0 z-20">
                                <tr>
                                    <th className="border border-neutral-700 px-4 py-3 font-bold tracking-wider text-left bg-neutral-900 sticky left-0 z-30 shadow-[2px_0_5px_rgba(0,0,0,0.1)]">Colaborador</th>
                                    {Array.from({ length: getLocalDaysInMonth(currentMonthDate.getFullYear(), currentMonthDate.getMonth()) }).map((_, i) => {
                                        const d = i + 1;
                                        const dateObj = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), d);
                                        const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                                        return (
                                            <th key={`head-${d}`} className={`border border-neutral-700 px-2 py-2 min-w-[90px] ${isWeekend ? 'bg-[#C00000] text-white' : ''}`}>
                                                <div className="font-bold text-base leading-none">{d}</div>
                                                <div className={`text-[9px] mt-1 ${isWeekend ? 'text-red-100' : 'text-neutral-400'}`}>{LOCAL_WEEKDAYS[dateObj.getDay()]}</div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {SAFE_VENDEDORES.map((seller) => (
                                    <tr key={`month-${seller}`} className="hover:bg-neutral-50 transition-colors">
                                        <td className="border border-neutral-200 px-4 py-3 font-bold text-neutral-800 text-left bg-neutral-50 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                            {seller}
                                        </td>
                                        {Array.from({ length: getLocalDaysInMonth(currentMonthDate.getFullYear(), currentMonthDate.getMonth()) }).map((_, i) => {
                                            const d = i + 1;
                                            const dateObj = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), d);
                                            const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                                            return (
                                                <td
                                                    key={`month-${seller}-${d}`}
                                                    onClick={() => handleScheduleClick(seller, d, 'MONTHLY')}
                                                    className={`border border-neutral-200 px-1 py-2 relative ${isWeekend ? 'bg-red-50/30' : ''} ${canEditSchedule ? 'cursor-pointer hover:bg-blue-50/50 group' : ''}`}
                                                >
                                                    {formatScheduleCell(getDailySchedule(seller, currentMonthDate.getFullYear(), currentMonthDate.getMonth(), d))}
                                                    {canEditSchedule && (
                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-blue-50/80 transition-opacity no-print">
                                                            <Edit3 size={14} className="text-blue-600" />
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {editScheduleCell && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 no-print">
                    <div className="flex min-h-full items-center justify-center">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in">
                            <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50 rounded-t-2xl">
                                <div>
                                    <h2 className="text-lg font-bold text-neutral-800">{editScheduleCell.type === 'WEEKLY' ? 'Editar Regra Semanal' : 'Criar Exceção no Dia'}</h2>
                                </div>
                                <button onClick={() => setEditScheduleCell(null)} className="w-8 h-8 flex items-center justify-center bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-600 rounded-full transition-colors"><X size={18} /></button>
                            </div>
                            <form onSubmit={handleSaveScheduleCell} className="p-6 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Horários Comuns</label>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {SAFE_HORARIOS.map(h => (
                                            <button key={h} type="button" onClick={() => setEditScheduleValue(h)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${editScheduleValue === h ? 'bg-neutral-800 text-white border-neutral-800' : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'}`}>{h}</button>
                                        ))}
                                        {editScheduleCell.type === 'MONTHLY' && (
                                            <button type="button" onClick={() => setEditScheduleValue('')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${editScheduleValue === '' ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'}`}>VOLTAR AO PADRÃO</button>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1.5 pt-2">
                                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Ou digite outro horário / motivo</label>
                                    <input type="text" value={editScheduleValue} onChange={e => setEditScheduleValue(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 text-neutral-800 px-3 py-2.5 rounded-lg outline-none focus:ring-1 focus:ring-[#E3000F] font-mono text-sm uppercase" />
                                </div>
                                <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3">
                                    <button type="button" onClick={() => setEditScheduleCell(null)} className="w-full sm:w-auto px-5 py-2.5 bg-white border border-neutral-200 text-neutral-600 font-medium rounded-lg hover:bg-neutral-50 transition-colors">Cancelar</button>
                                    <button type="submit" className="w-full sm:w-auto justify-center px-6 py-2.5 bg-[#E3000F] text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30 flex items-center gap-2">Salvar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};