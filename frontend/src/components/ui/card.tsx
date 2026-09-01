import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
}

export function Card({ children, className, padding = "md", hover = false }: CardProps) {
  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={hover ? { y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" } : {}}
      className={cn(
        "rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900",
        paddings[padding],
        className
      )}
    >
      {children}
    </motion.div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: { value: number; type: "increase" | "decrease" };
  className?: string;
}

export function StatCard({ title, value, icon, change, className }: StatCardProps) {
  return (
    <Card hover className={cn("flex items-start justify-between", className)}>
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        {change && (
          <p className={cn(
            "text-xs font-medium",
            change.type === "increase" ? "text-green-600" : "text-red-600"
          )}>
            {change.type === "increase" ? "+" : "-"}{change.value}%
          </p>
        )}
      </div>
      {icon && (
        <div className="rounded-lg bg-blue-50 p-2.5 dark:bg-blue-900/30">
          {icon}
        </div>
      )}
    </Card>
  );
}
