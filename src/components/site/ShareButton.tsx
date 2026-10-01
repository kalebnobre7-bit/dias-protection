"use client";

import { useState } from "react";

type Props = { title: string; text: string; label: string; copied: string; className?: string };

// Compartilha pelo menu nativo do celular; no desktop copia o link
export function ShareButton({ title, text, label, copied, className = "" }: Props) {
  const [done, setDone] = useState(false);

  async function share() {
    const url = `${window.location.origin}${window.location.pathname}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // usuário cancelou o menu
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      window.prompt(label, url);
    }
  }

  return (
    <button type="button" onClick={share} className={className} aria-live="polite">
      {done ? copied : label}
    </button>
  );
}
