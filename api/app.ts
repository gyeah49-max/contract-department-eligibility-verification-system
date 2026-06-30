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
    name: "??삳쭔??,
    company: "??깃쉐?袁⑹쁽",
    department: "筌△뫁苑?? 獄쏆꼶猷꾬㎗?용궗??녿궢",
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
    name: "繹먃筌ｌ쥙??,
    company: "??쇱궎??곌쾿 (????紐꾨씜)",
    department: "AI ?臾믪뒠??곕늄?紐꾩띃??꾨린??,
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
    name: "??곸겫??,
    company: "?癒?뵠燁살꼷肉??雅뚯눘????텢",
    department: "筌ｂ뫀???醫롫꺖?????룸궗??녿궢",
    email: "younghee.lee@hnl.co.kr",
    hasUploaded: false,
    documents: {},
  },
  {
    id: "STU-004",
    name: "獄쏅베???,
    company: "?袁??癒?짗筌?,
    department: "??살춳??筌뤴뫀?당뵳??싨⑤벏釉경?,
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
    name: "?醫롪퍕???源낆구 ??깊뒄 ???",
    description: "??뽱뀱 ??뺤첒??域뱀눖以??揶쎛??놁쁽 ?源낆구???④쑴鍮??녿궢 筌왖????덇문???源낆구????깊뒄??곷튊 ??몃빍??",
    required: true,
  },
  {
    id: "RULE-02",
    category: "company_info",
    name: "???꺗 疫꿸퀣毓쏙쭗???깊뒄 ???",
    description: "??뽱뀱 ??뺤첒???⑥쥙?쒍틠?甕곕벡?ㅿ쭗?놁뵠 ????녿궢 ?臾믩튋 筌ｋ떯猿???④쑴鍮??녿궢 筌〓챷肉?疫꿸퀣毓쏙쭗?껊궢 ??깊뒄??곷튊 ??몃빍??",
    required: true,
  },
  {
    id: "RULE-03",
    category: "insurance",
    name: "4?? ???띈퉪?꾨퓮 筌욊낯?ｅ첎????怨밴묶",
    description: "椰꾨떯而?퉪?꾨퓮 ?癒?뮉 ?⑥쥙?쒑퉪?꾨퓮 ?癒?봄??밸뼄 ??곷열??疫꿸퀣???곗쨮, ????筌〓챷肉ф묾怨쀫씜??'筌욊낯?ｅ첎???놁쁽'嚥??源낆쨯??뤿선 ??됰선????몃빍??",
    required: true,
  },
  {
    id: "RULE-04",
    category: "tuition_share",
    name: "?怨쀫씜筌??源낆쨯疫??봔????쑴??(50% ??곴맒)",
    description: "疫꿸퀣毓??봔????뚯젟???癒?뮉 ??뷀닊筌앹빖梨??뽮맒 疫꿸퀣毓???源낆쨯疫???뱀뿯 筌왖????쑴??????源낆쨯疫뀀뜆??50% ??곴맒??곷선????몃빍??",
    required: true,
    valueThreshold: "50%",
  },
  {
    id: "RULE-05",
    category: "working_hours",
    name: "?類?뇣 域뱀눖龜 ?遺쎄탷 (雅?35??볦퍢 ??곴맒)",
    description: "域뱀눖以덃④쑴鍮??뽮맒 雅뚯눖?????젟域뱀눖以??볦퍢??35??볦퍢 ??곴맒??흭, ?④쑴鍮??類κ묶揶쎛 '?類?뇣筌? ?癒?뮉 '疫꿸퀬釉???類λ맙????용뮉 域뱀눖以덃④쑴鍮? ??곷선????몃빍??",
    required: true,
    valueThreshold: 35,
  },
];

