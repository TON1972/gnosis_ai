import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, User, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface Message {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: Date;
  options?: { label: string; action: string }[];
}

const KNOWLEDGE_BASE = {
  greeting: {
    message: "Olá! 👋 Sou a Rebeca, assistente virtual da GNOSIS AI. Como posso ajudá-lo(a) hoje?",
    options: [
      { label: "💰 Dúvidas sobre Créditos", action: "creditos" },
      { label: "🔧 Como usar as Ferramentas", action: "ferramentas" },
      { label: "❓ Outras Dúvidas", action: "outras" },
      { label: "👋 Encerrar conversa", action: "encerrar" },
    ],
  },
  planos: {
    message: "Conta Free: todas as ferramentas. 500 créditos no cadastro + 50 por dia. Acabou o saldo? Compre créditos avulsos. Os avulsos não vencem.\n\nNão vendemos mais assinatura de planos. O que você paga é só recarga de créditos.",
    options: [
      { label: "Comprar créditos avulsos", action: "creditos_avulsos" },
      { label: "Ver pacotes", action: "ver_planos" },
      { label: "Voltar ao menu", action: "menu" },
      { label: "👋 Encerrar conversa", action: "encerrar" },
    ],
  },
  creditos: {
    message: "Sobre o sistema de créditos:\n\n• Cada ferramenta consome créditos ao ser usada\n• Toda conta é Free e usa todas as ferramentas\n• 500 créditos iniciais no cadastro (não renovam)\n• 50 créditos por dia (não acumulam)\n• Créditos avulsos comprados nunca expiram\n\nQual sua dúvida específica?",
    options: [
      { label: "Como ganhar mais créditos", action: "ganhar_creditos" },
      { label: "Créditos expiram?", action: "expiracao_creditos" },
      { label: "Comprar créditos avulsos", action: "creditos_avulsos" },
      { label: "Voltar ao menu", action: "menu" },
      { label: "👋 Encerrar conversa", action: "encerrar" },
    ],
  },
  ferramentas: {
    message: "A GNOSIS AI oferece o catálogo completo de ferramentas para toda conta Free:\n\nHermenêutica, Traduções, Resumos, Enfoques de Pregação, Estudos Doutrinários, Exegese, Teologia Sistemática, Patrística, Apologética e as demais do painel.\n\nO que limita o uso é o saldo de créditos, não o plano.",
    options: [
      { label: "Como usar uma ferramenta", action: "usar_ferramenta" },
      { label: "Custo em créditos", action: "custo_ferramentas" },
      { label: "Salvar estudos", action: "salvar_estudos" },
      { label: "Voltar ao menu", action: "menu" },
      { label: "👋 Encerrar conversa", action: "encerrar" },
    ],
  },
  outras: {
    message: "Outras dúvidas frequentes:\n\n• Preciso de cartão para criar conta?\n• Como comprar créditos?\n• Como entrar em contato com suporte?\n\nSelecione uma opção ou digite sua dúvida:",
    options: [
      { label: "Criar conta grátis", action: "testar_gratis" },
      { label: "Falar com suporte", action: "suporte" },
      { label: "Voltar ao menu", action: "menu" },
      { label: "👋 Encerrar conversa", action: "encerrar" },
    ],
  },
  diferencas_planos: {
    message: "Não há mais diferença de ferramentas por plano. Toda conta Free usa o catálogo inteiro. O que muda é o saldo: 500 iniciais + 50/dia, e recarga avulsa quando precisar.",
    options: [
      { label: "Ver créditos avulsos", action: "ver_planos" },
      { label: "Voltar ao menu", action: "menu" },
    ],
  },
  upgrade: {
    message: "Não há upgrade de plano. Para continuar gerando estudos, recarregue créditos avulsos no painel (botão Comprar créditos).",
    options: [
      { label: "Ver créditos avulsos", action: "ver_planos" },
      { label: "Voltar ao menu", action: "menu" },
    ],
  },
  pagamento: {
    message: "A compra de créditos avulsos aceita **Mercado Pago** e **Stripe**:\n\n• Cartão de crédito\n• PIX\n\nOs avulsos entram no saldo e nunca expiram.",
    options: [
      { label: "Ver créditos avulsos", action: "ver_planos" },
      { label: "Voltar ao menu", action: "menu" },
    ],
  },
  ganhar_creditos: {
    message: "Formas de ganhar créditos:\n\n1. **Cadastro** — 500 créditos iniciais (uma vez)\n2. **Créditos diários** — 50 por dia, não acumulam\n3. **Compra avulsa** — pacotes que nunca expiram",
    options: [
      { label: "Comprar créditos avulsos", action: "creditos_avulsos" },
      { label: "Voltar ao menu", action: "menu" },
    ],
  },
  expiracao_creditos: {
    message: "**Sobre expiração:**\n\n✅ **Créditos diários** — 50 por dia (não acumulam)\n✅ **Créditos iniciais** — 500 no cadastro, não renovam\n✅ **Créditos avulsos** — NUNCA expiram",
    options: [
      { label: "Comprar créditos avulsos", action: "creditos_avulsos" },
      { label: "Voltar ao menu", action: "menu" },
    ],
  },
  creditos_avulsos: {
    message: "Pacotes de créditos avulsos:\n\n• 1.000 créditos — R$ 9,90\n• 3.000 créditos — R$ 24,90\n• 6.000 créditos — R$ 39,90\n• 10.000 créditos — R$ 69,90\n\n**Vantagens:**\n✅ Nunca expiram\n✅ Servem em qualquer ferramenta",
    options: [
      { label: "Comprar agora", action: "ver_planos" },
      { label: "Voltar ao menu", action: "menu" },
    ],
  },
  usar_ferramenta: {
    message: "Para usar uma ferramenta:\n\n1. Faça login na plataforma\n2. Acesse o Painel de Controle\n3. Clique na ferramenta desejada\n4. Digite ou cole o texto bíblico\n5. Clique em 'Analisar'\n\nO resultado aparecerá em segundos e você pode salvar ou baixar em PDF!",
    options: [
      { label: "Fazer login", action: "login" },
      { label: "Voltar ao menu", action: "menu" },
    ],
  },
  custo_ferramentas: {
    message: "Custo em créditos por ferramenta:\n\n**Básicas (50 créditos):**\nHermenêutica, Traduções, Resumos, etc.\n\n**Intermediárias (75 créditos):**\nExegese, Teologia Sistemática\n\n**Avançadas (100 créditos):**\nLinguagem Ministerial, Análise de Dados\n\nO custo é descontado apenas quando você usa a ferramenta.",
    options: [
      { label: "Ver todas as ferramentas", action: "ferramentas" },
      { label: "Voltar ao menu", action: "menu" },
    ],
  },
  salvar_estudos: {
    message: "Você pode salvar até **100 estudos** no seu histórico!\n\n✅ Acesso rápido aos estudos salvos\n✅ Download em PDF a qualquer momento\n✅ Organização automática por data\n✅ Scroll completo para visualizar todos\n\nToda conta Free tem esse benefício.",
    options: [
      { label: "Acessar meu histórico", action: "login" },
      { label: "Voltar ao menu", action: "menu" },
    ],
  },
  testar_gratis: {
    message: "Sim! Crie uma conta Free sem cartão:\n\n✅ Todas as ferramentas liberadas\n✅ 500 créditos iniciais + 50 por dia\n✅ Sem cobrança automática\n\nAcabou o saldo? Compre créditos avulsos.",
    options: [
      { label: "Criar conta grátis", action: "login" },
      { label: "Voltar ao menu", action: "menu" },
    ],
  },
  cancelamento: {
    message: "Não há assinatura à venda no cadastro. Sua conta Free continua ativa. Créditos avulsos já comprados permanecem no saldo.",
    options: [
      { label: "Acessar painel", action: "login" },
      { label: "Voltar ao menu", action: "menu" },
    ],
  },
  suporte: {
    message: "", // Will be set dynamically based on time
    options: [
      { label: "Fornecer dados de contato", action: "capture_contact" },
      { label: "Voltar ao menu", action: "menu" },
    ],
  },
  ver_planos: {
    message: "Redirecionando você para a página de créditos avulsos...",
    options: [],
  },
  login: {
    message: "Redirecionando você para fazer login...",
    options: [],
  },
  encerrar: {
    message: "✨ Espero ter ajudado! Se precisar de mais alguma coisa, é só chamar. Shalom! ✨",
    options: [
      { label: "Voltar ao menu", action: "menu" },
    ],
  },
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [contactFormActive, setContactFormActive] = useState(false);
  const [departmentSelectionActive, setDepartmentSelectionActive] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Listen for custom event to open chat
  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('openRebecaChat', handleOpenChat);
    return () => window.removeEventListener('openRebecaChat', handleOpenChat);
  }, []);

  const saveContactMutation = trpc.chatbot.saveContact.useMutation({
    onSuccess: () => {
      toast.success("Dados enviados com sucesso! Nossa equipe entrará em contato em breve.");
      setContactFormActive(false);
      setDepartmentSelectionActive(false);
      setSelectedDepartment("");
      setContactName("");
      setContactEmail("");
      setContactMessage("");
      
      // Show confirmation message
      addMessage("bot", "✅ Obrigado! Seus dados foram enviados com sucesso. Nossa equipe entrará em contato em breve.\n\nEnquanto isso, você pode continuar navegando ou acessar nosso portal de suporte:", [
        { label: "Abrir portal de suporte", action: "abrir_suporte" },
        { label: "Voltar ao menu", action: "menu" },
      ]);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar dados. Por favor, tente novamente.");
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      handleBotResponse("greeting");
    }
  }, [isOpen]);

  const addMessage = (type: "user" | "bot", content: string, options?: { label: string; action: string }[]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      options,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const isBusinessHours = () => {
    const now = new Date();
    const brazilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const hour = brazilTime.getHours();
    return hour >= 10 && hour < 18;
  };

  const handleBotResponse = (action: string) => {
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      let response = KNOWLEDGE_BASE[action as keyof typeof KNOWLEDGE_BASE];
      
      // Handle support action with business hours check
      if (action === "suporte") {
        const inBusinessHours = isBusinessHours();
        response = {
          ...response,
          message: inBusinessHours
            ? "🕒 **Horário de Atendimento: 10h às 18h**\n\nEstamos disponíveis agora! Para que possamos ajudá-lo melhor, por favor forneça seus dados de contato. Nossa equipe entrará em contato em breve!"
            : "🌙 **Horário de Atendimento: 10h às 18h**\n\nNo momento estamos fora do horário de atendimento.\n\n**Deixe a sua solicitação abaixo, que no primeiro horário amanhã nós retornaremos, Shalom!**",
        };
      }

      if (action === "menu") {
        const greeting = KNOWLEDGE_BASE.greeting;
        addMessage("bot", greeting.message, greeting.options);
      } else if (action === "capture_contact") {
        setDepartmentSelectionActive(true);
        addMessage("bot", "Por favor, selecione o departamento com o qual deseja falar:");
      } else if (action === "select_department") {
        // This action is handled by handleDepartmentSelect function
        // Keeping this block for consistency but it won't be triggered
      } else if (action === "ver_planos") {
        addMessage("bot", response.message);
        setTimeout(() => {
          window.location.href = "/planos";
        }, 1000);
      } else if (action === "login") {
        addMessage("bot", response.message);
        setTimeout(() => {
          const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL || "https://api.manus.im";
          const appId = import.meta.env.VITE_APP_ID || "Ab5C8Nq9pGbzQm4EwPJGu4";
          const loginUrl = `${oauthPortalUrl}/oauth/authorize?client_id=${appId}&redirect_uri=${encodeURIComponent(window.location.origin + "/api/oauth/callback")}&response_type=code`;
          window.location.href = loginUrl;
        }, 1000);
      } else if (action === "abrir_suporte") {
        addMessage("bot", "Abrindo portal de suporte em nova aba...");
        setTimeout(() => {
          window.open("https://help.manus.im", "_blank");
        }, 1000);
      } else if (action === "encerrar") {
        addMessage("bot", response.message, response.options);
        // Auto-close chat after 5 seconds
        setTimeout(() => {
          setIsOpen(false);
        }, 5000);
      } else if (response) {
        addMessage("bot", response.message, response.options);
      } else {
        addMessage("bot", "Desculpe, não entendi sua pergunta. Pode reformular ou escolher uma opção do menu?", KNOWLEDGE_BASE.greeting.options);
      }

      setIsTyping(false);
    }, 800);
  };

  const handleOptionClick = (action: string) => {
    handleBotResponse(action);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    addMessage("user", inputValue);
    setInputValue("");

    // Simple keyword matching for free-form questions
    const lowerInput = inputValue.toLowerCase();

    if (lowerInput.includes("plano") || lowerInput.includes("preço") || lowerInput.includes("custo") || lowerInput.includes("assinatura") || lowerInput.includes("upgrade")) {
      handleBotResponse("planos");
    } else if (lowerInput.includes("crédito") || lowerInput.includes("credito")) {
      handleBotResponse("creditos");
    } else if (lowerInput.includes("ferramenta") || lowerInput.includes("como usar")) {
      handleBotResponse("ferramentas");
    } else if (lowerInput.includes("suporte") || lowerInput.includes("ajuda") || lowerInput.includes("contato")) {
      handleBotResponse("suporte");
    } else if (lowerInput.includes("cancelar") || lowerInput.includes("cancelamento")) {
      handleBotResponse("cancelamento");
    } else if (lowerInput.includes("testar") || lowerInput.includes("grátis") || lowerInput.includes("gratis") || lowerInput.includes("free")) {
      handleBotResponse("testar_gratis");
    } else {
      // Default response for unrecognized input
      setIsTyping(true);
      setTimeout(() => {
        addMessage("bot", "Desculpe, não encontrei uma resposta específica para sua pergunta. Posso ajudá-lo com:\n\n• Informações sobre planos\n• Dúvidas sobre créditos\n• Como usar as ferramentas\n• Suporte técnico\n\nEscolha uma opção ou reformule sua pergunta:", KNOWLEDGE_BASE.greeting.options);
        setIsTyping(false);
      }, 800);
    }
  };

  const handleDepartmentSelect = (dept: string) => {
    setSelectedDepartment(dept);
    setDepartmentSelectionActive(false);
    
    const deptNames: Record<string, string> = {
      tecnico: "Suporte Técnico",
      financeiro: "Financeiro",
      comercial: "Comercial",
      outros: "Outros Assuntos"
    };
    
    const deptMessages: Record<string, string> = {
      tecnico: "🔧 **Suporte Técnico**\n\nEntendo que você está com dificuldades técnicas. Nossa equipe de suporte técnico está pronta para ajudar com problemas de login, ferramentas, bugs ou qualquer questão técnica.\n\nPor favor, preencha os campos abaixo para que possamos entrar em contato:",
      financeiro: "💰 **Financeiro**\n\nVou te conectar com nosso departamento financeiro. Eles podem ajudar com questões sobre pagamentos, faturas, reembolsos, alteração de plano ou qualquer dúvida relacionada a cobranças.\n\nPor favor, preencha os campos abaixo para que possamos entrar em contato:",
      comercial: "📊 **Comercial**\n\nÓtimo! Nosso time comercial pode explicar créditos avulsos, pacotes e formas de pagamento.\n\nPor favor, preencha os campos abaixo para que possamos entrar em contato:",
      outros: "📋 **Outros Assuntos**\n\nEntendi! Vou encaminhar sua solicitação para a equipe adequada. Por favor, descreva sua necessidade no formulário abaixo para que possamos direcionar corretamente.\n\nPreencha os campos abaixo:"
    };
    
    addMessage("bot", deptMessages[dept]);
    
    // Show contact form after a brief delay
    setTimeout(() => {
      setContactFormActive(true);
    }, 500);
  };

  const handleSubmitContact = () => {
    if (!selectedDepartment) {
      toast.error("Por favor, selecione um departamento");
      return;
    }
    
    if (!contactName.trim() || !contactEmail.trim()) {
      toast.error("Por favor, preencha nome e e-mail");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      toast.error("Por favor, insira um e-mail válido");
      return;
    }

    saveContactMutation.mutate({
      name: contactName,
      email: contactEmail,
      department: selectedDepartment as "tecnico" | "financeiro" | "comercial" | "outros",
      message: contactMessage || undefined,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-6 z-50 bg-[#d4af37] text-[#1e3a5f] p-4 rounded-full shadow-2xl hover:bg-[#B8860B] transition-all duration-300 hover:scale-110"
          aria-label="Abrir chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 z-50 w-[340px] md:w-[380px] h-[520px] md:h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col border-4 border-[#d4af37]">
          {/* Header */}
          <div className="bg-[#1e3a5f] text-white p-4 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#d4af37]">
                <img src="/rebeca-avatar.png" alt="Rebeca" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Rebeca</h3>
                <p className="text-xs text-[#d4af37]">Assistente Virtual</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#d4af37] hover:text-white transition-colors"
              aria-label="Fechar chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white to-[#f5f5f5]">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex gap-2 max-w-[80%] ${message.type === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.type === "user" ? "bg-[#1e3a5f]" : "bg-[#d4af37]"}`}>
                    {message.type === "user" ? <User className="w-4 h-4 text-white" /> : <img src="/rebeca-avatar.png" alt="Rebeca" className="w-full h-full object-cover rounded-full" />}
                  </div>
                  <div>
                    <div className={`p-3 rounded-2xl ${message.type === "user" ? "bg-[#1e3a5f] text-white" : "bg-white text-[#1e3a5f] border-2 border-[#d4af37]"}`}>
                      <p className="text-sm whitespace-pre-line">{message.content}</p>
                    </div>
                    {message.options && message.options.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.options.map((option, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleOptionClick(option.action)}
                            className="block w-full text-left px-3 py-2 bg-[#d4af37] text-[#1e3a5f] rounded-lg text-sm font-semibold hover:bg-[#B8860B] transition-colors"
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Department Selection */}
            {departmentSelectionActive && (
              <div className="bg-white border-2 border-[#d4af37] rounded-2xl p-4 space-y-2">
                <p className="text-sm font-semibold text-[#1e3a5f] mb-3">Selecione o departamento:</p>
                <button
                  onClick={() => handleDepartmentSelect("tecnico")}
                  className="w-full text-left p-3 bg-[#d4af37] text-[#1e3a5f] rounded-lg hover:bg-[#B8860B] transition-colors font-medium"
                >
                  🔧 Suporte Técnico
                </button>
                <button
                  onClick={() => handleDepartmentSelect("financeiro")}
                  className="w-full text-left p-3 bg-[#d4af37] text-[#1e3a5f] rounded-lg hover:bg-[#B8860B] transition-colors font-medium"
                >
                  💰 Financeiro
                </button>
                <button
                  onClick={() => handleDepartmentSelect("comercial")}
                  className="w-full text-left p-3 bg-[#d4af37] text-[#1e3a5f] rounded-lg hover:bg-[#B8860B] transition-colors font-medium"
                >
                  📊 Comercial
                </button>
                <button
                  onClick={() => handleDepartmentSelect("outros")}
                  className="w-full text-left p-3 bg-[#d4af37] text-[#1e3a5f] rounded-lg hover:bg-[#B8860B] transition-colors font-medium"
                >
                  📋 Outros Assuntos
                </button>
                <button
                  onClick={() => {
                    setDepartmentSelectionActive(false);
                    addMessage("bot", "Seleção cancelada. Como posso ajudá-lo?", KNOWLEDGE_BASE.greeting.options);
                  }}
                  className="w-full text-left p-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium mt-2"
                >
                  ❌ Cancelar
                </button>
              </div>
            )}

            {/* Contact Form */}
            {contactFormActive && (
              <div className="bg-white border-2 border-[#d4af37] rounded-2xl p-4 space-y-3">
                <div>
                  <label className="text-sm font-semibold text-[#1e3a5f] block mb-1">Nome *</label>
                  <Input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="border-[#d4af37] focus:border-[#1e3a5f]"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#1e3a5f] block mb-1">E-mail *</label>
                  <Input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="border-[#d4af37] focus:border-[#1e3a5f]"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#1e3a5f] block mb-1">Mensagem (opcional)</label>
                  <Textarea
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Descreva brevemente sua dúvida..."
                    className="border-[#d4af37] focus:border-[#1e3a5f] resize-none"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmitContact}
                    disabled={saveContactMutation.isPending}
                    className="flex-1 bg-[#d4af37] text-[#1e3a5f] hover:bg-[#B8860B]"
                  >
                    {saveContactMutation.isPending ? "Enviando..." : "Enviar"}
                  </Button>
                  <Button
                    onClick={() => {
                      setContactFormActive(false);
                      setContactName("");
                      setContactEmail("");
                      setContactMessage("");
                    }}
                    variant="outline"
                    className="border-[#d4af37] text-[#1e3a5f]"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {isTyping && (
              <div className="flex justify-start">
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#d4af37]">
                    <img src="/rebeca-avatar.png" alt="Rebeca" className="w-full h-full object-cover" />
                  </div>
                  <div className="bg-white border-2 border-[#d4af37] p-3 rounded-2xl">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-[#d4af37] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="w-2 h-2 bg-[#d4af37] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                      <div className="w-2 h-2 bg-[#d4af37] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {!contactFormActive && (
            <div className="p-4 border-t-2 border-[#d4af37] bg-white rounded-b-xl">
              <div className="flex gap-2">
                <Textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua dúvida..."
                  className="flex-1 resize-none border-2 border-[#d4af37] focus:border-[#1e3a5f] rounded-lg text-sm"
                  rows={2}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className="bg-[#d4af37] text-[#1e3a5f] hover:bg-[#B8860B] self-end"
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

