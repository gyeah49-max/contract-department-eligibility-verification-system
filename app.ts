import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { Student, VerificationRule, VerificationResult, DashboardStats } from "./src/types";

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
    name: "?띻만??,
    company: "?쇱꽦?꾩옄",
    department: "李⑥꽭? 諛섎룄泥닿났?숆낵",
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
    name: "源泥좎닔",
    company: "?ㅼ삤?뚰겕 (?ㅽ??몄뾽)",
    department: "AI ?묒슜?뚰봽?몄썾?댄븰怨?,
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
    name: "?댁쁺??,
    company: "?먯씠移섏뿏??二쇱떇?뚯궗",
    department: "泥⑤떒 ?좎냼?ъ쑖?⑷났?숆낵",
    email: "younghee.lee@hnl.co.kr",
    hasUploaded: false,
    documents: {},
  },
  {
    id: "STU-004",
    name: "諛뺣???,
    company: "?꾨??먮룞李?,
    department: "?ㅻ쭏??紐⑤퉴由ы떚怨듯븰怨?,
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
    name: "?좎껌???깅챸 ?쇱튂 ?щ?",
    description: "?쒖텧 ?쒕쪟??洹쇰줈??媛?낆옄 ?깅챸??怨꾩빟?숆낵 吏???숈깮???깅챸怨??쇱튂?댁빞 ?⑸땲??",
    required: true,
  },
  {
    id: "RULE-02",
    category: "company_info",
    name: "?뚯냽 湲곗뾽紐??쇱튂 ?щ?",
    description: "?쒖텧 ?쒕쪟??怨좎슜二?踰뺤씤紐낆씠 ??숆낵 ?묒빟 泥닿껐??怨꾩빟?숆낵 李몄뿬 湲곗뾽紐낃낵 ?쇱튂?댁빞 ?⑸땲??",
    required: true,
  },
  {
    id: "RULE-03",
    category: "insurance",
    name: "4? ?ы쉶蹂댄뿕 吏곸옣媛???곹깭",
    description: "嫄닿컯蹂댄뿕 ?먮뒗 怨좎슜蹂댄뿕 ?먭꺽?앹떎 ?댁뿭??湲곗??쇰줈, ?대떦 李몄뿬湲곗뾽??'吏곸옣媛?낆옄'濡??깅줉?섏뼱 ?덉뼱???⑸땲??",
    required: true,
  },
  {
    id: "RULE-04",
    category: "tuition_share",
    name: "?곗뾽泥??깅줉湲?遺??鍮꾩쑉 (50% ?댁긽)",
    description: "湲곗뾽 遺???쎌젙???먮뒗 ?↔툑利앸챸?쒖긽 湲곗뾽???깅줉湲??⑹엯 吏??鍮꾩쑉??珥??깅줉湲덉쓽 50% ?댁긽?댁뼱???⑸땲??",
    required: true,
    valueThreshold: "50%",
  },
  {
    id: "RULE-05",
    category: "working_hours",
    name: "?뺢퇋 洹쇰Т ?붽굔 (二?35?쒓컙 ?댁긽)",
    description: "洹쇰줈怨꾩빟?쒖긽 二쇰떦 ?뚯젙洹쇰줈?쒓컙??35?쒓컙 ?댁긽?대ŉ, 怨꾩빟 ?뺥깭媛 '?뺢퇋吏? ?먮뒗 '湲고븳???뺥븿???녿뒗 洹쇰줈怨꾩빟' ?댁뼱???⑸땲??",
    required: true,
    valueThreshold: 35,
  },
];

