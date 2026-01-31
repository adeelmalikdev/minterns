import { Link } from "react-router-dom";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <span className="text-2xl font-bold text-primary">μ-intern</span>
    </Link>
  );
}
