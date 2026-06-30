// @ts-nocheck
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { Student, VerificationRule, VerificationResult, DashboardStats } from "../src/types";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is not defined. Using simulated AI fallback.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const students: Student[] = [
  {
    id: "STU-001",
    name: "홍길동",
    company: "삼성전자",
    department: "차세대 반도체공학과",
    email: "gildong.hong@samsung.com",
    hasUploaded: true,
    documents: {
      employment_contract: true,
      health_insurance_cert: true,
      sme_cert: false,
      tuition_receipt: true,
    },
    lastVerifiedStatus: "PASS",
    lastVerifiedAt: "2026-06-28T14:30:00-07:00",
  },
  {
    id: "STU-002",
    name: "김철수",
    company: "네오테크 (스타트업)",
    department: "AI 응용소프트웨어학과",
    email: "chulsoo.kim@neotech.io",
    hasUploaded: true,
    documents: {
      employment_contract: true,
      health_insurance_cert: true,
      sme_cert: true,
      tuition_receipt: true,
    },
    lastVerifiedStatus: "MANUAL_REVIEW",
    lastVerifiedAt: "2026-06-28T16:45:00-07:00",
  },
  {
    id: "STU-003",
    name: "이영희",
    company: "에이치엔엘 주식회사",
    department: "첨단 신소재융합공학과",
    email: "younghee.lee@hnl.co.kr",
    hasUploaded: false,
    documents: {},
  },
  {
    id: "STU-004",
    name: "박민수",
    company: "현대자동차",
    department: "스마트 모빌리티공학과",
    email: "minsu.park@hyundai.com",
    hasUploaded: true,
    documents: {
      employment_contract: true,
      health_insurance_cert: false,
      tuition_receipt: false,
    },
    lastVerifiedStatus: "FAIL",
    lastVerifiedAt: "2026-06-28T11:15:00-07:00",
  },
];

const rules: VerificationRule[] = [
  {
    id: "RULE-01",
    category: "student_info",
    name: "신청자 성명 일치 여부",
    description: "제출 서류의 근로자/가입자 성명이 계약학과 지원 학생의 성명과 일치해야 합니다.",
    required: true,
  },
  {
    id: "RULE-02",
    category: "company_info",
    name: "소속 기업명 일치 여부",
    description: "제출 서류의 고용주/법인명이 대학과 협약 체결된 계약학과 참여 기업명과 일치해야 합니다.",
    required: true,
  },
  {
    id: "RULE-03",
    category: "insurance",
    name: "4대 사회보험 직장가입 상태",
    description: "건강보험 또는 고용보험 자격득실 내역을 기준으로, 해당 참여기업의 '직장가입자'로 등록되어 있어야 합니다.",
    required: true,
  },
  {
    id: "RULE-04",
    category: "tuition_share",
    name: "산업체 등록금 부담 비율 (50% 이상)",
    description: "기업 부담 약정서 또는 송금증명서상 기업의 등록금 납입 지원 비율이 총 등록금의 50% 이상이어야 합니다.",
    required: true,
    valueThreshold: "50%",
  },
  {
    id: "RULE-05",
    category: "working_hours",
    name: "정규 근무 요건 (주 35시간 이상)",
    description: "근로계약서상 주당 소정근로시간이 35시간 이상이며, 계약 형태가 '정규직' 또는 '기한의 정함이 없는 근로계약' 이어야 합니다.",
    required: true,
    valueThreshold: 35,
  },
];

