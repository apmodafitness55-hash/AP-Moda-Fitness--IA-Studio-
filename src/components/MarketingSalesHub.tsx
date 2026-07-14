/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Video, 
  Instagram, 
  MessageSquare, 
  Copy, 
  Check, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Play, 
  Layers, 
  Heart, 
  Smartphone, 
  MessageCircle, 
  CheckCircle2, 
  HelpCircle,
  Megaphone
} from 'lucide-react';

interface ScriptItem {
  id: string;
  title: string;
  badge: string;
  vibe: string;
  audio: string;
  hook: string;
  scenes: { visual: string; audio: string; timing: string }[];
  caption: string;
}

interface StoryDynamic {
  id: string;
  title: string;
  objective: string;
  stories: { step: string; type: string; design: string; copy: string; interaction?: string }[];
}

interface HookItem {
  id: string;
  title: string;
  channel: 'WhatsApp' | 'Instagram';
  scenario: string;
  message: string;
}

export function MarketingSalesHub() {
  const [activeSection, setActiveSection] = useState<'reels' | 'stories' | 'conversao'>('reels');
  const [expandedScript, setExpandedScript] = useState<string | null>('reels_1');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const reelsScripts: ScriptItem[] = [
    {
      id: 'reels_1',
      title: 'Desafio Mix & Match — 3 looks perfeitos com apenas 2 peças',
      badge: 'Foco: Mix & Match',
      vibe: 'Estética Clean, Transições Rápidas, Enérgica',
      audio: 'Música eletrônica ou lo-fi luxuoso com batida marcada (áudio em alta)',
      hook: 'Mostre na prática como multiplicar o guarda-roupa fitness economizando!',
      scenes: [
        {
          visual: 'Close elegante na etiqueta de poliamida biodegradável premium da AP Moda Fitness. A modelo segura um Top Avulso e duas Leggings/Shorts diferentes.',
          audio: '“Você sabia que dá pra montar 3 looks totalmente diferentes com apenas 2 peças da AP Moda Fitness? Vem ver o poder do nosso Mix & Match!”',
          timing: '0s - 3s'
        },
        {
          visual: 'Transição rápida de batida (corte seco). Modelo veste o Top combinando com a Legging 1. Gira de costas mostrando a costura reforçada e zero transparência.',
          audio: '“Look 1: clássico monocromático. Alta compressão, costuras anatômicas que valorizam as curvas e conforto extremo para o agachamento pesado.”',
          timing: '3s - 7s'
        },
        {
          visual: 'Transição rápida (salto ou estalo de dedos). Modelo mantém o mesmo Top, mas troca para a Legging 2 em tom contrastante. Adiciona uma jaqueta ou boné opcional.',
          audio: '“Look 2: contraste moderno! Mix de cores pensado para transitar do treino ao pós-treino sem perder o estilo.”',
          timing: '7s - 11s'
        },
        {
          visual: 'Modelo amarra um casaco na cintura ou veste uma terceira peça leve que harmoniza com as duas cores anteriores.',
          audio: '“Look 3: casual esportivo completo. E o melhor: comprando as peças avulsas para montar seu próprio conjunto no site, você ganha 5% OFF automático na hora!”',
          timing: '11s - 15s'
        }
      ],
      caption: `Multiplique seus treinos com estilo! 🏋️‍♀️✨

Quem disse que você precisa de mil roupas para treinar linda e confortável todos os dias? Com o nosso recurso Mix & Match, você combina peças avulsas de alta tecnologia para criar looks exclusivos e com caimento perfeito.

E tem bônus de fábrica: ao escolher peças avulsas para montar sua combinação preferida, você ganha 5% de desconto automático no carrinho de compras!

Peças em poliamida biodegradável premium, zero transparência e proteção UV. 

👉 Acesse o link da nossa bio e monte suas combinações perfeitas agora mesmo! 

#apmodafitness #mixandmatch #lookdetreino #fitnesspremium #modafitness #suorcomestilo`
    },
    {
      id: 'reels_2',
      title: 'O Fim da Transparência no Treino (Prova de Fogo)',
      badge: 'Foco: Qualidade Premium',
      vibe: 'Dinâmico, Confiante, Close nos Detalhes',
      audio: 'Áudio narrado em tom de segredo ou descoberta, com batida eletrônica envolvente',
      hook: 'Quebre a maior objeção das clientes de forma visual e impactante.',
      scenes: [
        {
          visual: 'A modelo se posiciona de costas na luz do dia e faz um agachamento profundo clássico usando uma legging escura da marca.',
          audio: '“A prova de fogo de qualquer legging fitness: o agachamento na luz clara. Zero transparência, zero marcação.”',
          timing: '0s - 4s'
        },
        {
          visual: 'Close super aproximado no tecido sendo esticado com as mãos. Mostra o brilho discreto e a textura encorpada da poliamida biodegradável.',
          audio: '“Nosso tecido de poliamida biodegradável premium possui alta gramatura e tecnologia de dupla cobertura, garantindo segurança absoluta em qualquer movimento.”',
          timing: '4s - 8s'
        },
        {
          visual: 'A modelo sorri e mostra o site aberto no celular com o Provador Virtual ativo inserindo suas medidas.',
          audio: '“Medo de errar o tamanho? É só usar o Provador Virtual no nosso site. Ele te dá o caimento exato para o seu corpo em 15 segundos.”',
          timing: '8s - 12s'
        },
        {
          visual: 'Modelo caminha confiante em direção à câmera, exibindo o visual completo com top e legging harmonizados.',
          audio: '“Conforto, segurança e tecnologia de verdade. Garanta o seu look hoje e parcele em até 6x sem juros!”',
          timing: '12s - 15s'
        }
      ],
      caption: `Você treina com medo da transparência? ❌🏋️‍♀️

Na AP Moda Fitness, a segurança vem em primeiro lugar. Nossas Leggings e Shorts de alta performance são desenvolvidos com Poliamida Biodegradável de altíssima gramatura e dupla cobertura. 

✅ Zero Transparência
✅ Alta Compressão (Modela sem apertar)
✅ Cós Alto Anatômico que não enrola no treino
✅ Provador Virtual integrado para você escolher o tamanho perfeito sem errar!

Clique no botão da nossa loja online na bio, experimente o Provador Virtual e sinta a diferença no seu próximo treino!

#zerotransparencia #poliamidabiodegradavel #tecnologiafitness #lookdetreino #apmodafitness`
    },
    {
      id: 'reels_3',
      title: 'Transição Estilo Glow Up — Do Desânimo ao Look Imbatível',
      badge: 'Foco: Desejo e Status',
      vibe: 'Estética Luxury, Transição Impactante, Slow Motion',
      audio: 'Transição de áudio: som abafado ou preguiçoso para uma batida pop/luxo super nítida',
      hook: 'Desperte o desejo imediato de vestir AP Moda Fitness para melhorar o ânimo do treino.',
      scenes: [
        {
          visual: 'Modelo aparece de pijama, com cabelo bagunçado, bocejando, segurando um copo de café com cara de desânimo na segunda-feira.',
          audio: '“Aquele desânimo clássico de começar a semana de treino... Quem nunca?”',
          timing: '0s - 3s'
        },
        {
          visual: 'A modelo joga o pijama na lente da câmera. Transição rápida de corte por cobertura.',
          audio: '“Mas o segredo para destravar a endorfina começa na hora de vestir...”',
          timing: '3s - 5s'
        },
        {
          visual: 'Modelo surge deslumbrante em slow motion com um conjunto Mix & Match da nova coleção exclusiva. Detalhe da cintura alta modelada e postura perfeita.',
          audio: '“Um conjunto premium que abraça seu corpo, modela as curvas e te deixa pronta para vencer qualquer meta.”',
          timing: '5s - 11s'
        },
        {
          visual: 'Modelo sorri, arruma o cabelo e faz uma pose elegante mostrando o caimento perfeito no busto e quadril.',
          audio: '“Você não precisa de motivação, você precisa do look certo. Encontre o seu na nossa vitrine online. Link na bio!”',
          timing: '11s - 15s'
        }
      ],
      caption: `Aquele empurrãozinho que faltava para o seu treino! 💪✨

Você sabia que o look certo pode aumentar seu rendimento e auto-estima no treino? Vestir uma peça que modela perfeitamente, não enrola e te deixa segura muda o seu jogo!

Nossos conjuntos premium unem engenharia têxtil de ponta com um design impecável para que você se sinta maravilhosa do primeiro ao último exercício.

🛍️ Frete grátis para compras acima de R$ 399,00!
🛍️ 5% OFF combinando peças avulsas!

Visite nossa loja online e garanta sua armadura de bem-estar.

#glowupdetreino #lookfitness #autoestima #apmodafitness #treinolindo #estilofitness`
    }
  ];

  const storiesDynamics: StoryDynamic[] = [
    {
      id: 'story_1',
      title: 'Funil Interativo do Desejo (Sequência de 3 Stories)',
      objective: 'Engajamento rápido de audiência e ativação de vendas indiretas no Instagram.',
      stories: [
        {
          step: 'Story 1 (Manhã)',
          type: 'Interativo (Enquete)',
          design: 'Foto elegante de fundo com um conjunto monocromático azul-marinho e preto em luz natural.',
          copy: '“Qual é a maior vilã do seu treino de pernas hoje?”',
          interaction: 'Enquete com 2 opções: 1. Legging descendo/enrolando | 2. Medo da transparência'
        },
        {
          step: 'Story 2 (Tarde)',
          type: 'Educativo + Solução',
          design: 'Vídeo curto mostrando de perto o tecido de Poliamida de dupla cobertura e o elástico anatômico interno do cós.',
          copy: '“Se você respondeu qualquer uma das duas, o problema não é você, é o tecido! Nossas leggings contam com tecnologia de dupla cobertura (zero transparência) e cós anatômico modelador que fica no lugar o treino inteiro. 💆‍♀️✨”'
        },
        {
          step: 'Story 3 (Final do dia)',
          type: 'Chamada para Ação (CTA)',
          design: 'Print elegante da página do produto mostrando o botão do Provador Virtual e o cupom aplicado.',
          copy: '“Para você testar e nunca mais sofrer no treino: use o cupom BEMVINDA50 para garantir R$ 50 OFF na sua primeira compra! Digite seu tamanho ou simule no nosso Provador Virtual rápido para escolher sem erro. Clique no link e garanta o seu! 🚀👇”',
          interaction: 'Figurinha de Link apontando para o catálogo da loja online.'
        }
      ]
    },
    {
      id: 'story_2',
      title: 'Duelo Mix & Match — Ajude a Escolher o Look',
      objective: 'Mostrar a versatilidade das combinações avulsas e guiar a audiência para fechar no site com desconto.',
      stories: [
        {
          step: 'Story 1',
          type: 'Duelo Estético',
          design: 'Montagem limpa em tela dividida: Lado A (Top Preto + Legging Violeta) vs Lado B (Top Violeta + Legging Preta).',
          copy: '“Batalha de hoje: Qual combinação do nosso recurso Mix & Match combina mais com seu estilo de treino hoje? 💜🖤”',
          interaction: 'Enquete/Duelo: Lado A 🖤 vs Lado B 💜'
        },
        {
          step: 'Story 2',
          type: 'Revelação do Desconto',
          design: 'Vídeo da modelo mostrando o look vencedor em movimento na frente do espelho.',
          copy: '“Vocês escolheram muito bem! Sabia que combinando essas duas peças avulsas o nosso site aplica 5% DE DESCONTO AUTOMÁTICO no conjunto? Sim, você monta do seu jeito (tamanhos diferentes em cima e embaixo se precisar) e o desconto entra na hora! 😍”'
        },
        {
          step: 'Story 3',
          type: 'Garantia de Tamanho',
          design: 'A modelo mostra as duas peças e simula o Provador Virtual rápido.',
          copy: '“Sem desculpa de errar tamanho: o Provador Virtual te dá a sugestão exata para o busto, quadril e cintura. Clique no link para garantir a sua combinação com desconto! 🛍️✨”',
          interaction: 'Figurinha de Link para a Vitrine Mix & Match.'
        }
      ]
    }
  ];

  const conversionHooks: HookItem[] = [
    {
      id: 'hook_1',
      title: 'WhatsApp: Quebrando a Objeção de Tamanho (Provador Virtual)',
      channel: 'WhatsApp',
      scenario: 'Para clientes que visitaram o site, adicionaram itens, mas não finalizaram por medo do caimento/tamanho.',
      message: `Olá, [Nome da Cliente]! Tudo bem? 🌸

Vi que você deu uma olhadinha em algumas peças incríveis da nossa nova coleção de Alta Performance no site, mas acabou não finalizando o pedido.

Muitas clientes ficam na dúvida sobre qual tamanho escolher e se a peça vai vestir bem. Para te dar 100% de segurança, nós temos um Provador Virtual incrível e super rápido na nossa loja online! 

Basta colocar sua altura, peso e idade, e ele te mostra exatamente como cada peça vai vestir no seu corpo (indicando se vai ficar mais justa, ideal ou folgada). 

Assim você compra de fábrica sem nenhum medo de errar! Além disso, lembrando que se precisar trocar, nossa primeira troca é grátis e super descomplicada. 😊

Deseja que eu te envie o link direto do produto com o Provador Virtual ativo para você testar?`
    },
    {
      id: 'hook_2',
      title: 'Instagram: Script de Abordagem Direct para Leads de Enquetes',
      channel: 'Instagram',
      scenario: 'Mensagem para enviar no Direct das clientes que interagiram com enquetes sobre "Legging enrolando" ou "Transparência".',
      message: `Olá, [Nome do Usuário]! Tudo bem? 💖

Muito obrigada por votar na nossa enquete hoje! Vi que você também sofre com as leggings que ficam descendo ou enrolando na hora de treinar...

Ninguém merece ter que parar o treino para ficar subindo a calça, né? Por isso nós criamos a linha de Leggings Alta Performance com cós anatômico de dupla compressão e costura reforçada. Elas literalmente abraçam a sua cintura e ficam firmes o treino inteiro!

Para te ajudar a escolher o tamanho perfeito e resolver esse problema de vez, o nosso site tem o Provador Virtual. Você coloca suas medidas em segundos e ele indica o tamanho exato para não enrolar e nem ficar transparente.

Vou te dar um mimo especial de boas-vindas: com o cupom BEMVINDA50 você garante R$ 50,00 de desconto no seu primeiro pedido!

Quer que eu te envie o link da nossa coleção com o provador ativo para você simular? 🌸`
    },
    {
      id: 'hook_3',
      title: 'WhatsApp: Quebrando a Objeção de Trocas & Devoluções',
      channel: 'WhatsApp',
      scenario: 'Mensagem para enviar quando a cliente responde dizendo que "tem medo de comprar online e ter dor de cabeça para trocar".',
      message: `Compreendo perfeitamente sua preocupação, [Nome da Cliente]! Comprar roupa online dá aquele friozinho na barriga por conta do tamanho mesmo. 

Mas aqui na AP Moda Fitness nós cuidamos de tudo para você treinar sem preocupações:

1️⃣ Nós temos o Provador Virtual no site, que tem 98% de precisão baseada em milhares de biotipos reais. É só colocar peso e altura!
2️⃣ Se mesmo assim você precisar ajustar, a nossa Primeira Troca é totalmente Grátis e sem burocracia. Nós enviamos o código de postagem sem custo algum para você!
3️⃣ Nosso tecido tem alta flexibilidade com fibras de elastano premium, ou seja, ele se molda confortavelmente ao seu corpo.

Que tal escolhermos o seu look hoje com R$ 50 de desconto usando o cupom BEMVINDA50? Posso te guiar na escolha do tamanho ideal agora mesmo se preferir! 😊`
    }
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Header Panel */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-6 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-2">
              <span className="bg-pink-600/20 text-pink-400 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border border-pink-500/20">
                Apoio Comercial & Gestão
              </span>
              <span className="bg-emerald-600/20 text-emerald-400 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border border-emerald-500/20">
                Vendas Instagram & WhatsApp
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight font-sans">
              Central de Marketing & Vendas
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl font-medium">
              Acelere as vendas no varejo da AP Moda Fitness utilizando roteiros prontos de Reels, dinâmicas de Stories interativos e ganchos de alta conversão focados no Provador Virtual e no Mix & Match.
            </p>
          </div>
          <div className="flex items-center gap-1.5 self-start md:self-center bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/60">
            <Megaphone size={16} className="text-pink-500 ml-1.5 shrink-0 animate-bounce" />
            <span className="text-[10px] font-bold text-slate-200 uppercase tracking-wider mr-2">Suporte comercial ativo</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/60 max-w-md">
        <button
          type="button"
          onClick={() => setActiveSection('reels')}
          className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer border-none font-sans text-xs font-bold ${
            activeSection === 'reels'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'bg-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Video size={14} className={activeSection === 'reels' ? 'text-pink-600' : 'text-slate-450'} />
          <span>Roteiros Reels</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('stories')}
          className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer border-none font-sans text-xs font-bold ${
            activeSection === 'stories'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'bg-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Instagram size={14} className={activeSection === 'stories' ? 'text-pink-600' : 'text-slate-450'} />
          <span>Dinâmicas de Stories</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('conversao')}
          className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer border-none font-sans text-xs font-bold ${
            activeSection === 'conversao'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'bg-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare size={14} className={activeSection === 'conversao' ? 'text-pink-600' : 'text-slate-450'} />
          <span>Ganchos WhatsApp</span>
        </button>
      </div>

      {/* Tab: Reels Scripts */}
      {activeSection === 'reels' && (
        <div className="space-y-4 text-left">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers size={16} className="text-pink-600" />
              Banco de Roteiros para Reels (Foco em Mix & Match)
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold font-mono">
              {reelsScripts.length} roteiros disponíveis
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {reelsScripts.map((script) => {
              const isExpanded = expandedScript === script.id;
              return (
                <div 
                  key={script.id} 
                  className={`bg-white border rounded-3xl transition-all overflow-hidden ${
                    isExpanded ? 'border-pink-500/40 shadow-xs' : 'border-slate-200 hover:border-slate-350'
                  }`}
                >
                  {/* Header summary row */}
                  <div 
                    onClick={() => setExpandedScript(isExpanded ? null : script.id)}
                    className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none bg-slate-50/40 hover:bg-slate-50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-pink-100 text-pink-700 font-sans text-[8.5px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {script.badge}
                        </span>
                        <span className="text-[9.5px] text-slate-450 font-semibold flex items-center gap-1">
                          <Play size={10} className="text-slate-400" /> Vibe: {script.vibe}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-850 leading-tight">
                        {script.title}
                      </h4>
                    </div>
                    <div className="text-slate-400 p-1 hover:text-slate-600 shrink-0">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 p-5 space-y-5 animate-in fade-in duration-200">
                      {/* Contextual Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 rounded-2xl p-3.5 border border-slate-150 text-[10.5px]">
                        <div>
                          <span className="font-bold text-slate-500 uppercase tracking-wider text-[8.5px] block mb-0.5">Áudio Sugerido</span>
                          <p className="text-slate-800 font-semibold">{script.audio}</p>
                        </div>
                        <div>
                          <span className="font-bold text-slate-500 uppercase tracking-wider text-[8.5px] block mb-0.5">Gancho Inicial (Hook)</span>
                          <p className="text-slate-800 font-semibold">{script.hook}</p>
                        </div>
                      </div>

                      {/* Scene Breakdown */}
                      <div className="space-y-3">
                        <h5 className="font-extrabold text-[10px] text-slate-450 uppercase tracking-wider">Roteiro de Cenas & Gravação</h5>
                        <div className="relative border-l-2 border-pink-100 pl-4 ml-2 space-y-4">
                          {script.scenes.map((scene, idx) => (
                            <div key={idx} className="relative space-y-1">
                              <span className="absolute -left-[23px] top-0 w-3 h-3 rounded-full bg-pink-500 border-2 border-white shadow-xs" />
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-pink-600">Cena {idx + 1}</span>
                                <span className="text-[9px] font-mono text-slate-450 bg-slate-100 px-1.5 py-0.25 rounded-md">{scene.timing}</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10.5px]">
                                <div className="bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                                  <span className="font-bold text-slate-500 block text-[8px] uppercase tracking-wide mb-0.5">Visual (O que gravar)</span>
                                  <p className="text-slate-700 leading-relaxed font-medium">{scene.visual}</p>
                                </div>
                                <div className="bg-pink-50/15 p-2.5 rounded-xl border border-pink-100/20">
                                  <span className="font-bold text-pink-500 block text-[8px] uppercase tracking-wide mb-0.5">Locução / Áudio (O que falar)</span>
                                  <p className="text-slate-800 leading-relaxed font-semibold italic">“{scene.audio}”</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Caption Box with Copy Button */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex justify-between items-center">
                          <h5 className="font-extrabold text-[10px] text-slate-450 uppercase tracking-wider">Legenda Sugerida (Pronta para Copy)</h5>
                          <button
                            type="button"
                            onClick={() => handleCopy(script.caption, script.id)}
                            className="text-[9.5px] font-sans font-bold text-pink-600 border border-pink-200 hover:bg-pink-50 hover:border-pink-300 py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                          >
                            {copiedText === script.id ? (
                              <>
                                <Check size={12} className="text-emerald-600" />
                                <span className="text-emerald-600">Texto Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={12} />
                                <span>Copiar Legenda</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="bg-slate-900 text-slate-100 text-[10.5px] rounded-2xl p-4 font-mono whitespace-pre-wrap leading-relaxed text-left max-h-56 overflow-y-auto border border-slate-800 scrollbar-thin">
                          {script.caption}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Stories Dynamics */}
      {activeSection === 'stories' && (
        <div className="space-y-4 text-left">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Instagram size={16} className="text-pink-600" />
              Roteiros de Stories Interativos & Enquetes
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold font-mono">
              Ideias com foco em engajamento de varejo
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {storiesDynamics.map((dynamic) => (
              <div key={dynamic.id} className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 hover:shadow-xs transition">
                <div className="space-y-1 border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-extrabold text-slate-850 flex items-center gap-2">
                    <Sparkles size={14} className="text-pink-500 shrink-0" />
                    {dynamic.title}
                  </h4>
                  <p className="text-[10.5px] text-slate-500 font-semibold">
                    <span className="font-extrabold text-slate-700 uppercase text-[8.5px] tracking-wider block">Objetivo Comercial</span>
                    {dynamic.objective}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dynamic.stories.map((story, index) => (
                    <div key={index} className="bg-slate-50 rounded-2xl p-4 border border-slate-150 flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="bg-slate-900 text-white font-sans text-[8px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                            {story.step}
                          </span>
                          <span className="bg-pink-100 text-pink-700 font-sans text-[7.5px] font-extrabold px-1.5 py-0.25 rounded-md uppercase tracking-wide">
                            {story.type}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-450 font-semibold leading-snug">
                          <span className="font-bold text-slate-600 block text-[8px] uppercase tracking-wider">Sugestão de Visual/Design:</span>
                          {story.design}
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-slate-100 text-[10.5px] text-slate-850 font-medium italic relative min-h-[80px] flex items-center">
                          “{story.copy}”
                        </div>
                        {story.interaction && (
                          <div className="bg-pink-50/30 border border-pink-100/50 rounded-xl p-2.5 text-[9.5px]">
                            <span className="font-bold text-pink-600 block text-[8px] uppercase tracking-wider mb-0.5">Enquete/Sticker Interativo:</span>
                            <span className="font-bold text-slate-800">{story.interaction}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-200/50">
                        <button
                          type="button"
                          onClick={() => handleCopy(story.copy, `${dynamic.id}_s_${index}`)}
                          className="w-full text-center text-[9px] font-sans font-bold text-slate-600 hover:text-pink-600 bg-white border border-slate-200 hover:border-pink-300 py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          {copiedText === `${dynamic.id}_s_${index}` ? (
                            <>
                              <Check size={11} className="text-emerald-600" />
                              <span className="text-emerald-600">Copy de Story Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={11} />
                              <span>Copiar Texto do Story</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: WhatsApp Ganchos de Conversão */}
      {activeSection === 'conversao' && (
        <div className="space-y-4 text-left">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <MessageCircle size={16} className="text-pink-600" />
              Abordagem & Quebra de Objeção via Provador Virtual
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold font-mono">
              Ganchos prontos para celular & redes
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {conversionHooks.map((hook) => (
              <div key={hook.id} className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 hover:shadow-xs transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="space-y-0.5">
                    <span className="bg-emerald-100 text-emerald-800 font-sans text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-200/30">
                      {hook.channel}
                    </span>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-850">
                      {hook.title}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(hook.message, hook.id)}
                    className="self-start sm:self-center text-[9.5px] font-sans font-bold text-pink-600 border border-pink-200 hover:bg-pink-50 hover:border-pink-300 py-1.5 px-3.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedText === hook.id ? (
                      <>
                        <Check size={12} className="text-emerald-600" />
                        <span className="text-emerald-600">Copiado para o Zap!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copiar Mensagem</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-150 text-[10px] text-slate-500 font-semibold leading-relaxed">
                  <span className="font-extrabold text-slate-700 uppercase text-[8.5px] tracking-wider block mb-0.5">Cenário de Aplicação comercial:</span>
                  {hook.scenario}
                </div>

                <div className="bg-slate-950 text-emerald-100 rounded-2xl p-4 font-mono text-[10.5px] leading-relaxed max-h-64 overflow-y-auto border border-slate-850 whitespace-pre-wrap text-left scrollbar-thin">
                  {hook.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Support footer info */}
      <div className="bg-pink-50/20 border border-pink-100/50 rounded-3xl p-4 flex items-start gap-3 text-left">
        <CheckCircle2 size={16} className="text-pink-600 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <span className="font-extrabold text-[9.5px] text-pink-900 uppercase tracking-wide block">Dica de Sucesso Comercial</span>
          <p className="text-[10px] text-slate-500 font-semibold leading-normal">
            Sempre que abordar uma cliente indecisa ou que abandonou carrinho, envie o link direto do produto personalizado. Lembre-a de que o <strong>Provador Virtual</strong> calcula as proporções exatas do corpo para evitar devoluções e garantir compressão firme com costuras que não marcam.
          </p>
        </div>
      </div>
    </div>
  );
}
