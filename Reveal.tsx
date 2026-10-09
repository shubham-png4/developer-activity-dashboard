import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/utils/cn";

export function Reveal({
  children,
  delay = 0,
  className,
  id,
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  id?: string;
  as?: "div" | "li" | "section" | "article";
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.transitionDelay = `${delay}ms`;
          el.classList.add("is-in");
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -70px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return (
    // @ts-expect-error – polymorphic ref
    <Tag ref={ref} id={id} className={cn("reveal", className)}>
      {children}
    </Tag>
  );
}
