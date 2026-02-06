"use client";

import { motion } from "framer-motion";

interface AntigravityProps {
    children: React.ReactNode;
    className?: string;
    range?: number; // How far it floats (pixels)
    duration?: number; // Time for one full cycle (seconds)
}

export default function Antigravity({
    children,
    className = "",
    range = 10,
    duration = 3,
}: AntigravityProps) {
    return (
        <motion.div
            className={className}
            animate={{
                y: [-range, range, -range],
            }}
            transition={{
                duration: duration,
                repeat: Infinity,
                ease: "easeInOut",
            }}
        >
            {children}
        </motion.div>
    );
}
