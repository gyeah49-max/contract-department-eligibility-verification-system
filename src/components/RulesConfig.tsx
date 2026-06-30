import { useState } from "react";
import { VerificationRule } from "../types";
import { Settings, Check, AlertCircle, Save, HelpCircle } from "lucide-react";

interface RulesConfigProps {
  initialRules: VerificationRule[];
  onRulesUpdated: (updatedRules: VerificationRule[]) => void;
}

export default function RulesConfig({ initialRules, onRulesUpdated }: RulesConfigProps) {
  const [localRules, setLocalRules] = useState<VerificationRule[]>([...initialRules]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  const handleToggleRequired = (id: string) => {
    setLocalRules(prev =>
      prev.map(rule => (rule.id === id ? { ...rule, required: !rule.required } : rule))
    );
  };

  const handleThresholdChange = (id: string, value: string) => {
    setLocalRules(prev =>
      prev.map(rule => (rule.id === id ? { ...rule, valueThreshold: value } : rule))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");
    try {
      const response = await fetch("/api/rules/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localRules),
      });
      if (response.ok) {
        setSaveStatus("success");
        onRulesUpdated(localRules);
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
      }
    } catch (e) {
      console.error(e);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    const map: Record<string, { label: string; style: string }> = {
      student_info: { label: "학생 정보", style: "bg-blue-50 text-blue-700 border-blue-100" },
      company_info: { label: "기업 정보", style: "bg-purple-50 text-purple-700 border-purple-100" },
      insurance: { label: "4대 보험", style: "bg-emerald-50 text-emerald-700 border-emerald-100" },
      tuition_share: { label: "등록금 분담", style: "bg-indigo-50 text-indigo-700 border-indigo-100" },
      working_hours: { label: "근로 계약", style: "bg-amber-50 text-amber-700 border-amber-100" },
    };
    const details = map[category] || { label: "일반", style: "bg-gray-50 text-gray-700 border-gray-100" };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${details.style}`}>
        {details.label}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-700">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-gray-900 leading-tight">
              검증 요건 설정
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              계약학과 자격요건 검증용 임계치 및 필수 규칙을 관리합니다.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-gray-950 hover:bg-gray-800 disabled:bg-gray-300 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow"
        >
          <Save className="w-3.5 h-3.5" />
          {isSaving ? "저장 중..." : "설정 저장"}
        </button>
      </div>

      {saveStatus === "success" && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          검증 요건 변경 사항이 성공적으로 저장되었습니다! 다음 분석부터 적용됩니다.
        </div>
      )}

      {saveStatus === "error" && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          규칙 업데이트 도중 서버 오류가 발생하였습니다. 다시 시도해 주세요.
        </div>
      )}

      <div className="space-y-4">
        {localRules.map(rule => (
          <div
            key={rule.id}
            className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            {/* Rule Info */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                {getCategoryBadge(rule.category)}
                <span className="text-xs font-mono font-medium text-gray-400">
                  {rule.id}
                </span>
              </div>
              <h4 className="font-sans font-bold text-sm text-gray-900 leading-snug">
                {rule.name}
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed max-w-xl">
                {rule.description}
              </p>
            </div>

            {/* Rule Configuration Fields */}
            <div className="flex items-center gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
              {/* Threshold parameter if applicable */}
              {rule.valueThreshold !== undefined && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-0.5">
                    검증 기준값
                    <HelpCircle className="w-3 h-3 text-gray-300" title="Gemini가 서류에서 추출하여 정밀 비교할 최소 규격입니다." />
                  </span>
                  <input
                    type="text"
                    value={rule.valueThreshold}
                    onChange={e => handleThresholdChange(rule.id, e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-800 font-bold focus:border-sky-500 focus:ring-1 focus:ring-sky-500 bg-white w-24 text-center"
                  />
                </div>
              )}

              {/* Required Switcher */}
              <div className="flex flex-col gap-1 items-end">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  필수 요건 여부
                </span>
                <button
                  onClick={() => handleToggleRequired(rule.id)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none relative ${
                    rule.required ? "bg-gray-900" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white shadow-sm transform duration-200 ${
                      rule.required ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
