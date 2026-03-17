import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const WHATSAPP_PHONE_ID = "996575850212251";
const MARIUS_PHONE = "40750198891";

async function sendWhatsApp(to: string, body: string) {
  const token = process.env.WHATSAPP_API_TOKEN;
  if (!token) {
    console.warn("[demo] WHATSAPP_TOKEN not set — skipping WhatsApp send");
    return;
  }
  const phone = to.replace(/^\+/, "");
  await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: { body },
    }),
  });
}

export async function POST(req: NextRequest) {
  const { restaurantName, phone, city } = await req.json();

  if (!restaurantName?.trim() || !phone?.trim() || !city?.trim()) {
    return NextResponse.json({ error: "Toate câmpurile sunt obligatorii." }, { status: 400 });
  }

  const count = await prisma.demoRequest.count();
  const position = count + 1;

  const demo = await prisma.demoRequest.create({
    data: { restaurantName: restaurantName.trim(), phone: phone.trim(), city: city.trim(), position },
  });

  const now = new Date().toLocaleString("ro-RO", { timeZone: "Europe/Bucharest" });

  // Message to the restaurant
  const restaurantMsg =
    `👋 Salut ${restaurantName}!\n\n` +
    `Ești #${position} pe lista noastră — exact cum se simte și clientul tău când îi trimiți notificarea că masa e pregătită 🍽️\n\n` +
    `Cineva de la LineHop te sună în maxim 24h pentru setup gratuit.\n\n` +
    `*Până atunci, imaginează-ți că nu mai ai cozi la ușă.* 🚀`;

  // Notification to Marius
  const mariusMsg =
    `🔔 Demo nou #${position}: ${restaurantName} din ${city}\n` +
    `📞 ${phone}\n` +
    `Adăugat la ${now}`;

  await Promise.allSettled([
    sendWhatsApp(phone, restaurantMsg),
    sendWhatsApp(`+${MARIUS_PHONE}`, mariusMsg),
  ]);

  return NextResponse.json({ position: demo.position, id: demo.id });
}