const verificationHistory: VerificationResult[] = [
  {
    id: "VR-001",
    studentId: "STU-001",
    studentName: "??삳쭔??,
    companyName: "??깃쉐?袁⑹쁽",
    department: "筌△뫁苑?? 獄쏆꼶猷꾬㎗?용궗??녿궢",
    overallStatus: "PASS",
    checkedAt: "2026-06-28T14:30:00-07:00",
    extractedSummary: "??뽱뀱??'??彛낉쭩?몄구??, '椰꾨떯而?퉪?꾨퓮 ?癒?봄??밸뼄?類ㅼ뵥??, '?源낆쨯疫?筌왖????뚯젟?? 筌뤴뫀紐??怨밸???몃빍?? ??삳쭔????덇문?? ??깃쉐?袁⑹쁽 ???꺗 筌욊낯???揶쎛??놁쁽揶쎛 筌띿쉸?앾쭖? ?源낆쨯疫??癒곕립 疫꿸퀣毓?癒?퐣 50% 筌왖?癒곕릭????곸뒠???類ㅼ뵥??뤿???щ빍??",
    checks: [
      {
        ruleId: "RULE-01",
        ruleName: "?醫롪퍕???源낆구 ??깊뒄 ???",
        category: "student_info",
        status: "PASS",
        valueExtracted: "??삳쭔??,
        evidence: "?源낆구: ??삳쭔??(雅뚯눖??源낆쨯甕곕뜇?? 950101-*******)",
      },
      {
        ruleId: "RULE-02",
        ruleName: "???꺗 疫꿸퀣毓쏙쭗???깊뒄 ???",
        category: "company_info",
        status: "PASS",
        valueExtracted: "??깃쉐?袁⑹쁽(雅?",
        evidence: "??毓??筌뤿굞臾? ??깃쉐?袁⑹쁽 雅뚯눘????텢, ??毓?癒?쓰?? 124-81-*****",
      },
      {
        ruleId: "RULE-03",
        ruleName: "4?? ???띈퉪?꾨퓮 筌욊낯?ｅ첎????怨밴묶",
        category: "insurance",
        status: "PASS",
        valueExtracted: "椰꾨떯而?퉪?꾨퓮 筌욊낯?ｅ첎???(?띯뫀諭?",
        evidence: "椰꾨떯而?퉪?꾨퓮 筌욊낯?ｅ첎???놁쁽 ?癒?봄 ?띯뫀諭?? 2023.01.15, ??깃쉐?袁⑹쁽(雅?",
      },
      {
        ruleId: "RULE-04",
        ruleName: "?怨쀫씜筌??源낆쨯疫??봔????쑴??(50% ??곴맒)",
        category: "tuition_share",
        status: "PASS",
        valueExtracted: "疫꿸퀣毓??봔??100% (?袁⑹읈筌왖??",
        evidence: "?源낆쨯疫???? ??뚯젟: ??깃쉐?袁⑹쁽 ?紐꾩삺揶쏆뮆而???袁⑸만 筌왖??(100%)",
      },
      {
        ruleId: "RULE-05",
        ruleName: "?類?뇣 域뱀눖龜 ?遺쎄탷 (雅?35??볦퍢 ??곴맒)",
        category: "working_hours",
        status: "PASS",
        valueExtracted: "雅?40??볦퍢 (?類?뇣筌?",
        evidence: "???젟域뱀눖以??볦퍢: 雅?40??볦퍢, ?④쑴鍮?類κ묶: 疫꿸퀬釉????용뮉 ?類?뇣 域뱀눖以덃④쑴鍮?,
      },
    ],
  },
  {
    id: "VR-002",
    studentId: "STU-002",
    studentName: "繹먃筌ｌ쥙??,
    companyName: "??쇱궎??곌쾿 (????紐꾨씜)",
    department: "AI ?臾믪뒠??곕늄?紐꾩띃??꾨린??,
    overallStatus: "MANUAL_REVIEW",
    checkedAt: "2026-06-28T16:45:00-07:00",
    extractedSummary: "繹먃筌ｌ쥙????덇문??餓λ쵐?쇗묾怨쀫씜?類ㅼ뵥??뽮맒 疫꿸퀣毓?域뱀뮆?덂첎? '???┛????곗쨮 ?醫륁뒞 疫꿸퀗而???곷퓠 ??됱벉????놁쵄??뤿???щ빍?? ??살춸, ?源낆쨯疫???곴퍥 ?類ㅼ뵥筌앹빘肉??疫꿸퀣毓??봔??履??45%嚥?疫꿸퀣???뤿선 疫꿸퀣???50%??沃섎챶???몃빍?? (?? 疫꿸퀣毓??????諭??臾믩튋 ?곕떽? 筌앹빖?????뽱뀱 ?遺얠?)",
    checks: [
      {
        ruleId: "RULE-01",
        ruleName: "?醫롪퍕???源낆구 ??깊뒄 ???",
        category: "student_info",
        status: "PASS",
        valueExtracted: "繹먃筌ｌ쥙??,
        evidence: "?源낆구: 繹먃筌ｌ쥙?? ??쇱궎??곌쾿 ???꺗 ?怨뚮럡??,
      },
      {
        ruleId: "RULE-02",
        ruleName: "???꺗 疫꿸퀣毓쏙쭗???깊뒄 ???",
        category: "company_info",
        status: "PASS",
        valueExtracted: "(雅???쇱궎??곌쾿",
        evidence: "???텢筌? 雅뚯눘????텢 ??쇱궎??곌쾿 (??毓?癒?쾻嚥≪빖苡?? 220-81-*****)",
      },
      {
        ruleId: "RULE-03",
        ruleName: "4?? ???띈퉪?꾨퓮 筌욊낯?ｅ첎????怨밴묶",
        category: "insurance",
        status: "PASS",
        valueExtracted: "?⑥쥙?쒑퉪?꾨퓮 筌욊낯?ｅ첎???(?띯뫀諭?",
        evidence: "?⑥쥙?쒑퉪?꾨퓮 ??곕궖??륁쁽野??띯뫀諭???곷열: (雅???쇱궎??곌쾿, ?띯뫀諭??2024.11.01",
      },
      {
        ruleId: "RULE-04",
        ruleName: "?怨쀫씜筌??源낆쨯疫??봔????쑴??(50% ??곴맒)",
        category: "tuition_share",
        status: "FAIL",
        valueExtracted: "疫꿸퀣毓??봔??45% (揶쏆뮇???봔??55%)",
        evidence: "?源낆쨯疫???? ??쑴?? ???텢 筌왖?癒?닊 1,800,000??(???源낆쨯疫?4,000,000?癒?벥 45%)",
      },
      {
        ruleId: "RULE-05",
        ruleName: "?類?뇣 域뱀눖龜 ?遺쎄탷 (雅?35??볦퍢 ??곴맒)",
        category: "working_hours",
        status: "PASS",
        valueExtracted: "雅?38??볦퍢 (?類?뇣筌?",
        evidence: "???젟域뱀눖以??볦퍢: 雅?5??38??볦퍢, 疫꿸퀬釉????용뮉 ?類?뇣筌?域뱀눖以덃④쑴鍮?,
      },
    ],
  },
  {
    id: "VR-004",
    studentId: "STU-004",
    studentName: "獄쏅베???,
    companyName: "?袁??癒?짗筌?,
    department: "??살춳??筌뤴뫀?당뵳??싨⑤벏釉경?,
    overallStatus: "FAIL",
    checkedAt: "2026-06-28T11:15:00-07:00",
    extractedSummary: "獄쏅베?????덇문????뽱뀱??'域뱀눖以덃④쑴鍮???????젟 域뱀눖以??볦퍢??雅뚯눖??20??볦퍢(??λ뻻揶???곕뱜??????곗쨮 筌뤿굞???뤿선, ?④쑴鍮??녿궢???袁⑸땾 ?遺쎄탷??雅?35??볦퍢 ??곴맒 ?類?뇣 域뱀눖龜 鈺곌퀗援???겸뫗???? 筌륁궢鍮??덈뼄. ?癒곕립 4?? ???띈퉪?꾨퓮 揶쎛????뺤첒?? ?源낆쨯疫?筌왖??筌앹빖???? ??낆쨮??뺣┷筌왖 ??녿릭??щ빍??",
    checks: [
      {
        ruleId: "RULE-01",
        ruleName: "?醫롪퍕???源낆구 ??깊뒄 ???",
        category: "student_info",
        status: "PASS",
        valueExtracted: "獄쏅베???,
        evidence: "域뱀눖以덃④쑴鍮?? 獄쏅베???,
      },
      {
        ruleId: "RULE-02",
        ruleName: "???꺗 疫꿸퀣毓쏙쭗???깊뒄 ???",
        category: "company_info",
        status: "PASS",
        valueExtracted: "?袁??癒?짗筌?雅?",
        evidence: "???쒍틠? ?袁??癒?짗筌?雅뚯눘????텢",
      },
      {
        ruleId: "RULE-03",
        ruleName: "4?? ???띈퉪?꾨퓮 筌욊낯?ｅ첎????怨밴묶",
        category: "insurance",
        status: "FAIL",
        valueExtracted: "??뺤첒 沃섎챶??(?類ㅼ뵥 ?븍뜃?)",
        evidence: "椰꾨떯而?퉪?꾨퓮 ?癒?봄??밸뼄?類ㅼ뵥??? ??뽱뀱??? ??녿릭??щ빍??",
      },
      {
        ruleId: "RULE-04",
        ruleName: "?怨쀫씜筌??源낆쨯疫??봔????쑴??(50% ??곴맒)",
        category: "tuition_share",
        status: "FAIL",
        valueExtracted: "??뺤첒 沃섎챶??(?類ㅼ뵥 ?븍뜃?)",
        evidence: "?源낆쨯疫?筌왖????쑴???筌앹빖梨??????덈뮉 ??뺤첒揶쎛 ?袁⑥뵭??뤿???щ빍??",
      },
      {
        ruleId: "RULE-05",
        ruleName: "?類?뇣 域뱀눖龜 ?遺쎄탷 (雅?35??볦퍢 ??곴맒)",
        category: "working_hours",
        status: "FAIL",
        valueExtracted: "雅?20??볦퍢 (??λ뻻揶?域뱀눖以??",
        evidence: "???젟域뱀눖以??볦퍢: 雅뚯눖??20??볦퍢, ?類κ묶: ??λ뻻揶???볦퍢??域뱀눖以??④쑴鍮?,
      },
    ],
  },
];

