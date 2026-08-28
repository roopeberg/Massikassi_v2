import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-errors";
import { sendMail } from "@/lib/mail";
import { clientIp, rateLimit, tooManyRequestsResponse } from "@/lib/rate-limit";
import { attachRecoveryEmail } from "@/lib/recovery-repo";
import { recoveryEmailSchema } from "@/lib/validation";

// This endpoint sends email, so it's rate-limited more strictly than a
// plain mutation — both to stop someone mail-bombing an address they don't
// own (by repeatedly "attaching" it to events) and, incidentally, to keep
// this self-hosted mail relay's volume sane.
export async function POST(request: NextRequest, { params }: { params: Promise<{ hash: string }> }) {
  const limit = rateLimit(`recovery-email:attach:${clientIp(request)}`, 5, 60 * 60 * 1000);
  if (!limit.ok) return tooManyRequestsResponse(limit.retryAfterSeconds);

  try {
    const { hash } = await params;
    // Never destructure/log this further than passing it straight to
    // attachRecoveryEmail and sendMail below — see lib/recovery-email.ts.
    const { email } = recoveryEmailSchema.parse(await request.json());

    const result = await attachRecoveryEmail(hash, email);
    if (result.alreadyVerified) {
      return NextResponse.json({ status: "already-verified" });
    }

    const confirmUrl = new URL(`/confirm/${result.token}`, `https://${process.env.DOMAIN}`).toString();
    const sent = await sendMail(
      email,
      "Vahvista palautussähköposti — massikassi",
      [
        "Joku (toivottavasti sinä) liitti tämän sähköpostiosoitteen erääseen massikassi-tapahtumaan palautuslinkkiä varten.",
        "",
        `Vahvista osoite tästä (linkki vanhenee tunnin kuluttua): ${confirmUrl}`,
        "",
        "Jos et tunnista tätä, voit jättää viestin huomiotta — osoite ei tallennu käyttöön ilman vahvistusta.",
      ].join("\n"),
    );

    return NextResponse.json({ status: sent ? "confirmation-sent" : "send-failed" });
  } catch (error) {
    return handleApiError(error);
  }
}
