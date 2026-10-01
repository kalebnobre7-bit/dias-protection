"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Briefcase as IconJobs, Building2 as IconPartners, Car as IconVehicles, ChartColumn as IconFinance, ExternalLink as IconExternal, FileText as IconProposals, House as IconHome, LogOut as IconLogout, Menu as IconMenu, ShieldCheck as IconAgents, Trash2, Users as IconClients } from "lucide-react";

import { Emblem } from "@/components/brand/Logo";
import { signOut, useSession } from "@/lib/admin/auth";
import { repo } from "@/lib/admin/store";


const nav = [
  { href: "/admin", label: "Início", Icon: IconHome },
  { href: "/admin/propostas", label: "Propostas", Icon: IconProposals },
  { href: "/admin/servicos", label: "Serviços", Icon: IconJobs },
  { href: "/admin/clientes", label: "Clientes", Icon: IconClients },
  { href: "/admin/parceiros", label: "Parceiros", Icon: IconPartners },
  { href: "/admin/agentes", label: "Agentes", Icon: IconAgents },
  { href: "/admin/veiculos", label: "Veículos", Icon: IconVehicles },
  { href: "/admin/financeiro", label: "Financeiro", Icon: IconFinance },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname().replace(/\/$/, "") || "/admin";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (session === "out") router.replace("/admin/login");
  }, [session, router]);
  useEffect(() => setOpen(false), [pathname]);

  if (session !== "in") return <div className="min-h-dvh bg-ink" />;

  const logout = async () => {
    await signOut();
    router.replace("/admin/login");
  };

  const sidebar = (
    <nav aria-label="Painel" className="flex h-full flex-col gap-1 p-3">
      <Link href="/admin" className="mb-4 flex min-h-12 items-center gap-3 px-3">
        <Emblem className="h-9 text-text" />
        <span className="leading-tight">
          <span className="block font-semibold tracking-[-0.02em]">Dias Protection</span>
          <span className="block text-xs text-muted">Painel</span>
        </span>
      </Link>
      {nav.map(({ href, label, Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-[0.9375rem] transition-colors duration-200 ${
              active ? "bg-white/8 font-medium text-text" : "text-muted hover:bg-white/4 hover:text-text"
            }`}
          >
            <Icon className={`size-5 ${active ? "text-accent" : ""}`} />
            {label}
          </Link>
        );
      })}

      <div className="mt-auto space-y-1 border-t border-line pt-3">
        <a
          href={`${process.env.NEXT_PUBLIC_BASE_PATH}/pt`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-[0.9375rem] text-muted transition-colors hover:bg-white/4 hover:text-text"
        >
          <IconExternal className="size-5" /> Ver site
        </a>
        <ResetData />
        <button
          type="button"
          onClick={logout}
          className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-[0.9375rem] text-muted transition-colors hover:bg-white/4 hover:text-text"
        >
          <IconLogout className="size-5" /> Sair
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-dvh bg-ink lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh border-r border-line bg-ink-2 lg:block">{sidebar}</aside>

      {/* Celular: barra superior + gaveta */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-ink/80 px-2 backdrop-blur-[16px] backdrop-saturate-[180%] lg:hidden">
        <button type="button" onClick={() => setOpen(true)} aria-label="Abrir menu" className="grid size-11 place-items-center rounded-full">
          <IconMenu className="size-5" />
        </button>
        <span className="font-semibold tracking-[-0.02em]">{nav.find((n) => (n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href)))?.label}</span>
        <span className="size-11" />
      </header>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-black/60"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.aside
              className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-line bg-ink-2 pb-[env(safe-area-inset-bottom)]"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 38 }}
            >
              {sidebar}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <main className="mx-auto w-full min-w-0 max-w-5xl px-4 pb-16 pt-6 md:px-8 md:pt-10">{children}</main>
    </div>
  );
}

// Enquanto não há Supabase: zera os dados de exemplo antes do uso real
function ResetData() {
  const [armed, setArmed] = useState(false);
  const run = async () => {
    if (!armed) return setArmed(true);
    await repo.reset("empty");
    setArmed(false);
  };
  return (
    <button
      type="button"
      onClick={run}
      onBlur={() => setArmed(false)}
      className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[0.9375rem] transition-colors hover:bg-white/4 ${armed ? "text-danger" : "text-muted hover:text-text"}`}
    >
      <Trash2 className="size-5" />
      {armed ? "Apagar tudo? Toque de novo" : "Zerar dados de exemplo"}
    </button>
  );
}
