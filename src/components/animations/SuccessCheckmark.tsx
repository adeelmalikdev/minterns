import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface SuccessCheckmarkProps {
  size?: number;
  className?: string;
}

export function SuccessCheckmark({ size = 24, className }: SuccessCheckmarkProps) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
      }}
      className={className}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="rounded-full bg-primary p-2 text-primary-foreground"
      >
        <Check size={size} />
      </motion.div>
    </motion.div>
  );
}
