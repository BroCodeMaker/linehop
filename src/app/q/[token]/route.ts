import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;

  const qrToken = await prisma.qrToken.findUnique({
    where: { token },
    include: { restaurant: { select: { slug: true } } },
  });

  if (!qrToken) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Update firstScannedAt if first scan
  if (!qrToken.firstScannedAt) {
    await prisma.qrToken.update({
      where: { id: qrToken.id },
      data: { firstScannedAt: new Date() },
    });
  }

  if (qrToken.status === "claimed" && qrToken.restaurant?.slug) {
    return NextResponse.redirect(
      new URL(`/r/${qrToken.restaurant.slug}`, _req.url),
      302
    );
  }

  // Unclaimed or no restaurant — show activation pending page
  const html = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LineHop — Cod în curs de activare</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, sans-serif;
      min-height: 100vh;
      background: #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.1);
      padding: 48px 40px;
      text-align: center;
      max-width: 400px;
      width: 100%;
    }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 22px; font-weight: 700; color: #111; margin-bottom: 8px; }
    p { font-size: 15px; color: #6b7280; line-height: 1.6; }
    .token {
      display: inline-block;
      font-family: monospace;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 4px;
      color: #111;
      background: #f3f4f6;
      border-radius: 8px;
      padding: 8px 20px;
      margin: 16px 0;
    }
    .brand { font-size: 13px; color: #9ca3af; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">⏳</div>
    <h1>Cod urmează să fie activat</h1>
    <div class="token">${token}</div>
    <p>Acest cod QR va fi activat în curând și vă va redirecționa spre lista de așteptare a restaurantului.</p>
    <p class="brand">LineHop — Restaurant Waitlist</p>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
