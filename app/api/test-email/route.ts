import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

export async function GET() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.EMAIL_FROM || "OMNEXORA <onboarding@resend.dev>";

  const hasKey = !!apiKey;

  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      debug: { hasKey, fromAddress },
      error: "RESEND_API_KEY environment variable is not set",
    });
  }

  const resend = new Resend(apiKey);

  try {
    const result = await resend.emails.send({
      from: fromAddress,
      to: "chadmspencer94@gmail.com",
      subject: "OMNEXORA test email",
      text: "If you see this, Resend is working.",
    });

    return NextResponse.json({
      ok: true,
      debug: { hasKey, fromAddress },
      result,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      ok: false,
      debug: { hasKey, fromAddress },
      error: errorMessage,
    });
  }
}
