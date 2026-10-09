// Logo via máscara CSS: a cor vem de `text-*` (currentColor) ou de um backgroundImage em `style`

type Props = { className?: string; style?: React.CSSProperties };

export function Emblem({ className = "", style }: Props) {
  return <span aria-hidden className={`mask-emblem inline-block aspect-[1732/2024] ${className}`} style={style} />;
}

export function Wordmark({ className = "", style }: Props) {
  return <span aria-hidden className={`mask-wordmark inline-block aspect-[2576/1824] ${className}`} style={style} />;
}