const verificationHistory: VerificationResult[] = [
  {
    id: "VR-001",
    studentId: "STU-001",
    studentName: "홍길동",
    companyName: "삼성전자",
    department: "차세대 반도체공학과",
    overallStatus: "PASS",
    checkedAt: "2026-06-28T14:30:00-07:00",
    extractedSummary: "제출된 '재직증명서', '건강보험 자격득실확인서', '등록금 지원 약정서' 모두 적합합니다. 홍길동 학생은 삼성전자 소속 직장인 가입자가 맞으며, 등록금 또한 기업에서 50% 지원하는 내용이 확인되었습니다.",
    checks: [
      {
        ruleId: "RULE-01",
        ruleName: "신청자 성명 일치 여부",
        category: "student_info",
        status: "PASS",
        valueExtracted: "홍길동",
        evidence: "성명: 홍길동 (주민등록번호: 950101-*******)",
      },
      {
        ruleId: "RULE-02",
        ruleName: "소속 기업명 일치 여부",
        category: "company_info",
        status: "PASS",
        valueExtracted: "삼성전자(주)",
        evidence: "사업장 명칭: 삼성전자 주식회사, 사업자번호: 124-81-*****",
      },
      {
        ruleId: "RULE-03",
        ruleName: "4대 사회보험 직장가입 상태",
        category: "insurance",
        status: "PASS",
        valueExtracted: "건강보험 직장가입 (취득)",
        evidence: "건강보험 직장가입자 자격 취득일: 2023.01.15, 삼성전자(주)",
      },
      {
        ruleId: "RULE-04",
        ruleName: "산업체 등록금 부담 비율 (50% 이상)",
        category: "tuition_share",
        status: "PASS",
        valueExtracted: "기업 부담 100% (완전지원)",
        evidence: "등록금 납부 약정: 삼성전자 인재개발원 전액 지원 (100%)",
      },
      {
        ruleId: "RULE-05",
        ruleName: "정규 근무 요건 (주 35시간 이상)",
        category: "working_hours",
        status: "PASS",
        valueExtracted: "주 40시간 (정규직)",
        evidence: "소정근로시간: 주 40시간, 계약형태: 기한이 없는 정규 근로계약",
      },
    ],
  },
  {
    id: "VR-002",
    studentId: "STU-002",
    studentName: "김철수",
    companyName: "네오테크 (스타트업)",
    department: "AI 응용소프트웨어학과",
    overallStatus: "MANUAL_REVIEW",
    checkedAt: "2026-06-28T16:45:00-07:00",
    extractedSummary: "김철수 학생의 중소기업확인서상 기업 규모가 '소기업'으로 유효 기간 내에 있음이 입증되었습니다. 다만, 등록금 이체 확인증에서 기업 부담률이 45%로 기재되어 기준인 50%에 미달합니다. (단, 기업-대학 특수협약 추가 증빙서 제출 요망)",
    checks: [
      {
        ruleId: "RULE-01",
        ruleName: "신청자 성명 일치 여부",
        category: "student_info",
        status: "PASS",
        valueExtracted: "김철수",
        evidence: "성명: 김철수, 네오테크 소속 연구원",
      },
      {
        ruleId: "RULE-02",
        ruleName: "소속 기업명 일치 여부",
        category: "company_info",
        status: "PASS",
        valueExtracted: "(주)네오테크",
        evidence: "회사명: 주식회사 네오테크 (사업자등록번호: 220-81-*****)",
      },
      {
        ruleId: "RULE-03",
        ruleName: "4대 사회보험 직장가입 상태",
        category: "insurance",
        status: "PASS",
        valueExtracted: "고용보험 직장가입 (취득)",
        evidence: "고용보험 피보험자격 취득 내역: (주)네오테크, 취득일 2024.11.01",
      },
      {
        ruleId: "RULE-04",
        ruleName: "산업체 등록금 부담 비율 (50% 이상)",
        category: "tuition_share",
        status: "FAIL",
        valueExtracted: "기업 부담 45% (개인 부담 55%)",
        evidence: "등록금 납부 비율: 회사 지원금 1,800,000원 (총 등록금 4,000,000원의 45%)",
      },
      {
        ruleId: "RULE-05",
        ruleName: "정규 근무 요건 (주 35시간 이상)",
        category: "working_hours",
        status: "PASS",
        valueExtracted: "주 38시간 (정규직)",
        evidence: "소정근로시간: 주 5일 38시간, 기한이 없는 정규직 근로계약",
      },
    ],
  },
  {
    id: "VR-004",
    studentId: "STU-004",
    studentName: "박민수",
    companyName: "현대자동차",
    department: "스마트 모빌리티공학과",
    overallStatus: "FAIL",
    checkedAt: "2026-06-28T11:15:00-07:00",
    extractedSummary: "박민수 학생이 제출한 '근로계약서'상 소정 근로시간이 주당 20시간(단시간 파트타임)으로 명시되어, 계약학과의 필수 요건인 주 35시간 이상 정규 근무 조건을 충족하지 못합니다. 또한 4대 사회보험 가입 서류와 등록금 지원 증빙서가 업로드되지 않았습니다.",
    checks: [
      {
        ruleId: "RULE-01",
        ruleName: "신청자 성명 일치 여부",
        category: "student_info",
        status: "PASS",
        valueExtracted: "박민수",
        evidence: "근로계약자: 박민수",
      },
      {
        ruleId: "RULE-02",
        ruleName: "소속 기업명 일치 여부",
        category: "company_info",
        status: "PASS",
        valueExtracted: "현대자동차(주)",
        evidence: "사용주: 현대자동차 주식회사",
      },
      {
        ruleId: "RULE-03",
        ruleName: "4대 사회보험 직장가입 상태",
        category: "insurance",
        status: "FAIL",
        valueExtracted: "서류 미비 (확인 불가)",
        evidence: "건강보험 자격득실확인서가 제출되지 않았습니다.",
      },
      {
        ruleId: "RULE-04",
        ruleName: "산업체 등록금 부담 비율 (50% 이상)",
        category: "tuition_share",
        status: "FAIL",
        valueExtracted: "서류 미비 (확인 불가)",
        evidence: "등록금 지원 비율을 증명할 수 있는 서류가 누락되었습니다.",
      },
      {
        ruleId: "RULE-05",
        ruleName: "정규 근무 요건 (주 35시간 이상)",
        category: "working_hours",
        status: "FAIL",
        valueExtracted: "주 20시간 (단시간 근로자)",
        evidence: "소정근로시간: 주당 20시간, 형태: 단시간 시간제 근로 계약",
      },
    ],
  },
];

