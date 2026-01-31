import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: "sm" | "md" | "lg";
  readOnly?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function StarRating({
  value,
  onChange,
  max = 5,
  size = "md",
  readOnly = false,
  className,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);

  const displayValue = hoverValue !== null ? hoverValue : value;

  const handleClick = (rating: number) => {
    if (!readOnly && onChange) {
      onChange(rating);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, rating: number) => {
    if (readOnly) return;
    
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick(rating);
    } else if (e.key === "ArrowRight" && rating < max) {
      e.preventDefault();
      handleClick(rating + 1);
    } else if (e.key === "ArrowLeft" && rating > 1) {
      e.preventDefault();
      handleClick(rating - 1);
    }
  };

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      role="radiogroup"
      aria-label="Rating"
    >
      {Array.from({ length: max }, (_, i) => {
        const rating = i + 1;
        const isFilled = rating <= displayValue;

        return (
          <button
            key={rating}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={`${rating} star${rating !== 1 ? "s" : ""}`}
            tabIndex={readOnly ? -1 : rating === value ? 0 : -1}
            disabled={readOnly}
            onClick={() => handleClick(rating)}
            onMouseEnter={() => !readOnly && setHoverValue(rating)}
            onMouseLeave={() => !readOnly && setHoverValue(null)}
            onKeyDown={(e) => handleKeyDown(e, rating)}
            className={cn(
              "transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded",
              readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"
            )}
          >
            <Star
              className={cn(
                sizeConfig[size],
                "transition-colors",
                isFilled
                  ? "fill-warning text-warning"
                  : "fill-transparent text-muted-foreground/40"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
