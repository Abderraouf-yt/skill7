"use client";

import { motion } from "framer-motion";

interface GradientTextProps {
    children: React.ReactNode;
    className?: string;
    colors?: string[];
    animationSpeed?: number;
}

export default function GradientText({
    children,
    className = "",
    colors = ["#ec4899", "#8b5cf6", "#3b82f6", "#06b6d4", "#ec4899"], // Pink -> Violet -> Blue -> Cyan -> Pink
    animationSpeed = 8,
}: GradientTextProps) {
    const gradient = `linear-gradient(to right, ${colors.join(", ")})`;

    return (
        <motion.div
            className={`relative inline-block text-transparent bg-clip-text ${className}`}
            style={{
                backgroundImage: gradient,
                backgroundSize: "300% 100%",
            }}
            animate={{
                backgroundPosition: ["0% 50%", "100% 50%"],
            }}
            transition={{
                duration: animationSpeed,
                ease: "linear",
                repeat: Infinity,
            }}
        >
            {children}
        </motion.div>
    );
}
