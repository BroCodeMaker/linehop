import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const user = await prisma.restaurantUser.findFirst({
      where: { email: email.toLowerCase().trim() },
      include: { restaurant: true },
    });

    if (!user || !(await compare(password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = signSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId,
      restaurantSlug: user.restaurant.slug,
    });

    const res = NextResponse.json({
      ok: true,
      restaurantId: user.restaurantId,
      restaurantSlug: user.restaurant.slug,
    });

    res.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("[login]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
