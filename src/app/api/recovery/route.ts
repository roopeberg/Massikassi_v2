import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-errors";
import { sendMail } from "@/lib/mail";
import { clientIp, rateLimit, tooManyRequestsResponse } from "@/lib/rate-limit";
import { emailKeyFor } from "@/lib/recovery-email";
import { requestRecovery } from "@/lib/recovery-repo";
import { recoveryEmailSchema } from "@/lib/validation";

// Always the same message regardless of whether the address matched
// anything — see requestRecovery in lib/recovery-repo.ts for the
// corresponding "don't let this be observable" work on the DB/timing side.
const GENERIC_RESPONSE = {
  message: "Jos osoitteeseen liittyviä tapahtumia löytyi, lähetimme palautuslinkin sähköpostiin.",
};

export async function POST(request: NextRequest) {
  const ipLimit = rateLimit(`recovery:request:ip:${clientIp(request)}`, 5, 60 * 60 * 1000);
  if (!ipLimit.ok) return tooManyRequestsResponse(ipLimit.retryAfterSeconds);

  try {
    const { email } = recoveryEmailSchema.parse(await request.json());

    // Rate-limited by emailKey too (not just IP) — this increments the same
    // regardless of whether the address matches anything, so it's not an
    // existence oracle, just a cap on how often any single address can be
    // mailed. See lib/recovery-email.ts for why this is an HMAC, not the
    // address itself, and note it's computed again inside requestRecovery —
    // duplicated on purpose so this rate-limit key never has to carry the
    // plaintext address through an extra layer.
    const keyLimit = rateLimit(`recovery:request:key:${emailKeyFor(email)}`, 3, 60 * 60 * 1000);
    if (!keyLimit.ok) return NextResponse.json(GENERIC_RESPONSE);

    const token = await requestRecovery(email);
    if (token) {
      const recoveryUrl = new URL(`/recovery/${token}`, `https://${process.env.DOMAIN}`).toString();
      await sendMail(
        email,
        "Palautuslinkki — massikassi",
        [
          "Pyysit tämän sähköpostiosoitteen tapahtumien palautuslinkkiä.",
          "",
          `Avaa tästä (linkki vanhenee 45 minuutissa, toimii vain kerran): ${recoveryUrl}`,
          "",
          "Jos et pyytänyt tätä, voit jättää viestin huomiotta.",
        ].join("\n"),
      );
    }

    return NextResponse.json(GENERIC_RESPONSE);
  } catch (error) {
    return handleApiError(error);
  }
}
