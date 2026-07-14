/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { 
  AreaChart, Area,
  LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  DollarSign, 
  Plus, 
  Minus, 
  RefreshCw, 
  Sliders, 
  HelpCircle,
  Flame,
  Info
} from 'lucide-react';
import { Sale } from '../types';

interface SalesGoalSimulatorProps {
  sales: Sale[];
}

export default function SalesGoalSimulator({ sales }: SalesGoalSimulatorProps) {
  // Current Month definition: June 2026 (based on mockData.ts system year)
  const simulatedYear = 2026;
  const simulatedMonth = 5; // 0-indexed, June is 5
  const simulatedTodayDay = 13; // June 13, 2026
  
  // States for interactive simulations
  const [monthlyGoal, setMonthlyGoal] = useState<number>(20000); // Default R$ 20.000,00
  const [remainingDays, setRemainingDays] = useState<number>(17); // Days remaining in June (30 - 13 = 17)
  const [useOnlyBusinessDays, setUseOnlyBusinessDays] = useState<boolean>(false);
  const [simulatedExtraSale, setSimulatedExtraSale] = useState<number>(0);
  const [showHelperTips, setShowHelperTips] = useState<boolean>(true);

  // Quick Goal presets
  const goalPresets = [10000, 15000, 20000, 30000, 50000];

  // Helper to format currency
  const formatValue = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // 1. Calculate Real Completed Revenue for June 2026
  const realizedRevenue = useMemo(() => {
    const juneSales = sales.filter(sale => {
      if (sale.status !== 'Concluída') return false;
      const saleDate = new Date(sale.createdAt);
      return saleDate.getFullYear() === simulatedYear && saleDate.getMonth() === simulatedMonth;
    });
    
    return juneSales.reduce((sum, s) => sum + s.total, 0);
  }, [sales]);

  // Adjust current total in real-time if user plays with the simulated extra sale input
  const totalWithSimulated = useMemo(() => {
    return realizedRevenue + simulatedExtraSale;
  }, [realizedRevenue, simulatedExtraSale]);

  // 2. Goal completion calculations
  const remainingToGoal = useMemo(() => {
    const diff = monthlyGoal - totalWithSimulated;
    return diff > 0 ? diff : 0;
  }, [monthlyGoal, totalWithSimulated]);

  const percentageReached = useMemo(() => {
    if (monthlyGoal <= 0) return 100;
    const pct = (totalWithSimulated / monthlyGoal) * 100;
    return Number(pct.toFixed(1));
  }, [totalWithSimulated, monthlyGoal]);

  // 3. Historical daily average (June 1st to June 13th = 13 days)
  const currentDailyAverage = useMemo(() => {
    return totalWithSimulated / simulatedTodayDay;
  }, [totalWithSimulated]);

  // 4. Required Daily Average over the remaining days
  const requiredDailyAverage = useMemo(() => {
    if (remainingDays <= 0) return 0;
    return remainingToGoal / remainingDays;
  }, [remainingToGoal, remainingDays]);

  // Compare pacing: Is the required rate higher or lower than our current average pacing?
  const paceAnalysis = useMemo(() => {
    if (remainingToGoal <= 0) {
      return {
        status: 'goal_achieved',
        message: 'Meta Atingida! Parabéns pelo excelente resultado! 🎉',
        color: 'emerald',
        percentageGap: 0,
        tips: [
          'Aproveite a tração de vendas para fazer ofertas cruzadas ("cross-selling") e liquidar itens parados de coleções passadas.',
          'Consolide o relacionamento com as novas clientes deste mês enviando mensagens personalizadas de agradecimento no WhatsApp.',
          'Aumente seus estoques de itens campeões, como o Conjunto Seamless Sculpt, visando o próximo mês.'
        ]
      };
    }

    const gap = requiredDailyAverage - currentDailyAverage;
    const pctGap = (requiredDailyAverage / (currentDailyAverage || 1)) * 100 - 100;

    if (gap <= 0) {
      return {
        status: 'on_track',
        message: 'No ritmo ideal! Seu histórico diário atual é suficiente para atingir a meta tranquilamente.',
        color: 'indigo',
        percentageGap: pctGap,
        tips: [
          'Mantenha a constância nos canais de venda (Instagram e WhatsApp).',
          'Tente aumentar o ticket médio atual oferendo acessórios pequenos (meiões, faixas de cabelo) antes de finalizar a venda.',
          'Ofereça frete grátis personalizado como argumento para fechar vendas pendentes no carrinho do e-commerce.'
        ]
      };
    } else {
      return {
        status: 'warning',
        message: `Aceleração necessária! Você precisa vender R$ ${gap.toFixed(2)} a mais por dia (+${pctGap.toFixed(0)}%) do que sua média atual para alcançar a meta.`,
        color: 'pink',
        percentageGap: pctGap,
        tips: [
          'Crie um Combo Relâmpago com os Tops Fitness menos vendidos para alavancar faturamento rápido.',
          'Aborde as clientes ativas do faturamento anterior no WhatsApp com uma oferta especial de fidelidade de 15% OFF.',
          'Faça uma Live Shop de 30 minutos no Instagram demonstrando o caimento impecável da Legging Ativa All-Black.'
        ]
      };
    }
  }, [requiredDailyAverage, currentDailyAverage, remainingToGoal]);

  // 5. Generate Trajectory Curve (Days 1 to 30 of June)
  const trajectoryChartData = useMemo(() => {
    const totalDays = 30;
    const data = [];
    
    // Group completed sales by day of month (June 1 - 30) for historical calculation
    const dailySalesMap: Record<number, number> = {};
    for (let d = 1; d <= totalDays; d++) {
      dailySalesMap[d] = 0;
    }

    // Add extra simulated sale spread safely on today (June 13) just for active graphing
    dailySalesMap[simulatedTodayDay] += simulatedExtraSale;

    sales.forEach(sale => {
      if (sale.status !== 'Concluída') return;
      const saleDate = new Date(sale.createdAt);
      if (saleDate.getFullYear() === simulatedYear && saleDate.getMonth() === simulatedMonth) {
        const dayNum = saleDate.getDate();
        if (dayNum <= totalDays) {
          dailySalesMap[dayNum] = (dailySalesMap[dayNum] || 0) + sale.total;
        }
      }
    });

    let cumulativeReal = 0;
    
    for (let day = 1; day <= totalDays; day++) {
      const formattedLabel = `${day.toString().padStart(2, '0')}/06`;
      
      // Calculate linear target trajectory (perfectly straight path to target)
      const linearTarget = (monthlyGoal / totalDays) * day;
      
      // Realized progress (only up to simulatedTodayDay)
      let realCumulative: number | null = null;
      if (day <= simulatedTodayDay) {
        cumulativeReal += dailySalesMap[day];
        realCumulative = Number(cumulativeReal.toFixed(2));
      }

      // Projected progress (starts from Today's cumulative real value, then grows linearly to hit exactly the Goal at day 30)
      let projectedCumulative: number | null = null;
      if (day >= simulatedTodayDay) {
        if (day === simulatedTodayDay) {
          projectedCumulative = Number(cumulativeReal.toFixed(2));
        } else {
          const daysProjectedElapsed = day - simulatedTodayDay;
          const totalDaysProjectedLeft = totalDays - simulatedTodayDay;
          const realFactor = cumulativeReal + (monthlyGoal - cumulativeReal) * (daysProjectedElapsed / totalDaysProjectedLeft);
          projectedCumulative = Number(realFactor.toFixed(2));
        }
      }

      data.push({
        name: formattedLabel,
        dayNum: day,
        'Meta Linear Constant': Number(linearTarget.toFixed(2)),
        'Realizado Concluído': realCumulative,
        'Reta de Projeção Requerida': projectedCumulative,
      });
    }

    return data;
  }, [sales, monthlyGoal, simulatedExtraSale]);

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-xs flex flex-col gap-6" id="sales-goals-simulator">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-50 pb-5">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-pink-50 text-pink-600 rounded-xl mt-0.5 shadow-sm">
            <Target size={20} className="stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5 font-sans">
              <span>Simulador Inteligente de Metas</span>
              <span className="bg-gradient-to-r from-pink-500 to-violet-505 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider animate-pulse flex items-center gap-0.5">
                <Flame size={9} /> Projeção Ativa
              </span>
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">Acompanhe e projete o faturamento restante para atingir seus objetivos de vendas fitness</p>
          </div>
        </div>
        
        {/* Toggle help block */}
        <button
          type="button"
          onClick={() => setShowHelperTips(!showHelperTips)}
          className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1 cursor-pointer select-none ${
            showHelperTips 
              ? 'bg-slate-50 text-slate-500 border-slate-200' 
              : 'bg-white text-pink-600 border-pink-200 hover:bg-pink-50'
          }`}
        >
          <Info size={12} />
          <span>{showHelperTips ? 'Ocultar Conselhos' : 'Dicas Estratégicas'}</span>
        </button>
      </div>

      {/* Main Interactive Controls Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* L: Simulation controls (4 cols) */}
        <div className="lg:col-span-5 bg-slate-50/60 border border-slate-100 rounded-2xl p-4 md:p-5 flex flex-col gap-5 text-left font-sans">
          
          <div className="space-y-1.5">
            <h4 className="text-[11.5px] font-black text-slate-700 tracking-wider uppercase flex items-center gap-1.5 select-none">
              <Sliders size={13} className="text-pink-500" />
              <span>Ajustar Parâmetros</span>
            </h4>
            <p className="text-[10px] text-slate-400">Brinque com os números abaixo para testar diferentes cenários imediatamente.</p>
          </div>

          {/* Target Config */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-650 font-bold font-sans">Meta de Faturamento Mensal</span>
              <span className="font-extrabold text-pink-650 font-mono text-[13px] bg-pink-50 text-pink-600 px-2 py-0.5 rounded-md">
                {formatValue(monthlyGoal)}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                type="button" 
                onClick={() => setMonthlyGoal(prev => Math.max(2000, prev - 1000))} 
                className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:border-pink-500 hover:text-pink-650 flex items-center justify-center font-bold text-slate-600 transition-colors cursor-pointer shrink-0"
              >
                <Minus size={14} />
              </button>
              
              {/* Range input slider */}
              <input 
                type="range"
                min="5000"
                max="60000"
                step="1000"
                value={monthlyGoal}
                onChange={(e) => setMonthlyGoal(Number(e.target.value))}
                className="flex-1 accent-pink-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />

              <button 
                type="button" 
                onClick={() => setMonthlyGoal(prev => Math.min(100000, prev + 1000))} 
                className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:border-pink-500 hover:text-pink-650 flex items-center justify-center font-bold text-slate-600 transition-colors cursor-pointer shrink-0"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Quick Presets row */}
            <div className="grid grid-cols-5 gap-1 pt-1">
              {goalPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMonthlyGoal(preset)}
                  className={`text-[9.5px] font-bold py-1 rounded transition-colors cursor-pointer ${
                    monthlyGoal === preset 
                      ? 'bg-pink-600 text-white font-black' 
                      : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {preset >= 1000 ? `${preset / 1000}k` : preset}
                </button>
              ))}
            </div>
          </div>

          {/* Sales Days Config */}
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-650 font-bold">Dias de Atividade Restantes</span>
              <span className="font-extrabold text-indigo-650 font-mono text-[13px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md">
                {remainingDays} dias
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                type="button" 
                onClick={() => setRemainingDays(prev => Math.max(1, prev - 1))} 
                className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 flex items-center justify-center font-bold text-slate-600 transition-colors cursor-pointer shrink-0"
              >
                <Minus size={14} />
              </button>
              
              <input 
                type="range"
                min="1"
                max="30"
                step="1"
                value={remainingDays}
                onChange={(e) => setRemainingDays(Number(e.target.value))}
                className="flex-1 accent-indigo-650 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />

              <button 
                type="button" 
                onClick={() => setRemainingDays(prev => Math.min(30, prev + 1))} 
                className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 flex items-center justify-center font-bold text-slate-600 transition-colors cursor-pointer shrink-0"
              >
                <Plus size={14} />
              </button>
            </div>
            
            {/* Context feedback of current simulated day */}
            <p className="text-[10px] text-slate-400 font-medium">Hoje é dia <span className="font-bold text-slate-600">13 de Junho</span>. Faltam exatamente 17 dias corridos para o fim de Junho.</p>
          </div>

          {/* Extra Simulated Large Order Box */}
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-650 font-bold flex items-center gap-1">
                <span>Simular Nova Venda</span>
                <Sparkles size={11} className="text-amber-500 shrink-0" />
              </span>
              <span className="font-extrabold text-amber-650 font-mono text-[12.5px] text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-md">
                +{formatValue(simulatedExtraSale)}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSimulatedExtraSale(0)}
                className="text-[9.5px] font-bold px-2 py-1.5 rounded bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 cursor-pointer"
              >
                Zerar
              </button>
              <button
                type="button"
                onClick={() => setSimulatedExtraSale(prev => prev + 500)}
                className="flex-1 text-[9.5px] font-bold py-1.5 rounded bg-white hover:bg-pink-50 text-pink-650 border border-pink-100 cursor-pointer text-center"
              >
                + R$500
              </button>
              <button
                type="button"
                onClick={() => setSimulatedExtraSale(prev => prev + 1500)}
                className="flex-1 text-[9.5px] font-bold py-1.5 rounded bg-white hover:bg-pink-50 text-pink-650 border border-pink-100 cursor-pointer text-center"
              >
                + R$1,5k
              </button>
              <button
                type="button"
                onClick={() => setSimulatedExtraSale(prev => prev + 3000)}
                className="flex-1 text-[9.5px] font-bold py-1.5 rounded bg-white hover:bg-pink-50 text-pink-650 border border-pink-100 cursor-pointer text-center"
              >
                + R$3k
              </button>
            </div>
            <p className="text-[9.5px] text-slate-400">Verifique o impacto no gráfico e na meta diária adicionando vendas previstas fictícias.</p>
          </div>

        </div>

        {/* R: Dynamic Dashboard & Performance Projection (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Main Key indicators strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4 font-sans text-left">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Faturado Real</span>
              <span className="text-sm font-extrabold text-slate-800 font-mono mt-0.5 block">{formatValue(realizedRevenue)}</span>
              {simulatedExtraSale > 0 && (
                <span className="text-[9.5px] text-amber-650 font-bold block mt-0.5">({formatValue(totalWithSimulated)} com simulação)</span>
              )}
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Falta Vender</span>
              <span className={`text-sm font-extrabold font-mono mt-0.5 block ${remainingToGoal === 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                {remainingToGoal === 0 ? 'R$ 0,00' : formatValue(remainingToGoal)}
              </span>
              <span className="text-[9.5px] text-slate-400 font-semibold block mt-0.5">para meta</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Média Diária</span>
              <span className="text-sm font-extrabold text-indigo-700 font-mono mt-0.5 block">{formatValue(currentDailyAverage)}</span>
              <span className="text-[9.5px] text-slate-400 font-semibold block mt-0.5">histórica</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Meta Diária Req.</span>
              <span className={`text-sm font-extrabold font-mono mt-0.5 block ${paceAnalysis.color === 'pink' ? 'text-pink-600 font-black' : 'text-emerald-600'}`}>
                {formatValue(requiredDailyAverage)}
              </span>
              <span className="text-[9.5px] text-slate-400 font-semibold block mt-0.5">nos {remainingDays} dias</span>
            </div>
          </div>

          {/* Multi-layered Visual progress trajectory bar */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex flex-col gap-2 font-sans text-left">
            <div className="flex justify-between items-center text-xs select-none">
              <span className="font-bold text-slate-600">Progresso Geral Acumulado</span>
              <span className="font-extrabold text-pink-650 text-right">{percentageReached}%</span>
            </div>
            
            {/* Visual Bar with nice rounding and dual fill (orange highlight for simulated extra sale) */}
            <div className="w-full h-3.5 bg-slate-250 rounded-full overflow-hidden relative border border-slate-200">
              <div 
                className="h-full bg-gradient-to-r from-pink-500 to-pink-650 transition-all duration-300 rounded-full"
                style={{ width: `${Math.min(100, (realizedRevenue / monthlyGoal) * 100)}%` }}
              />
              {simulatedExtraSale > 0 && (
                <div 
                  className="h-full bg-amber-400 absolute top-0 block animate-pulse duration-1000"
                  style={{ 
                    left: `${Math.min(100, (realizedRevenue / monthlyGoal) * 100)}%`,
                    width: `${Math.min(100 - (realizedRevenue / monthlyGoal) * 105, (simulatedExtraSale / monthlyGoal) * 100)}%` 
                  }}
                />
              )}
            </div>
            <div className="flex justify-between text-[9px] text-slate-400">
              <span>Começo (R$ 0)</span>
              <span>Hoje (Dia 13)</span>
              <span>Meta ({formatValue(monthlyGoal)})</span>
            </div>
          </div>

          {/* Actionable status message box based on calculations */}
          <div className={`p-4 rounded-2xl text-left border ${
            paceAnalysis.color === 'emerald' 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
              : paceAnalysis.color === 'indigo'
                ? 'bg-indigo-50 border-indigo-100 text-indigo-800'
                : 'bg-pink-50 border-pink-100 text-pink-800'
          }`}>
            <div className="flex items-start gap-2.5">
              <div className="shrink-0 mt-0.5">
                {paceAnalysis.color === 'emerald' && <CheckCircle2 size={16} className="text-emerald-600" />}
                {paceAnalysis.color === 'indigo' && <CheckCircle2 size={16} className="text-indigo-600" />}
                {paceAnalysis.color === 'pink' && <AlertCircle size={16} className="text-pink-600" />}
              </div>
              <div>
                <h4 className="font-extrabold text-xs tracking-tight">{paceAnalysis.message}</h4>
                <p className={`text-[10.5px] mt-1 font-sans ${
                  paceAnalysis.color === 'emerald' 
                    ? 'text-emerald-700/80' 
                    : paceAnalysis.color === 'indigo'
                      ? 'text-indigo-700/80'
                      : 'text-pink-700/80'
                }`}>
                  Ao manter um ritmo diário de <strong className="font-mono">{formatValue(requiredDailyAverage)}</strong>, você atinge o planejado sem estresse de última hora.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Trajectory Graph Plot */}
      <div className="bg-slate-50/30 border border-slate-50 rounded-2xl p-4 flex flex-col gap-3 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-50 pb-3 gap-2">
          <div>
            <h4 className="text-xs font-extrabold text-slate-700 tracking-tight font-sans">Trajetória e Simulação de Velocidade</h4>
            <p className="text-[10px] text-slate-400 font-sans mt-0.5">Desvio ideal vs. real do faturamento e a reta de aceleração necessária para finalizar o mês na meta</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 select-none self-end sm:self-auto">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-dashed border-t border-amber-500 inline-block" />
              <span>Meta Linear</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-pink-500 inline-block" />
              <span>Acumulado Real</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-dashed border-t-2 border-indigo-500 inline-block" />
              <span>Reta de Projeção</span>
            </div>
          </div>
        </div>

        {/* Recharts Canvas */}
        <div className="h-44 md:h-52 w-full mt-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trajectoryChartData} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} tickLine={false} />
              <YAxis 
                stroke="#94A3B8" 
                fontSize={9} 
                tickLine={false} 
                tickFormatter={(val) => `R$${val >= 1000 ? `${val / 1000}k` : val}`}
              />
              <Tooltip 
                formatter={(value: any, name: any) => [
                  formatValue(Number(value)),
                  name
                ]}
                contentStyle={{ fontSize: '11px', fontFamily: 'sans-serif' }}
              />
              {/* Reference straight target path */}
              <Line 
                type="monotone" 
                dataKey="Meta Linear Constant" 
                name="Meta Linear Recomendada" 
                stroke="#F59E0B" 
                strokeWidth={1} 
                strokeDasharray="4 4" 
                dot={false}
                activeDot={false} 
              />
              {/* Real historical cumulative line */}
              <Line 
                type="monotone" 
                dataKey="Realizado Concluído" 
                name="Faturamento Acumulado Real" 
                stroke="#EC4899" 
                strokeWidth={3} 
                dot={{ r: 2, fill: '#EC4899' }}
                activeDot={{ r: 4 }} 
              />
              {/* Required remaining future path to catch up and hit target */}
              <Line 
                type="monotone" 
                dataKey="Reta de Projeção Requerida" 
                name="Aceleração Requerida" 
                stroke="#4F46E5" 
                strokeWidth={2} 
                strokeDasharray="3 3"
                dot={{ r: 1.5, fill: '#4F46E5' }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Roteiro e Dicas Estratégicas (Funnels) */}
      {showHelperTips && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-5 animate-fade-in text-left">
          {paceAnalysis.tips.map((tip, idx) => (
            <div 
              key={idx} 
              className={`p-3.5 rounded-xl border flex gap-2.5 transition-all hover:shadow-xs font-sans ${
                paceAnalysis.status === 'warning' 
                  ? 'bg-rose-50/30 border-rose-100' 
                  : paceAnalysis.status === 'on_track'
                    ? 'bg-indigo-50/20 border-indigo-100'
                    : 'bg-emerald-50/20 border-emerald-100'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                <Sparkles size={14} className={`
                  ${paceAnalysis.status === 'warning' ? 'text-pink-500' : ''}
                  ${paceAnalysis.status === 'on_track' ? 'text-indigo-500' : ''}
                  ${paceAnalysis.status === 'goal_achieved' ? 'text-emerald-500' : ''}
                `} />
              </div>
              <div>
                <h5 className="font-black text-[11px] text-slate-700 uppercase tracking-wider">Ação Recomendada {idx + 1}</h5>
                <p className="text-[10.5px] text-slate-500 mt-1 leading-relaxed">{tip}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
