// Logo via máscara CSS: a cor vem de `text-*` (currentColor)

type Props = { className?: string };

export function Emblem({ className = "" }: Props) {
  return <span aria-hidden className={`mask-emblem inline-block aspect-[1732/2024] ${className}`} />;
}

export function Wordmark({ className = "" }: Props) {
  return <span aria-hidden className={`mask-wordmark inline-block aspect-[2576/1824] ${className}`} />;
}
