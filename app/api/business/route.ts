import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { db } from "@/src/prisma/db";

const businessSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  category: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export async function POST(request: Request) {
  // 1. Identify the caller from the server session — never trust a userId
  //    sent from the client, since that value could be forged.
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Only OWNER accounts should be able to create/register a business.
  if (session.user.role !== "OWNER") {
    return NextResponse.json(
      { error: "Only business owners can register a business" },
      { status: 403 },
    );
  }

  // 3. Prevent an owner from being linked to a second business.
  //    (Skip this check if you intend to support multiple businesses per owner.)
  const existingUser = await db.orm.public.User.where({
    id: session.user.id,
  }).first();

  if (existingUser?.businessId) {
    return NextResponse.json(
      { error: "You already have a business registered" },
      { status: 409 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = businessSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: z.flattenError(parsed.error) },
      { status: 400 },
    );
  }

  try {
    // 4. Create the business, then link it to the logged-in user, together.
    const business = await db.orm.public.Business.create({
      name: parsed.data.name,
      category: parsed.data.category,
      address: parsed.data.address,
      phone: parsed.data.phone,
    });

    await db.orm.public.User.where({ id: session.user.id }).update({
      businessId: business.id,
    });

    return NextResponse.json({ success: true, business }, { status: 201 });
  } catch (error) {
    console.error("Failed to create business:", error);
    return NextResponse.json(
      { error: "Failed to save business info" },
      { status: 500 },
    );
  }
}
