import { NextResponse } from "next/server";

const contactToEmail = process.env.CONTACT_TO_EMAIL || "contact@thesaasbook.com";
const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL;

type ContactPayload = {
  name?: string;
  email?: string;
  message?: string;
  website?: string;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function POST(request: Request) {
  let payload: ContactPayload;

  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const name = payload.name?.trim() || "";
  const email = payload.email?.trim() || "";
  const message = payload.message?.trim() || "";
  const website = payload.website?.trim() || "";

  if (website) {
    return NextResponse.json({ message: "Message sent successfully." }, { status: 200 });
  }

  if (!name || !email || !message) {
    return NextResponse.json(
      { message: "Please complete your name, email, and message before sending." },
      { status: 400 }
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ message: "Please enter a valid email address." }, { status: 400 });
  }

  if (!resendApiKey || !resendFromEmail) {
    return NextResponse.json(
      {
        message:
          "The contact form is not configured yet. Add RESEND_API_KEY and RESEND_FROM_EMAIL in production to send emails directly.",
      },
      { status: 503 }
    );
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": crypto.randomUUID(),
      "User-Agent": "TheSaaSBook-ContactForm/1.0",
    },
    body: JSON.stringify({
      from: resendFromEmail,
      to: [contactToEmail],
      reply_to: email,
      subject: `Contact form submission from ${name}`,
      text: [`Name: ${name}`, `Email: ${email}`, "", "Message:", message].join("\n"),
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
      `,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null) as
      | { message?: string; name?: string; statusCode?: number }
      | null;

    const providerMessage = errorBody?.message?.trim();
    const message = providerMessage
      ? providerMessage.includes("domain is not verified")
        ? "Email sending is blocked because thesaasbook.com is not verified in Resend yet. Verify the domain in Resend, then try again."
        : providerMessage.includes("API key") || response.status === 401
          ? "The Resend API key is invalid or unauthorized. Update RESEND_API_KEY and try again."
          : providerMessage
      : "We could not send your message right now. Please try again in a moment.";

    return NextResponse.json(
      {
        message,
      },
      { status: response.status >= 400 && response.status < 600 ? response.status : 502 }
    );
  }

  return NextResponse.json(
    {
      message: "Your message was sent successfully. We’ll get back to you soon.",
    },
    { status: 200 }
  );
}
