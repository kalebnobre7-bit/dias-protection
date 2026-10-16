type Props = { label: string; title: string; lead?: string; align?: "left" | "center" };

export function SectionHeading({ label, title, lead, align = "left" }: Props) {
  const center = align === "center";
  return (
    // Celular: sempre centralizado; desktop segue `align`
    <header className={`mb-12 text-center md:mb-16 ${center ? "mx-auto" : "md:text-left"}`}>
      <p className="label">{label}</p>
      <h2 className={`t-h2 mx-auto mt-3 max-w-[20ch] ${center ? "" : "md:mx-0"}`}>{title}</h2>
      {lead && <p className={`t-lead mx-auto mt-5 max-w-[52ch] ${center ? "" : "md:mx-0"}`}>{lead}</p>}
    </header>
  );
}
