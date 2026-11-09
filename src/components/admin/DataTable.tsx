// Primeira coluna é o rótulo e fica fixa ao rolar para o lado no celular; as demais, valores alinhados à direita
const STICKY = "sticky left-0 bg-[color-mix(in_srgb,var(--color-navy)_60%,var(--color-ink))]";
const STRIPE = "bg-[color-mix(in_srgb,white_5%,color-mix(in_srgb,var(--color-navy)_60%,var(--color-ink)))]";

export function DataTable({ head, rows, foot, striped = false }: { head: string[]; rows: string[][]; foot: string[]; striped?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-navy/60">
      <table className="w-full min-w-[34rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-[0.8125rem] text-muted">
            {head.map((h, i) => (
              <th key={i} className={`px-4 py-3 font-medium ${i ? "text-right" : `text-left ${STICKY}`}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r, ri) => {
            const stripe = striped && ri % 2 === 0;
            return (
              <tr key={ri} className={stripe ? STRIPE : ""}>
                {r.map((c, i) => (
                  <td key={i} className={`px-4 py-3 ${i ? "num text-right" : `font-medium sticky left-0 ${stripe ? STRIPE : STICKY}`}`}>
                    {c}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-line-strong font-semibold">
            {foot.map((c, i) => (
              <td key={i} className={`px-4 py-3 ${i ? "num text-right" : STICKY}`}>
                {c}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