const MOCK_DOCUMENTS_DB: Record<string, string> = {
  employment_contract_pass: `
==== 근로계약서 ====
1. 근로계약 당사자
   - 사업주: 삼성전자 주식회사 (대표이사 경계현)
   - 근로자: 홍길동 (주민등록번호: 950101-1******)
2. 근로 조건 및 근무 형태
   - 계약 형태: 기한의 정함이 없는 근로계약 (정규직)
   - 근무지: 삼성전자 평택캠퍼스 반도체생산본부
   - 소정근로시간: 09:00 ~ 18:00 (주 5일, 주 40시간 근무, 휴게시간 1시간 제외)
3. 계약 일자: 2023년 1월 10일
   상기 당사자는 위와 같이 정식 근로계약을 체결하고 신의성실에 따라 근로의무를 이행할 것을 확약함.
  `,
  health_insurance_pass: `
==== 건강보험 자격득실확인서 ====
국민건강보험공단 발행 (확인서 번호: 2026-NHI-984210)
신청인 인적사항:
   - 성명: 홍길동
   - 주민등록번호: 950101-1******
자격득실 내역 (전체 이력):
   - 순번 1 | 사업장 명칭: 삼성전자(주) | 자격구분: 직장가입자 | 취득일: 2023.01.15 | 상실일: -
   - 순번 2 | 사업장 명칭: 공군교육사령부 | 자격구분: 직장가입자 | 취득일: 2016.03.01 | 상실일: 2018.05.31
본 확인서는 국민건강보험법 규정에 의해 위와 같이 자격득실 내역이 사실임을 증명함.
  `,
  tuition_receipt_pass: `
==== 등록금 지원 약정서 ====
대학 계약학과 등록금 산업체 분담 약정서
1. 학생 정보
   - 성명: 홍길동
   - 소속 학과: 차세대 반도체공학과 (석사과정)
2. 산업체 정보
   - 기업명: 삼성전자 주식회사
   - 담당 부서: 인재개발처 교육운영그룹
3. 등록금 분담 확약
   - 총 등록금 (학기당): 6,000,000원
   - 산업체 부담금: 6,000,000원 (총 등록금의 100% 지원)
   - 근로자 자부담금: 0원 (자부담 없음)
삼성전자는 해당 인재가 대학 소정의 교육과정을 완수할 수 있도록 등록금 전액을 납부 기한 내에 대학교 지정 계좌로 입금할 것을 약정합니다.
  `,
  sme_cert_pass: `
==== 중소기업확인서 ====
중소벤처기업부 발행 (발행번호: 2025-SME-128471)
1. 기업 정보
   - 기업명: 주식회사 네오테크
   - 대표자: 김아름
   - 법인등록번호: 110111-*******
   - 본사 주소: 서울특별시 마포구 백범로 31길 10, 서울창업허브 4층
2. 기업 구분 및 유효기간
   - 기업 구분: 소기업 (중소기업기본법 제2조에 따른 중소기업)
   - 적용 유효기간: 2025년 4월 1일 ~ 2026년 3월 31일
위 기업은 중소기업기본법 제2조에 따른 중소기업임을 확인합니다.
  `,
  tuition_receipt_fail: `
==== 등록금 이체 확인증 ====
송금은행: 신한은행 (이체결과: 완료)
1. 이체 세부 정보
   - 송금인: (주)네오테크 (사업자번호: 220-81-*****)
   - 수취인: 한국대학교 대학원 산학협력단
   - 송금 금액: 1,800,000원
2. 대상자 정보
   - 입학생: 김철수 (AI 응용소프트웨어학과)
   - 비고: 2026학년도 1학기 등록금 매칭 (기업 분담금 45% 지원 적용건, 총 등록금 4,000,000원 대비 지원)
해당 이체 내역은 금융거래 법적 확인 효력을 가지는 송금 확인 문서입니다.
  `,
  employment_contract_fail: `
==== 근로계약서 (시간제 파트타임) ====
1. 계약 계약자
   - 사용자: 현대자동차 주식회사 (대표이사 장재훈)
   - 근로자: 박민수 (980415-*******)
2. 업무 내용 및 근무 요건
   - 부서: 울산공장 차량검수지원반
   - 직급 및 직종: 시간제 파트타임 지원 근로자 (기간제 계약직)
   - 소정근로시간: 주 3일 근무 (월, 수, 금), 하루 6시간, 주당 총 소정근로시간 18시간
   - 근무 기간: 2026년 3월 1일 ~ 2026년 8월 31일 (6개월 단기 계약)
위 조건 하에 양 당사자는 상호 근로의무 체결에 합의함.
  `,
};

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "20mb" }));

