import { TemplateDetail } from "@/components/template-detail";

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TemplateDetail id={id} />;
}
