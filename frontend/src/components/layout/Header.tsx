import { useTranslation } from "react-i18next";
import { Sun, Moon, Languages } from "lucide-react";
import { useTheme, useLanguage } from "../../stores/appStore";

export function Header() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { language, changeLanguage } = useLanguage();

  const titleMap: Record<string, string> = {
    "/": t("nav.dashboard"),
    "/patients": t("nav.patients"),
    "/appointments": t("nav.appointments"),
    "/cashier": t("nav.cashier"),
    "/transactions": t("nav.transactions"),
    "/settings": t("nav.settings"),
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="pl-12 lg:pl-0">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{titleMap[window.location.pathname] || t("appName")}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => changeLanguage(language === "en" ? "ar" : "en")}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 transition-colors"
          title="Switch language"
        >
          <Languages className="h-5 w-5" />
        </button>
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 transition-colors"
          title="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );
}
