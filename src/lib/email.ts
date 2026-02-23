import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const from = process.env.RESEND_FROM_EMAIL ?? "no-reply@cuidou.app";

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    return;
  }

  try {
    await resend.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
  } catch (error) {
    console.error("Failed to send email", error);
  }
}
