import { Link } from "react-router-dom";

interface LogoProps {
  className?: string;
  showSubtitle?: boolean;
}

export function Logo({ className, showSubtitle = false }: LogoProps) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <span className="text-2xl font-bold text-primary">μ-intern</span>
      {showSubtitle && (
        <span className="text-sm text-muted-foreground">IIUI</span>
      )}
    </Link>
  );
}
