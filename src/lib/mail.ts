import nodemailer, { type Transporter } from "nodemailer";

/**
 * Talks only to the self-hosted `mail` container (docker-compose.yml,
 * a boky/postfix image) over the internal Docker network — never a
 * third-party email API. See DEPLOY.md for the DNS records (SPF, DKIM,
 * rDNS) this needs to actually land in inboxes from a self-hosted IP.
 */
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST ?? "mail",
      port: Number(process.env.MAIL_PORT ?? 587),
      secure: false,
      // This hop never leaves the private Docker network — the `mail`
      // container isn't reachable from outside it (no published port). TLS
      // matters for postfix's onward delivery to the real internet, which
      // it handles itself (smtp_tls_security_level=may); STARTTLS on this
      // internal leg would just mean trusting a self-signed cert for no
      // real benefit, so skip it rather than fight cert verification.
      ignoreTLS: true,
    });
  }
  return transporter;
}

function fromAddress(): string {
  const domain = process.env.DOMAIN;
  if (!domain) throw new Error("DOMAIN is not configured");
  return `Massikassi <no-reply@${domain}>`;
}

/**
 * Best-effort send: never throws — a delivery failure shouldn't break the
 * request that triggered it (e.g. attaching a recovery email should still
 * succeed even if the confirmation mail bounces at SMTP time), and the
 * caller must not log the raw error, since nodemailer/SMTP rejection
 * messages can echo the recipient address back (e.g. "550 mailbox
 * <address> unavailable"). Logs only that a send failed, nothing about
 * to/subject/body.
 */
export async function sendMail(to: string, subject: string, text: string): Promise<boolean> {
  try {
    await getTransporter().sendMail({ from: fromAddress(), to, subject, text });
    return true;
  } catch {
    console.error("mail send failed");
    return false;
  }
}
