/**
 * 🔐 Autenticação - GNOSIS AI
 * Login com Email/Senha ou Google + Seleção de Planos
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { BookOpen, Loader2, CheckCircle2 } from "lucide-react";
import { APP_TITLE } from "@/const";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function Auth() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register state
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<string>("1"); 

  const { data: plans } = trpc.plans.list.useQuery();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const planParam = params.get("plan");
    const tabParam = params.get("tab");
    
    if (planParam) setSelectedPlan(planParam);
    if (tabParam === "register") setActiveTab("register");
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return toast.error("Preencha todos os campos");

    setLoading(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Bem-vindo de volta!");
        window.location.href = "/dashboard";
      } else {
        toast.error(data.message || "Credenciais inválidas");
      }
    } catch (error) {
      toast.error("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName || !registerEmail || !registerPassword) return toast.error("Preencha todos os campos");
    if (registerPassword !== registerConfirmPassword) return toast.error("As senhas não coincidem");

    setLoading(true);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          password: registerPassword,
          planId: Number(selectedPlan),
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Conta criada com sucesso!");
        window.location.href = "/dashboard";
      } else {
        toast.error(data.message || "Erro ao criar conta");
      }
    } catch (error) {
      toast.error("Erro no servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1e3a5f] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[#FFFACD] border-[#d4af37]/30 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="bg-[#d4af37] p-3 rounded-full">
              <BookOpen className="w-10 h-10 text-[#1e3a5f]" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-[#1e3a5f] uppercase tracking-tighter">
            {APP_TITLE}
          </CardTitle>
          <CardDescription className="text-[#1e3a5f]/70 font-medium">
            Sua jornada de conhecimento bíblico começa aqui
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-[#1e3a5f]/10 p-1">
              <TabsTrigger value="login" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white">Entrar</TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white">Cadastrar</TabsTrigger>
            </TabsList>

            {/* Google Login Only */}
            <div className="mb-6">
              <Button 
                variant="outline" 
                onClick={() => window.location.href = "/api/oauth/google"}
                className="w-full border-[#d4af37]/50 bg-transparent hover:bg-[#d4af37]/10 text-[#1e3a5f] font-bold h-12"
              >
                <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continuar com Google
              </Button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-[#d4af37]/30" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#FFFACD] px-2 text-[#1e3a5f]/60 font-bold">Ou E-mail</span></div>
            </div>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[#1e3a5f] font-bold">Email</Label>
                  <Input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="border-[#d4af37]/40 bg-white/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#1e3a5f] font-bold">Senha</Label>
                  <Input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="border-[#d4af37]/40 bg-white/50" />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-[#1e3a5f] text-white hover:bg-[#2a4a6f] h-12 font-bold">
                  {loading ? <Loader2 className="animate-spin" /> : "Entrar e Estudar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-[#1e3a5f] font-bold">Nome Completo</Label>
                  <Input value={registerName} onChange={(e) => setRegisterName(e.target.value)} className="border-[#d4af37]/40 bg-transparent h-10" />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[#1e3a5f] font-bold">Email</Label>
                    <Input type="email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} className="border-[#d4af37]/40 bg-white/50 h-10" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[#1e3a5f] font-bold">Plano Desejado</Label>
                    <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                      <SelectTrigger className="border-[#d4af37]/40 bg-transparent h-10">
                        <SelectValue placeholder="Plano" />
                      </SelectTrigger>
                      {/* ✅ Fundo branco/bege definido no SelectContent para não ficar transparente */}
                      <SelectContent className="bg-[#FFFACD] border-[#d4af37] shadow-xl">
                        {plans?.map((p) => (
                          <SelectItem key={p.id} value={p.id.toString()} className="font-bold text-[#1e3a5f] hover:bg-[#d4af37]/10">
                            {p.displayName.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[#1e3a5f] font-bold">Senha</Label>
                    <Input type="password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} className="border-[#d4af37]/40 bg-white/50 h-10" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[#1e3a5f] font-bold">Confirmar</Label>
                    <Input type="password" value={registerConfirmPassword} onChange={(e) => setRegisterConfirmPassword(e.target.value)} className="border-[#d4af37]/40 bg-transparent h-10" />
                  </div>
                </div>

                <div className="bg-[#1e3a5f]/5 p-3 rounded-lg border border-[#d4af37]/20 flex items-start gap-2 mt-2">
                  <CheckCircle2 className="w-4 h-4 text-[#d4af37] mt-0.5" />
                  <p className="text-[10px] text-[#1e3a5f]/80 italic">
                    Ao criar sua conta, você receberá automaticamente os créditos iniciais do plano 
                    <strong> {plans?.find(p => p.id.toString() === selectedPlan)?.displayName}</strong>.
                  </p>
                </div>

                <Button type="submit" disabled={loading} className="w-full bg-[#1e3a5f] text-white hover:bg-[#2a4a6f] h-12 font-bold mt-2">
                  {loading ? <Loader2 className="animate-spin" /> : "Criar Conta e Começar"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}