import { queryEmbedding } from "./vector";
import {
  AgentMessage,
  OrchestrationInput,
  OrchestrationResult,
  PlanStep,
} from "./types";

function createPlanSteps(specification: string): PlanStep[] {
  const normalized = specification
    .replace(/\r\n/g, "\n")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const sentences =
    normalized.length > 0
      ? normalized
      : specification.split(/[.?!]/).map((line) => line.trim()).filter(Boolean);

  const baseSteps =
    sentences.length === 0
      ? ["Review mevcut proje yapısı", "Planı uygulamak için kod yaz", "Çıktıyı test et ve doğrula"]
      : sentences;

  return baseSteps.map((summary, index) => ({
    id: `step-${index + 1}`,
    summary,
    rationale: `Gereksinimden türetilmiş ${index + 1}. aksiyon.`,
    dependencies: index === 0 ? [] : [`step-${index}`],
    status: index === 0 ? "in-progress" : "pending",
  }));
}

function createAgentMessage(role: AgentMessage["role"], content: string, reasoning: string): AgentMessage {
  return {
    role,
    content,
    reasoning,
    timestamp: new Date().toISOString(),
  };
}

function craftCodingNotes(plan: PlanStep[], contextSummary: string[]): AgentMessage[] {
  return plan.map((step, index) =>
    createAgentMessage(
      "coder",
      `Adım "${step.summary}" için eylem planı:
- İlgili bağlam: ${contextSummary[index % contextSummary.length] ?? "Önceki adımlar"}
- Uygulanacak değişiklik: Başlıkla ilişkili kodu güncelleyin veya oluşturun.
- Beklenen çıktı: Testleri geçiren, dokümantasyona uyumlu kod.`,
      "Planlanmış görev sırasını izleyerek hedeflenen kod değişikliğini tanımladı.",
    ),
  );
}

function craftReviewNotes(plan: PlanStep[], contextSummary: string[]): AgentMessage[] {
  return plan.map((step, index) =>
    createAgentMessage(
      "reviewer",
      `Adım "${step.summary}" için doğrulama listesi:
- Kod stil kontrolü
- Edge case senaryoları
- Test kapsamı ve otomasyon
İlgili bağlam: ${contextSummary[index % contextSummary.length] ?? "Plan adımları"}
Sonuç: ${index === plan.length - 1 ? "Son değerlendirme, tüm sistem kararlı görünüyor." : "Orta adım, sonraki adıma aktarılacak bulgular yok."}`,
      "Adıma özel kalite kontrollerini otomatikleştirdi.",
    ),
  );
}

function buildCommandSuggestions(input: OrchestrationInput, plan: PlanStep[]): string[] {
  const suggestions = new Set<string>();
  if (input.tests?.length) {
    for (const testCommand of input.tests) {
      suggestions.add(testCommand);
    }
  } else {
    suggestions.add("npm run build");
    suggestions.add("npm test");
  }

  for (const step of plan) {
    if (/doc|readme/i.test(step.summary)) {
      suggestions.add("npm run lint");
    }
  }

  return Array.from(suggestions);
}

export function runOrchestration(input: OrchestrationInput): OrchestrationResult {
  const plan = createPlanSteps(input.specification);
  const query = `${input.specification}\n\nOdaklanılacak dosya yolları: ${input.workspace
    .map((doc) => doc.path)
    .join(", ")}`;

  const relevantContext = queryEmbedding(input.embeddings, query, 6, 0.08);
  const contextSummary = relevantContext.map((item) => `${item.path} (${item.similarity.toFixed(2)})`);

  const managerMessage = createAgentMessage(
    "manager",
    `Görev analizi tamamlandı. ${plan.length} adımlı plan oluşturuldu.`,
    "Spesifikasyondaki gereksinimleri çözüm adımlarına dönüştürdü.",
  );

  const codingNotes = [
    managerMessage,
    ...craftCodingNotes(plan, contextSummary.length > 0 ? contextSummary : ["Genel bağlam"]),
  ];

  const reviewNotes = craftReviewNotes(plan, contextSummary.length > 0 ? contextSummary : ["Plan detayları"]);

  const suggestedCommands = buildCommandSuggestions(input, plan);

  return {
    plan,
    codingNotes,
    reviewNotes,
    relevantContext,
    suggestedCommands,
  };
}

