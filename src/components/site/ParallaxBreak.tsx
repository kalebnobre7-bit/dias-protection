"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Props = { image: string; children: React.ReactNode };

// Quebra visual em tela cheia; parallax só em desktop e sem reduced motion
export function ParallaxBreak({ image, children }: Props) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const [desktop, setDesktop] = useState(false);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <section ref={ref} className="relative isolate flex min-h-[80svh] items-center overflow-hidden">
      <motion.div
        aria-hidden
        className="absolute inset-x-0 -inset-y-[10%] -z-20"
        style={desktop && !reduced ? { y } : undefined}
      >
        <Image src={image} alt="" fill sizes="100vw" className="object-cover" />
      </motion.div>
      <div aria-hidden className="absolute inset-0 -z-10 bg-ink/65" />
      <div className="mx-auto w-full max-w-7xl px-4 py-28 md:px-8">{children}</div>
    </section>
  );
}