const MOCK_DOCUMENTS_DB: Record<string, string> = {
  employment_contract_pass: `
==== 域뱀눖以덃④쑴鍮??====
1. 域뱀눖以덃④쑴鍮??諭沅??   - ??毓썰틠? ??깃쉐?袁⑹쁽 雅뚯눘????텢 (????뽰뵠??野껋럡???
   - 域뱀눖以?? ??삳쭔??(雅뚯눖??源낆쨯甕곕뜇?? 950101-1******)
2. 域뱀눖以?鈺곌퀗援?獄?域뱀눖龜 ?類κ묶
   - ?④쑴鍮??類κ묶: 疫꿸퀬釉???類λ맙????용뮉 域뱀눖以덃④쑴鍮?(?類?뇣筌?
   - 域뱀눖龜筌왖: ??깃쉐?袁⑹쁽 ??꿸문筌?쥚???獄쏆꼶猷꾬㎗?곴문?怨뺣궚?봔
   - ???젟域뱀눖以??볦퍢: 09:00 ~ 18:00 (雅?5?? 雅?40??볦퍢 域뱀눖龜, ??우쓺??볦퍢 1??볦퍢 ??뽰뇚)
3. ?④쑴鍮???깆쁽: 2023??1??10??   ?怨대┛ ?諭沅?癒?뮉 ?袁? 揶쏆늿???類ㅻ뻼 域뱀눖以덃④쑴鍮??筌ｋ떯猿??랁??醫롮벥?源녿뼄???怨뺤뵬 域뱀눖以??롊®몴???꾨뻬??野껉퍔???類ㅻ튋??
  `,
  health_insurance_pass: `
==== 椰꾨떯而?퉪?꾨퓮 ?癒?봄??밸뼄?類ㅼ뵥??====
???椰꾨떯而?퉪?꾨퓮?⑤벉??獄쏆뮉六?(?類ㅼ뵥??甕곕뜇?? 2026-NHI-984210)
?醫롪퍕???紐꾩읅??鍮?
   - ?源낆구: ??삳쭔??   - 雅뚯눖??源낆쨯甕곕뜇?? 950101-1******
?癒?봄??밸뼄 ??곷열 (?袁⑷퍥 ????:
   - ??뺤쓰 1 | ??毓??筌뤿굞臾? ??깃쉐?袁⑹쁽(雅? | ?癒?봄?닌됲뀋: 筌욊낯?ｅ첎???놁쁽 | ?띯뫀諭?? 2023.01.15 | ?怨몃뼄?? -
   - ??뺤쓰 2 | ??毓??筌뤿굞臾? ?⑤벀?붹뤃癒?몓??議딃겫? | ?癒?봄?닌됲뀋: 筌욊낯?ｅ첎???놁쁽 | ?띯뫀諭?? 2016.03.01 | ?怨몃뼄?? 2018.05.31
癰??類ㅼ뵥??뺣뮉 ???椰꾨떯而?퉪?꾨퓮甕?域뱀뮇?????묐퉸 ?袁? 揶쏆늿???癒?봄??밸뼄 ??곷열??????袁⑹뱽 筌앹빖梨??
  `,
  tuition_receipt_pass: `
==== ?源낆쨯疫?筌왖????뚯젟??====
?????④쑴鍮??녿궢 ?源낆쨯疫??怨쀫씜筌??브쑬????뚯젟??1. ??덇문 ?類ｋ궖
   - ?源낆구: ??삳쭔??   - ???꺗 ??녿궢: 筌△뫁苑?? 獄쏆꼶猷꾬㎗?용궗??녿궢 (??밴텢?⑥눘??
2. ?怨쀫씜筌??類ｋ궖
   - 疫꿸퀣毓쏙쭗? ??깃쉐?袁⑹쁽 雅뚯눘????텢
   - ?????봔?? ?紐꾩삺揶쏆뮆而삼㎗??대Ŋ???곸겫域밸챶竊?
3. ?源낆쨯疫??브쑬???類ㅻ튋
   - ???源낆쨯疫?(??녿┛??: 6,000,000??   - ?怨쀫씜筌??봔??욱닊: 6,000,000??(???源낆쨯疫뀀뜆??100% 筌왖??
   - 域뱀눖以???癒???욱닊: 0??(?癒?????곸벉)
??깃쉐?袁⑹쁽???????紐꾩삺揶쎛 ???????젟???대Ŋ?곫⑥눘????袁⑸땾??????덈즲嚥??源낆쨯疫??袁⑸만????? 疫꿸퀬釉???곷퓠 ????놃꺍 筌왖???④쑴伊뽪에???껎닊??野껉퍔????뚯젟??몃빍??
  `,
  sme_cert_pass: `
==== 餓λ쵐?쇗묾怨쀫씜?類ㅼ뵥??====
餓λ쵐?쇠린?쇱퓗疫꿸퀣毓썽겫? 獄쏆뮉六?(獄쏆뮉六얕린?딆깈: 2025-SME-128471)
1. 疫꿸퀣毓??類ｋ궖
   - 疫꿸퀣毓쏙쭗? 雅뚯눘????텢 ??쇱궎??곌쾿
   - ????뽰쁽: 繹먃?袁⑥カ
   - 甕곕벡??源낆쨯甕곕뜇?? 110111-*******
   - 癰귣챷沅?雅뚯눘?? ??뽰뒻?諛명??筌띾뜇猷룡뤃?獄쏄퉭苡얏에?31疫?10, ??뽰뒻筌≪럩毓??덊닏 4筌?2. 疫꿸퀣毓??닌됲뀋 獄??醫륁뒞疫꿸퀗而?
   - 疫꿸퀣毓??닌됲뀋: ???┛??(餓λ쵐?쇗묾怨쀫씜疫꿸퀡??린???鈺곌퀣肉??怨뺚뀲 餓λ쵐?쇗묾怨쀫씜)
   - ?怨몄뒠 ?醫륁뒞疫꿸퀗而? 2025??4??1??~ 2026??3??31????疫꿸퀣毓?? 餓λ쵐?쇗묾怨쀫씜疫꿸퀡??린???鈺곌퀣肉??怨뺚뀲 餓λ쵐?쇗묾怨쀫씜?袁⑹뱽 ?類ㅼ뵥??몃빍??
  `,
  tuition_receipt_fail: `
==== ?源낆쨯疫???곴퍥 ?類ㅼ뵥筌?====
??뷀닊???? ?醫뤿립????(??곴퍥野껉퀗?? ?袁⑥┷)
1. ??곴퍥 ?紐? ?類ｋ궖
   - ??뷀닊?? (雅???쇱궎??곌쾿 (??毓?癒?쓰?? 220-81-*****)
   - ??뤿옱?? ??볥럢????놃꺍 ????덉뜚 ?怨좊린?臾먯젾??   - ??뷀닊 疫뀀뜆釉? 1,800,000??2. ???怨몄쁽 ?類ｋ궖
   - ??뉖린?? 繹먃筌ｌ쥙??(AI ?臾믪뒠??곕늄?紐꾩띃??꾨린??
   - ??쑨?? 2026??뉖??1??녿┛ ?源낆쨯疫?筌띲끉臾?(疫꿸퀣毓??브쑬?욄묾?45% 筌왖???怨몄뒠椰? ???源낆쨯疫?4,000,000??????筌왖??
??????곴퍥 ??곷열?? 疫뀀뜆?뽩쳞怨뺤삋 甕곕벡???類ㅼ뵥 ??ㅼ젾??揶쎛筌왖????뷀닊 ?類ㅼ뵥 ?얜챷苑??낅빍??
  `,
  employment_contract_fail: `
==== 域뱀눖以덃④쑴鍮??(??볦퍢????곕뱜???? ====
1. ?④쑴鍮??④쑴鍮??   - ????? ?袁??癒?짗筌?雅뚯눘????텢 (????뽰뵠???關???
   - 域뱀눖以?? 獄쏅베???(980415-*******)
2. ??끦???곸뒠 獄?域뱀눖龜 ?遺쎄탷
   - ?봔?? ?紐꾧텦?⑤벊??筌△뫀?얍칰?????癒?뺘
   - 筌욊낫??獄?筌욊낯伊? ??볦퍢????곕뱜????筌왖??域뱀눖以??(疫꿸퀗而???④쑴鍮잞쭪?
   - ???젟域뱀눖以??볦퍢: 雅?3??域뱀눖龜 (?? ?? 疫?, ??롳펷 6??볦퍢, 雅뚯눖???????젟域뱀눖以??볦퍢 18??볦퍢
   - 域뱀눖龜 疫꿸퀗而? 2026??3??1??~ 2026??8??31??(6揶쏆뮇????ｋ┛ ?④쑴鍮?
??鈺곌퀗援???뤿퓠 ???諭沅?癒?뮉 ?怨뱀깈 域뱀눖以??롊?筌ｋ떯猿????뱀벥??
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
    return res.status(400).json({ error: "筌뤴뫀諭????????낆젾??곷튊 ??몃빍??" });
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
    return res.status(400).json({ error: "??而?몴?? ??? ?臾믩뻼??낅빍??" });
  }
  rules.length = 0;
  rules.push(...updatedRules);
  return res.json({ message: "野꺜筌??遺쎄탷 域뱀뮇????源껊궗?怨몄몵嚥???낅쑓??꾨뱜??뤿???щ빍??" });
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
    return res.status(400).json({ error: "??덇문 ID?? ??뺤첒 ?醫륁굨?? ?袁⑸땾??낅빍??" });
  }

  const student = students.find((s) => s.id === studentId);
  if (!student) {
    return res.status(404).json({ error: "??????덇문??筌≪뼚??????곷뮸??덈뼄." });
  }

  let documentText = "";
  let isMock = false;

  if (mockKey && MOCK_DOCUMENTS_DB[mockKey]) {
    documentText = MOCK_DOCUMENTS_DB[mockKey];
    isMock = true;
  } else if (fileBase64) {
    documentText = "Analyzing uploaded file data...";
  } else {
    return res.status(400).json({ error: "?브쑴苑?????뵬 ?類ｋ궖揶쎛 ?袁⑥뵭??뤿???щ빍??" });
  }

  try {
    const activeRules = rules;
    const ai = getGeminiClient();

    let geminiResponseText = "";

    if (process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY" || !process.env.GEMINI_API_KEY) {
      console.log("No custom Gemini API key found, generating high-fidelity structured audit analysis from database mock patterns.");
      const textToAnalyze = documentText.toLowerCase();

      const isNameMatched = textToAnalyze.includes(student.name);
      const isCompanyMatched = textToAnalyze.includes(student.company.substring(0, 3)) || textToAnalyze.includes("??깃쉐?袁⑹쁽") || textToAnalyze.includes("??쇱궎??곌쾿") || textToAnalyze.includes("?袁??癒?짗筌?);
      const hasInsurance = docType === "health_insurance_cert" && textToAnalyze.includes("筌욊낯?ｅ첎???놁쁽");
      const hasSme = docType === "sme_cert" && textToAnalyze.includes("餓λ쵐?쇗묾怨쀫씜");
      const tuitionMatch = docType === "tuition_receipt" ? (textToAnalyze.includes("100%") ? "PASS" : textToAnalyze.includes("45%") ? "FAIL" : "WARNING") : "PASS";
      const hoursMatch = docType === "employment_contract" ? (textToAnalyze.includes("40??볦퍢") ? "PASS" : textToAnalyze.includes("18??볦퍢") ? "FAIL" : "WARNING") : "PASS";

      const mockChecks = activeRules.map((rule) => {
        let status: "PASS" | "FAIL" | "WARNING" = "PASS";
        let valueExtracted = "?怨밸?";
        let evidence = "??뽱뀱????뺤첒 ??곸뒠???브쑴苑??野껉퀗??野꺜筌??遺쎄탷???겸뫗???몃빍??";

        if (rule.category === "student_info") {
          status = isNameMatched ? "PASS" : "FAIL";
          valueExtracted = isNameMatched ? student.name : "沃섎챷???븍뜆?ょ㎉?;
          evidence = isNameMatched
            ? `??뺤첒?????怨몄쁽: ${student.name} ?類ㅼ뵥 ?袁⑥┷`
            : `??뺤첒?癒?퐣 ??덇문 ?源낆구 '${student.name}'???? 筌≪뼚??????얘탢???븍뜆?ょ㎉?묐???덈뼄.`;
        } else if (rule.category === "company_info") {
          status = isCompanyMatched ? "PASS" : "FAIL";
          valueExtracted = isCompanyMatched ? student.company : "沃섎챷?ょ㎉?;
          evidence = isCompanyMatched
            ? `筌〓챷肉ф묾怨쀫씜: ${student.company} 甕곕벡???類ㅼ뵥 ?袁⑥┷`
            : `????녿궢 ?臾믩튋??疫꿸퀣毓쏙쭗?'${student.company}'????) ??깊뒄??롫뮉 筌뤿굞臾????뺤첒???봔??鍮??덈뼄.`;
        } else if (rule.category === "insurance" && docType === "health_insurance_cert") {
          status = hasInsurance ? "PASS" : "FAIL";
          valueExtracted = hasInsurance ? "筌욊낯?ｅ첎???놁쁽 (?띯뫀諭?" : "??곗뺘/筌왖?????놁쁽 ?癒?뮉 沃섎챶??;
          evidence = hasInsurance
            ? `?癒?봄?닌됲뀋: 筌욊낯?ｅ첎???놁쁽 | 揶쎛??놁퓗: ${student.company}`
            : "筌욊낯???揶쎛??놁쁽揶쎛 ?袁⑤빒 筌왖?????놁쁽 ?癒?뮉 ?怨몃뼄 筌ｌ꼶??????곤쭕?鈺곕똻???몃빍??";
        } else if (rule.category === "tuition_share" && docType === "tuition_receipt") {
          status = tuitionMatch === "PASS" ? "PASS" : "FAIL";
          valueExtracted = textToAnalyze.includes("100%") ? "100% 筌왖?? : "45% 筌왖??(疫꿸퀣? 沃섎챶??";
          evidence = textToAnalyze.includes("100%")
            ? "筌왖???類κ묶: 疫꿸퀣毓??브쑬?욄묾?100% (?袁⑸만 筌왖??"
            : "疫꿸퀣毓?筌왖?癒?만: 1,800,000??(?μ빘釉?4,000,000??????45% 筌왖?癒?퓠 ?븍뜃??";
        } else if (rule.category === "working_hours" && docType === "employment_contract") {
          status = hoursMatch === "PASS" ? "PASS" : "FAIL";
          valueExtracted = textToAnalyze.includes("40??볦퍢") ? "雅?40??볦퍢 (?類?뇣筌?" : "雅?18??볦퍢 (??λ뻻揶??④쑴鍮잞쭪?";
          evidence = textToAnalyze.includes("40??볦퍢")
            ? "域뱀눖龜 ?類κ묶: 雅뚯눖??40??볦퍢 ?類?뇣 域뱀눖以? 疫꿸퀬釉???類λ맙????곸벉"
            : "???젟域뱀눖以??볦퍢: 雅뚯눖??18??볦퍢??곗쨮 ?④쑴鍮??녿궢 ?袁⑸땾 疫꿸퀣?(雅?35??볦퍢)????뽮강 沃섎챶???몃빍??";
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
        extractedSummary: `[?????됱뵠??野꺜筌?野껉퀗?? ??덇문筌?${student.name}, 疫꿸퀣毓쏙쭗?${student.company}????????뽱뀱??뺤첒 '${docType}' ?類? ??鈺?野껉퀗?? ${overallStatus === "PASS" ? "筌뤴뫀諭?野꺜筌앹빘???얜똻沅????궢?????щ빍??" : "??? ?봔?怨밸? ?????野꺜?곗뮆由???곕떽? ??뺤첒 癰귣똻???癒?뮉 ?온?귐딆쁽 ??롫짗 ?諭????袁⑹뒄??몃빍??"}`,
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
        text: `You are an auditing bot verifying eligibility for Korean Contract Departments (?④쑴鍮??녿궢). 
The current applicant name is: "${student.name}"
Their contracted partner company is: "${student.company}"
The document type is: "${docType}" (employment_contract: ??彛?域뱀눖以덃④쑴鍮?? health_insurance_cert: 椰꾨떯而?퉪?꾨퓮?癒?봄??밸뼄, sme_cert: 餓λ쵐?쇗묾怨쀫씜?類ㅼ뵥?? tuition_receipt: ?源낆쨯疫뀀뜄?볡㎉???癒?쵄??

Validate this document based on the following rules:
${JSON.stringify(activeRules, null, 2)}

Provide a strict, professional Korean audit result according to the requested JSON response schema.`,
      };
      contentsInput = { parts: [filePart, textPart] };
    } else {
      const textPart = {
        text: `You are an auditing bot verifying eligibility for Korean Contract Departments (?④쑴鍮??녿궢). 
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
    res.status(500).json({ error: "Gemini ?브쑴苑?餓???뺤쒔 ??살첒揶쎛 獄쏆뮇源??됰뮸??덈뼄.", details: error.message });
  }
});

