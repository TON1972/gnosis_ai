import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, BookOpen, GraduationCap, Coins, CreditCard, HelpCircle, Home } from "lucide-react";
import { Link } from "wouter";
import { APP_LOGO, APP_TITLE } from "@/const";
import MobileMenu from "@/components/MobileMenu";
import { useAuth } from "@/_core/hooks/useAuth";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  icon: React.ReactNode;
  items: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    title: "Ferramentas de Estudo Bíblico",
    icon: <BookOpen className="w-5 h-5" />,
    items: [
      {
        question: "O que é a ferramenta de Hermenêutica?",
        answer: "A Hermenêutica é uma ferramenta que analisa o contexto histórico, cultural e literário dos textos bíblicos. Ela ajuda você a compreender o significado original das passagens, considerando o contexto em que foram escritas, os costumes da época e as nuances linguísticas."
      },
      {
        question: "Como funciona a ferramenta de Traduções?",
        answer: "Nossa ferramenta de Traduções permite consultar os textos originais em Hebraico, Aramaico e Grego, com análises detalhadas das palavras e suas múltiplas possibilidades de tradução. Isso proporciona uma compreensão mais profunda e precisa das Escrituras."
      },
      {
        question: "Para que serve a ferramenta de Resumos?",
        answer: "A ferramenta de Resumos cria sínteses personalizadas de passagens bíblicas, livros ou temas específicos. Você pode ajustar o nível de detalhamento e o foco do resumo conforme suas necessidades de estudo ou preparação de aulas."
      },
      {
        question: "Como os Esboços de Pregação podem me ajudar?",
        answer: "Os Esboços de Pregação fornecem estruturas organizadas para sermões, incluindo introdução, pontos principais, ilustrações sugeridas e aplicações práticas. É uma ferramenta essencial para pastores e pregadores na preparação de mensagens impactantes."
      },
      {
        question: "Qual a diferença entre Hermenêutica e Exegese?",
        answer: "A Hermenêutica foca no contexto histórico e cultural amplo, enquanto a Exegese oferece uma interpretação crítica e detalhada verso por verso, analisando aspectos gramaticais, sintáticos e teológicos específicos do texto."
      },
      {
        question: "Posso usar as ferramentas para estudo pessoal ou apenas para pregação?",
        answer: "Todas as ferramentas são versáteis e podem ser usadas tanto para estudo pessoal quanto para preparação de pregações, aulas de escola dominical, trabalhos acadêmicos ou grupos de estudo bíblico."
      }
    ]
  },
  {
    title: "Ferramentas Avançadas de Teologia",
    icon: <GraduationCap className="w-5 h-5" />,
    items: [
      {
        question: "O que são Estudos Doutrinários?",
        answer: "Os Estudos Doutrinários oferecem análises teológicas profundas sobre doutrinas específicas como salvação, trindade, escatologia, entre outras. A ferramenta apresenta diferentes perspectivas teológicas e fundamentação bíblica para cada doutrina."
      },
      {
        question: "Como funciona a Análise Teológica Comparada?",
        answer: "Esta ferramenta compara diferentes correntes teológicas (calvinismo, arminianismo, teologia da libertação, etc.) sobre temas específicos, apresentando os argumentos de cada posição de forma equilibrada e fundamentada biblicamente."
      },
      {
        question: "Para que serve a ferramenta de Religiões Comparadas?",
        answer: "A ferramenta de Religiões Comparadas permite estudar comparativamente o cristianismo e outras religiões, analisando crenças, práticas e textos sagrados. É útil para apologética, diálogo inter-religioso e compreensão cultural."
      },
      {
        question: "O que é Teologia Sistemática?",
        answer: "A Teologia Sistemática organiza os ensinamentos bíblicos em temas coerentes e inter-relacionados, oferecendo uma visão abrangente da fé cristã. A ferramenta ajuda a estudar temas como bibliologia, cristologia, pneumatologia, soteriologia e escatologia de forma estruturada."
      },
      {
        question: "O que é a ferramenta de Patrística?",
        answer: "A ferramenta de Patrística oferece acesso ao pensamento dos Pais da Igreja (séculos I-VIII), incluindo escritos de Agostinho, Orígenes, Tertuliano, Irineu e outros. Ela permite estudar como a teologia cristã foi desenvolvida nos primeiros séculos, analisando debates doutrinários, interpretações bíblicas e práticas eclesiásticas da igreja primitiva."
      },
      {
        question: "Como funciona a Linha do Tempo Teológica?",
        answer: "A Linha do Tempo Teológica apresenta uma visualização cronológica dos principais eventos, concílios, movimentos e teólogos da história da igreja. Ela permite compreender o desenvolvimento histórico das doutrinas cristãs, desde o período apostólico até os dias atuais, contextualizando reformas, cismas e transformações teológicas."
      },
      {
        question: "Para que serve a Apologética Avançada?",
        answer: "A Apologética Avançada fornece argumentos filosóficos, históricos e científicos em defesa da fé cristã. A ferramenta aborda questões complexas como a existência de Deus, a confiabilidade dos manuscritos bíblicos, a historicidade de Jesus, o problema do mal, e responde a objeções comuns ao cristianismo com rigor acadêmico e fundamentação sólida."
      },
      {
        question: "O que é a ferramenta de Escatologia Bíblica?",
        answer: "A Escatologia Bíblica oferece análise profunda dos eventos finais descritos nas Escrituras, incluindo estudo de profecias, interpretação do Apocalipse, diferentes visões escatológicas (pré-milenismo, pós-milenismo, amilenismo), sinais dos tempos e o plano divino para o futuro da humanidade. A ferramenta apresenta as principais correntes interpretativas com fundamentação bíblica e teológica."
      }
    ]
  },
  {
    title: "Ferramentas Acadêmicas e Práticas",
    icon: <GraduationCap className="w-5 h-5" />,
    items: [
      {
        question: "O que torna a Contextualização Brasileira única?",
        answer: "A Contextualização Brasileira oferece referências que os melhores softwares estrangeiros não possuem. Ela utiliza um corpus exclusivo com dados sobre a realidade brasileira, incluindo aspectos culturais, sociais e religiosos do Brasil, permitindo aplicações mais relevantes das Escrituras ao nosso contexto."
      },
      {
        question: "Como funciona o Gerador de Referências ABNT/APA?",
        answer: "Esta ferramenta formata automaticamente suas citações e referências bibliográficas nos padrões ABNT e APA, essenciais para trabalhos acadêmicos. Basta inserir os dados da fonte e a ferramenta gera a formatação correta."
      },
      {
        question: "Para que serve a Análise de Linguagem Ministerial?",
        answer: "A Análise de Linguagem Ministerial examina discursos, sermões e textos ministeriais, avaliando aspectos retóricos, teológicos e comunicacionais. É útil para aprimorar habilidades de pregação e comunicação."
      },
      {
        question: "Como o Assistente de Redação Acadêmica pode me ajudar?",
        answer: "O Assistente oferece auxílio na estruturação e desenvolvimento de trabalhos acadêmicos, incluindo monografias, artigos e teses teológicas. Ele sugere melhorias na argumentação, coerência e formatação do texto."
      },
      {
        question: "O que são os Dados Demográficos de igrejas?",
        answer: "Esta ferramenta fornece acesso a dados estatísticos sobre igrejas, denominações e movimentos religiosos no Brasil e no mundo, úteis para pesquisas, planejamento ministerial e compreensão de tendências religiosas."
      }
    ]
  },
  {
    title: "Sistema de Créditos",
    icon: <Coins className="w-5 h-5" />,
    items: [
      {
        question: "Como funciona o sistema de créditos da GNOSIS AI?",
        answer: "A GNOSIS AI utiliza três tipos de créditos: (1) Créditos Iniciais - cumulativos que são renovados a cada 30 dias, recebidos na assinatura e renovação mensal; (2) Créditos Diários - não-cumulativos, renovados diariamente; (3) Créditos Avulsos - permanentes, comprados separadamente e que nunca expiram."
      },
      {
        question: "Os créditos diários acumulam se eu não usar?",
        answer: "Não, os créditos diários são não-cumulativos. Eles são renovados diariamente no valor correspondente ao seu plano, mas não se acumulam de um dia para o outro. Já os créditos iniciais e avulsos são cumulativos."
      },
      {
        question: "Por quanto tempo os créditos iniciais são válidos?",
        answer: "Os créditos iniciais dos planos pagos (Aliança, Lumen e Premium) são renovados a cada 30 dias na renovação da assinatura. Você recebe novamente a quantidade completa de créditos iniciais do seu plano a cada ciclo mensal. Para o plano FREE, os 500 créditos iniciais NÃO são renováveis."
      },
      {
        question: "O que acontece quando meus créditos acabam?",
        answer: "Quando seus créditos acabam, você pode: (1) aguardar a renovação dos créditos diários no dia seguinte; (2) fazer upgrade para um plano superior; (3) comprar créditos avulsos que são permanentes e nunca expiram."
      },
      {
        question: "Em que ordem os créditos são utilizados?",
        answer: "Os créditos são consumidos na seguinte ordem de prioridade: primeiro os créditos diários, depois os créditos iniciais (se ainda válidos) e por último os créditos avulsos. Isso garante que você aproveite ao máximo seus créditos com prazo de validade antes de usar os permanentes."
      }
    ]
  },
  {
    title: "Planos de Assinatura",
    icon: <CreditCard className="w-5 h-5" />,
    items: [
      {
        question: "Quais são os planos disponíveis e seus preços?",
        answer: "Oferecemos 4 planos: FREE (gratuito), Aliança (R$ 19,98/mês), Lumen (R$ 36,98/mês) e GNOSIS Premium (R$ 68,98/mês). Cada plano oferece diferentes quantidades de créditos e acesso a ferramentas específicas."
      },
      {
        question: "Qual a diferença entre os planos?",
        answer: "FREE: 500 créditos iniciais (não-renováveis) + 50/dia, 6 ferramentas básicas. Aliança: 1.500 iniciais + 100/dia, 10 ferramentas. Lumen: 3.000 iniciais + 200/dia, todas as 19 ferramentas. Premium: 6.000 iniciais + 300/dia, todas as 19 ferramentas."
      },
      {
        question: "Quais ferramentas NÃO estão disponíveis no plano Aliança?",
        answer: "O plano Aliança não inclui 9 ferramentas avançadas: Exegese, Patrística, Linha do Tempo Teológica, Apologética Avançada, Gerador de Referências ABNT/APA, Redação Acadêmica, Dados Demográficos, Transcrição de Mídia e Escatologia Bíblica. Ele oferece 10 das 19 ferramentas disponíveis."
      },
      {
        question: "Posso testar antes de assinar?",
        answer: "Sim! O plano FREE permite testar 6 ferramentas básicas com 500 créditos iniciais e 50 créditos diários. É uma excelente forma de conhecer a plataforma antes de fazer upgrade para um plano pago."
      },
      {
        question: "Como funciona a renovação dos planos?",
        answer: "Os planos são renovados automaticamente a cada mês. A cada renovação, você recebe novamente os créditos iniciais do seu plano (renovados a cada 30 dias), além de continuar recebendo os créditos diários. Os créditos avulsos comprados permanecem sempre disponíveis."
      }
    ]
  },
  {
    title: "Funcionalidades Gerais",
    icon: <HelpCircle className="w-5 h-5" />,
    items: [
      {
        question: "A GNOSIS AI funciona offline?",
        answer: "Não, a GNOSIS AI é uma plataforma online que requer conexão com a internet para funcionar. Isso garante que você sempre tenha acesso às versões mais atualizadas das ferramentas e aos bancos de dados mais recentes."
      },
      {
        question: "Posso usar a GNOSIS AI em dispositivos móveis?",
        answer: "Sim! A plataforma é totalmente responsiva e funciona perfeitamente em smartphones, tablets e computadores. Você pode acessar suas ferramentas de estudo de qualquer dispositivo com navegador web."
      },
      {
        question: "Como funciona a ferramenta de Transcrição de Mídia?",
        answer: "A ferramenta de Transcrição converte áudios e vídeos (sermões, palestras, estudos) em texto escrito. É útil para criar arquivos de mensagens, facilitar estudos e tornar conteúdos mais acessíveis."
      },
      {
        question: "Meus dados e estudos ficam salvos na plataforma?",
        answer: "Sim, todos os seus estudos, pesquisas e histórico de uso ficam salvos de forma segura na plataforma. Você pode acessá-los a qualquer momento de qualquer dispositivo conectado à sua conta."
      },
      {
        question: "A GNOSIS AI substitui o estudo da Bíblia?",
        answer: "Não! A GNOSIS AI é uma ferramenta de apoio ao estudo bíblico, não um substituto. Ela foi desenvolvida para enriquecer e aprofundar seu estudo pessoal das Escrituras, fornecendo recursos que facilitam a compreensão e aplicação da Palavra de Deus."
      }
    ]
  }
];

