import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Inbox, Loader2, MessageSquare, Trash2, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function SupportTickets() {
  const { data: supportRequests, isLoading, refetch } = trpc.admin.supportRequests.useQuery({ status: 'all', department: 'all' });
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const updateStatus = trpc.admin.updateSupportStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado");
      refetch();
    }
  });

  const deleteTicket = trpc.admin.deleteSupportRequest.useMutation({
    onSuccess: () => {
      toast.success("Ticket excluído");
      refetch();
      setIsOpen(false);
    }
  });

  const { data: ticketMessages, refetch: refetchMessages } = trpc.admin.getTicketMessages.useQuery(
    { ticketId: selectedTicket?.id || 0 },
    { enabled: !!selectedTicket }
  );

  const sendReply = trpc.admin.sendTicketMessage.useMutation({
    onSuccess: () => {
      toast.success("Resposta enviada");
      setReplyMessage("");
      refetchMessages();
    }
  });

  const handleOpenTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    setIsOpen(true);
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    await sendReply.mutateAsync({
      ticketId: selectedTicket.id,
      message: replyMessage
    });

    // Auto-update status to resolved or contacted? Vamos manter opcional
    // updateStatus.mutate({ id: selectedTicket.id, status: 'contacted' });
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este ticket? Essa ação não pode ser desfeita.")) {
      deleteTicket.mutate({ id });
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#d4af37] w-10 h-10" /></div>;

  const activeTickets = supportRequests?.filter(r => !r.archived) || [];

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[#1e3a5f] font-bold">Solicitações ({activeTickets.length})</h3>
      </div>

      {activeTickets.length > 0 ? (
        activeTickets.map((req) => (
          <Card key={req.id} className="p-4 md:p-6 bg-white hover:border-[#d4af37] transition-all border-2 border-transparent shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="h-12 w-12 bg-[#1e3a5f]/5 rounded-xl flex items-center justify-center shrink-0">
                    <Inbox className="w-6 h-6 text-[#1e3a5f]/50" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1e3a5f] leading-tight">{req.name}</h4>
                    <p className="text-xs text-gray-400">{req.email} • {new Date(req.createdAt).toLocaleString("pt-BR")}</p>
                    <span className="text-[10px] font-medium px-2 py-0.5 bg-gray-100 rounded text-gray-500 mt-1 inline-block uppercase">
                      {req.department}
                    </span>
                  </div>
                </div>

                <Select
                  defaultValue={req.status}
                  onValueChange={(val: any) => updateStatus.mutate({ id: req.id, status: val })}
                >
                  <SelectTrigger className={`w-[130px] h-8 text-xs font-bold uppercase border-0 ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    req.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="contacted">Em Andamento</SelectItem>
                    <SelectItem value="resolved">Resolvido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-[#d4af37]">
                <p className="text-sm text-[#1e3a5f]/80 italic">"{req.message}"</p>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(req.id)}
                  className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </Button>

                <Button
                  size="sm"
                  onClick={() => handleOpenTicket(req)}
                  className="bg-[#1e3a5f] text-white hover:bg-[#2a4a7f] h-8"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Ver / Responder
                </Button>
              </div>
            </div>
          </Card>
        ))
      ) : (
        <div className="text-center py-20 text-gray-400 italic">Nenhum ticket encontrado.</div>
      )}

      {/* DIALOG DE RESPOSTA */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl bg-[#f8f9fa] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-[#1e3a5f] flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#d4af37]" />
              Ticket #{selectedTicket?.id} - {selectedTicket?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            <ScrollArea className="flex-1 bg-white rounded-lg border p-4 h-[300px]">
              <div className="space-y-4">
                {/* Mensagem Original */}
                <div className="flex flex-col gap-1 items-start">
                  <span className="text-xs font-bold text-gray-500">{selectedTicket?.name} (Cliente)</span>
                  <div className="bg-gray-100 p-3 rounded-tr-lg rounded-br-lg rounded-bl-lg text-sm text-[#1e3a5f]">
                    {selectedTicket?.message}
                  </div>
                  <span className="text-[10px] text-gray-400">{new Date(selectedTicket?.createdAt).toLocaleString()}</span>
                </div>

                {/* Histórico */}
                {ticketMessages?.map((msg: any) => (
                  <div key={msg.id} className={`flex flex-col gap-1 ${msg.senderType === 'admin' ? 'items-end' : 'items-start'}`}>
                    <span className="text-xs font-bold text-gray-500">
                      {msg.senderType === 'admin' ? 'Você (Admin)' : `${selectedTicket?.name} (Cliente)`}
                    </span>
                    <div className={`p-3 text-sm max-w-[80%] ${msg.senderType === 'admin'
                      ? 'bg-[#1e3a5f] text-white rounded-tl-lg rounded-bl-lg rounded-br-lg'
                      : 'bg-gray-200 text-[#1e3a5f] rounded-tr-lg rounded-br-lg rounded-bl-lg'
                      }`}>
                      {msg.message}
                    </div>
                    <span className="text-[10px] text-gray-400">{new Date(msg.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="space-y-2">
              <Textarea
                placeholder="Escreva sua resposta..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                className="bg-white border-[#d4af37]/30 focus:border-[#d4af37]"
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Essa resposta será enviada por email para o cliente.</span>
                <Button
                  onClick={handleSendReply}
                  disabled={sendReply.isPending || !replyMessage.trim()}
                  className="bg-[#d4af37] text-[#1e3a5f] font-bold hover:bg-[#b08d26]"
                >
                  {sendReply.isPending ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Enviar Resposta
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}