app.get("/api/students", (req, res) => {
  res.json(students);
});

app.post("/api/students/add", (req, res) => {
  const { name, company, department, email } = req.body;
  if (!name || !company || !department || !email) {
    return res.status(400).json({ error: "모든 항목을 입력해야 합니다." });
  }
  const newStudent: Student = {
    id: `STU-0${students.length + 1}`,
    name,
    company,
    department,
    email,
    hasUploaded: false,
    documents: {},
  };
  students.push(newStudent);
  return res.status(201).json(newStudent);
});

app.get("/api/rules", (req, res) => {
  res.json(rules);
});

app.post("/api/rules/update", (req, res) => {
  const updatedRules = req.body;
  if (!Array.isArray(updatedRules)) {
    return res.status(400).json({ error: "올바르지 않은 양식입니다." });
  }
  rules.length = 0;
  rules.push(...updatedRules);
  return res.json({ message: "검증 요건 규칙이 성공적으로 업데이트되었습니다." });
});

app.get("/api/dashboard/stats", (req, res) => {
  const totalStudents = students.length;
  const uploadedStudents = students.filter((s) => s.hasUploaded).length;
  const passCount = students.filter((s) => s.lastVerifiedStatus === "PASS").length;
  const failCount = students.filter((s) => s.lastVerifiedStatus === "FAIL").length;
  const reviewCount = students.filter((s) => s.lastVerifiedStatus === "MANUAL_REVIEW").length;

  const stats: DashboardStats = {
    totalStudents,
    uploadedStudents,
    passCount,
    failCount,
    reviewCount,
  };
  res.json(stats);
});

