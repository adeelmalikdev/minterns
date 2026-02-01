import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

interface Requirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: Requirement[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "One number", test: (p) => /\d/.test(p) },
  { label: "One special character (!@#$%^&*)", test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  const passedCount = requirements.filter((req) => req.test(password)).length;
  
  if (passedCount <= 1) return { score: passedCount, label: "Weak", color: "bg-destructive" };
  if (passedCount <= 2) return { score: passedCount, label: "Fair", color: "bg-warning" };
  if (passedCount <= 3) return { score: passedCount, label: "Good", color: "bg-info" };
  if (passedCount <= 4) return { score: passedCount, label: "Strong", color: "bg-success" };
  return { score: passedCount, label: "Very Strong", color: "bg-success" };
}

export function isPasswordValid(password: string): boolean {
  return requirements.every((req) => req.test(password));
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const strength = getPasswordStrength(password);
  
  if (!password) return null;

  return (
    <div className={cn("space-y-3", className)} role="status" aria-live="polite">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span className={cn(
            "font-medium",
            strength.score <= 1 && "text-destructive",
            strength.score === 2 && "text-warning",
            strength.score === 3 && "text-info",
            strength.score >= 4 && "text-success"
          )}>
            {strength.label}
          </span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= strength.score ? strength.color : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Requirements List */}
      <ul className="space-y-1" aria-label="Password requirements">
        {requirements.map((req, index) => {
          const passed = req.test(password);
          return (
            <li
              key={index}
              className={cn(
                "flex items-center gap-2 text-xs transition-colors",
                passed ? "text-success" : "text-muted-foreground"
              )}
            >
              {passed ? (
                <Check className="h-3 w-3" aria-hidden="true" />
              ) : (
                <X className="h-3 w-3" aria-hidden="true" />
              )}
              <span>{req.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
