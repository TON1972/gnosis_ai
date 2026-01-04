import React, { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Link, useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from 'react-markdown';
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Send, Loader2, Download, Copy, CheckCircle, BookOpen } from "lucide-react";
import CreditsPanel from "@/components/CreditsPanel";
import NoCreditsModal from "@/components/NoCreditsModal";
import { toast } from "sonner";
import SubscriptionWarningBanner from "@/components/SubscriptionWarningBanner";
import DashboardMobileMenu from "@/components/DashboardMobileMenu";
import "../dashboard-mobile.css";

const PLACEHOLDERS: Record<string, string> = {
  hermeneutica: "Digite a referência bíblica ou cole o texto que deseja analisar...",
  exegese: "Digite a passagem bíblica para análise exegética detalhada...",
  traducoes: "Digite a referência bíblica ou palavra específica para análise de tradução...",
  resumos: "Digite o que deseja resumir...",
  esbocos: "Digite o tema ou passagem para criar um esboço de pregação...",
  "escatologia-biblica": "Digite o tema escatológico que deseja analisar...",
};

export default function ToolPage() {
  const [, params] = useRoute("/tool/:toolId");
  const [, setLocation] = useLocation();
  const toolIdFromParams = params?.toolId || "";

  const { user: authUser, logout } = useAuth();
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [showNoCreditsModal, setShowNoCreditsModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // ✅ Estados para armazenar os dados dinâmicos da IA
  const [wordCount, setWordCount] = useState(0); 
  const [computedCost, setComputedCost] = useState(50);

  // Queries
  const { data: allTools, isLoading: loadingTools } = trpc.tools.list.useQuery();
  const dbTool = allTools?.find(t => t.id === Number(toolIdFromParams) || t.name === toolIdFromParams);
  const { data: dbUser } = trpc.auth.me.useQuery(undefined, { enabled: !!authUser });
  const user = dbUser || authUser;
  const { data: credits, refetch: refetchCredits } = trpc.credits.balance.useQuery();

  // Mutations
  const generateMutation = trpc.tools.generate.useMutation();
  const saveStudyMutation = trpc.studies.save.useMutation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [toolIdFromParams]);

  const handleGenerate = async () => {
    if (!dbTool || !input.trim()) return;

    try {
      // 1. Chamada da IA para gerar conteúdo e calcular custo dinâmico
      const response = await generateMutation.mutateAsync({
        toolId: dbTool.id.toString(), 
        input: input,
        history: [] 
      });

      // ✅ Atualiza os estados com os valores calculados pelo backend
      setResult(response.content);
      setWordCount(response.wordCount);
      setComputedCost(response.creditCost);

      // 2. Salva o Estudo e Debita Créditos (usando os valores dinâmicos)
      await saveStudyMutation.mutateAsync({
        toolId: Number(dbTool.id), 
        toolName: dbTool.displayName,
        input: input,
        output: response.content,
        creditCost: response.creditCost, // ✅ Custo baseado na tabela de palavras
        wordCount: response.wordCount    // ✅ Total de palavras real
      });

      refetchCredits(); // Atualiza o saldo na tela
      
      toast.success("Análise concluída!");
    } catch (error: any) {
      console.error("Erro no fluxo:", error);
      if (error.message?.includes("insuficientes")) {
        setShowNoCreditsModal(true);
      } else {
        toast.error("Erro ao processar análise.");
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success("Conteúdo copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dbTool?.displayName.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loadingTools) {
    return <div className="min-h-screen flex items-center justify-center bg-[#1e3a5f] text-[#d4af37]">Carregando ferramenta...</div>;
  }

  if (!dbTool) {
    return (
      <div className="min-h-screen bg-gradient-radial from-[#d4af37] via-[#DAA520] to-[#FFFACD] flex items-center justify-center">
        <div className="text-center bg-white/90 p-8 rounded-2xl border-4 border-[#d4af37]">
          <h1 className="text-2xl font-bold text-[#1e3a5f] mb-4">Ferramenta não localizada</h1>
          <Link href="/dashboard">
            <Button className="bg-[#1e3a5f] text-[#d4af37]">Voltar ao Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="tool-page-container min-h-screen bg-gradient-radial from-[#d4af37] via-[#DAA520] to-[#FFFACD]">
      <header className="sticky top-0 z-50 bg-[#1e3a5f] shadow-lg border-b-4 border-[#d4af37]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/">
              <span className="flex items-center gap-4 cursor-pointer">
                <img src={APP_LOGO} alt={APP_TITLE} className="h-16 w-16 object-contain" />
                <h1 className="hidden md:block text-3xl font-bold text-[#d4af37]">{APP_TITLE}</h1>
                <h1 className="block md:hidden text-3xl font-bold text-[#d4af37]">GNOSIS AI</h1>
              </span>
            </Link>
            <DashboardMobileMenu 
              user={user}
              onLogout={() => { logout(); setLocation("/"); }}
            />
          </div>
        </div>
      </header>

      <SubscriptionWarningBanner />

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <CreditsPanel onNeedCredits={() => setShowNoCreditsModal(true)} />
            <Link href="/dashboard">
              <Button variant="outline" className="w-full mt-4 border-[#d4af37] text-[#1e3a5f] hover:bg-[#d4af37] hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>
            </Link>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white/90 rounded-2xl p-8 shadow-xl border-4 border-[#d4af37] mb-6">
              <h2 className="text-3xl font-bold text-[#1e3a5f] mb-2">{dbTool.displayName}</h2>
              <p className="text-lg text-[#8b6f47] mb-4">{dbTool.description}</p>
              <div className="flex items-center gap-4">
                <span className="text-sm bg-[#1e3a5f] text-[#d4af37] px-3 py-1 rounded-full font-bold">
                   Cobrança Dinâmica por Extensão
                </span>
                <span className="text-sm text-[#8b6f47]">
                  Saldo: <strong>{credits?.total || 0}</strong>
                </span>
              </div>
            </div>

            <div className="bg-white/90 rounded-2xl p-8 shadow-xl border-4 border-[#d4af37] mb-6">
              <label className="block text-lg font-bold text-[#1e3a5f] mb-3">Entrada de Dados</label>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={PLACEHOLDERS[dbTool.name] || "Digite o texto para análise..."}
                className="min-h-50 border-2 border-[#d4af37] focus:border-[#B8860B] rounded-lg p-4 text-[#1e3a5f]"
              />
              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending || !input.trim()}
                className="mt-4 w-full bg-[#1e3a5f] text-[#d4af37] hover:bg-[#2a4a7f] font-bold text-lg py-6"
              >
                {generateMutation.isPending ? (
                  <><Loader2 className="mr-2 animate-spin" /> Processando...</>
                ) : (
                  <><Send className="mr-2" /> Gerar {dbTool.displayName}</>
                )}
              </Button>
            </div>

            {result && (
              <div className="bg-white/95 rounded-2xl p-8 shadow-2xl border-4 border-[#d4af37] animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-6 border-b-2 border-[#d4af37] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#1e3a5f] p-2 rounded-lg">
                      <BookOpen className="w-6 h-6 text-[#d4af37]" />
                    </div>
                    <label className="text-xl font-black text-[#1e3a5f] tracking-tight uppercase">
                      Resultado da Análise Teológica
                    </label>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleCopy} variant="outline" size="sm" className="border-2 border-[#d4af37] text-[#1e3a5f] hover:bg-[#d4af37] font-bold">
                      {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      Copiar
                    </Button>
                    <Button onClick={handleDownloadTxt} variant="outline" size="sm" className="border-2 border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] font-bold">
                      <Download className="w-4 h-4 mr-2" /> TXT
                    </Button>
                  </div>
                </div>

                <div className="bg-[#FFFACD]/30 border-l-8 border-[#1e3a5f] rounded-r-xl p-8 shadow-inner">
                  <article className="prose prose-slate prose-lg max-w-none prose-headings:text-[#1e3a5f] prose-strong:text-[#1e3a5f] text-[#1e3a5f] font-serif leading-relaxed italic-quotes">
                    <ReactMarkdown
                      components={{
                        h3: ({node, ...props}) => <h3 className="text-2xl border-b border-[#d4af37]/30 pb-2 mt-8 mb-4 uppercase" {...props} />,
                        p: ({node, ...props}) => <p className="mb-4 text-justify" {...props} />,
                        strong: ({node, ...props}) => <strong className="text-[#a0522d]" {...props} />,
                      }}
                    >
                      {result}
                    </ReactMarkdown>
                    
                    {/* ✅ Rodapé Informativo com os valores capturados do estado */}
                    <div className="mt-8 pt-4 border-t-2 border-[#d4af37]/30 flex flex-wrap gap-4 justify-between items-center text-[#1e3a5f] font-bold">
                      <div className="flex items-center gap-2 bg-[#fdfaf0] px-4 py-2 rounded-lg border border-[#d4af37]/50">
                        <span className="text-xs uppercase opacity-70 tracking-widest">Extensão</span>
                        <span className="text-lg">{wordCount} palavras</span>
                      </div>
                      <div className="flex items-center gap-2 bg-[#1e3a5f] text-[#d4af37] px-4 py-2 rounded-lg shadow-md">
                        <span className="text-xs uppercase opacity-80 tracking-widest">Consumo</span>
                        <span className="text-lg">{computedCost} créditos</span>
                      </div>
                    </div>
                  </article>
                </div>
                
                <div className="mt-6 flex justify-center">
                  <p className="text-xs text-[#1e3a5f]/60 font-medium italic">
                    Análise gerada via Inteligência Artificial Teológica • Gnosis AI
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <NoCreditsModal open={showNoCreditsModal} onClose={() => setShowNoCreditsModal(false)} />
    </div>
  );
}