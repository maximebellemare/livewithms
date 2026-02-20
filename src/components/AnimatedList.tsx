import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
}

const container = {
  animate: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

export const listItemVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 30 } },
};

const AnimatedList = ({ children, className }: AnimatedListProps) => (
  <motion.div
    variants={container}
    initial="initial"
    animate="animate"
    className={className}
  >
    {children}
  </motion.div>
);

export default AnimatedList;
