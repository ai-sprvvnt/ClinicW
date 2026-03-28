import { requireUser } from "@/lib/api-auth";

function sanitizeFilename(input: string | null): string {
  const baseName = typeof input === "string" ? input.trim() : "";
  const safeBaseName = baseName.length > 0 ? baseName : "reporte.csv";
  const withExtension = safeBaseName.toLowerCase().endsWith(".csv")
    ? safeBaseName
    : `${safeBaseName}.csv`;
  return withExtension.replace(/[\\/:*?"<>|]+/g, "_");
}

export async function POST(req: Request) {
  const { response } = await requireUser();
  if (response) return response;

  try {
    const formData = await req.formData();
    const content = formData.get("content");
    const filename = sanitizeFilename(formData.get("filename") as string | null);

    const csvContent =
      typeof content === "string" ? content : "";

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("export-csv error:", error);
    return new Response("Error generating CSV.", { status: 500 });
  }
}
