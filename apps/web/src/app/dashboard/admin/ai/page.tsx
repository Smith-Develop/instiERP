import { db } from "@insti/database";
import { AdminAIView } from "@/modules/ai/admin-ai-view";

export default async function AdminAIPage() {
  const [providers, schools] = await Promise.all([
    db.ai_providers.findMany({ orderBy: { name: "asc" } }),
    db.schools.findMany({ where: { deleted_at: null }, select: { id: true, name: true } }),
  ]);

  const configs = await db.ai_configurations.findMany({
    include: { provider: { select: { name: true } } },
  });

  const configMap = new Map(configs.map(c => [c.school_id, c]));

  return <AdminAIView providers={providers} schools={schools.map(s => ({ ...s, config: configMap.get(s.id) ?? null }))} />;
}
