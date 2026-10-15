// Texto livre digitado no painel: mantém as quebras de linha e vira *trecho* em negrito (como no WhatsApp)
export function RichText({ text, className = "" }: { text: string; className?: string }) {
  return (
    <p className={`whitespace-pre-line ${className}`}>
      {text
        .trim()
        .split(/(\*[^*\n]+\*)/g)
        .map((part, i) =>
          /^\*[^*\n]+\*$/.test(part) ? (
            <strong key={i} className="font-semibold">
              {part.slice(1, -1)}
            </strong>
          ) : (
            part
          ),
        )}
    </p>
  );
}
