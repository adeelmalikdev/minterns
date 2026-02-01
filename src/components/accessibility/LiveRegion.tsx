import { cn } from "@/lib/utils";

interface LiveRegionProps {
  children: React.ReactNode;
  politeness?: "polite" | "assertive" | "off";
  atomic?: boolean;
  relevant?: "additions" | "removals" | "text" | "all";
  className?: string;
}

/**
 * Wrapper for announcing dynamic content changes to screen readers
 */
export function LiveRegion({
  children,
  politeness = "polite",
  atomic = true,
  relevant = "all",
  className,
}: LiveRegionProps) {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={cn(className)}
    >
      {children}
    </div>
  );
}

/**
 * Visually hidden but announced to screen readers
 */
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only" role="status" aria-live="polite">
      {children}
    </span>
  );
}
