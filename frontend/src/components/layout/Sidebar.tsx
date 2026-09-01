import { useState } from "react";
import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Calendar, CreditCard, Receipt, Settings, LogOut, Menu, Stethoscope,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../hooks/useAuth";
import { Avatar, Badge } from "../ui";

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "Patients", path: "/patients", icon: <Users className="h-5 w-5" /> },
  { label: "Appointments", path: "/appointments", icon: <Calendar className="h-5 w-5" /> },
  { label: "Cashier", path: "/cashier", icon: <CreditCard className="h-5 w-5" /> },
  { label: "Transactions", path: "/transactions", icon: <Receipt className="h-5 w-5" /> },
  { label: "Settings", path: "/settings", icon: <Settings className="h-5 w-5" />, adminOnly: true },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const filteredItems = navItems.filter((item) => !item.adminOnly || user?.role === "admin");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-blue-600">
          <Stethoscope className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold text-gray-900 dark:text-white">Doctor Assistant</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
              )}
            >
              <span className={cn(isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500")}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center gap-3">
          <Avatar name={user?.full_name || "User"} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.full_name}</p>
            <Badge variant={user?.role === "admin" ? "info" : "default"} size="sm">{user?.role}</Badge>
          </div>
          <button onClick={handleLogout} className="rounded-lg p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button onClick={() => setIsMobileOpen(true)} className="lg:hidden fixed top-4 left-4 z-50 rounded-lg bg-white dark:bg-gray-900 p-2 shadow-md border border-gray-200 dark:border-gray-700">
        <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
      </button>
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setIsMobileOpen(false)} />
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="lg:hidden fixed inset-y-0 left-0 z-50 w-[280px]">
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <div className="hidden lg:flex lg:w-[260px] lg:flex-shrink-0">
        <SidebarContent />
      </div>
    </>
  );
}
