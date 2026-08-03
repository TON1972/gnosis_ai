import { useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter"; // Alterado para navegação
import { Download, Trash2, Clock, BookText, FileText, MessageSquare, Trash } from "lucide-react";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import PlanRequiredModal from "@/components/PlanRequiredModal";
 
export default function SavedStudiesSection() {
  const { t, i18n } = useTranslation();
  const { data: savedStudies, refetch } = trpc.studies.list.useQuery();
  const deleteStudyMutation = trpc.studies.delete.useMutation();
  const [, setLocation] = useLocation();
  const { canUseTools, isLoading: planAccessLoading } = usePlanAccess();
  const [showPlanRequiredModal, setShowPlanRequiredModal] = useState(false);
 
  const currentLocale = i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : 'pt-BR';
 
  const handleDelete = async (id: number) => {
    if (!confirm(t('savedStudies.confirmDelete'))) return;
    try {
      await deleteStudyMutation.mutateAsync({ id });
      toast.success(t('savedStudies.deleteSuccess'));
      refetch();
    } catch (error) {
      toast.error(t('savedStudies.deleteError'));
    }
  };
 
  const handleDownloadTxt = (study: any) => {
    const blob = new Blob([study.output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${study.toolName.replace(/\s+/g, '_')}_${new Date(study.createdAt).toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
 
  const handleContinueStudy = (studyId: number) => {
    if (!planAccessLoading && !canUseTools) {
      setShowPlanRequiredModal(true);
      return;
    }
    setLocation(`/study/${studyId}`);
  };

  if (!savedStudies || savedStudies.length === 0) return null;
 
  return (
    <div className="bg-white/90 rounded-2xl p-4 shadow-xl border-4 border-[#d4af37]">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-[#d4af37]">
        < BookText className="w-5 h-5 text-[#1e3a5f]" />
        <h3 className="text-lg font-bold text-[#1e3a5f]">{t('savedStudies.title')}</h3>
      </div>
 
      <div className="saved-studies-list space-y-3 max-h-125 overflow-y-auto">
        {savedStudies.map((study) => (
          <div key={study.id} className="bg-[#FFFACD] border-2 border-[#d4af37] rounded-lg p-3">
            <div className="mb-2">
              <h4 className="text-sm font-bold text-[#1e3a5f] mb-1">{study.toolName}</h4>
              <p className="text-xs text-[#8b6f47] line-clamp-2 mb-2">{study.input}</p>
              <div className="flex items-center gap-2 text-xs text-[#8b6f47]">
                <Clock className="w-3 h-3" />
                {new Date(study.createdAt).toLocaleDateString(currentLocale)}
              </div>
            </div>
 
            <div className="flex gap-1">
              {/* ✅ NOVO: Botão que leva para a página de chat */}
              <Button
                onClick={() => handleContinueStudy(study.id)}
                className="flex-1 h-8 bg-[#1e3a5f] text-white hover:bg-[#d4af37] text-xs"
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                {t('savedStudies.continueBtn')}
              </Button>
              <Button
                onClick={() => handleDownloadTxt(study)}
                variant="outline"
                size="sm"
                className="h-8 border-[#d4af37] text-[#1e3a5f]"
              >
                <FileText className="w-3 h-3" />
              </Button>
              <Button
                onClick={() => handleDelete(study.id)}
                variant="outline"
                size="sm"
                className="h-8 border-red-500 text-red-600"
              >
                <Trash className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <PlanRequiredModal
        open={showPlanRequiredModal}
        onOpenChange={setShowPlanRequiredModal}
      />
    </div>
  );
}