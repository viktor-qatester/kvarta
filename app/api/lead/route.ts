import { createLeadPool } from "@/lib/db";
import { createLeadInTransaction } from "@/lib/lead-service";
import { validateLeadInput } from "@/lib/lead-validation";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "validation", fieldErrors: { name: "Некорректный JSON" } },
      { status: 400 },
    );
  }

  const parsed = validateLeadInput(body);
  if (!parsed.ok) {
    return Response.json(
      { error: "validation", fieldErrors: parsed.fieldErrors },
      { status: 400 },
    );
  }

  const pool = createLeadPool();
  const client = await pool.connect();
  try {
    const result = await createLeadInTransaction(client, parsed.data, "public");
    if (result.status === "duplicate") {
      return Response.json(
        {
          error: "duplicate",
          message:
            "Заявка с этим номером уже принята недавно. Повторите позже или позвоните в обжарку.",
        },
        { status: 409 },
      );
    }
    return Response.json({ ok: true, id: result.leadId }, { status: 201 });
  } catch {
    return Response.json(
      { error: "server", message: "Не удалось сохранить заявку. Попробуйте ещё раз." },
      { status: 500 },
    );
  } finally {
    client.release();
    await pool.end();
  }
}
