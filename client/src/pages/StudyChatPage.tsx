import { useState, useEffect, useRef } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft, Send, Loader2, BookOpen, User,
  Download, Copy, CheckCircle, FileText
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import ShareButton from "@/components/ShareButton";
import NoCreditsModal from "@/components/NoCreditsModal";
import { useTranslation } from "react-i18next";

export default function StudyChatPage() {
  const { i18n } = useTranslation();
  const [, params] = useRoute("/study/:studyId");
  const [, setLocation] = useLocation();
  const studyId = Number(params?.studyId);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant", content: string }[]>([]);
  const [copied, setCopied] = useState(false);

  // ✅ Query para buscar o estudo e suas mensagens vinculadas
  const { data: studyData, isLoading } = trpc.studies.getWithMessages.useQuery({ id: studyId });

  // ✅ Mutations para gerar resposta e salvar na nova tabela
  // ✅ Mutations para gerar resposta e salvar na nova tabela
  const generateMutation = trpc.tools.generate.useMutation();
  const addMessageMutation = trpc.studies.addMessage.useMutation();
  const { data: credits, refetch: refetchCredits } = trpc.credits.balance.useQuery();
  const { data: activePlan } = trpc.credits.activePlan.useQuery();

  const [showNoCreditsModal, setShowNoCreditsModal] = useState(false);
  const [modalTab, setModalTab] = useState<'plans' | 'credits'>('plans');

  // ✅ Inicializa o chat combinando o estudo pai COM as mensagens históricas
  useEffect(() => {
    if (studyData && messages.length === 0) {
      // 1. Criamos a "Mensagem Mestra" baseada no estudo original
      const firstUserMsg = { role: "user" as const, content: studyData.study.input };
      const firstAssistantMsg = { role: "assistant" as const, content: studyData.study.output };

      // 2. Mapeamos as mensagens de continuidade da tabela study_messages
      const continuationHistory = studyData.messages.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content
      }));

      // 3. MONTAGE FINAL: Estudo Original + Continuidade
      // Isso garante que o estudo inicial SEMPRE apareça no topo.
      setMessages([
        firstUserMsg,
        firstAssistantMsg,
        ...continuationHistory
      ]);
    }
  }, [studyData, messages.length]);

  // Scroll automático para a última mensagem
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Funções de Exportação e Cópia ---

  const handleCopyAll = () => {
    const fullText = messages.map(m => `${m.role === 'user' ? 'USUÁRIO' : 'GNOSIS AI'}:\n${m.content}`).join("\n\n---\n\n");
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success("Conversa copiada!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const fullText = messages.map(m => `${m.role === 'user' ? 'USUÁRIO' : 'GNOSIS AI'}:\n${m.content}`).join("\n\n---\n\n");
    const blob = new Blob([fullText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Estudo_${studyData?.study.toolName || 'Gnosis'}_${studyId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Arquivo TXT gerado!");
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    const margin = 20;
    let y = margin;
    const maxWidth = doc.internal.pageSize.getWidth() - (margin * 2);

    doc.setFontSize(16);
    doc.setTextColor(30, 58, 95); // #1e3a5f
    doc.text(`Estudo Bíblico: ${studyData?.study.toolName || 'Gnosis'}`, margin, y);
    y += 15;

    messages.forEach((m) => {
      // Cabeçalho da mensagem no PDF
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      if (y > 270) { doc.addPage(); y = margin; }
      doc.text(m.role === "user" ? "VOCÊ:" : "GNOSIS AI:", margin, y);
      y += 7;

      // Conteúdo da mensagem
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      const lines = doc.splitTextToSize(m.content, maxWidth);
      lines.forEach((line: string) => {
        if (y > 280) { doc.addPage(); y = margin; }
        doc.text(line, margin, y);
        y += 6;
      });
      y += 10;
    });

    doc.save(`Estudo_Gnosis_${studyId}.pdf`);
    toast.success("PDF gerado com sucesso!");
  };

  // --- Lógica de Envio de Mensagem ---
  const handleSendMessage = async () => {
    if (!input.trim() || !studyData || !studyData.study.id) return;

    // ✅ Validação Antecipada de Créditos
    const currentCredits = credits?.total || 0;
    // Custo estimado por mensagem (geralmente menor que ferramenta completa, mas precisa ser > 0)
    const estimatedCost = 10;

    if (currentCredits < estimatedCost) {
      const isFree = activePlan?.plan?.name === 'free';
      setModalTab(isFree ? 'plans' : 'credits');
      setShowNoCreditsModal(true);
      return;
    }

    const userMessage = input;
    setInput("");

    // Adiciona na interface imediatamente
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);

    try {
      // Salva a pergunta do usuário na nova tabela
      await addMessageMutation.mutateAsync({
        studyId: studyData.study.id,
        role: "user",
        content: userMessage,
        wordCount: userMessage.split(/\s+/).length,
        creditCost: 0
      });

      // Gera resposta enviando TODO o histórico (Estudo Original + Chat)
      const response = await generateMutation.mutateAsync({
        toolId: String(studyData.study.toolId),
        input: userMessage,
        history: messages,
        language: i18n.language // Add current language
      });

      // Salva a resposta da IA
      await addMessageMutation.mutateAsync({
        studyId: studyData.study.id,
        role: "assistant",
        content: response.content,
        wordCount: response.wordCount,
        creditCost: response.creditCost
      });

      setMessages(prev => [...prev, { role: "assistant", content: response.content }]);
      refetchCredits();
    } catch (error: any) {
      if (error.message?.includes("insuficientes")) {
        const isFree = activePlan?.plan?.name === 'free';
        setModalTab(isFree ? 'plans' : 'credits');
        setShowNoCreditsModal(true);
      } else {
        toast.error("Erro ao processar mensagem.");
      }
    }
  };

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center bg-[#FFFACD]">
      <div className="text-center">
        <Loader2 className="animate-spin text-[#1e3a5f] w-12 h-12 mx-auto mb-4" />
        <p className="text-[#1e3a5f] font-bold">Carregando seu estudo...</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-[#FFFACD]/30 font-serif">
      {/* Header com Ações de Exportação */}
      <header className="bg-[#1e3a5f] text-[#d4af37] p-4 border-b-4 border-[#d4af37] shadow-lg sticky top-0 z-20">
        <div className="container mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <ArrowLeft className="cursor-pointer hover:scale-110 transition-transform w-6 h-6" />
            </Link>
            <div>
              <h1 className="font-bold uppercase text-sm md:text-base leading-tight">
                {studyData?.study.toolName}
              </h1>
              <p className="text-[10px] opacity-70 tracking-widest">REGISTRO #{studyId}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleCopyAll} variant="outline" size="sm" className="bg-white/10 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-[#1e3a5f] font-bold">
              {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              <span className="hidden sm:inline">Copiar Tudo</span>
            </Button>
            <Button onClick={handleDownloadTxt} variant="outline" size="sm" className="bg-white/10 border-[#d4af37] text-[#d4af37] font-bold">
              <FileText className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">TXT</span>
            </Button>
            <Button onClick={handleDownloadPdf} variant="outline" size="sm" className="bg-white/10 border-[#d4af37] text-[#d4af37] font-bold">
              <Download className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <ShareButton
              title={studyData?.study.toolName || "Estudo Bíblico Gnosis"}
              url={window.location.href}
              content={messages.map(m => m.content).join("\n\n")}
            />
          </div>
        </div>
      </header>

      {/* Área de Mensagens (Chat) */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="container mx-auto max-w-4xl space-y-8 pb-10">
          {/* Marcador de Data Inicial */}
          <div className="flex justify-center">
            <span className="bg-[#1e3a5f]/10 text-[#1e3a5f] text-[10px] px-6 py-1.5 rounded-full uppercase font-black border-2 border-[#1e3a5f]/10 tracking-tighter">
              Início do Estudo • {new Date(studyData?.study.createdAt || "").toLocaleDateString('pt-BR')}
            </span>
          </div>

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[92%] md:max-w-[85%] p-6 rounded-2xl shadow-xl border-2 animate-in fade-in slide-in-from-bottom-3 duration-500 ${msg.role === "user"
                ? "bg-[#1e3a5f] text-white border-[#d4af37] rounded-tr-none"
                : "bg-white text-[#1e3a5f] border-[#d4af37] rounded-tl-none"
                }`}>
                {/* Identificador de quem fala */}
                <div className={`flex items-center gap-2 mb-4 text-[10px] font-black uppercase tracking-[0.2em] ${msg.role === "user" ? "text-[#d4af37]" : "text-[#8b6f47]"}`}>
                  {msg.role === "user" ? <User size={14} /> : <BookOpen size={14} />}
                  {msg.role === "user" ? "Seu Questionamento" : "Análise Gnosis AI"}
                </div>

                {/* Conteúdo Renderizado com Markdown */}
                <article className="prose prose-sm md:prose-base max-w-none text-inherit leading-relaxed font-serif text-justify italic-quotes">
                  <ReactMarkdown
                    components={{
                      h3: ({ node, ...props }) => <h3 className="text-2xl border-b border-[#d4af37]/30 pb-2 mt-8 mb-4 uppercase font-bold text-left" {...props} />,
                      // ✅ MOBILE: text-left | DESKTOP: md:text-justify
                      p: ({ node, ...props }) => <p className="mb-4 text-left md:text-justify" {...props} />,
                      strong: ({ node, ...props }) => <strong className="text-[#a0522d] font-bold" {...props} />,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </article>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </main>

      {/* Rodapé com Input Fixo */}
      <footer className="p-4 bg-white border-t-4 border-[#d4af37] shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="container mx-auto max-w-4xl">
          <div className="flex gap-3 items-end">
            {/* Botão de Voltar ao Dashboard (Integrado ao Chat) */}
            <Link href="/dashboard">
              <Button
                className="bg-[#d4af37]/20 border-2 border-[#d4af37] text-[#1e3a5f] hover:bg-[#d4af37] h-15 w-15 transition-all shadow-md rounded-xl shrink-0"
                title="Voltar ao Dashboard"
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
            </Link>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Aprofunde seu conhecimento com uma dúvida..."
              className="border-2 border-[#d4af37] focus-visible:ring-[#1e3a5f] min-h-15 max-h-45 text-[#1e3a5f] text-base rounded-xl p-4 shadow-inner font-serif"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={generateMutation.isPending || !input.trim()}
              className="bg-[#1e3a5f] text-[#d4af37] hover:bg-[#2a4a7f] h-15 w-15 md:w-auto md:px-8 transition-all active:scale-95 shadow-lg rounded-xl shrink-0"
            >
              {generateMutation.isPending ? <Loader2 className="animate-spin w-6 h-6" /> : <Send className="w-6 h-6" />}
            </Button>
          </div>
          {/* <p className="text-center text-[9px] text-[#8b6f47] mt-3 font-bold uppercase tracking-widest opacity-60">
            Cada interação consome créditos baseados na extensão da resposta.
          </p> */}
        </div>
      </footer>
      <NoCreditsModal
        open={showNoCreditsModal}
        onClose={() => setShowNoCreditsModal(false)}
        initialTab={modalTab}
      />
    </div>
  );
}