app.post("/api/verify/override", (req, res) => {
  const { studentId, status, note } = req.body;
  if (!studentId || !status) {
    return res.status(400).json({ error: "?袁⑸땾 ?類ｋ궖揶쎛 ?袁⑥뵭??뤿???щ빍??" });
  }

  const student = students.find((s) => s.id === studentId);
  if (!student) {
    return res.status(404).json({ error: "??????덇문??筌≪뼚??????곷뮸??덈뼄." });
  }

  student.lastVerifiedStatus = status;
  student.lastVerifiedAt = new Date().toISOString();

  const historyItem = verificationHistory.find((v) => v.studentId === studentId);
  if (historyItem) {
    historyItem.overallStatus = status;
    historyItem.extractedSummary = `[?온?귐딆쁽 ??롫짗 揶쏅벡???諭?? ???: ${note || "?온?귐딆쁽 ?類ㅼ뵥 ?袁⑥┷"}\n\n??곸읈 ?브쑴苑???곸뒠: ${historyItem.extractedSummary}`;
  } else {
    verificationHistory.push({
      id: `VR-M-${Date.now().toString().slice(-3)}`,
      studentId: student.id,
      studentName: student.name,
      companyName: student.company,
      department: student.department,
      overallStatus: status,
      checkedAt: student.lastVerifiedAt,
      extractedSummary: `[?온?귐딆쁽 ??롫짗 ?醫됲뇣 ?諭?? ???: ${note || "??뺤첒 ??쎈늄??깆뵥 ??鈺??袁⑥┷"}`,
      checks: rules.map((r) => ({
        ruleId: r.id,
        ruleName: r.name,
        category: r.category,
        status: "PASS",
        valueExtracted: "??롫짗 ?類ㅼ뵥",
        evidence: "?온?귐딆쁽揶쎛 ??쎈늄??깆뵥 筌앹빖??????퉸 ?遺쎄탷 ???궢嚥?筌ｌ꼶???,
      })),
    });
  }

  res.json({ success: true, student });
});

export { app };
export { students, rules, verificationHistory };