app.get("/api/verification/history", (req, res) => {
  res.json(verificationHistory);
});

app.post("/api/verify", async (req, res) => {
  const { studentId, docType, fileName, fileBase64, mockKey } = req.body;

  if (!studentId || !docType) {
    return res.status(400).json({ error: "학생 ID와 서류 유형은 필수입니다." });
  }

  const student = students.find((s) => s.id === studentId);
  if (!student) {
    return res.status(404).json({ error: "해당 학생을 찾을 수 없습니다." });
  }

  let documentText = "";
  let isMock = false;

  if (mockKey && MOCK_DOCUMENTS_DB[mockKey]) {
    documentText = MOCK_DOCUMENTS_DB[mockKey];
    isMock = true;
  } else if (fileBase64) {
    documentText = "Analyzing uploaded file data...";
  } else {
    return res.status(400).json({ error: "분석할 파일 정보가 누락되었습니다." });
  }

  try {
    const activeRules = rules;
    const ai = getGeminiClient();

    let geminiResponseText = "";

    if (process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY" || !process.env.GEMINI_API_KEY) {
      console.log("No custom Gemini API key found, generating high-fidelity structured audit analysis from database mock patterns.");
      const textToAnalyze = documentText.toLowerCase();

      const isNameMatched = textToAnalyze.includes(student.name);
      const isCompanyMatched = textToAnalyze.includes(student.company.substring(0, 3)) || textToAnalyze.includes("삼성전자") || textToAnalyze.includes("네오테크") || textToAnalyze.includes("현대자동차");
      const hasInsurance = docType === "health_insurance_cert" && textToAnalyze.includes("직장가입자");
      const hasSme = docType === "sme_cert" && textToAnalyze.includes("중소기업");
      const tuitionMatch = docType === "tuition_receipt" ? (textToAnalyze.includes("100%") ? "PASS" : textToAnalyze.includes("45%") ? "FAIL" : "WARNING") : "PASS";
      const hoursMatch = docType === "employment_contract" ? (textToAnalyze.includes("40시간") ? "PASS" : textToAnalyze.includes("18시간") ? "FAIL" : "WARNING") : "PASS";

      const mockChecks = activeRules.map((rule) => {
        let status: "PASS" | "FAIL" | "WARNING" = "PASS";
        let valueExtracted = "적합";
        let evidence = "제출된 서류 내용을 분석한 결과 검증 요건을 충족합니다.";

        if (rule.category === "student_info") {
          status = isNameMatched ? "PASS" : "FAIL";
          valueExtracted = isNameMatched ? student.name : "미치/불일치";
          evidence = isNameMatched
            ? `서류상 대상자: ${student.name} 확인 완료`
            : `서류에서 학생 성명 '${student.name}'을(를) 찾을 수 없거나 불일치합니다.`;
        } else if (rule.category === "company_info") {
          status = isCompanyMatched ? "PASS" : "FAIL";
          valueExtracted = isCompanyMatched ? student.company : "미일치";
          evidence = isCompanyMatched
            ? `참여기업: ${student.company} 법인 확인 완료`
            : `대학과 협약된 기업명 '${student.company}'과(와) 일치하는 명칭이 서류상 부재합니다.`;
        } else if (rule.category === "insurance" && docType === "health_insurance_cert") {
          status = hasInsurance ? "PASS" : "FAIL";
          valueExtracted = hasInsurance ? "직장가입자 (취득)" : "일반/지역가입자 또는 미비";
          evidence = hasInsurance
            ? `자격구분: 직장가입자 | 가입처: ${student.company}`
            : "직장인 가입자가 아닌 지역가입자 또는 상실 처리된 이력만 존재합니다.";
        } else if (rule.category === "tuition_share" && docType === "tuition_receipt") {
          status = tuitionMatch === "PASS" ? "PASS" : "FAIL";
          valueExtracted = textToAnalyze.includes("100%") ? "100% 지원" : "45% 지원 (기준 미달)";
          evidence = textToAnalyze.includes("100%")
            ? "지원 형태: 기업 분담금 100% (전액 지원)"
            : "기업 지원액: 1,800,000원 (총액 4,000,000원 대비 45% 지원에 불과)";
        } else if (rule.category === "working_hours" && docType === "employment_contract") {
          status = hoursMatch === "PASS" ? "PASS" : "FAIL";
          valueExtracted = textToAnalyze.includes("40시간") ? "주 40시간 (정규직)" : "주 18시간 (단시간 계약직)";
          evidence = textToAnalyze.includes("40시간")
            ? "근무 형태: 주당 40시간 정규 근로, 기한의 정함이 없음"
            : "소정근로시간: 주당 18시간으로 계약학과 필수 기준(주 35시간)에 한참 미달합니다.";
        }

        return {
          ruleId: rule.id,
          ruleName: rule.name,
          category: rule.category,
          status,
          valueExtracted,
          evidence,
        };
      });

      const anyFail = mockChecks.some((c) => c.status === "FAIL");
      const overallStatus = anyFail
        ? (docType === "tuition_receipt" && mockChecks.find(c => c.ruleId === "RULE-04")?.status === "FAIL" ? "MANUAL_REVIEW" : "FAIL")
        : "PASS";

      const simulatedResult: VerificationResult = {
        id: `VR-${Date.now().toString().slice(-3)}`,
        studentId: student.id,
        studentName: student.name,
        companyName: student.company,
        department: student.department,
        overallStatus,
        checkedAt: new Date().toISOString(),
        checks: mockChecks,
        extractedSummary: `[시뮬레이션 검증 결과] 학생명 ${student.name}, 기업명 ${student.company}에 대해 제출서류 '${docType}' 정밀 대조 결과, ${overallStatus === "PASS" ? "모든 검증을 무사 통과하였습니다." : "일부 부적합 항목이 검출되어 추가 서류 보완 또는 관리자 수동 승인이 필요합니다."}`,
      };

      student.hasUploaded = true;
      student.documents[docType] = true;
      student.lastVerifiedStatus = overallStatus;
      student.lastVerifiedAt = simulatedResult.checkedAt;

      const existingHistIndex = verificationHistory.findIndex(v => v.studentId === studentId);
      if (existingHistIndex >= 0) {
        verificationHistory[existingHistIndex] = simulatedResult;
      } else {
        verificationHistory.push(simulatedResult);
      }

      return res.json({ success: true, result: simulatedResult });
    }

    let contentsInput: any = [];

    if (fileBase64) {
      const mimeType = fileName?.endsWith(".pdf") ? "application/pdf" : "image/jpeg";
      const filePart = {
        inlineData: {
          mimeType,
          data: fileBase64.replace(/^data:.*,/, ""),
        },
      };
      const textPart = {
        text: `You are an auditing bot verifying eligibility for Korean Contract Departments (계약학과). 
The current applicant name is: "${student.name}"
Their contracted partner company is: "${student.company}"
The document type is: "${docType}" (employment_contract: 재직/근로계약서, health_insurance_cert: 건강보험자격득실, sme_cert: 중소기업확인서, tuition_receipt: 등록금매칭지원증빙)

Validate this document based on the following rules:
${JSON.stringify(activeRules, null, 2)}

Provide a strict, professional Korean audit result according to the requested JSON response schema.`,
      };
      contentsInput = { parts: [filePart, textPart] };
    } else {
      const textPart = {
        text: `You are an auditing bot verifying eligibility for Korean Contract Departments (계약학과). 
Analyze this official Korean text content extracted from the document:
"""
${documentText}
"""

The current applicant name is: "${student.name}"
Their contracted partner company is: "${student.company}"
The document type is: "${docType}" 

Evaluate against these active validation rules:
${JSON.stringify(activeRules, null, 2)}

Provide a strict, professional Korean audit result according to the requested JSON response schema.`,
      };
      contentsInput = textPart;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contentsInput,
      config: {
        systemInstruction: "You are a professional auditor certifying students for South Korean industrial contract departments. Extract name, organization, working conditions, and compare them with target records. Produce high-precision JSON results.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            extractedSummary: {
              type: Type.STRING,
              description: "A summary of the audit findings in Korean. Professional and objective tone.",
            },
            overallStatus: {
              type: Type.STRING,
              description: "Must be 'PASS', 'FAIL', or 'MANUAL_REVIEW'.",
            },
            checks: {
              type: Type.ARRAY,
              description: "Verification status for each active rule.",
              items: {
                type: Type.OBJECT,
                properties: {
                  ruleId: { type: Type.STRING },
                  ruleName: { type: Type.STRING },
                  category: { type: Type.STRING },
                  status: { type: Type.STRING, description: "Must be 'PASS', 'FAIL', or 'WARNING'" },
                  valueExtracted: { type: Type.STRING, description: "Value or text extracted from document" },
                  evidence: { type: Type.STRING, description: "Direct sentence or clause from the document as evidence" },
                },
                required: ["ruleId", "ruleName", "category", "status", "valueExtracted", "evidence"],
              },
            },
          },
          required: ["extractedSummary", "overallStatus", "checks"],
        },
      },
    });

    const parsedResult = JSON.parse(response.text.trim());

    const result: VerificationResult = {
      id: `VR-${Date.now().toString().slice(-3)}`,
      studentId: student.id,
      studentName: student.name,
      companyName: student.company,
      department: student.department,
      overallStatus: parsedResult.overallStatus as any,
      checkedAt: new Date().toISOString(),
      checks: parsedResult.checks,
      extractedSummary: parsedResult.extractedSummary,
    };

    student.hasUploaded = true;
    student.documents[docType] = true;
    student.lastVerifiedStatus = result.overallStatus;
    student.lastVerifiedAt = result.checkedAt;

    const existingHistIndex = verificationHistory.findIndex(v => v.studentId === studentId);
    if (existingHistIndex >= 0) {
      verificationHistory[existingHistIndex] = result;
    } else {
      verificationHistory.push(result);
    }

    res.json({ success: true, result });
  } catch (error: any) {
    console.error("Gemini processing failed:", error);
    res.status(500).json({ error: "Gemini 분석 중 서버 오류가 발생했습니다.", details: error.message });
  }
});

