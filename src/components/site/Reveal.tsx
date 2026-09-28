"use client";

import { motion, type Variants } from "framer-motion";

// Curvas do projeto (espelham --ease-out em globals.css)
const easeOut = [0.16, 1, 0.3, 1] as const;

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easeOut } },
};

type Props = { children: React.ReactNode; className?: string; delay?: number };

// Entrada ao rolar; o MotionConfig do layout reduz para só opacidade com prefers-reduced-motion
export function Reveal({ children, className, delay = 0 }: Props) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: easeOut, delay }}
    >
      {children}
    </motion.div>
  );
}

type StaggerProps = { children: React.ReactNode; className?: string; as?: "div" | "ul" | "ol" | "dl" };

// Grupo com filhos entrando em cascata (90ms entre cada)
export function Stagger({ children, className, as = "div" }: StaggerProps) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}
    >
      {children}
    </Tag>
  );
}

type ItemProps = { children: React.ReactNode; className?: string; as?: "div" | "li" };

export function StaggerItem({ children, className, as = "div" }: ItemProps) {
  const Tag = motion[as];
  return (
    <Tag className={className} variants={item}>
      {children}
    </Tag>
  );
}

// Entrada do hero: sobe e desfoca de leve, uma vez, ao carregar (CSS puro, ver .hero-in)
export function HeroIn({ children, className = "", delay = 0 }: Props) {
  return (
    <div className={`hero-in ${className}`} style={delay ? { animationDelay: `${delay}s` } : undefined}>
      {children}
    </div>
  );
}
