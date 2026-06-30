import { useState, type FormEvent } from "react";
import { ShieldCheck, Lock, Eye, EyeOff, LogIn } from "lucide-react";

interface AdminLoginProps {
  onLogin: () => void;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password === "admin123") {
      onLogin();
    } else {
      setError("관리자 비밀번호가 일치하지 않습니다.");
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center mx-auto shadow-sm border border-emerald-100">
            <ShieldCheck className="w-7 h-7 text-emerald-700" />
          </div>
          <h2 className="font-display font-bold text-lg text-gray-900">관리자 로그인</h2>
          <p className="text-xs text-gray-400 font-medium">
            계약학과 자격검증 시스템 관리자 전용
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              관리자 비밀번호
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                placeholder="비밀번호 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-[11px] font-semibold text-rose-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <LogIn className="w-4 h-4" />
            관리자 대시보드 접속
          </button>
        </form>

        <p className="text-[10px] text-gray-400 text-center leading-relaxed">
          기본 비밀번호: <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono font-bold text-gray-600">admin123</code>
        </p>
      </div>
    </div>
  );
}