app.post("/api/verify/override", (req, res) => {
  const { studentId, status, note } = req.body;
  if (!studentId || !status) {
    return res.status(400).json({ error: "필수 정보가 누락되었습니다." });
  }

  const student = students.find((s) => s.id === studentId);
  if (!student) {
    return res.status(404).json({ error: "해당 학생을 찾을 수 없습니다." });
  }

  student.lastVerifiedStatus = status;
  student.lastVerifiedAt = new Date().toISOString();

  const historyItem = verificationHistory.find((v) => v.studentId === studentId);
  if (historyItem) {
    historyItem.overallStatus = status;
    historyItem.extractedSummary = `[관리자 수동 강제 승인] 사유: ${note || "관리자 확인 완료"}\n\n이전 분석 내용: ${historyItem.extractedSummary}`;
  } else {
    verificationHistory.push({
      id: `VR-M-${Date.now().toString().slice(-3)}`,
      studentId: student.id,
      studentName: student.name,
      companyName: student.company,
      department: student.department,
      overallStatus: status,
      checkedAt: student.lastVerifiedAt,
      extractedSummary: `[관리자 수동 신규 승인] 사유: ${note || "서류 오프라인 대조 완료"}`,
      checks: rules.map((r) => ({
        ruleId: r.id,
        ruleName: r.name,
        category: r.category,
        status: "PASS",
        valueExtracted: "수동 확인",
        evidence: "관리자가 오프라인 증빙을 통해 요건 통과로 처리함",
      })),
    });
  }

  res.json({ success: true, student });
});

// Static file serving for production
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

export default app;

if (!process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server Ready] running on http://localhost:${PORT}`);
  });
}