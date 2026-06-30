import React, { useState } from "react";
import { Student, DocumentType, VerificationResult, VerificationRule } from "../types";
import {
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  UploadCloud,
  Sparkles,
  Loader2,
  Building2,
  UserPlus,
  Mail,
  GraduationCap,
  ArrowRight,
  ShieldAlert
} from "lucide-react";

interface StudentViewProps {
  students: Student[];
  onAddStudent: (name: string, company: string, department: string, email: string) => Promise<void>;
  onVerify: (
    studentId: string,
    docType: DocumentType,
    fileName: string,
    fileBase64?: string,
    mockKey?: string
  ) => Promise<VerificationResult | null>;
  activeRules: VerificationRule[];
  verificationHistory: VerificationResult[];
}

export default function StudentView({
  students,
  onAddStudent,
  onVerify,
  activeRules,
  verificationHistory,
}: StudentViewProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || "");
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>("employment_contract");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [activeResult, setActiveResult] = useState<VerificationResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Student registration form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentCompany, setNewStudentCompany] = useState("");
  const [newStudentDept, setNewStudentDept] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [addError, setAddError] = useState("");

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Find latest verification result for the active student & document type (or general)
  const latestStudentResult = verificationHistory.find((v) => v.studentId === selectedStudentId);

  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    if (!newStudentName || !newStudentCompany || !newStudentDept || !newStudentEmail) {
      setAddError("모든 필드를 입력해 주세요.");
      return;
    }
    try {
      await onAddStudent(newStudentName, newStudentCompany, newStudentDept, newStudentEmail);
      // Reset form
      setNewStudentName("");
      setNewStudentCompany("");
      setNewStudentDept("");
      setNewStudentEmail("");
      setShowAddForm(false);
    } catch (err: any) {
      setAddError(err.message || "학생 추가 도중 에러가 발생했습니다.");
    }
  };

  const triggerVerification = async (fileName: string, fileBase64?: string, mockKey?: string) => {
    if (!selectedStudentId) return;
    setIsUploading(true);
    setUploadProgress("서류 전송 및 OCR 구문 분석 준비 중...");
    
    setTimeout(() => setUploadProgress("Gemini 3.5 LLM 컨텍스트 로드 완료..."), 800);
    setTimeout(() => setUploadProgress("지원 자격조건 검증 규칙 대조 분석 중..."), 1500);

    try {
      const res = await onVerify(selectedStudentId, selectedDocType, fileName, fileBase64, mockKey);
      if (res) {
        setActiveResult(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
  };

  // Fix: use explicit docType to avoid React state closure issue
  const triggerVerificationWithDocType = async (fileName: string, docType: DocumentType, mockKey: string) => {
    if (!selectedStudentId) return;
    setIsUploading(true);
    setUploadProgress("서류 전송 및 OCR 구문 분석 준비 중...");
    setTimeout(() => setUploadProgress("Gemini 3.5 LLM 컨텍스트 로드 완료..."), 800);
    setTimeout(() => setUploadProgress("지원 자격조건 검증 규칙 대조 분석 중..."), 1500);
    try {
      const res = await onVerify(selectedStudentId, docType, fileName, undefined, mockKey);
      if (res) {
        setActiveResult(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
  };

  // Handle real files selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      triggerVerification(file.name, base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        triggerVerification(file.name, base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Preset Mock Scenarios Picker triggers real backend OCR + verification
  const mockScenarios = [
    {
      name: "정식 근로계약서 (PASS 요건)",
      docType: "employment_contract" as DocumentType,
      fileName: "근로계약서_홍길동_PASS.pdf",
      key: "employment_contract_pass",
      desc: "주 40시간 근무, 정규직 형태의 서류",
    },
    {
      name: "단시간 근로계약서 (FAIL 요건)",
      docType: "employment_contract" as DocumentType,
      fileName: "시간제_근로계약서_박민수_FAIL.pdf",
      key: "employment_contract_fail",
      desc: "주당 18시간 단기근무 조건 미달 서류",
    },
    {
      name: "건강보험 자격득실확인서 (PASS)",
      docType: "health_insurance_cert" as DocumentType,
      fileName: "건강보험득실_홍길동_PASS.pdf",
      key: "health_insurance_pass",
      desc: "참여기업 직장인 4대보험 가입서",
    },
    {
      name: "유효한 중소기업확인서 (PASS)",
      docType: "sme_cert" as DocumentType,
      fileName: "중소기업확인서_네오테크_PASS.pdf",
      key: "sme_cert_pass",
      desc: "스타트업의 법정 유효 중소기업 입증 서류",
    },
    {
      name: "등록금 전액 지원약정서 (PASS)",
      docType: "tuition_receipt" as DocumentType,
      fileName: "등록금지원합의서_삼성전자_PASS.pdf",
      key: "tuition_receipt_pass",
      desc: "대기업 등록금 100% 회사부담 확약서",
    },
    {
      name: "등록금 45% 지원 송금증 (FAIL)",
      docType: "tuition_receipt" as DocumentType,
      fileName: "신한은행_송금결과_김철수_FAIL.pdf",
      key: "tuition_receipt_fail",
      desc: "기업 분담 비율 50% 기준치 미달 서류",
    },
  ];

  const getStatusBadge = (status: "PASS" | "FAIL" | "MANUAL_REVIEW") => {
    if (status === "PASS") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] sm:text-xs font-bold text-emerald-700 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5" />
          요건 적합 (PASS)
        </span>
      );
    } else if (status === "FAIL") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-100 text-[10px] sm:text-xs font-bold text-rose-700 whitespace-nowrap">
          <XCircle className="w-3.5 h-3.5" />
          부적합 (FAIL)
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-100 text-[10px] sm:text-xs font-bold text-amber-700">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="line-clamp-1 sm:line-clamp-none">수동 검토 필요 (REVIEW)</span>
        </span>
      );
    }
  };

  const getDocumentLabel = (type: DocumentType) => {
    switch (type) {
      case "employment_contract":
        return "근로계약서 / 재직증명서";
      case "health_insurance_cert":
        return "건강보험 자격득실확인서";
      case "sme_cert":
        return "중소기업확인서 / 사업자등록증";
      case "tuition_receipt":
        return "등록금 이체 확인증 / 지원약정서";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start animate-fade-in">
      {/* Left Column: Input Panel */}
      <div className="md:col-span-5 space-y-6">
        {/* Step 1: Applicant Profile Selector */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-50">
            <h3 className="font-display font-bold text-sm text-gray-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-gray-900 text-white flex items-center justify-center text-[10px] font-bold">1</span>
              대상 신청자 선택
            </h3>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="text-xs font-semibold text-gray-500 hover:text-gray-950 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              신규 등록
            </button>
          </div>

          {/* New Student Inline Registration Form */}
          {showAddForm && (
            <form onSubmit={handleAddStudentSubmit} className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
              <span className="text-xs font-bold text-gray-700 block">신규 신청자 등록</span>
              {addError && <span className="text-[11px] text-rose-600 block">{addError}</span>}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="학생 이름 (예: 홍길동)"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white"
                  required
                />
                <input
                  type="text"
                  placeholder="기업명 (예: 삼성전자)"
                  value={newStudentCompany}
                  onChange={(e) => setNewStudentCompany(e.target.value)}
                  className="px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="학과명"
                  value={newStudentDept}
                  onChange={(e) => setNewStudentDept(e.target.value)}
                  className="px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white"
                  required
                />
                <input
                  type="email"
                  placeholder="이메일 주소"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  className="px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-bold transition-all"
              >
                신청 등록 완료
              </button>
            </form>
          )}

          {/* Student Profile Card Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto">
            {students.map((student) => (
              <button
                key={student.id}
                onClick={() => {
                  setSelectedStudentId(student.id);
                  setActiveResult(null);
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedStudentId === student.id
                    ? "border-gray-900 bg-gray-950 text-white shadow"
                    : "border-gray-100 bg-white text-gray-600 hover:border-gray-200 hover:bg-gray-50/50"
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>{student.name}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    selectedStudentId === student.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    {student.id}
                  </span>
                </div>
                <div className="text-[10px] opacity-75 mt-1 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {student.company}
                </div>
                <div className="text-[10px] opacity-75 mt-0.5 flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" />
                  {student.department}
                </div>

                {/* Checklist icons of already uploaded documents */}
                <div className="flex gap-1.5 mt-2 pt-2 border-t border-current/10">
                  <span className={`w-2 h-2 rounded-full ${student.documents.employment_contract ? "bg-emerald-400" : "bg-gray-300"}`} title="근로계약서" />
                  <span className={`w-2 h-2 rounded-full ${student.documents.health_insurance_cert ? "bg-emerald-400" : "bg-gray-300"}`} title="건강보험득실" />
                  <span className={`w-2 h-2 rounded-full ${student.documents.sme_cert ? "bg-emerald-400" : "bg-gray-300"}`} title="중소기업확인" />
                  <span className={`w-2 h-2 rounded-full ${student.documents.tuition_receipt ? "bg-emerald-400" : "bg-gray-300"}`} title="등록금매칭" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Document Upload Pane */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-display font-bold text-sm text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-50">
            <span className="w-5 h-5 rounded-md bg-gray-900 text-white flex items-center justify-center text-[10px] font-bold">2</span>
            서류 유형 및 업로드
          </h3>

          {/* Document Type select buttons */}
          <div className="grid grid-cols-2 gap-1.5">
            {(["employment_contract", "health_insurance_cert", "sme_cert", "tuition_receipt"] as DocumentType[]).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedDocType(type)}
                className={`py-2 px-3 rounded-lg border text-left text-xs font-semibold transition-all ${
                  selectedDocType === type
                    ? "bg-gray-50 border-gray-900 text-gray-900 font-bold"
                    : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {getDocumentLabel(type)}
              </button>
            ))}
          </div>

          {/* Interactive Drag and Drop Upload Card */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all relative flex flex-col items-center justify-center gap-2 ${
              dragActive ? "border-sky-500 bg-sky-50/20" : "border-gray-200 hover:border-gray-300 bg-gray-50/30"
            }`}
          >
            <UploadCloud className="w-10 h-10 text-sky-300" />
            <div>
              <span className="text-xs font-bold text-gray-700 block">파일을 올려서 바로 검증할 수 있어요</span>
              <span className="text-[10px] text-gray-400 block mt-0.5">드래그 앤 드롭 또는 파일 선택 가능 · PDF, PNG, JPG 형식 지원</span>
            </div>

            {selectedFileName ? (
              <div className="px-3 py-1.5 rounded-full bg-white border border-sky-100 text-[10px] font-semibold text-sky-700 shadow-sm">
                선택된 파일: {selectedFileName}
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-full bg-white border border-gray-100 text-[10px] font-semibold text-gray-400">
                아직 선택된 파일이 없습니다
              </div>
            )}

            <label className="mt-2 px-3.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-100 rounded-lg text-xs font-bold cursor-pointer transition-all shadow-sm">
              내 파일 업로드
              <input type="file" onChange={handleFileChange} className="hidden" accept=".pdf,.png,.jpg,.jpeg" />
            </label>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              업로드 후 바로 OCR 검증이 시작됩니다. 학생과 문서 유형을 먼저 확인해 주세요.
            </p>
          </div>
        </div>

        {/* Step 3: Fast-Load Mock Files (UX Mastery) */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center gap-1.5 text-gray-900">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h4 className="font-sans font-bold text-xs">💡 실감형 테스트용 가상 서류 로드</h4>
          </div>
          <p className="text-[11px] text-gray-400 leading-normal">
            실제 서류가 없는 경우, 아래의 미리 준비된 고성능 학제별 한글 서류 시나리오를 클릭하여 <b>진짜 Gemini OCR 분석 프로세스</b>를 즉시 테스트해 보세요.
          </p>

          <div className="space-y-1.5">
            {mockScenarios.map((scen, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedDocType(scen.docType);
                  // Use scen.docType directly instead of the stale selectedDocType state
                  triggerVerificationWithDocType(scen.fileName, scen.docType, scen.key);
                }}
                className="w-full p-2.5 rounded-xl border border-gray-50 bg-gray-50/50 hover:bg-gray-100 hover:border-gray-100 transition-all text-left flex items-start gap-2.5 group cursor-pointer"
              >
                <div className="p-1 rounded bg-white text-gray-600 mt-0.5 shadow-sm group-hover:text-gray-900 transition-colors">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-gray-800 flex items-center gap-1.5">
                    {scen.name}
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{scen.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Interactive Audit Report */}
      <div className="md:col-span-7 space-y-6">
        {/* Loading Overlay State */}
        {isUploading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm flex flex-col items-center justify-center gap-4 min-h-[480px]">
            <Loader2 className="w-12 h-12 text-gray-900 animate-spin" />
            <div className="space-y-1">
              <h4 className="font-display font-bold text-base text-gray-900">
                Gemini 3.5 AI 정밀 심사 중
              </h4>
              <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                {uploadProgress || "서류 구문 및 텍스트를 고속 분석하여 정밀 대조 검증하고 있습니다."}
              </p>
            </div>
            {/* Ambient loading bars */}
            <div className="w-56 h-1.5 bg-gray-100 rounded-full overflow-hidden relative mt-4">
              <div className="absolute top-0 bottom-0 left-0 bg-gray-900 animate-[loading_1.5s_infinite] w-1/2 rounded-full" />
            </div>
          </div>
        ) : activeResult || latestStudentResult ? (
          // Audit Result Content Card
          (() => {
            const report = activeResult || latestStudentResult!;
            return (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6 animate-fade-in">
                {/* Audit Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block">
                      Audit Verification Report
                    </span>
                    <h3 className="font-display font-bold text-lg text-gray-900 leading-tight">
                      {report.studentName} 학생 자격 심사 보고서
                    </h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <span>검증 완료 시간:</span>
                      <span className="font-mono">{new Date(report.checkedAt).toLocaleString()}</span>
                    </p>
                  </div>
                  <div className="w-full sm:w-auto flex justify-start sm:justify-end shrink-0">
                    {getStatusBadge(report.overallStatus)}
                  </div>
                </div>

                {/* Overall Summary block from Gemini */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                  <div className="flex items-center gap-2 text-gray-950 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-gray-900" />
                    Gemini AI 판독 소견
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed font-sans font-medium">
                    {report.extractedSummary}
                  </p>
                </div>

                {/* Requirements Checklist Breakdown */}
                <div className="space-y-4">
                  <h4 className="font-sans font-bold text-xs text-gray-400 uppercase tracking-wider">
                    체크리스트 상세 분석 내역
                  </h4>

                  <div className="space-y-3">
                    {report.checks.map((check, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-xl border transition-all ${
                          check.status === "PASS"
                            ? "bg-emerald-50/20 border-emerald-100"
                            : check.status === "FAIL"
                            ? "bg-rose-50/20 border-rose-100"
                            : "bg-amber-50/20 border-amber-100"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <span className="text-[10px] font-mono text-gray-400 font-bold uppercase block tracking-wider">
                              Rule {index + 1} • {check.category}
                            </span>
                            <h5 className="font-sans font-bold text-xs text-gray-900">
                              {check.ruleName}
                            </h5>
                          </div>
                          <div>
                            {check.status === "PASS" ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                                적합
                              </span>
                            ) : check.status === "FAIL" ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 uppercase">
                                부적합
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                                보완
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Extracted value and quoted text evidence */}
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-2 text-[11px] pt-3 border-t border-dashed border-gray-200/50">
                          <div className="md:col-span-4">
                            <span className="text-gray-400 block font-semibold">서류 추출 데이터</span>
                            <span className="text-gray-950 font-bold font-mono">{check.valueExtracted}</span>
                          </div>
                          <div className="md:col-span-8 bg-white/65 p-2 rounded border border-gray-100/50">
                            <span className="text-gray-400 block font-semibold mb-0.5">정밀 매칭 근거 구절</span>
                            <span className="text-gray-500 font-medium leading-relaxed block italic break-all">
                              "{check.evidence}"
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions banner based on overall status */}
                {report.overallStatus !== "PASS" && (
                  <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-100/50 flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h5 className="font-sans font-bold text-xs text-amber-900">서류 보완 조치가 필요한 상태입니다</h5>
                      <p className="text-[11px] text-amber-700 leading-normal font-medium">
                        대응 규칙 요건 중 미달 사항이 발견되었습니다. 정식 계약 내용 수정 후 서류를 재제출하시거나, 혹은 담당 교수/행정처 관리자 대시보드에서 수동 오프라인 예외 처리를 요청하시기 바랍니다.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })()
        ) : (
          // Default Idle State
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm flex flex-col items-center justify-center gap-4 min-h-[480px]">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
              <FileText className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h4 className="font-display font-bold text-base text-gray-900">
                심사 보고서 대기 중
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed font-sans font-medium">
                왼쪽 패널에서 신청 학생을 선택하고 대조하고 싶은 서류(근로계약서, 건강보험자격증, 중소기업확인서 등)를 드래그 앤 드롭 업로드해 주세요.
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-[11px] text-gray-500 max-w-md leading-relaxed mt-2 font-medium">
              💡 <b>빠른 체험 팁</b>: 하단의 <b>'테스트용 가상 서류 로드'</b> 시나리오 버튼을 클릭하시면 실제 서류가 없어도 즉석에서 정확한 PASS/FAIL 판단 및 상세 실적 보고서 출력을 보실 수 있습니다.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
