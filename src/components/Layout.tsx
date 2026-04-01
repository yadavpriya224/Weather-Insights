import { Link, Outlet, useLocation as useRouterLocation } from "react-router-dom";
import { Cloud, CalendarRange, LayoutDashboard, Moon, Sun } from "lucide-react";
import { cn } from "../lib/utils";
import { useTheme } from "./ThemeProvider";

export default function Layout() {
  const routerLocation = useRouterLocation();
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-100 via-rose-50 to-sky-50 dark:from-slate-900 dark:via-slate-950 dark:to-black text-slate-900 dark:text-slate-100 font-sans selection:bg-orange-200 dark:selection:bg-blue-900 transition-colors duration-300">
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 dark:border-slate-800/50 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl supports-[backdrop-filter]:bg-white/40 shadow-sm transition-colors duration-300">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-slate-800 dark:text-slate-100">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
              <Cloud className="h-5 w-5 text-white" />
            </div>
            <span>Weather<span className="text-blue-600 dark:text-blue-400">Insights</span></span>
          </div>
          <div className="flex items-center gap-3">
            <nav className="flex items-center gap-1 sm:gap-2 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
              <Link
                to="/"
                className={cn(
                  "transition-all px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2",
                  routerLocation.pathname === "/" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                )}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Today</span>
              </Link>
              <Link
                to="/historical"
                className={cn(
                  "transition-all px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2",
                  routerLocation.pathname === "/historical" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                )}
              >
                <CalendarRange className="h-4 w-4" />
                <span className="hidden sm:inline">Historical</span>
              </Link>
            </nav>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
