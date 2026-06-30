import React, { useState, useEffect } from "react";
import { Student, VerificationResult, DashboardStats } from "../types";
import {
  Search,
  SlidersHorizontal,
  FileCheck2,
  FileX2,
  AlertTriangle,
  Eye,
  RefreshCw,
  Check,
  Calendar,
  Building2,
  TrendingUp,
  X,
  FileText,
  BookmarkCheck,
  MessageSquare
} from "lucide-react";

interface AdminDashboardProps {
  students: Student[];
  verificationHistory: VerificationResult[];
  onManualOverride: (studentId: string, status: "PASS" | "FAIL", note: string) => Promise<void>;
}

export default function AdminDashboard({
  students,
  verificationHistory,
  onManualOverride,
}: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    uploadedStudents: 0,
    passCount: 0,
    failCount: 0,
    reviewCount: 0,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PASS" | "FAIL" | "MANUAL_REVIEW" | "PENDING">("ALL");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Manual Override Form State
  const [overrideStatus, setOverrideStatus] = useState<"PASS" | "FAIL">("PASS");
  const [overrideNote, setOverrideNote] = useState("");
  const [isSavingOverride, setIsSavingOverride] = useState(false);

  // Recalculate stats whenever students or history changes
  useEffect(() => {
    const total = students.length;
    const uploaded = students.filter((s) => s.hasUploaded).length;
    const pass = students.filter((s) => s.lastVerifiedStatus === "PASS").length;
    const fail = students.filter((s) => s.lastVerifiedStatus === "FAIL").length;
    const review = students.filter((s) => s.lastVerifiedStatus === "MANUAL_REVIEW").length;

    setStats({
      totalStudents: total,
      uploadedStudents: uploaded,
      passCount: pass,
      failCount: fail,
      reviewCount: review,
    });
  }, [students, verificationHistory]);

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setIsSavingOverride(true);
    try {
      await onManualOverride(selectedStudent.id, overrideStatus, overrideNote);
      setOverrideNote("");
      // Refresh current selected student details from updated parent state
      const updatedStu = students.find(s => s.id === selectedStudent.id);
      if (updatedStu) setSelectedStudent(updatedStu);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingOverride(false);
    }
  };

  const getStatusStyle = (status?: string) => {
    switch (status) {
      case "PASS":
        return "bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold";
      case "FAIL":
        return "bg-rose-50 text-rose-700 border border-rose-100 font-bold";
      case "MANUAL_REVIEW":
        return "bg-amber-50 text-amber-700 border border-amber-100 font-bold";
      default:
        return "bg-gray-50 text-gray-400 border border-gray-100 font-medium";
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "PASS":
        return "적합 (PASS)";
      case "FAIL":
        return "부적합 (FAIL)";
      case "MANUAL_REVIEW":
        return "수동 검토";
      default:
        return "서류 미제출";
    }
  };

  // Filter students based on search and status
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.department.toLowerCase().includes(searchQuery.toLowerCase());

    const studentStatus = student.hasUploaded ? student.lastVerifiedStatus || "PENDING" : "PENDING";
    const matchesStatus = statusFilter === "ALL" || studentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const selectedStudentResult = verificationHistory.find(
    (v) => v.studentId === selectedStudent?.id
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Bento Grid Analytics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {/* Total Enrollments */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-sans font-bold text-gray-400 uppercase tracking-wider block">
            총 학생 정원
          </span>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-display font-extrabold text-2xl text-gray-900">
              {stats.totalStudents}
            </span>
            <span className="text-[10px] text-gray-400 font-semibold font-mono">명</span>
          </div>
          <div className="text-[10px] text-gray-400 font-medium mt-1">계약학과 총 정원</div>
        </div>

        {/* Upload Rate */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-sans font-bold text-gray-400 uppercase tracking-wider block">
            서류 제출 완료
          </span>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-display font-extrabold text-2xl text-gray-900">
              {stats.uploadedStudents}
            </span>
            <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              {Math.round((stats.uploadedStudents / (stats.totalStudents || 1)) * 100)}%
            </span>
          </div>
          <div className="text-[10px] text-gray-400 font-medium mt-1">
            제출 {stats.uploadedStudents} / 미제출 {stats.totalStudents - stats.uploadedStudents}
          </div>
        </div>

        {/* Pass Count */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-sans font-bold text-gray-400 uppercase tracking-wider block">
            자격 요건 적합 (PASS)
          </span>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-display font-extrabold text-2xl text-emerald-600">
              {stats.passCount}
            </span>
            <span className="text-[10px] text-gray-400 font-semibold">건</span>
          </div>
          <div className="text-[10px] text-gray-400 font-medium mt-1">심사 최종 승인 인원</div>
        </div>

        {/* Review Required Count */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-sans font-bold text-gray-400 uppercase tracking-wider block">
            수동 검토 대상 (REVIEW)
          </span>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-display font-extrabold text-2xl text-amber-500">
              {stats.reviewCount}
            </span>
            <span className="text-[10px] text-gray-400 font-semibold">건</span>
          </div>
          <div className="text-[10px] text-gray-400 font-medium mt-1">보완 서류 제출 요망</div>
        </div>

        {/* Fail Count */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1 md:col-span-1">
          <span className="text-[11px] font-sans font-bold text-gray-400 uppercase tracking-wider block">
            자격 미달 (FAIL)
          </span>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-display font-extrabold text-2xl text-rose-600">
              {stats.failCount}
            </span>
            <span className="text-[10px] text-gray-400 font-semibold">건</span>
          </div>
          <div className="text-[10px] text-gray-400 font-medium mt-1">재직 및 근무시간 부적합</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Ledger Table */}
        <div className="md:col-span-8 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header & Controls inside card */}
          <div className="p-5 border-b border-gray-50 space-y-4">
            <div>
              <h3 className="font-display font-bold text-base text-gray-900 leading-tight">
                자격 검증 신청 장부 (Applicant Ledger)
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                신청자들의 제출 상태와 정밀 Gemini OCR 검사 내역을 모니터링합니다.
              </p>
            </div>

            {/* Controls panel */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search bar */}
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="신청 학생명, 계약 기업명, 또는 학과명 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 bg-white"
                />
              </div>

              {/* Status Filter segmented tab */}
              <div className="flex gap-1 bg-gray-100/75 p-1 rounded-xl shrink-0 overflow-x-auto">
                {(["ALL", "PASS", "FAIL", "MANUAL_REVIEW", "PENDING"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap ${
                      statusFilter === filter
                        ? "bg-white text-gray-950 shadow-sm"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    {filter === "ALL"
                      ? "전체"
                      : filter === "PASS"
                      ? "적합"
                      : filter === "FAIL"
                      ? "부적합"
                      : filter === "MANUAL_REVIEW"
                      ? "검토"
                      : "미제출"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table list */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <th className="py-3 px-5">학생 신원</th>
                  <th className="py-3 px-5">소속 산학협력기업</th>
                  <th className="py-3 px-5">제출 문서 현황</th>
                  <th className="py-3 px-5">자격 판정</th>
                  <th className="py-3 px-5 text-right">상세 정보</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => {
                    const studentStatus = student.hasUploaded
                      ? student.lastVerifiedStatus || "PENDING"
                      : "PENDING";
                    return (
                      <tr
                        key={student.id}
                        className={`hover:bg-gray-50/50 transition-colors ${
                          selectedStudent?.id === student.id ? "bg-gray-50/60" : ""
                        }`}
                      >
                        {/* Student Ident */}
                        <td className="py-4 px-5">
                          <div className="font-bold text-gray-900">{student.name}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5">{student.department}</div>
                        </td>

                        {/* Corporate entity */}
                        <td className="py-4 px-5">
                          <div className="font-semibold text-gray-700">{student.company}</div>
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">{student.email}</div>
                        </td>

                        {/* Submission list */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-4 h-4 rounded text-[9px] font-extrabold flex items-center justify-center ${
                                student.documents.employment_contract
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : "bg-gray-50 text-gray-300 border border-gray-100"
                              }`}
                              title="근로계약서"
                            >
                              계
                            </span>
                            <span
                              className={`w-4 h-4 rounded text-[9px] font-extrabold flex items-center justify-center ${
                                student.documents.health_insurance_cert
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : "bg-gray-50 text-gray-300 border border-gray-100"
                              }`}
                              title="건강보험"
                            >
                              보
                            </span>
                            <span
                              className={`w-4 h-4 rounded text-[9px] font-extrabold flex items-center justify-center ${
                                student.documents.sme_cert
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : "bg-gray-50 text-gray-300 border border-gray-100"
                              }`}
                              title="중소기업"
                            >
                              중
                            </span>
                            <span
                              className={`w-4 h-4 rounded text-[9px] font-extrabold flex items-center justify-center ${
                                student.documents.tuition_receipt
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : "bg-gray-50 text-gray-300 border border-gray-100"
                              }`}
                              title="등록금"
                            >
                              금
                            </span>
                          </div>
                        </td>

                        {/* Rating status */}
                        <td className="py-4 px-5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] inline-block ${getStatusStyle(studentStatus)}`}>
                            {getStatusLabel(studentStatus)}
                          </span>
                        </td>

                        {/* View action */}
                        <td className="py-4 px-5 text-right">
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className="p-1.5 rounded-lg border border-gray-200 hover:border-gray-900 hover:bg-gray-900 hover:text-white text-gray-500 transition-all inline-flex items-center justify-center cursor-pointer"
                            title="자료 심사 및 상세 기록 열기"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400">
                      해당 조건에 만족하는 신청자가 부재합니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Dynamic Deep Dive Inspector & Manual Override Form */}
        <div className="md:col-span-4 space-y-6">
          {selectedStudent ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6 animate-fade-in relative">
              {/* Close Button */}
              <button
                onClick={() => setSelectedStudent(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Profile Header */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-gray-400 tracking-wider block">
                  Auditor deep-dive
                </span>
                <h4 className="font-display font-extrabold text-base text-gray-900 leading-tight">
                  {selectedStudent.name} 학생 심사기록
                </h4>
                <p className="text-xs text-gray-500 font-medium">
                  {selectedStudent.department} | {selectedStudent.company}
                </p>
              </div>

              {/* Document Checkmarks Checklist */}
              <div className="space-y-2 border-t border-b border-gray-50 py-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  제출 필수 서류 판정
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                    <Check className={`w-3.5 h-3.5 ${selectedStudent.documents.employment_contract ? "text-emerald-500" : "text-gray-300"}`} />
                    <span className="font-semibold text-gray-700">근로계약서</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                    <Check className={`w-3.5 h-3.5 ${selectedStudent.documents.health_insurance_cert ? "text-emerald-500" : "text-gray-300"}`} />
                    <span className="font-semibold text-gray-700">건강보험</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                    <Check className={`w-3.5 h-3.5 ${selectedStudent.documents.sme_cert ? "text-emerald-500" : "text-gray-300"}`} />
                    <span className="font-semibold text-gray-700">중소기업확인</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                    <Check className={`w-3.5 h-3.5 ${selectedStudent.documents.tuition_receipt ? "text-emerald-500" : "text-gray-300"}`} />
                    <span className="font-semibold text-gray-700">등록금이체증</span>
                  </div>
                </div>
              </div>

              {/* Detailed verification history results */}
              {selectedStudentResult ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Gemini 판독 보고서 전문
                    </span>
                    <p className="text-[11px] text-gray-600 leading-relaxed font-sans font-medium bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                      {selectedStudentResult.extractedSummary}
                    </p>
                  </div>

                  {/* Criteria rule highlights */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      요건 대조 일치표
                    </span>
                    <div className="space-y-1.5">
                      {selectedStudentResult.checks.map((check, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg border border-gray-50 text-[11px] font-sans">
                          <span className="font-semibold text-gray-700 truncate max-w-[180px]">
                            {check.ruleName}
                          </span>
                          <span className={`px-2 py-0.5 rounded font-extrabold ${
                            check.status === "PASS"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}>
                            {check.status === "PASS" ? "적합" : "부적합"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400 text-xs">
                  아직 자동 AI 심사 기록이 존재하지 않는 신청자입니다.
                </div>
              )}

              {/* Administrative Manual Override Action Form (Full-Stack Power) */}
              <form onSubmit={handleOverrideSubmit} className="pt-4 border-t border-gray-100 space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    행정처 수동 대조 승인 (Manual Override)
                  </span>
                  <p className="text-[10px] text-gray-400 leading-normal">
                    오프라인 서류 확인서 원본 또는 기타 특수 예외 협약 내용을 대조하여 판독 결과를 강제 수정 및 정식 등록할 수 있습니다.
                  </p>
                </div>

                {/* Overriding selection switch */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOverrideStatus("PASS")}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                      overrideStatus === "PASS"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-500"
                        : "bg-white border-gray-200 text-gray-500"
                    }`}
                  >
                    수동 적합 처리 (PASS)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverrideStatus("FAIL")}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                      overrideStatus === "FAIL"
                        ? "bg-rose-50 text-rose-800 border-rose-500"
                        : "bg-white border-gray-200 text-gray-500"
                    }`}
                  >
                    수동 부적합 처리 (FAIL)
                  </button>
                </div>

                {/* Overriding Note */}
                <div className="space-y-1">
                  <textarea
                    placeholder="수동 승인 사유를 상세 기재해 주세요. (예: 삼성전자 인재개발원 오프라인 전액 부담 공문 확인 완료)"
                    value={overrideNote}
                    onChange={(e) => setOverrideNote(e.target.value)}
                    className="w-full h-18 px-3 py-2 text-xs rounded-lg border border-gray-200 focus:border-gray-900 bg-white"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingOverride}
                  className="w-full py-2.5 bg-gray-950 hover:bg-gray-800 disabled:bg-gray-300 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  {isSavingOverride ? "저장 중..." : "행정 대조 수동 심사서 저장"}
                </button>
              </form>
            </div>
          ) : (
            // Idle Detail state
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm flex flex-col items-center justify-center gap-3 min-h-[380px]">
              <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h5 className="font-display font-bold text-sm text-gray-900">
                  신청자 정밀 정보 대기
                </h5>
                <p className="text-[11px] text-gray-400 leading-normal max-w-xs mx-auto">
                  장부 테이블에서 특정 학생의 상세 돋보기 또는 눈 아이콘을 클릭하여 AI 판독 결과, 대조 근거문 구절 및 관리자 강제 수동 예외 결재를 진행할 수 있습니다.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
