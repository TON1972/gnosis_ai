import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { MessageCircle, Send, Home } from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";

export default function PublicTicket() {
  const { ticketId } = useParams();
  const [, setLocation] = useLocation();
  const [newMessage, setNewMessage] = useState("");
  const [clientName, setClientName] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const ticketIdNum = ticketId ? parseInt(ticketId) : 0;

  // Query ticket messages
  const { data: ticketMessages = [], refetch } = trpc.admin.getTicketMessages.useQuery(
    { ticketId: ticketIdNum },
    {
      enabled: ticketIdNum > 0,
      refetchInterval: 5000, // Auto-refresh every 5 seconds
    }
  );

  // Send client message mutation
  const sendMessageMutation = trpc.admin.sendClientTicketMessage.useMutation({
    onSuccess: () => {
      toast.success("Mensagem enviada com sucesso!");
      setNewMessage("");
      setSendingMessage(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erro ao enviar mensagem: ${error.message}`);
      setSendingMessage(false);
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !clientName.trim()) {
      toast.error("Por favor, preencha seu nome e mensagem");
      return;
    }

    setSendingMessage(true);
    sendMessageMutation.mutate({
      ticketId: ticketIdNum,
      message: newMessage.trim(),
      clientName: clientName.trim(),
    });
  };

  if (!ticketId || ticketIdNum === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-radial from-[#d4af37] via-[#DAA520] to-[#FFFACD]">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4">
            ❌ Ticket Inválido
          </h2>
          <p className="text-[#8b6f47] mb-6">
            O link do ticket está incorreto ou o ticket não existe.
          </p>
          <Button
            onClick={() => setLocation("/")}
            className="bg-[#d4af37] hover:bg-[#b8941f] text-[#1e3a5f]"
          >
            <Home className="w-4 h-4 mr-2" />
            Voltar ao Início
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-radial from-[#d4af37] via-[#DAA520] to-[#FFFACD]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#1e3a5f] shadow-lg border-b-4 border-[#d4af37]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={APP_LOGO} alt={APP_TITLE} className="h-12 w-12 object-contain" loading="lazy" />
              <div>
                {/* Título completo para desktop */}
                <h1 className="hidden md:block text-2xl font-bold text-[#d4af37]">{APP_TITLE}</h1>
                {/* Título curto para mobile */}
                <h1 className="block md:hidden text-2xl font-bold text-[#d4af37]">GNOSIS AI</h1>
                <p className="text-sm text-[#d4af37]/70">Ticket de Suporte #{ticketId}</p>
              </div>
            </div>
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              className="border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-[#1e3a5f]"
              size="sm"
            >
              <Home className="w-4 h-4 mr-2" />
              Voltar ao Início
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="p-6 bg-gradient-to-br from-[#FFFACD] to-white border-2 border-[#d4af37]">
          <div className="flex items-center gap-2 mb-6">
            <MessageCircle className="w-6 h-6 text-[#d4af37]" />
            <h2 className="text-2xl font-bold text-[#1e3a5f]">
              Conversa - Ticket #{ticketId}
            </h2>
          </div>

          {/* Messages Display */}
          <div className="bg-white rounded-lg p-4 mb-6 max-h-96 overflow-y-auto border-2 border-[#d4af37]/30">
            {ticketMessages.map((msg) => (
              <div
                key={msg.id}
                className={`mb-4 p-3 rounded-lg ${
                  msg.senderType === "admin"
                    ? "bg-[#d4af37]/20 ml-8"
                    : "bg-[#1e3a5f]/10 mr-8"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-[#1e3a5f]">
                    {msg.senderType === "admin" ? "🛡️ " : "👤 "}
                    {msg.senderName}
                  </span>
                  <span className="text-xs text-[#8b6f47]">
                    {new Date(msg.createdAt).toLocaleString("pt-BR")}
                  </span>
                </div>
                <p className="text-[#1e3a5f] whitespace-pre-wrap">{msg.message}</p>
              </div>
            ))}
            {ticketMessages.length === 0 && (
              <p className="text-center text-[#8b6f47] py-4">
                Aguardando resposta da equipe de suporte...
              </p>
            )}
          </div>

          {/* Client Name Input (if not set) */}
          {!clientName && (
            <div className="mb-4">
              <label className="block text-[#1e3a5f] font-semibold mb-2">
                Seu Nome:
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Digite seu nome..."
                className="w-full p-3 border-2 border-[#d4af37] rounded-lg text-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
              />
            </div>
          )}

          {/* Message Input */}
          <div className="space-y-4">
            <label className="block text-[#1e3a5f] font-semibold">
              Sua Mensagem:
            </label>
            <div className="flex gap-2">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite sua mensagem aqui..."
                className="flex-1 p-3 border-2 border-[#d4af37] rounded-lg text-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                rows={4}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) {
                    handleSendMessage();
                  }
                }}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || !clientName.trim() || sendingMessage}
                className="bg-[#d4af37] hover:bg-[#b8941f] text-[#1e3a5f] font-bold self-end"
              >
                {sendingMessage ? (
                  "Enviando..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-1" />
                    Enviar
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-[#8b6f47]">
              💡 Dica: Pressione Ctrl+Enter para enviar rapidamente
            </p>
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-[#d4af37]/10 rounded-lg border border-[#d4af37]/30">
            <p className="text-sm text-[#1e3a5f]">
              <strong>ℹ️ Informações:</strong>
            </p>
            <ul className="text-sm text-[#8b6f47] mt-2 space-y-1">
              <li>• Horário de Atendimento: 10h às 18h</li>
              <li>• Você receberá um e-mail quando houver resposta</li>
              <li>• Mantenha este link salvo para acompanhar a conversa</li>
            </ul>
          </div>
        </Card>
      </main>
    </div>
  );
}

