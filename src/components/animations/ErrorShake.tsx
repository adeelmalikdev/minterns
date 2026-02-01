import { motion } from "framer-motion";
import { ReactNode } from "react";

interface ErrorShakeProps {
  children: ReactNode;
  isError?: boolean;
  className?: string;
}

export function ErrorShake({ children, isError = true, className }: ErrorShakeProps) {
  return (
    <motion.div
      animate={isError ? { x: [0, -10, 10, -10, 10, 0] } : {}}
      transition={{ duration: 0.4 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
