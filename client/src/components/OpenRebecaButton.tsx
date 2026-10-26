import { MessageCircle } from "lucide-react";

export function openRebecaChat() {
  window.dispatchEvent(new CustomEvent("openRebecaChat"));
}

interface OpenRebecaButtonProps {
  variant?: "header" | "menu";
  onOpen?: () => void;
}

export default function OpenRebecaButton({ variant = "header", onOpen }: OpenRebecaButtonProps) {
  const handleClick = () => {
    openRebecaChat();
    onOpen?.();
  };

  if (variant === "menu") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="block w-full text-left px-4 py-3 text-[#d4af37] hover:bg-[#2a4a7f] rounded-lg transition-colors"
      >
        Falar com Rebeca
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d4af37] text-[#1e3a5f] shadow-md hover:bg-[#B8860B] transition-colors"
      aria-label="Falar com Rebeca"
      title="Ajuda"
    >
      <MessageCircle className="h-5 w-5" />
    </button>
  );
}