const verificationHistory: VerificationResult[] = [
  {
    id: "VR-001",
    studentId: "STU-001",
    studentName: "?띻만??,
    companyName: "?쇱꽦?꾩옄",
    department: "李⑥꽭? 諛섎룄泥닿났?숆낵",
    overallStatus: "PASS",
    checkedAt: "2026-06-28T14:30:00-07:00",
    extractedSummary: "?쒖텧??'?ъ쭅利앸챸??, '嫄닿컯蹂댄뿕 ?먭꺽?앹떎?뺤씤??, '?깅줉湲?吏???쎌젙?? 紐⑤몢 ?곹빀?⑸땲?? ?띻만???숈깮? ?쇱꽦?꾩옄 ?뚯냽 吏곸옣??媛?낆옄媛 留욎쑝硫? ?깅줉湲??먰븳 湲곗뾽?먯꽌 50% 吏?먰븯???댁슜???뺤씤?섏뿀?듬땲??",
    checks: [
      {
        ruleId: "RULE-01",
        ruleName: "?좎껌???깅챸 ?쇱튂 ?щ?",
        category: "student_info",
        status: "PASS",
        valueExtracted: "?띻만??,
        evidence: "?깅챸: ?띻만??(二쇰??깅줉踰덊샇: 950101-*******)",
      },
      {
        ruleId: "RULE-02",
        ruleName: "?뚯냽 湲곗뾽紐??쇱튂 ?щ?",
        category: "company_info",
        status: "PASS",
        valueExtracted: "?쇱꽦?꾩옄(二?",
        evidence: "?ъ뾽??紐낆묶: ?쇱꽦?꾩옄 二쇱떇?뚯궗, ?ъ뾽?먮쾲?? 124-81-*****",
      },
      {
        ruleId: "RULE-03",
        ruleName: "4? ?ы쉶蹂댄뿕 吏곸옣媛???곹깭",
        category: "insurance",
        status: "PASS",
        valueExtracted: "嫄닿컯蹂댄뿕 吏곸옣媛??(痍⑤뱷)",
        evidence: "嫄닿컯蹂댄뿕 吏곸옣媛?낆옄 ?먭꺽 痍⑤뱷?? 2023.01.15, ?쇱꽦?꾩옄(二?",
      },
      {
        ruleId: "RULE-04",
        ruleName: "?곗뾽泥??깅줉湲?遺??鍮꾩쑉 (50% ?댁긽)",
        category: "tuition_share",
        status: "PASS",
        valueExtracted: "湲곗뾽 遺??100% (?꾩쟾吏??",
        evidence: "?깅줉湲??⑸? ?쎌젙: ?쇱꽦?꾩옄 ?몄옱媛쒕컻???꾩븸 吏??(100%)",
      },
      {
        ruleId: "RULE-05",
        ruleName: "?뺢퇋 洹쇰Т ?붽굔 (二?35?쒓컙 ?댁긽)",
        category: "working_hours",
        status: "PASS",
        valueExtracted: "二?40?쒓컙 (?뺢퇋吏?",
        evidence: "?뚯젙洹쇰줈?쒓컙: 二?40?쒓컙, 怨꾩빟?뺥깭: 湲고븳???녿뒗 ?뺢퇋 洹쇰줈怨꾩빟",
      },
    ],
  },
  {
    id: "VR-002",
    studentId: "STU-002",
    studentName: "源泥좎닔",
    companyName: "?ㅼ삤?뚰겕 (?ㅽ??몄뾽)",
    department: "AI ?묒슜?뚰봽?몄썾?댄븰怨?,
    overallStatus: "MANUAL_REVIEW",
    checkedAt: "2026-06-28T16:45:00-07:00",
    extractedSummary: "源泥좎닔 ?숈깮??以묒냼湲곗뾽?뺤씤?쒖긽 湲곗뾽 洹쒕え媛 '?뚭린???쇰줈 ?좏슚 湲곌컙 ?댁뿉 ?덉쓬???낆쬆?섏뿀?듬땲?? ?ㅻ쭔, ?깅줉湲??댁껜 ?뺤씤利앹뿉??湲곗뾽 遺?대쪧??45%濡?湲곗옱?섏뼱 湲곗???50%??誘몃떖?⑸땲?? (?? 湲곗뾽-????뱀닔?묒빟 異붽? 利앸튃???쒖텧 ?붾쭩)",
    checks: [
      {
        ruleId: "RULE-01",
        ruleName: "?좎껌???깅챸 ?쇱튂 ?щ?",
        category: "student_info",
        status: "PASS",
        valueExtracted: "源泥좎닔",
        evidence: "?깅챸: 源泥좎닔, ?ㅼ삤?뚰겕 ?뚯냽 ?곌뎄??,
      },
      {
        ruleId: "RULE-02",
        ruleName: "?뚯냽 湲곗뾽紐??쇱튂 ?щ?",
        category: "company_info",
        status: "PASS",
        valueExtracted: "(二??ㅼ삤?뚰겕",
        evidence: "?뚯궗紐? 二쇱떇?뚯궗 ?ㅼ삤?뚰겕 (?ъ뾽?먮벑濡앸쾲?? 220-81-*****)",
      },
      {
        ruleId: "RULE-03",
        ruleName: "4? ?ы쉶蹂댄뿕 吏곸옣媛???곹깭",
        category: "insurance",
        status: "PASS",
        valueExtracted: "怨좎슜蹂댄뿕 吏곸옣媛??(痍⑤뱷)",
        evidence: "怨좎슜蹂댄뿕 ?쇰낫?섏옄寃?痍⑤뱷 ?댁뿭: (二??ㅼ삤?뚰겕, 痍⑤뱷??2024.11.01",
      },
      {
        ruleId: "RULE-04",
        ruleName: "?곗뾽泥??깅줉湲?遺??鍮꾩쑉 (50% ?댁긽)",
        category: "tuition_share",
        status: "FAIL",
        valueExtracted: "湲곗뾽 遺??45% (媛쒖씤 遺??55%)",
        evidence: "?깅줉湲??⑸? 鍮꾩쑉: ?뚯궗 吏?먭툑 1,800,000??(珥??깅줉湲?4,000,000?먯쓽 45%)",
      },
      {
        ruleId: "RULE-05",
        ruleName: "?뺢퇋 洹쇰Т ?붽굔 (二?35?쒓컙 ?댁긽)",
        category: "working_hours",
        status: "PASS",
        valueExtracted: "二?38?쒓컙 (?뺢퇋吏?",
        evidence: "?뚯젙洹쇰줈?쒓컙: 二?5??38?쒓컙, 湲고븳???녿뒗 ?뺢퇋吏?洹쇰줈怨꾩빟",
      },
    ],
  },
  {
    id: "VR-004",
    studentId: "STU-004",
    studentName: "諛뺣???,
    companyName: "?꾨??먮룞李?,
    department: "?ㅻ쭏??紐⑤퉴由ы떚怨듯븰怨?,
    overallStatus: "FAIL",
    checkedAt: "2026-06-28T11:15:00-07:00",
    extractedSummary: "諛뺣????숈깮???쒖텧??'洹쇰줈怨꾩빟?????뚯젙 洹쇰줈?쒓컙??二쇰떦 20?쒓컙(?⑥떆媛??뚰듃????쇰줈 紐낆떆?섏뼱, 怨꾩빟?숆낵???꾩닔 ?붽굔??二?35?쒓컙 ?댁긽 ?뺢퇋 洹쇰Т 議곌굔??異⑹”?섏? 紐삵빀?덈떎. ?먰븳 4? ?ы쉶蹂댄뿕 媛???쒕쪟? ?깅줉湲?吏??利앸튃?쒓? ?낅줈?쒕릺吏 ?딆븯?듬땲??",
    checks: [
      {
        ruleId: "RULE-01",
        ruleName: "?좎껌???깅챸 ?쇱튂 ?щ?",
        category: "student_info",
        status: "PASS",
        valueExtracted: "諛뺣???,
        evidence: "洹쇰줈怨꾩빟?? 諛뺣???,
      },
      {
        ruleId: "RULE-02",
        ruleName: "?뚯냽 湲곗뾽紐??쇱튂 ?щ?",
        category: "company_info",
        status: "PASS",
        valueExtracted: "?꾨??먮룞李?二?",
        evidence: "?ъ슜二? ?꾨??먮룞李?二쇱떇?뚯궗",
      },
      {
        ruleId: "RULE-03",
        ruleName: "4? ?ы쉶蹂댄뿕 吏곸옣媛???곹깭",
        category: "insurance",
        status: "FAIL",
        valueExtracted: "?쒕쪟 誘몃퉬 (?뺤씤 遺덇?)",
        evidence: "嫄닿컯蹂댄뿕 ?먭꺽?앹떎?뺤씤?쒓? ?쒖텧?섏? ?딆븯?듬땲??",
      },
      {
        ruleId: "RULE-04",
        ruleName: "?곗뾽泥??깅줉湲?遺??鍮꾩쑉 (50% ?댁긽)",
        category: "tuition_share",
        status: "FAIL",
        valueExtracted: "?쒕쪟 誘몃퉬 (?뺤씤 遺덇?)",
        evidence: "?깅줉湲?吏??鍮꾩쑉??利앸챸?????덈뒗 ?쒕쪟媛 ?꾨씫?섏뿀?듬땲??",
      },
      {
        ruleId: "RULE-05",
        ruleName: "?뺢퇋 洹쇰Т ?붽굔 (二?35?쒓컙 ?댁긽)",
        category: "working_hours",
        status: "FAIL",
        valueExtracted: "二?20?쒓컙 (?⑥떆媛?洹쇰줈??",
        evidence: "?뚯젙洹쇰줈?쒓컙: 二쇰떦 20?쒓컙, ?뺥깭: ?⑥떆媛??쒓컙??洹쇰줈 怨꾩빟",
      },
    ],
  },
];

