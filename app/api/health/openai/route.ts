import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function GET() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "OPENAI_API_KEY is missing on server runtime" },
        { status: 500 }
      );
    }

    const client = new OpenAI({ apiKey });
    await client.models.list();

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const message = err?.message ?? "Unknown error";
    const status = err?.status ?? 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
