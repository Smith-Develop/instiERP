import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@insti/database";

export async function getActiveProvider(schoolId?: string) {
  // If schoolId provided, use that institution's config
  if (schoolId) {
    const config = await db.ai_configurations.findUnique({
      where: { school_id: schoolId },
      include: { provider: true },
    });
    if (config?.provider?.is_active && config.provider.api_key) {
      return { config, provider: config.provider };
    }
  }

  // Fallback: use default provider
  const defaultProvider = await db.ai_providers.findFirst({
    where: { is_default: true, is_active: true },
  });
  if (defaultProvider) {
    const config = schoolId
      ? await db.ai_configurations.findUnique({ where: { school_id: schoolId } })
      : null;
    return { config, provider: defaultProvider };
  }

  // Last resort: any active provider
  const anyProvider = await db.ai_providers.findFirst({ where: { is_active: true } });
  if (anyProvider) return { config: null, provider: anyProvider };

  throw new Error("No active AI provider configured");
}

export async function generateWithGemini(
  provider: { api_key: string; models: unknown },
  model: string,
  systemPrompt: string | null,
  userPrompt: string,
): Promise<{ text: string; tokensUsed: number }> {
  const genAI = new GoogleGenerativeAI(provider.api_key);
  const genModel = genAI.getGenerativeModel({ model: model || "gemini-2.0-flash" });

  const parts: { text: string }[] = [];
  if (systemPrompt) parts.push({ text: systemPrompt });
  parts.push({ text: userPrompt });

  const result = await genModel.generateContent(parts);
  const response = await result.response;
  const text = response.text();
  const tokensUsed = response.usageMetadata?.totalTokenCount ?? 0;

  return { text, tokensUsed };
}

const PREDICTION_CACHE_HOURS = 24; // Cache predictions for 24 hours

export async function getCachedPrediction(schoolId: string, entityType: string, entityId: string) {
  const cutoff = new Date(Date.now() - PREDICTION_CACHE_HOURS * 3600000);
  return db.ai_logs.findFirst({
    where: {
      school_id: schoolId,
      entity_type: entityType,
      entity_id: entityId,
      feature: "prediction",
      created_at: { gte: cutoff },
    },
    orderBy: { created_at: "desc" },
  });
}
