// app/api/employee/profile/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/src/prisma/db";

export const dynamic = "force-dynamic";

async function getAuthenticatedEmployee() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      error: NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 },
      ),
    };
  }

  if (session.user.role !== "EMPLOYEE") {
    return {
      error: NextResponse.json(
        { message: "Only employees can access this profile" },
        { status: 403 },
      ),
    };
  }

  const user = await db.orm.public.User.where({
    id: session.user.id,
    role: "EMPLOYEE",
  }).first();

  if (!user) {
    return {
      error: NextResponse.json(
        { message: "Employee not found" },
        { status: 404 },
      ),
    };
  }

  return { user };
}

export async function GET() {
  try {
    const result = await getAuthenticatedEmployee();

    if ("error" in result) {
      return result.error;
    }

    const { user } = result;

    const profile = await db.orm.public.EmployeeProfile.where({
      userId: user.id,
    }).first();

    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,

      fullName: profile?.fullName ?? "",
      phone: profile?.phone ?? user.phone ?? "",
      contactEmail: profile?.contactEmail ?? "",
      address: profile?.address ?? user.address ?? "",
      photoUrl: profile?.photoUrl ?? user.imageUrl ?? "",
      isAvailable: profile?.isAvailable ?? true,
    });
  } catch (error) {
    console.error("Failed to fetch employee profile:", error);

    return NextResponse.json(
      { message: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const result = await getAuthenticatedEmployee();

    if ("error" in result) {
      return result.error;
    }

    const { user } = result;

    const body = await request.json();

    const fullName =
      typeof body.fullName === "string"
        ? body.fullName.trim()
        : "";

    const phone =
      typeof body.phone === "string"
        ? body.phone.trim()
        : "";

    const contactEmail =
      typeof body.contactEmail === "string"
        ? body.contactEmail.trim()
        : "";

    const address =
      typeof body.address === "string"
        ? body.address.trim()
        : "";

    const photoUrl =
      typeof body.photoUrl === "string"
        ? body.photoUrl.trim()
        : "";

    const isAvailable = body.isAvailable;

    if (!fullName) {
      return NextResponse.json(
        { message: "Full name is required" },
        { status: 400 },
      );
    }

    if (
      contactEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)
    ) {
      return NextResponse.json(
        { message: "Please provide a valid contact email" },
        { status: 400 },
      );
    }

    if (typeof isAvailable !== "boolean") {
      return NextResponse.json(
        { message: "Availability must be true or false" },
        { status: 400 },
      );
    }

    if (
      photoUrl &&
      !/^https?:\/\/.+/i.test(photoUrl)
    ) {
      return NextResponse.json(
        { message: "Photo URL must start with http:// or https://" },
        { status: 400 },
      );
    }

    const existingProfile =
      await db.orm.public.EmployeeProfile.where({
        userId: user.id,
      }).first();

    const profileData = {
      fullName,
      phone: phone || null,
      contactEmail: contactEmail || null,
      address: address || null,
      photoUrl: photoUrl || null,
      isAvailable,
    };

    if (existingProfile) {
      await db.orm.public.EmployeeProfile.where({
        userId: user.id,
      }).update(profileData);
    } else {
      await db.orm.public.EmployeeProfile.create({
        userId: user.id,
        ...profileData,
      });
    }

    // Keep shared contact fields in sync with the User record.
    await db.orm.public.User.where({
      id: user.id,
    }).update({
      phone: phone || null,
      address: address || null,
      imageUrl: photoUrl || null,
    });

    const updatedProfile =
      await db.orm.public.EmployeeProfile.where({
        userId: user.id,
      }).first();

    return NextResponse.json({
      message: "Profile updated successfully",
      profile: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: updatedProfile?.fullName ?? fullName,
        phone: updatedProfile?.phone ?? "",
        contactEmail: updatedProfile?.contactEmail ?? "",
        address: updatedProfile?.address ?? "",
        photoUrl: updatedProfile?.photoUrl ?? "",
        isAvailable: updatedProfile?.isAvailable ?? isAvailable,
      },
    });
  } catch (error) {
    console.error("Failed to update employee profile:", error);

    return NextResponse.json(
      { message: "Failed to update profile" },
      { status: 500 },
    );
  }
}