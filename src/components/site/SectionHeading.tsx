type Props = { label: string; title: string; lead?: string; align?: "left" | "center" };

export function SectionHeading({ label, title, lead, align = "left" }: Props) {
  const center = align === "center";
  return (
    <header className={`mb-12 md:mb-16 ${center ? "mx-auto text-center" : ""}`}>
      <p className="label">{label}</p>
      <h2 className={`t-h2 mt-3 max-w-[20ch] ${center ? "mx-auto" : ""}`}>{title}</h2>
      {lead && <p className={`t-lead mt-5 max-w-[52ch] ${center ? "mx-auto" : ""}`}>{lead}</p>}
    </header>
  );
}
