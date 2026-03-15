import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedPageProps {
  children: ReactNode;
  className?: string;
}

const AnimatedPage = ({ children, className }: AnimatedPageProps) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 28,
        mass: 0.8,
      },
    }}
    exit={{
      opacity: 0,
      transition: {
        duration: 0.1,
      },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

export default AnimatedPage;
