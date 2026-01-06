import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Inbox, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function SupportTickets() {
  const { data: supportRequests, isLoading, refetch } = trpc.admin.supportRequests.useQuery({ status: 'all', department: 'all' });
  
  const updateStatus = trpc.admin.updateSupportStatus.useMutation({ 
    onSuccess: () => { 
      toast.success("Ticket atualizado"); 
      refetch(); 
    } 
  });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#d4af37] w-10 h-10" /></div>;

  const activeTickets = supportRequests?.filter(r => !r.archived) || [];

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[#1e3a5f] font-bold">Solicitações Ativas ({activeTickets.length})</h3>
      </div>

      {activeTickets.length > 0 ? (
        activeTickets.map((req) => (
          <Card key={req.id} className="p-6 bg-white hover:border-[#d4af37] transition-all border-2 border-transparent shadow-sm">
             <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex gap-4">
                   <div className="h-12 w-12 bg-[#1e3a5f]/5 rounded-xl flex items-center justify-center shrink-0">
                      <Inbox className="w-6 h-6 text-[#1e3a5f]/50" />
                   </div>
                   <div>
                      <h4 className="font-bold text-[#1e3a5f] leading-tight">{req.name}</h4>
                      <p className="text-xs text-gray-400 mb-2">{req.email} • {new Date(req.createdAt).toLocaleString("pt-BR")}</p>
                      <div className="text-sm text-[#1e3a5f]/80 italic border-l-4 border-[#d4af37] pl-3 py-1 bg-gray-50 rounded-r-lg">
                        "{req.message}"
                      </div>
                   </div>
                </div>
                <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
                   <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full text-center ${
                      req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                   }`}>
                      {req.status === 'pending' ? 'Pendente' : 'Resolvido'}
                   </span>
                   <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => window.open(`mailto:${req.email}`)} 
                    className="flex-1 text-xs border-[#d4af37] text-[#1e3a5f] font-bold"
                   >
                    Responder
                   </Button>
                   {req.status === 'pending' && (
                     <Button 
                      size="sm" 
                      onClick={() => updateStatus.mutate({ id: req.id, status: 'resolved' })} 
                      className="flex-1 text-xs bg-green-600 text-white font-bold"
                     >
                      Resolver
                     </Button>
                   )}
                </div>
             </div>
          </Card>
        ))
      ) : (
        <div className="text-center py-20 text-gray-400 italic">Nenhum ticket pendente.</div>
      )}
    </div>
  );
}