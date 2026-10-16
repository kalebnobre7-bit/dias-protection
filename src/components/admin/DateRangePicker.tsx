"use client";

import { useState } from "react";
import { ChevronLeft as IconPrev, ChevronRight as IconNext } from "lucide-react";

// Período tipo Airbnb: 1º toque marca o início, 2º marca o fim. Datas "YYYY-MM-DD"; end "" = um dia só.
const WEEK = ["D", "S", "T", "Q", "Q", "S", "S"];
const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const todayIso = () => {
  const t = new Date();
  return iso(t.getFullYear(), t.getMonth(), t.getDate());
};

export function DateRangePicker({ start, end, onChange }: { start: string; end: string; onChange: (start: string, end: string) => void }) {
  const first = start ? start.split("-").map(Number) : null;
  const [view, setView] = useState(() => {
    const t = new Date();
    return first ? { y: first[0], m: first[1] - 1 } : { y: t.getFullYear(), m: t.getMonth() };
  });
  const [hover, setHover] = useState("");

  const shift = (n: number) => setView((v) => ({ y: v.y + Math.floor((v.m + n) / 12), m: (((v.m + n) % 12) + 12) % 12 }));
  const pick = (day: string) => {
    if (!start || end) return onChange(day, "");
    if (day < start) return onChange(day, "");
    onChange(start, day === start ? "" : day);
  };

  // Fim provisório enquanto o mouse passa, para mostrar a faixa antes do 2º toque
  const rangeEnd = end || (start && hover > start ? hover : "");
  const next = { y: view.y + Math.floor((view.m + 1) / 12), m: (view.m + 1) % 12 };

  return (
    <div className="rounded-xl border border-line p-4" onMouseLeave={() => setHover("")}>
      <div className="grid gap-6 md:grid-cols-2">
        <Month y={view.y} m={view.m} start={start} end={rangeEnd} onPick={pick} onHover={setHover} onPrev={() => shift(-1)} onNext={() => shift(1)} nextClass="md:invisible" />
        <div className="hidden md:block">
          <Month y={next.y} m={next.m} start={start} end={rangeEnd} onPick={pick} onHover={setHover} onPrev={() => shift(-1)} onNext={() => shift(1)} prevClass="invisible" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3 text-[0.8125rem] text-muted">
        <span>{!start ? "Toque no primeiro dia" : !end ? "Toque no último dia (ou deixe um dia só)" : "Período marcado"}</span>
        {start && (
          <button type="button" onClick={() => onChange("", "")} className="min-h-9 rounded-md px-3 text-sm font-medium text-text underline-offset-4 hover:underline">
            Limpar
          </button>
        )}
      </div>
    </div>
  );
}

function Month(props: {
  y: number;
  m: number;
  start: string;
  end: string;
  onPick: (day: string) => void;
  onHover: (day: string) => void;
  onPrev: () => void;
  onNext: () => void;
  prevClass?: string;
  nextClass?: string;
}) {
  const { y, m, start, end } = props;
  const offset = new Date(y, m, 1).getDay();
  const total = new Date(y, m + 1, 0).getDate();
  const today = todayIso();
  const title = new Date(y, m, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const nav = "grid size-9 place-items-center rounded-md text-muted hover:bg-white/6 hover:text-text";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={props.onPrev} aria-label="Mês anterior" className={`${nav} ${props.prevClass ?? ""}`}>
          <IconPrev className="size-4" />
        </button>
        <p className="text-sm font-semibold first-letter:uppercase">{title}</p>
        <button type="button" onClick={props.onNext} aria-label="Próximo mês" className={`${nav} ${props.nextClass ?? ""}`}>
          <IconNext className="size-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs text-muted">
        {WEEK.map((w, i) => (
          <span key={i} className="py-1">
            {w}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: offset }, (_, i) => (
          <span key={`e${i}`} />
        ))}
        {Array.from({ length: total }, (_, i) => {
          const day = iso(y, m, i + 1);
          const edge = day === start || day === end;
          const inside = !!start && !!end && day > start && day < end;
          // Faixa contínua entre início e fim, com as pontas em círculo
          const band = end && start !== end ? (day === start ? "bg-gradient-to-r from-transparent from-50% to-accent/15 to-50%" : day === end ? "bg-gradient-to-l from-transparent from-50% to-accent/15 to-50%" : inside ? "bg-accent/15" : "") : "";
          return (
            <div key={day} className={`py-0.5 ${band}`}>
              <button
                type="button"
                onClick={() => props.onPick(day)}
                onMouseEnter={() => props.onHover(day)}
                aria-pressed={edge || inside}
                aria-label={new Date(y, m, i + 1).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
                className={`num mx-auto grid size-10 place-items-center rounded-full text-[0.875rem] transition-colors duration-150 ${
                  edge ? "bg-text font-semibold text-ink" : "hover:ring-1 hover:ring-text/60"
                } ${day === today && !edge ? "font-semibold text-accent" : ""}`}
              >
                {i + 1}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
