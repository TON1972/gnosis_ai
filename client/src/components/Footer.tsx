import { APP_TITLE } from "@/const";
import { Link } from "wouter";

export default function Footer() {
    return (
        <footer className="bg-[#1e3a5f] text-[#d4af37] py-12 mt-16 border-t-4 border-[#d4af37]">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-3 gap-8 mb-8">
                    <div>
                        <h4 className="text-xl font-bold mb-4">Sobre</h4>
                        <p className="text-[#B8860B]">
                            GNOSIS AI é uma plataforma de estudos bíblicos profundos,
                            desenvolvida para pastores, teólogos e estudantes de seminário.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-xl font-bold mb-4">Links Rápidos</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/faq">
                                    <span className="text-[#B8860B] hover:text-[#d4af37] transition-colors cursor-pointer">
                                        Perguntas Frequentes
                                    </span>
                                </Link>
                            </li>
                            <li>
                                <a href="#planos" className="text-[#B8860B] hover:text-[#d4af37] transition-colors">
                                    Planos e Preços
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-xl font-bold mb-4">Contato</h4>
                        <p className="text-[#B8860B]">
                            Dúvidas ou sugestões? Entre em contato conosco.<br></br>
                            <a href="mailto:contato@gnosisai.global">contato@gnosisai.global</a>
                        </p>
                    </div>
                </div>
                <div className="text-center pt-8 border-t-2 border-[#d4af37]">
                    <p className="text-lg">
                        © 2025 {APP_TITLE} - Todos os direitos reservados
                    </p>
                    <p className="text-sm text-[#B8860B] mt-2">
                        Aprofunde-se na Palavra com ferramentas de excelência
                    </p>
                </div>
            </div>
        </footer>
    );
}