const MOCK_DOCUMENTS_DB: Record<string, string> = {
  employment_contract_pass: `
==== 洹쇰줈怨꾩빟??====
1. 洹쇰줈怨꾩빟 ?뱀궗??   - ?ъ뾽二? ?쇱꽦?꾩옄 二쇱떇?뚯궗 (??쒖씠??寃쎄퀎??
   - 洹쇰줈?? ?띻만??(二쇰??깅줉踰덊샇: 950101-1******)
2. 洹쇰줈 議곌굔 諛?洹쇰Т ?뺥깭
   - 怨꾩빟 ?뺥깭: 湲고븳???뺥븿???녿뒗 洹쇰줈怨꾩빟 (?뺢퇋吏?
   - 洹쇰Т吏: ?쇱꽦?꾩옄 ?됲깮罹좏띁??諛섎룄泥댁깮?곕낯遺
   - ?뚯젙洹쇰줈?쒓컙: 09:00 ~ 18:00 (二?5?? 二?40?쒓컙 洹쇰Т, ?닿쾶?쒓컙 1?쒓컙 ?쒖쇅)
3. 怨꾩빟 ?쇱옄: 2023??1??10??   ?곴린 ?뱀궗?먮뒗 ?꾩? 媛숈씠 ?뺤떇 洹쇰줈怨꾩빟??泥닿껐?섍퀬 ?좎쓽?깆떎???곕씪 洹쇰줈?섎Т瑜??댄뻾??寃껋쓣 ?뺤빟??
  `,
  health_insurance_pass: `
==== 嫄닿컯蹂댄뿕 ?먭꺽?앹떎?뺤씤??====
援??嫄닿컯蹂댄뿕怨듬떒 諛쒗뻾 (?뺤씤??踰덊샇: 2026-NHI-984210)
?좎껌???몄쟻?ы빆:
   - ?깅챸: ?띻만??   - 二쇰??깅줉踰덊샇: 950101-1******
?먭꺽?앹떎 ?댁뿭 (?꾩껜 ?대젰):
   - ?쒕쾲 1 | ?ъ뾽??紐낆묶: ?쇱꽦?꾩옄(二? | ?먭꺽援щ텇: 吏곸옣媛?낆옄 | 痍⑤뱷?? 2023.01.15 | ?곸떎?? -
   - ?쒕쾲 2 | ?ъ뾽??紐낆묶: 怨듦뎔援먯쑁?щ졊遺 | ?먭꺽援щ텇: 吏곸옣媛?낆옄 | 痍⑤뱷?? 2016.03.01 | ?곸떎?? 2018.05.31
蹂??뺤씤?쒕뒗 援??嫄닿컯蹂댄뿕踰?洹쒖젙???섑빐 ?꾩? 媛숈씠 ?먭꺽?앹떎 ?댁뿭???ъ떎?꾩쓣 利앸챸??
  `,
  tuition_receipt_pass: `
==== ?깅줉湲?吏???쎌젙??====
???怨꾩빟?숆낵 ?깅줉湲??곗뾽泥?遺꾨떞 ?쎌젙??1. ?숈깮 ?뺣낫
   - ?깅챸: ?띻만??   - ?뚯냽 ?숆낵: 李⑥꽭? 諛섎룄泥닿났?숆낵 (?앹궗怨쇱젙)
2. ?곗뾽泥??뺣낫
   - 湲곗뾽紐? ?쇱꽦?꾩옄 二쇱떇?뚯궗
   - ?대떦 遺?? ?몄옱媛쒕컻泥?援먯쑁?댁쁺洹몃９
3. ?깅줉湲?遺꾨떞 ?뺤빟
   - 珥??깅줉湲?(?숆린??: 6,000,000??   - ?곗뾽泥?遺?닿툑: 6,000,000??(珥??깅줉湲덉쓽 100% 吏??
   - 洹쇰줈???먮??닿툑: 0??(?먮????놁쓬)
?쇱꽦?꾩옄???대떦 ?몄옱媛 ????뚯젙??援먯쑁怨쇱젙???꾩닔?????덈룄濡??깅줉湲??꾩븸???⑸? 湲고븳 ?댁뿉 ??숆탳 吏??怨꾩쥖濡??낃툑??寃껋쓣 ?쎌젙?⑸땲??
  `,
  sme_cert_pass: `
==== 以묒냼湲곗뾽?뺤씤??====
以묒냼踰ㅼ쿂湲곗뾽遺 諛쒗뻾 (諛쒗뻾踰덊샇: 2025-SME-128471)
1. 湲곗뾽 ?뺣낫
   - 湲곗뾽紐? 二쇱떇?뚯궗 ?ㅼ삤?뚰겕
   - ??쒖옄: 源?꾨쫫
   - 踰뺤씤?깅줉踰덊샇: 110111-*******
   - 蹂몄궗 二쇱냼: ?쒖슱?밸퀎??留덊룷援?諛깅쾾濡?31湲?10, ?쒖슱李쎌뾽?덈툕 4痢?2. 湲곗뾽 援щ텇 諛??좏슚湲곌컙
   - 湲곗뾽 援щ텇: ?뚭린??(以묒냼湲곗뾽湲곕낯踰???議곗뿉 ?곕Ⅸ 以묒냼湲곗뾽)
   - ?곸슜 ?좏슚湲곌컙: 2025??4??1??~ 2026??3??31????湲곗뾽? 以묒냼湲곗뾽湲곕낯踰???議곗뿉 ?곕Ⅸ 以묒냼湲곗뾽?꾩쓣 ?뺤씤?⑸땲??
  `,
  tuition_receipt_fail: `
==== ?깅줉湲??댁껜 ?뺤씤利?====
?↔툑??? ?좏븳???(?댁껜寃곌낵: ?꾨즺)
1. ?댁껜 ?몃? ?뺣낫
   - ?↔툑?? (二??ㅼ삤?뚰겕 (?ъ뾽?먮쾲?? 220-81-*****)
   - ?섏랬?? ?쒓뎅??숆탳 ??숈썝 ?고븰?묐젰??   - ?↔툑 湲덉븸: 1,800,000??2. ??곸옄 ?뺣낫
   - ?낇븰?? 源泥좎닔 (AI ?묒슜?뚰봽?몄썾?댄븰怨?
   - 鍮꾧퀬: 2026?숇뀈??1?숆린 ?깅줉湲?留ㅼ묶 (湲곗뾽 遺꾨떞湲?45% 吏???곸슜嫄? 珥??깅줉湲?4,000,000???鍮?吏??
?대떦 ?댁껜 ?댁뿭? 湲덉쑖嫄곕옒 踰뺤쟻 ?뺤씤 ?⑤젰??媛吏???↔툑 ?뺤씤 臾몄꽌?낅땲??
  `,
  employment_contract_fail: `
==== 洹쇰줈怨꾩빟??(?쒓컙???뚰듃??? ====
1. 怨꾩빟 怨꾩빟??   - ?ъ슜?? ?꾨??먮룞李?二쇱떇?뚯궗 (??쒖씠???μ옱??
   - 洹쇰줈?? 諛뺣???(980415-*******)
2. ?낅Т ?댁슜 諛?洹쇰Т ?붽굔
   - 遺?? ?몄궛怨듭옣 李⑤웾寃?섏??먮컲
   - 吏곴툒 諛?吏곸쥌: ?쒓컙???뚰듃???吏??洹쇰줈??(湲곌컙??怨꾩빟吏?
   - ?뚯젙洹쇰줈?쒓컙: 二?3??洹쇰Т (?? ?? 湲?, ?섎（ 6?쒓컙, 二쇰떦 珥??뚯젙洹쇰줈?쒓컙 18?쒓컙
   - 洹쇰Т 湲곌컙: 2026??3??1??~ 2026??8??31??(6媛쒖썡 ?④린 怨꾩빟)
??議곌굔 ?섏뿉 ???뱀궗?먮뒗 ?곹샇 洹쇰줈?섎Т 泥닿껐???⑹쓽??
  `,
};