function FAQAccordion({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-2 border-[#d4af37] rounded-lg overflow-hidden bg-gradient-to-br from-[#FFFACD] to-[#F0E68C] shadow-md hover:shadow-lg transition-shadow">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#F0E68C]/30 transition-colors"
      >
        <span className="font-semibold text-[#1e3a5f] pr-4">{item.question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-[#d4af37] flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[#d4af37] flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 py-4 border-t-2 border-[#d4af37] bg-[#FFFACD]">
          <p className="text-[#8b6f47] leading-relaxed">{item.answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  // Scroll to top when page loads (método robusto)
  useEffect(() => {
    // Método 1: Scroll imediato
    window.scrollTo(0, 0);
    // Método 2: Forçar scroll após pequeno delay
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
  }, []);

  const toggleItem = (categoryIndex: number, itemIndex: number) => {
    const key = `${categoryIndex}-${itemIndex}`;
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(key)) {
      newOpenItems.delete(key);
    } else {
      newOpenItems.add(key);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <div className="public-page min-h-screen bg-gradient-radial from-[#d4af37] via-[#DAA520] to-[#FFFACD]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#1e3a5f] shadow-lg border-b-4 border-[#d4af37]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/">
              <span className="flex items-center gap-4 hover:opacity-80 transition-opacity cursor-pointer">
                <img src={APP_LOGO} alt={APP_TITLE} className="h-16 w-16 object-contain" loading="lazy" />
                {/* Título completo para desktop */}
                <h1 className="hidden md:block text-3xl font-bold text-[#d4af37]">{APP_TITLE}</h1>
                {/* Título curto para mobile */}
                <h1 className="block md:hidden text-3xl font-bold text-[#d4af37]">GNOSIS AI</h1>
              </span>
            </Link>
            {/* Menu Hambúrguer (Desktop e Mobile) */}
            <div>
              <MobileMenu 
                isAuthenticated={!!useAuth().user} 
                onLogout={() => window.location.href = '/'}
                loginUrl="/auth"
                user={useAuth().user}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Page Title */}
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-[#1e3a5f] mb-4">
            Perguntas Frequentes
          </h2>
          <p className="text-xl text-[#8b6f47] max-w-3xl mx-auto">
            Encontre respostas para as principais dúvidas sobre a GNOSIS AI, suas ferramentas, planos e sistema de créditos.
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="max-w-5xl mx-auto space-y-12">
          {faqData.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-white/80 rounded-2xl p-8 shadow-xl border-4 border-[#d4af37]">
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-[#d4af37]">
                <div className="p-3 bg-[#1e3a5f] rounded-lg text-[#d4af37]">
                  {category.icon}
                </div>
                <h3 className="text-2xl font-bold text-[#1e3a5f]">{category.title}</h3>
              </div>

              {/* Category Items */}
              <div className="space-y-4">
                {category.items.map((item, itemIndex) => (
                  <FAQAccordion
                    key={itemIndex}
                    item={item}
                    isOpen={openItems.has(`${categoryIndex}-${itemIndex}`)}
                    onToggle={() => toggleItem(categoryIndex, itemIndex)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center bg-white/90 rounded-2xl p-12 max-w-4xl mx-auto shadow-2xl border-4 border-[#d4af37]">
          <h3 className="text-3xl font-bold text-[#1e3a5f] mb-4">
            Ainda tem dúvidas?
          </h3>
          <p className="text-lg text-[#8b6f47] mb-8">
            Nossa equipe está pronta para ajudar você a aproveitar ao máximo a GNOSIS AI.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/planos">
              <span 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="inline-block px-8 py-4 bg-[#1e3a5f] text-[#d4af37] rounded-lg font-bold text-lg hover:bg-[#2a4a7f] transition-colors shadow-lg cursor-pointer"
              >
                Começar Agora
              </span>
            </Link>
            <button onClick={() => window.dispatchEvent(new Event('openRebecaChat'))}>
              <span className="inline-block px-8 py-4 bg-[#d4af37] text-[#1e3a5f] rounded-lg font-bold text-lg hover:bg-[#B8860B] transition-colors shadow-lg cursor-pointer">
                Falar com Suporte
              </span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1e3a5f] text-[#d4af37] py-8 mt-16 border-t-4 border-[#d4af37]">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg">
            © 2025 {APP_TITLE} - Estudos Bíblicos Profundos
          </p>
          <p className="text-sm text-[#B8860B] mt-2">
            Aprofunde-se na Palavra com ferramentas de excelência
          </p>
        </div>
      </footer>
    </div>
  );
}

