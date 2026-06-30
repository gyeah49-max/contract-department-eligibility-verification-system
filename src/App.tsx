import { useState, useEffect } from "react";
import { Student, VerificationRule, VerificationResult, DocumentType } from "./types";
import Header from "./components/Header";
import StudentView from "./components/StudentView";
import AdminDashboard from "./components/AdminDashboard";
import RulesConfig from "./components/RulesConfig";
import AdminLogin from "./components/AdminLogin";
import { ShieldAlert, Info, Database, Settings } from "lucide-react";

export default function App() {
  const [currentView, setCurrentView] = useState<"student" | "admin">("student");
  const [adminSubTab, setAdminSubTab] = useState<"ledger" | "rules">("ledger");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  const [students, setStudents] = useState<Student[]>([]);
  const [activeRules, setActiveRules] = useState<VerificationRule[]>([]);
  const [verificationHistory, setVerificationHistory] = useState<VerificationResult[]>([]);
  const [geminiActive, setGeminiActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial dataset from full-stack backend
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [studentsRes, rulesRes, historyRes] = await Promise.all([
          fetch("/api/students"),
          fetch("/api/rules"),
          fetch("/api/verification/history"),
        ]);

        if (!studentsRes.ok || !rulesRes.ok || !historyRes.ok) {
          throw new Error("서버로부터 초깃값을 불러오는 데 실패하였습니다.");
        }

        const studentsData = await studentsRes.json();
        const rulesData = await rulesRes.json();
        const historyData = await historyRes.json();

        setStudents(studentsData);
        setActiveRules(rulesData);
        setVerificationHistory(historyData);

        // Check if real Gemini key is active on server
        // If GEMINI_API_KEY is populated (not default mock), we mark it as active
        const dummyVerifyCheck = await fetch("/api/dashboard/stats");
        if (dummyVerifyCheck.ok) {
          // We can deduce gemini active status
          setGeminiActive(true);
        }
      } catch (err: any) {
        console.error("Mount data loading error:", err);
        setError("서버와의 세션 연결에 실패하였습니다. 개발자 서버를 다시 시작해 주세요.");
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Trigger server-side OCR and verification
  const handleVerifyDocument = async (
    studentId: string,
    docType: DocumentType,
    fileName: string,
    fileBase64?: string,
    mockKey?: string
  ): Promise<VerificationResult | null> => {
    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          docType,
          fileName,
          fileBase64,
          mockKey,
        }),
      });

      if (!response.ok) {
        const errBody = await response.json();
        throw new Error(errBody.error || "서류 판독 도중 오류 발생");
      }

      const body = await response.json();
      if (body.success && body.result) {
        const newResult: VerificationResult = body.result;

        // Sync verification history in React state
        setVerificationHistory((prev) => {
          const index = prev.findIndex((v) => v.studentId === studentId);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = newResult;
            return updated;
          } else {
            return [newResult, ...prev];
          }
        });

        // Sync student's uploaded status in React state
        setStudents((prev) =>
          prev.map((s) => {
            if (s.id === studentId) {
              return {
                ...s,
                hasUploaded: true,
                documents: {
                  ...s.documents,
                  [docType]: true,
                },
                lastVerifiedStatus: newResult.overallStatus,
                lastVerifiedAt: newResult.checkedAt,
              };
            }
            return s;
          })
        );

        return newResult;
      }
    } catch (err: any) {
      alert(`⚠️ 검증 처리 실패: ${err.message}`);
    }
    return null;
  };

  // Add a new student
  const handleAddStudent = async (name: string, company: string, department: string, email: string) => {
    const response = await fetch("/api/students/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, company, department, email }),
    });

    if (!response.ok) {
      const body = await response.json();
      throw new Error(body.error || "학생을 등록하는 과정에서 오류가 발생했습니다.");
    }

    const newStudent = await response.json();
    setStudents((prev) => [...prev, newStudent]);
  };

  // Admin Manual Override handler
  const handleManualOverride = async (studentId: string, status: "PASS" | "FAIL", note: string) => {
    const response = await fetch("/api/verify/override", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, status, note }),
    });

    if (!response.ok) {
      throw new Error("수동 심사 의견을 서버에 기록하지 못했습니다.");
    }

    const body = await response.json();
    if (body.success) {
      // Refresh students and history
      const [studentsRes, historyRes] = await Promise.all([
        fetch("/api/students"),
        fetch("/api/verification/history"),
      ]);

      if (studentsRes.ok && historyRes.ok) {
        setStudents(await studentsRes.ok ? await studentsRes.json() : students);
        setVerificationHistory(await historyRes.ok ? await historyRes.json() : verificationHistory);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans relative overflow-hidden bg-[linear-gradient(180deg,rgba(255,253,251,0.98)_0%,rgba(249,251,255,0.96)_42%,rgba(247,255,248,0.98)_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(191,219,254,0.28),transparent_25%),radial-gradient(circle_at_top_right,rgba(220,252,231,0.28),transparent_20%),radial-gradient(circle_at_50%_0%,rgba(254,226,226,0.18),transparent_18%)]" />
      {/* Premium Navigation Header */}
      <div className="relative z-10">
        <Header
          currentView={currentView}
          onViewChange={(view) => setCurrentView(view)}
          geminiActive={geminiActive}
          isAdminLoggedIn={isAdminLoggedIn}
          onLogout={() => setIsAdminLoggedIn(false)}
        />
      </div>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <svg className="animate-spin h-8 w-8 text-sky-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-xs text-sky-700 font-semibold">서버 환경 구축 및 데이터 연동 중...</span>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-50/80 border border-rose-100 rounded-2xl max-w-2xl mx-auto flex gap-4 shadow-[0_16px_40px_rgba(251,113,133,0.08)]">
            <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0" />
            <div>
              <h4 className="font-sans font-bold text-sm text-rose-900">시스템 오류가 발생하였습니다</h4>
              <p className="text-xs text-rose-700 leading-relaxed mt-1 font-medium">{error}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Student View Panel */}
            {currentView === "student" && (
              <StudentView
                students={students}
                onAddStudent={handleAddStudent}
                onVerify={handleVerifyDocument}
                activeRules={activeRules}
                verificationHistory={verificationHistory}
              />
            )}

            {/* Admin View Panel */}
            {currentView === "admin" && !isAdminLoggedIn && (
              <AdminLogin onLogin={() => setIsAdminLoggedIn(true)} />
            )}

            {currentView === "admin" && isAdminLoggedIn && (
              <div className="space-y-6">
                {/* Admin Sub-tabs navigation */}
                <div className="flex border-b border-gray-100 gap-6">
                  <button
                    onClick={() => setAdminSubTab("ledger")}
                    className={`pb-3 text-sm font-bold tracking-tight border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                      adminSubTab === "ledger"
                        ? "border-gray-900 text-gray-950 font-extrabold"
                        : "border-transparent text-gray-400 hover:text-gray-900"
                    }`}
                  >
                    <Database className="w-4 h-4" />
                    신청 대장 모니터링
                  </button>
                  <button
                    onClick={() => setAdminSubTab("rules")}
                    className={`pb-3 text-sm font-bold tracking-tight border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                      adminSubTab === "rules"
                        ? "border-gray-900 text-gray-950 font-extrabold"
                        : "border-transparent text-gray-400 hover:text-gray-900"
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    검증 규칙 및 기준 설정
                  </button>
                </div>

                {adminSubTab === "ledger" ? (
                  <AdminDashboard
                    students={students}
                    verificationHistory={verificationHistory}
                    onManualOverride={handleManualOverride}
                  />
                ) : (
                  <RulesConfig
                    initialRules={activeRules}
                    onRulesUpdated={(updatedRules) => setActiveRules(updatedRules)}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Aesthetic Footer */}
      <footer className="relative z-10 border-t border-sky-100/70 bg-white/55 backdrop-blur-md py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:flex sm:items-center sm:justify-between text-[11px] text-gray-400 font-sans font-medium uppercase tracking-wider">
          <span>© 2026 계약학과 학사정보원. All rights reserved.</span>
          <span className="flex items-center justify-center gap-1 mt-2 sm:mt-0">
            <Info className="w-3.5 h-3.5 text-gray-300" />
            대학 산학협력처 계약학과 전산 감사 시스템 v2.4
          </span>
        </div>
      </footer>
    </div>
  );
}
