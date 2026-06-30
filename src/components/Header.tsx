import { ShieldCheck, User, Database, Cpu, LogOut, Lock } from "lucide-react";

interface HeaderProps {
  currentView: "student" | "admin";
  onViewChange: (view: "student" | "admin") => void;
  geminiActive: boolean;
  isAdminLoggedIn: boolean;
  onLogout: () => void;
}

export default function Header({ currentView, onViewChange, geminiActive, isAdminLoggedIn, onLogout }: HeaderProps) {
  return (
    <header className="border-b border-sky-100/80 bg-white/60 backdrop-blur-md sticky top-0 z-50 transition-all duration-200 shadow-[0_8px_30px_rgba(148,163,184,0.06)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[4rem] py-3 sm:py-0 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
        {/* Brand Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-200 via-pink-100 to-emerald-100 flex items-center justify-center text-slate-700 shadow-[0_12px_30px_rgba(186,230,253,0.28)] transition-transform hover:scale-105 duration-200 shrink-0">
            <ShieldCheck className="w-5.5 h-5.5" />
          </div>
          <div className="flex flex-col items-start min-w-0">
            <span className="font-display font-bold text-xs sm:text-base md:text-lg tracking-tight text-slate-900 block leading-tight whitespace-nowrap">
              계약학과 자격요건 검증 시스템
            </span>
            <span className="text-[8px] sm:text-[11px] font-sans text-sky-700/60 font-medium block uppercase tracking-wider whitespace-nowrap">
              Contract Department Eligibility Verifier
            </span>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          {/* Segmented Controller */}
          <div className="bg-sky-50/80 p-1 rounded-xl flex items-center gap-1 w-full sm:w-auto justify-between sm:justify-start border border-sky-100/70">
            <button
              onClick={() => onViewChange("student")}
              className={`flex-1 sm:flex-initial px-2.5 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold tracking-tight transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                currentView === "student"
                  ? "bg-white text-sky-700 shadow-sm font-bold"
                  : "text-slate-500 hover:text-sky-700 hover:bg-white/70"
              }`}
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              학생 서류 제출
            </button>
            <button
              onClick={() => onViewChange("admin")}
              className={`flex-1 sm:flex-initial px-2.5 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold tracking-tight transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                currentView === "admin"
                  ? "bg-white text-emerald-700 shadow-sm font-bold"
                  : "text-slate-500 hover:text-emerald-700 hover:bg-white/70"
              }`}
            >
              {currentView === "admin" && !isAdminLoggedIn ? (
                <Lock className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <Database className="w-3.5 h-3.5 shrink-0" />
              )}
              {currentView === "admin" && !isAdminLoggedIn ? "관리자 로그인" : "관리자 대시보드"}
            </button>
          </div>

          {/* Right side indicators */}
          <div className="flex items-center gap-2">
            {isAdminLoggedIn && (
              <button
                onClick={onLogout}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                title="관리자 로그아웃"
              >
                <LogOut className="w-3 h-3" />
                로그아웃
              </button>
            )}
            <div className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-50 border border-pink-100 text-[10px] font-mono font-semibold text-rose-700">
              <Cpu className={`w-3 h-3 ${geminiActive ? "text-emerald-400" : "text-amber-300"}`} />
              {geminiActive ? "Gemini Pro 3.5 Active" : "Local AI Simulated"}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
