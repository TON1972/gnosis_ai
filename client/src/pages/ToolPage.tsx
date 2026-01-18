import React, { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Link, useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from 'react-markdown';
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Send, Loader2, Download, Copy, CheckCircle, BookOpen, ExternalLink } from "lucide-react";
import CreditsPanel from "@/components/CreditsPanel";
import NoCreditsModal from "@/components/NoCreditsModal";
import { toast } from "sonner";
import SubscriptionWarningBanner from "@/components/SubscriptionWarningBanner";
import DashboardMobileMenu from "@/components/DashboardMobileMenu";
import Footer from "@/components/Footer";
import { useUpgradeReminder } from "@/hooks/useUpgradeReminder";
import UpgradeReminderModal from "@/components/UpgradeReminderModal";
import HeaderCredits from "@/components/HeaderCredits";
import "../dashboard-mobile.css";

export default function ToolPage() {
  const [, params] = useRoute("/tool/:toolId");
  const [, setLocation] = useLocation();
  const toolIdFromParams = params?.toolId || "";

  const { user: authUser, logout } = useAuth();
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [showNoCreditsModal, setShowNoCreditsModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedStudyId, setGeneratedStudyId] = useState<number | null>(null);

  const [wordCount, setWordCount] = useState(0);
  const [computedCost, setComputedCost] = useState(50);

  const { data: allTools, isLoading: loadingTools } = trpc.tools.list.useQuery();
  const dbTool = allTools?.find(t => t.id === Number(toolIdFromParams) || t.name === toolIdFromParams);

  const { data: dbUser } = trpc.auth.me.useQuery(undefined, { enabled: !!authUser });
  const user = dbUser || authUser;
  const { data: credits, refetch: refetchCredits } = trpc.credits.balance.useQuery();
  const { data: activePlan } = trpc.credits.activePlan.useQuery();

  const generateMutation = trpc.tools.generate.useMutation();
  const saveStudyMutation = trpc.studies.save.useMutation();

  const [modalTab, setModalTab] = useState<'plans' | 'credits'>('plans');

  // Upgrade Reminder para usuários free
  const { showModal: showUpgradeReminder, handleClose: handleCloseUpgradeReminder } = useUpgradeReminder();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [toolIdFromParams]);

  const handleGenerate = async () => {
    if (!dbTool || !input.trim()) return;

    // ✅ Validação Antecipada de Créditos
    const currentCredits = credits?.total || 0;
    const estimatedCost = dbTool.creditCost || 50;

    if (currentCredits < estimatedCost) {
      const isFree = activePlan?.plan?.name === 'free';
      setModalTab(isFree ? 'plans' : 'credits');
      setShowNoCreditsModal(true);
      return;
    }

    setGeneratedStudyId(null);

    try {
      const response = await generateMutation.mutateAsync({
        toolId: dbTool.id.toString(),
        input: input,
        history: []
      });

      setResult(response.content);
      setWordCount(response.wordCount);
      setComputedCost(response.creditCost);

      // ✅ Chamada da Mutation (Tipada como any para evitar erros de TS no acesso ao ID)
      const saveResponse = await saveStudyMutation.mutateAsync({
        toolId: Number(dbTool.id),
        toolName: dbTool.displayName,
        input: input,
        output: response.content,
        creditCost: response.creditCost,
        wordCount: response.wordCount
      }) as any;

      if (saveResponse && saveResponse.id) {
        setGeneratedStudyId(saveResponse.id);
      }

      refetchCredits();
      toast.success("Análise concluída com sucesso!");
    } catch (error: any) {
      if (error.message?.includes("insuficientes")) {
        const isFree = activePlan?.plan?.name === 'free';
        setModalTab(isFree ? 'plans' : 'credits');
        setShowNoCreditsModal(true);
      } else {
        toast.error("Erro ao processar análise.");
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success("Copiado!");
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

  if (loadingTools) return (
    <div className="min-h-screen flex items-center justify-center bg-[#1e3a5f] text-[#d4af37]">
      <Loader2 className="w-10 h-10 animate-spin" />
    </div>
  );

  return (
    <div className="tool-page-container min-h-screen bg-gradient-radial from-[#d4af37] via-[#DAA520] to-[#FFFACD]">
      <header className="sticky top-0 z-50 bg-[#1e3a5f] shadow-lg border-b-4 border-[#d4af37]">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <span className="flex items-center gap-4 cursor-pointer">
                <img src={APP_LOGO} alt={APP_TITLE} className="h-16 w-16" />
                <h1 className="text-3xl font-bold text-[#d4af37] hidden md:block">{APP_TITLE}</h1>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {/* ✅ Novo display de créditos no header */}
            <div className="mr-2">
              <HeaderCredits />
            </div>

            {/* ✅ Botão Voltar movido para o header */}
            <Link href="/dashboard">
              <Button variant="outline" className="border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-[#1e3a5f] font-bold">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>
            </Link>

            <DashboardMobileMenu user={user} onLogout={() => { logout(); setLocation("/"); }} />
          </div>
        </div>
      </header>

      <SubscriptionWarningBanner />

      <div className="container mx-auto px-4 py-8">
        {/* Layout simplificado sem Grid de Sidebar */}
        <div className="max-w-5xl mx-auto">
          <main>
            <div className="bg-white/90 rounded-2xl p-8 shadow-xl border-4 border-[#d4af37] mb-6">
              <h2 className="text-3xl font-bold text-[#1e3a5f]">{dbTool?.displayName}</h2>
              <p className="text-[#8b6f47] mt-2">{dbTool?.description}</p>
            </div>

            <div className="bg-white/90 rounded-2xl p-8 shadow-xl border-4 border-[#d4af37] mb-6">
              <label className="block text-lg font-bold text-[#1e3a5f] mb-3">Entrada de Dados</label>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={dbTool?.inputPlaceholder || "Digite o texto..."}
                className="min-h-50 border-2 border-[#d4af37] rounded-lg p-4 bg-white"
              />
              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending || !input.trim()}
                className="mt-4 w-full bg-[#1e3a5f] text-[#d4af37] font-bold py-6 text-lg transition-all active:scale-95"
              >
                {generateMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2" />}
                {generateMutation.isPending ? "Processando..." : `Gerar ${dbTool?.displayName}`}
              </Button>
            </div>

            {result && (
              <div className="space-y-8">
                <div className="bg-white/95 rounded-2xl p-8 shadow-2xl border-4 border-[#d4af37] animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between mb-6 border-b-2 border-[#d4af37] pb-4">
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-6 h-6 text-[#d4af37]" />
                      <span className="text-xl font-black text-[#1e3a5f] uppercase tracking-tight">Resultado</span>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleCopy} variant="outline" size="sm" className="border-[#d4af37] text-[#1e3a5f] font-bold hover:bg-[#d4af37]">
                        {copied ? <CheckCircle className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />} Copiar
                      </Button>
                      <Button onClick={handleDownloadTxt} variant="outline" size="sm" className="border-[#1e3a5f] text-[#1e3a5f] font-bold">
                        <Download className="w-4 h-4 mr-1" /> TXT
                      </Button>
                    </div>
                  </div>

                  <div className="bg-[#FFFACD]/30 border-l-8 border-[#1e3a5f] p-8 rounded-r-xl">
                    <article className="prose prose-slate prose-lg max-w-none font-serif leading-relaxed text-[#1e3a5f]">
                      <ReactMarkdown
                        components={{
                          h3: ({ node, ...props }) => <h3 className="text-2xl border-b border-[#d4af37]/30 pb-2 mt-8 mb-4 uppercase font-bold text-left" {...props} />,
                          // ✅ MOBILE: text-left | DESKTOP: md:text-justify
                          p: ({ node, ...props }) => <p className="mb-4 text-left md:text-justify" {...props} />,
                          strong: ({ node, ...props }) => <strong className="text-[#a0522d] font-bold" {...props} />,
                        }}
                      >
                        {result}
                      </ReactMarkdown>
                    </article>

                    <div className="mt-8 pt-4 border-t-2 border-[#d4af37]/30 flex justify-between items-center text-[#1e3a5f] font-bold">
                      <span className="text-sm uppercase tracking-widest">{wordCount} palavras</span>
                      {/* <span className="bg-[#1e3a5f] text-[#d4af37] px-4 py-1 rounded-lg">Consumo: {computedCost} créditos</span> */}
                    </div>
                  </div>
                </div>

                {/* ✅ Botão de Continuidade com Design Premium */}
                {generatedStudyId && (
                  <div className="flex justify-center pb-6 pt-4 animate-in zoom-in duration-1000">
                    <Link href={`/study/${generatedStudyId}`}>
                      <button className="premium-btn group relative flex items-center justify-center gap-4 px-12 py-6 text-2xl font-black uppercase tracking-tighter text-[#1e3a5f] transition-all hover:scale-105 active:scale-95">
                        {/* Efeito de Brilho Interno */}
                        <div className="absolute inset-0 rounded-2xl bg-linear-to-r from-[#d4af37] via-[#f7e695] to-[#d4af37] shadow-[0_10px_40px_-10px_rgba(212,175,55,0.5)]"></div>
                        <div className="btn-shine absolute inset-0 rounded-2xl"></div>

                        {/* Conteúdo */}
                        <div className="relative z-10 flex items-center gap-3">
                          <ExternalLink className="w-7 h-7 group-hover:rotate-12 transition-transform duration-300" />
                          <span>Continuar Estudo na Sala</span>
                        </div>

                        {/* Borda Externa Fina */}
                        <div className="absolute inset-0 rounded-2xl border-2 border-[#1e3a5f]/20 group-hover:border-[#1e3a5f]/40 transition-colors"></div>
                      </button>
                    </Link>
                  </div>
                )}
                <div className="flex justify-center pb-12 animate-in fade-in duration-500 delay-150">
                  <Link href="/dashboard">
                    <Button variant="outline" size="lg" className="border-[#d4af37] text-[#1e3a5f] font-bold hover:bg-[#d4af37] hover:text-[#1e3a5f] shadow-lg">
                      <ArrowLeft className="w-5 h-5 mr-2" /> Voltar ao Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
      <Footer />
      <NoCreditsModal
        open={showNoCreditsModal}
        onClose={() => setShowNoCreditsModal(false)}
        initialTab={modalTab}
      />
      <UpgradeReminderModal open={showUpgradeReminder} onClose={handleCloseUpgradeReminder} />

      {/* ✅ CSS para os efeitos de luxo do botão */}
      <style>{`
        .premium-btn {
          filter: drop-shadow(0 10px 15px rgba(212, 175, 55, 0.3));
        }

        .btn-shine {
          background: linear-gradient(
            45deg,
            transparent 25%,
            rgba(255, 255, 255, 0.5) 50%,
            transparent 75%
          );
          background-size: 200% 200%;
          animation: shine 3s infinite;
        }

        @keyframes shine {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @keyframes pulse-soft {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.02); opacity: 0.9; }
        }

        .premium-btn:hover {
          animation: pulse-soft 2s infinite ease-in-out;
        }

        article.italic-quotes blockquote {
          font-style: italic;
          border-left: 4px solid #d4af37;
          padding-left: 1rem;
          margin: 1.5rem 0;
          color: #555;
        }
      `}</style>
    </div>
  );
}