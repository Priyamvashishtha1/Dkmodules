import twilio from "twilio";

function getTwilioClient() {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return null;
  }

  return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

export async function sendWhatsApp(to, message) {
  const client = getTwilioClient();
  const from = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";
  const cleaned = String(to || "").replace(/\D/g, "");

  if (!client) {
    console.warn("Twilio credentials are missing. WhatsApp send skipped.", { to, message });
    return { skipped: true };
  }

  if (!cleaned) {
    throw new Error("A valid mobile number is required for WhatsApp messages.");
  }

  const target = cleaned.startsWith("91") ? cleaned : `91${cleaned}`;

  await client.messages.create({
    body: message,
    from,
    to: `whatsapp:+${target}`
  });

  return { sent: true };
}