const app = express();
app.use(express.json({ limit: "20mb" }));

app.get("/api/students", (req, res) => {
  res.json(students);
});

app.post("/api/students/add", (req, res) => {
  const { name, company, department, email } = req.body;
  if (!name || !company || !department || !email) {
    return res.status(400).json({ error: "紐⑤뱺 ??ぉ???낅젰?댁빞 ?⑸땲??" });
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
    return res.status(400).json({ error: "?щ컮瑜댁? ?딆? ?묒떇?낅땲??" });
  }
  rules.length = 0;
  rules.push(...updatedRules);
  return res.json({ message: "寃利??붽굔 洹쒖튃???깃났?곸쑝濡??낅뜲?댄듃?섏뿀?듬땲??" });
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
    return res.status(400).json({ error: "?숈깮 ID? ?쒕쪟 ?좏삎? ?꾩닔?낅땲??" });
  }

  const student = students.find((s) => s.id === studentId);
  if (!student) {
    return res.status(404).json({ error: "?대떦 ?숈깮??李얠쓣 ???놁뒿?덈떎." });
  }

  let documentText = "";
  let isMock = false;

  if (mockKey && MOCK_DOCUMENTS_DB[mockKey]) {
    documentText = MOCK_DOCUMENTS_DB[mockKey];
    isMock = true;
  } else if (fileBase64) {
    documentText = "Analyzing uploaded file data...";
  } else {
    return res.status(400).json({ error: "遺꾩꽍???뚯씪 ?뺣낫媛 ?꾨씫?섏뿀?듬땲??" });
  }

  try {
    const activeRules = rules;
    const ai = getGeminiClient();

    let geminiResponseText = "";

    if (process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY" || !process.env.GEMINI_API_KEY) {
      console.log("No custom Gemini API key found, generating high-fidelity structured audit analysis from database mock patterns.");
      const textToAnalyze = documentText.toLowerCase();

      const isNameMatched = textToAnalyze.includes(student.name);
      const isCompanyMatched = textToAnalyze.includes(student.company.substring(0, 3)) || textToAnalyze.includes("?쇱꽦?꾩옄") || textToAnalyze.includes("?ㅼ삤?뚰겕") || textToAnalyze.includes("?꾨??먮룞李?);
      const hasInsurance = docType === "health_insurance_cert" && textToAnalyze.includes("吏곸옣媛?낆옄");
      const hasSme = docType === "sme_cert" && textToAnalyze.includes("以묒냼湲곗뾽");
      const tuitionMatch = docType === "tuition_receipt" ? (textToAnalyze.includes("100%") ? "PASS" : textToAnalyze.includes("45%") ? "FAIL" : "WARNING") : "PASS";
      const hoursMatch = docType === "employment_contract" ? (textToAnalyze.includes("40?쒓컙") ? "PASS" : textToAnalyze.includes("18?쒓컙") ? "FAIL" : "WARNING") : "PASS";

      const mockChecks = activeRules.map((rule) => {
        let status: "PASS" | "FAIL" | "WARNING" = "PASS";
        let valueExtracted = "?곹빀";
        let evidence = "?쒖텧???쒕쪟 ?댁슜??遺꾩꽍??寃곌낵 寃利??붽굔??異⑹”?⑸땲??";

        if (rule.category === "student_info") {
          status = isNameMatched ? "PASS" : "FAIL";
          valueExtracted = isNameMatched ? student.name : "誘몄튂/遺덉씪移?;
          evidence = isNameMatched
            ? `?쒕쪟????곸옄: ${student.name} ?뺤씤 ?꾨즺`
            : `?쒕쪟?먯꽌 ?숈깮 ?깅챸 '${student.name}'??瑜? 李얠쓣 ???녾굅??遺덉씪移섑빀?덈떎.`;
        } else if (rule.category === "company_info") {
          status = isCompanyMatched ? "PASS" : "FAIL";
          valueExtracted = isCompanyMatched ? student.company : "誘몄씪移?;
          evidence = isCompanyMatched
            ? `李몄뿬湲곗뾽: ${student.company} 踰뺤씤 ?뺤씤 ?꾨즺`
            : `??숆낵 ?묒빟??湲곗뾽紐?'${student.company}'怨??) ?쇱튂?섎뒗 紐낆묶???쒕쪟??遺?ы빀?덈떎.`;
        } else if (rule.category === "insurance" && docType === "health_insurance_cert") {
          status = hasInsurance ? "PASS" : "FAIL";
          valueExtracted = hasInsurance ? "吏곸옣媛?낆옄 (痍⑤뱷)" : "?쇰컲/吏????낆옄 ?먮뒗 誘몃퉬";
          evidence = hasInsurance
            ? `?먭꺽援щ텇: 吏곸옣媛?낆옄 | 媛?낆쿂: ${student.company}`
            : "吏곸옣??媛?낆옄媛 ?꾨땶 吏????낆옄 ?먮뒗 ?곸떎 泥섎━???대젰留?議댁옱?⑸땲??";
        } else if (rule.category === "tuition_share" && docType === "tuition_receipt") {
          status = tuitionMatch === "PASS" ? "PASS" : "FAIL";
          valueExtracted = textToAnalyze.includes("100%") ? "100% 吏?? : "45% 吏??(湲곗? 誘몃떖)";
          evidence = textToAnalyze.includes("100%")
            ? "吏???뺥깭: 湲곗뾽 遺꾨떞湲?100% (?꾩븸 吏??"
            : "湲곗뾽 吏?먯븸: 1,800,000??(珥앹븸 4,000,000???鍮?45% 吏?먯뿉 遺덇낵)";
        } else if (rule.category === "working_hours" && docType === "employment_contract") {
          status = hoursMatch === "PASS" ? "PASS" : "FAIL";
          valueExtracted = textToAnalyze.includes("40?쒓컙") ? "二?40?쒓컙 (?뺢퇋吏?" : "二?18?쒓컙 (?⑥떆媛?怨꾩빟吏?";
          evidence = textToAnalyze.includes("40?쒓컙")
            ? "洹쇰Т ?뺥깭: 二쇰떦 40?쒓컙 ?뺢퇋 洹쇰줈, 湲고븳???뺥븿???놁쓬"
            : "?뚯젙洹쇰줈?쒓컙: 二쇰떦 18?쒓컙?쇰줈 怨꾩빟?숆낵 ?꾩닔 湲곗?(二?35?쒓컙)???쒖갭 誘몃떖?⑸땲??";
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
        extractedSummary: `[?쒕??덉씠??寃利?寃곌낵] ?숈깮紐?${student.name}, 湲곗뾽紐?${student.company}??????쒖텧?쒕쪟 '${docType}' ?뺣? ?議?寃곌낵, ${overallStatus === "PASS" ? "紐⑤뱺 寃利앹쓣 臾댁궗 ?듦낵?섏??듬땲??" : "?쇰? 遺?곹빀 ??ぉ??寃異쒕릺??異붽? ?쒕쪟 蹂댁셿 ?먮뒗 愿由ъ옄 ?섎룞 ?뱀씤???꾩슂?⑸땲??"}`,
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
        text: `You are an auditing bot verifying eligibility for Korean Contract Departments (怨꾩빟?숆낵). 
The current applicant name is: "${student.name}"
Their contracted partner company is: "${student.company}"
The document type is: "${docType}" (employment_contract: ?ъ쭅/洹쇰줈怨꾩빟?? health_insurance_cert: 嫄닿컯蹂댄뿕?먭꺽?앹떎, sme_cert: 以묒냼湲곗뾽?뺤씤?? tuition_receipt: ?깅줉湲덈ℓ移???먯쬆鍮?

Validate this document based on the following rules:
${JSON.stringify(activeRules, null, 2)}

Provide a strict, professional Korean audit result according to the requested JSON response schema.`,
      };
      contentsInput = { parts: [filePart, textPart] };
    } else {
      const textPart = {
        text: `You are an auditing bot verifying eligibility for Korean Contract Departments (怨꾩빟?숆낵). 
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
    res.status(500).json({ error: "Gemini 遺꾩꽍 以??쒕쾭 ?ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.", details: error.message });
  }
});

app.post("/api/verify/override", (req, res) => {
  const { studentId, status, note } = req.body;
  if (!studentId || !status) {
    return res.status(400).json({ error: "?꾩닔 ?뺣낫媛 ?꾨씫?섏뿀?듬땲??" });
  }

  const student = students.find((s) => s.id === studentId);
  if (!student) {
    return res.status(404).json({ error: "?대떦 ?숈깮??李얠쓣 ???놁뒿?덈떎." });
  }

  student.lastVerifiedStatus = status;
  student.lastVerifiedAt = new Date().toISOString();

  const historyItem = verificationHistory.find((v) => v.studentId === studentId);
  if (historyItem) {
    historyItem.overallStatus = status;
    historyItem.extractedSummary = `[愿由ъ옄 ?섎룞 媛뺤젣 ?뱀씤] ?ъ쑀: ${note || "愿由ъ옄 ?뺤씤 ?꾨즺"}\n\n?댁쟾 遺꾩꽍 ?댁슜: ${historyItem.extractedSummary}`;
  } else {
    verificationHistory.push({
      id: `VR-M-${Date.now().toString().slice(-3)}`,
      studentId: student.id,
      studentName: student.name,
      companyName: student.company,
      department: student.department,
      overallStatus: status,
      checkedAt: student.lastVerifiedAt,
      extractedSummary: `[愿由ъ옄 ?섎룞 ?좉퇋 ?뱀씤] ?ъ쑀: ${note || "?쒕쪟 ?ㅽ봽?쇱씤 ?議??꾨즺"}`,
      checks: rules.map((r) => ({
        ruleId: r.id,
        ruleName: r.name,
        category: r.category,
        status: "PASS",
        valueExtracted: "?섎룞 ?뺤씤",
        evidence: "愿由ъ옄媛 ?ㅽ봽?쇱씤 利앸튃???듯빐 ?붽굔 ?듦낵濡?泥섎━??,
      })),
    });
  }

  res.json({ success: true, student });
});

export { app };
export { students, rules, verificationHistory };
