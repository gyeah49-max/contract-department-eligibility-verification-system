export interface VerificationRule {
  id: string;
  category: 'student_info' | 'company_info' | 'insurance' | 'tuition_share' | 'working_hours';
  name: string;
  description: string;
  required: boolean;
  valueThreshold?: string | number;
}

export type DocumentType =
  | 'employment_contract' // 근로계약서 / 재직증명서
  | 'health_insurance_cert' // 건강보험 자격득실확인서
  | 'sme_cert' // 중소기업확인서 / 사업자등록증
  | 'tuition_receipt'; // 등록금 이체 확인증 / 지원금 약정서

export interface DocumentUpload {
  id: string;
  docType: DocumentType;
  fileName: string;
  status: 'pending' | 'verifying' | 'matched' | 'failed';
  extractedText?: string;
  fileBase64?: string;
}

export interface VerificationCheck {
  ruleId: string;
  ruleName: string;
  category: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  valueExtracted: string;
  evidence: string;
}

export interface VerificationResult {
  id: string;
  studentId: string;
  studentName: string;
  companyName: string;
  department: string;
  overallStatus: 'PASS' | 'FAIL' | 'MANUAL_REVIEW';
  checkedAt: string;
  checks: VerificationCheck[];
  extractedSummary: string;
  errors?: string[];
}

export interface Student {
  id: string;
  name: string;
  company: string;
  department: string;
  email: string;
  hasUploaded: boolean;
  documents: {
    employment_contract?: boolean;
    health_insurance_cert?: boolean;
    sme_cert?: boolean;
    tuition_receipt?: boolean;
  };
  lastVerifiedStatus?: 'PASS' | 'FAIL' | 'MANUAL_REVIEW';
  lastVerifiedAt?: string;
}

export interface DashboardStats {
  totalStudents: number;
  uploadedStudents: number;
  passCount: number;
  failCount: number;
  reviewCount: number;
}
