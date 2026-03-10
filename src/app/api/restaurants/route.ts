import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function getSession(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return null;
  return verifySession(token);
}

// GET /api/restaurants — list restaurants for logged-in user
export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // If user is bound to a specific restaurant, only return that one
  // Otherwise return all (for super-admin scenarios)
  const where = session.restaurantId
    ? { id: session.restaurantId as string }
    : {};

  const restaurants = await prisma.restaurant.findMany({
    where,
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, slug: true, status: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, restaurants });
}

// POST /api/restaurants — create a new restaurant
export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, slug: rawSlug, address } = body as { name: string; slug?: string; address?: string };

  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: "Name must be at least 2 characters" }, { status: 400 });
  }

  const slug = rawSlug ? toSlug(rawSlug) : toSlug(name);
  if (!slug) {
    return NextResponse.json({ error: "Could not generate a valid slug" }, { status: 400 });
  }

  // Check uniqueness
  const existing = await prisma.restaurant.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug already taken, choose a different name" }, { status: 409 });
  }

  const restaurant = await prisma.restaurant.create({
    data: {
      name: name.trim(),
      slug,
      // address not in schema but we can store in a future settings JSON
    },
  });

  // Create default settings
  await prisma.restaurantSettings.create({
    data: { restaurantId: restaurant.id },
  });

  // Create a user for this restaurant linked to the creator's email
  const creatorEmail = session.email as string;
  if (creatorEmail) {
    // Check if user already exists for this restaurant (shouldn't happen on create)
    const existingUser = await prisma.restaurantUser.findFirst({
      where: { email: creatorEmail, restaurantId: restaurant.id },
    });
    if (!existingUser) {
      // Get the creator's password hash from their current restaurant
      const sourceUser = await prisma.restaurantUser.findFirst({
        where: { email: creatorEmail, restaurantId: session.restaurantId as string },
        select: { passwordHash: true },
      });
      if (sourceUser) {
        await prisma.restaurantUser.create({
          data: {
            restaurantId: restaurant.id,
            email: creatorEmail,
            passwordHash: sourceUser.passwordHash,
            role: "admin",
          },
        });
      }
    }
  }

  return NextResponse.json({ ok: true, restaurant }, { status: 201 });
}
