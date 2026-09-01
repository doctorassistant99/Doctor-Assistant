import React from "react";
import { cn } from "../../lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
  className?: string;
}

const variants = {
  default: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  success: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  danger: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  info: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

export function Badge({ children, variant = "default", size = "sm", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// Status-specific badge helpers
export function StatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
    scheduled: "info",
    confirmed: "success",
    checked_in: "warning",
    completed: "success",
    cancelled: "danger",
    no_show: "danger",
    active: "success",
    inactive: "danger",
    cash: "success",
    card: "info",
    transfer: "default",
    consultation: "info",
    payment: "success",
    refund: "danger",
    other: "default",
  };

  return (
    <Badge variant={variantMap[status] || "default"}>
      {status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
    </Badge>
  );
}
