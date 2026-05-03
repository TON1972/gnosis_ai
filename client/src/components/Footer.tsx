import { APP_TITLE } from "@/const";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";

export default function Footer() {
    const { t } = useTranslation();

    return (
        <footer className="bg-[#1e3a5f] text-[#d4af37] py-12 mt-16 border-t-4 border-[#d4af37]">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-3 gap-8 mb-8">
                    <div>
                        <h4 className="text-xl font-bold mb-4">{t('footer.aboutTitle')}</h4>
                        <p className="text-[#B8860B]">
                            {t('footer.aboutText')}
                        </p>
                    </div>
                    <div>
                        <h4 className="text-xl font-bold mb-4">{t('footer.linksTitle')}</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/faq">
                                    <span className="text-[#B8860B] hover:text-[#d4af37] transition-colors cursor-pointer">
                                        {t('menu.faq')}
                                    </span>
                                </Link>
                            </li>
                            <li>
                                <a href="#planos" className="text-[#B8860B] hover:text-[#d4af37] transition-colors">
                                    {t('home.btnPlans')}
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-xl font-bold mb-4">{t('footer.contactTitle')}</h4>
                        <p className="text-[#B8860B]">
                            {t('footer.contactText')}<br></br>
                            <a href="mailto:contato@gnosisai.global">contato@gnosisai.global</a>
                        </p>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t-2 border-[#d4af37]">
                    <div className="text-center md:text-left mb-4 md:mb-0">
                        <p className="text-lg">
                            © 2025 {APP_TITLE} - {t('footer.rights')}
                        </p>
                        <p className="text-sm text-[#B8860B] mt-2">
                            {t('footer.tagline')}
                        </p>
                    </div>
                    <div className="ml-auto">
                        <LanguageSwitcher />
                    </div>
                </div>
            </div>
        </footer>
    );
}
