import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { MessageCircle, Send, X } from "lucide-react";

interface TicketSystemProps {
  ticketId: number;
  onClose: () => void;
  ticketStatus?: string;
  isArchived?: boolean;
  onArchiveChange?: () => void;
}

export default function TicketSystem({ ticketId, onClose, ticketStatus, isArchived, onArchiveChange }: TicketSystemProps) {
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Get ticket info directly to ensure we have the latest status
  const { data: ticketInfo } = trpc.admin.supportRequests.useQuery(
    { status: "all", department: "all" },
    {
      select: (data) => data.find(t => t.id === ticketId),
    }
  );

  // Use ticketInfo if available, fallback to props
  const currentStatus = ticketInfo?.status || ticketStatus;
  const currentArchived = ticketInfo?.archived ?? isArchived ?? false;

  // Query ticket messages
  const { data: ticketMessages = [], refetch } = trpc.admin.getTicketMessages.useQuery(
    { ticketId },
    {
      refetchInterval: 5000, // Auto-refresh every 5 seconds
    }
  );

  // Send message mutation
  const sendMessageMutation = trpc.admin.sendTicketMessage.useMutation({
    onSuccess: () => {
      toast.success("Mensagem enviada com sucesso!");
      setNewMessage("");
      setSendingMessage(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao enviar mensagem: ${error.message}`);
      setSendingMessage(false);
    },
  });

  // Mark as read mutation
  const markAsReadMutation = trpc.admin.markTicketAsRead.useMutation();

  // Archive/unarchive mutations
  const archiveMutation = trpc.admin.archiveTicket.useMutation({
    onSuccess: () => {
      toast.success("Ticket arquivado com sucesso!");
      onArchiveChange?.();
      onClose();
    },
    onError: (error) => {
      toast.error(`Erro ao arquivar: ${error.message}`);
    },
  });

  const unarchiveMutation = trpc.admin.unarchiveTicket.useMutation({
    onSuccess: () => {
      toast.success("Ticket desarquivado com sucesso!");
      onArchiveChange?.();
    },
    onError: (error) => {
      toast.error(`Erro ao desarquivar: ${error.message}`);
    },
  });

  // Mark messages as read when opening ticket
  useEffect(() => {
    markAsReadMutation.mutate({ ticketId });
  }, [ticketId]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    setSendingMessage(true);
    sendMessageMutation.mutate({
      ticketId,
      message: newMessage.trim(),
    });
  };

  return (
    <Card className="mt-6 p-6 bg-gradient-to-br from-[#FFFACD] to-white border-2 border-[#d4af37]">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-[#d4af37]" />
          <h2 className="text-2xl font-bold text-[#1e3a5f]">
            Conversa - Ticket #{ticketId}
          </h2>
        </div>
        <div className="flex gap-2">
          {/* Archive/Unarchive Button - Show for resolved tickets only */}
          {currentStatus === "resolved" && (
            currentArchived ? (
              <Button
                onClick={() => unarchiveMutation.mutate({ ticketId })}
                variant="outline"
                className="border-green-500 text-green-700 hover:bg-green-50"
                size="sm"
              >
                📦 Desarquivar
              </Button>
            ) : (
              <Button
                onClick={() => archiveMutation.mutate({ ticketId })}
                variant="outline"
                className="border-gray-500 text-gray-700 hover:bg-gray-50"
                size="sm"
              >
                📦 Arquivar
              </Button>
            )
          )}
          <Button
            onClick={onClose}
            variant="outline"
            className="border-[#d4af37] text-[#1e3a5f]"
            size="sm"
          >
            <X className="w-4 h-4 mr-1" />
            Fechar
          </Button>
        </div>
      </div>

      {/* Messages Display */}
      <div className="bg-white rounded-lg p-4 mb-4 max-h-96 overflow-y-auto border-2 border-[#d4af37]/30">
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
            Nenhuma mensagem ainda. Seja o primeiro a responder!
          </p>
        )}
      </div>

      {/* Message Input */}
      <div className="flex gap-2">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Digite sua resposta aqui..."
          className="flex-1 p-3 border-2 border-[#d4af37] rounded-lg text-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
          rows={3}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.ctrlKey) {
              handleSendMessage();
            }
          }}
        />
        <Button
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || sendingMessage}
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
      <p className="text-xs text-[#8b6f47] mt-2">
        💡 Dica: Pressione Ctrl+Enter para enviar rapidamente
      </p>
    </Card>
  );
}

