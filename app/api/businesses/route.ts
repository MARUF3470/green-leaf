import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/src/prisma/db";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

function requireAdmin(session: any) {
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only platform admins can access this." },
      { status: 403 },
    );
  }
  return null;
}

// GET /api/admin/businesses
export async function GET() {
  const session = await getServerSession(authOptions);
  const authError = requireAdmin(session);
  if (authError) return authError;

  try {
    const [businesses, owners, subscriptions, plans] = await Promise.all([
      db.orm.public.Business.where({})
        .orderBy((b) => b.createdAt.desc())
        .all(),
      db.orm.public.User.where({ role: "OWNER" }).all(),
      db.orm.public.Subscription.where({}).all(),
      db.orm.public.Plan.where({}).all(),
    ]);

    const ownerIds = owners.map((o: any) => o.id);
    const ownerProfiles = (
      await db.orm.public.EmployeeProfile.where({}).all()
    ).filter((p: any) => ownerIds.includes(p.userId));

    const data = businesses.map((business: any) => {
      const owner = owners.find((o: any) => o.businessId === business.id);
      const ownerProfile = ownerProfiles.find(
        (p: any) => p.userId === owner?.id,
      );
      const subscription = subscriptions.find(
        (s: any) => s.businessId === business.id,
      );
      const plan = plans.find((p: any) => p.id === subscription?.planId);

      // Normalize to a monthly figure for MRR, regardless of billing interval.
      const monthlyRevenue = plan
        ? plan.interval === "YEARLY"
          ? Number(plan.price) / 12
          : Number(plan.price)
        : 0;

      return {
        id: business.id,
        business: business.name,
        owner: ownerProfile?.fullName ?? owner?.username ?? "—",
        plan: plan?.name ?? "No plan",
        status: business.isActive ? "Active" : "Suspended",
        mrr: monthlyRevenue,
      };
    });

    return NextResponse.json({ businesses: data });
  } catch (error) {
    console.error("Failed to fetch businesses:", error);
    return NextResponse.json(
      { error: "Failed to fetch businesses" },
      { status: 500 },
    );
  }
}

// PATCH /api/admin/businesses
// Body: { businessId: string, isActive: boolean }
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  const authError = requireAdmin(session);
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  const { businessId, isActive } = body ?? {};

  if (!businessId || typeof isActive !== "boolean") {
    return NextResponse.json(
      { error: "businessId and isActive (boolean) are required" },
      { status: 400 },
    );
  }

  try {
    const business = await db.orm.public.Business.where({
      id: businessId,
    }).first();

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    await db.orm.public.Business.where({ id: businessId }).update({
      isActive,
    });

    return NextResponse.json({ success: true, isActive });
  } catch (error) {
    console.error("Failed to update business status:", error);
    return NextResponse.json(
      { error: "Failed to update business status" },
      { status: 500 },
    );
  }
}
