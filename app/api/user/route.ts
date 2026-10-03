import { db } from "@/src/prisma/db";
import { hash } from "bcrypt";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const {
      name,
      email,
      address,
      password,
      phone,
      image,
      role,
    } = await request.json();

    // --------------------------------------------------
    // GET CURRENT SESSION
    // --------------------------------------------------

    const session = await getServerSession(authOptions);

    // --------------------------------------------------
    // EMPLOYEE CREATION
    // --------------------------------------------------

    if (role === "EMPLOYEE") {
      // Only an owner can create employees
      if (!session?.user?.id || session.user.role !== "OWNER") {
        return NextResponse.json(
          { error: "Only business owners can create employees" },
          { status: 401 },
        );
      }

      // Find the actual owner in the database
      const owner = await db.orm.public.User.where({
        id: session.user.id,
        role: "OWNER",
      }).first();

      if (!owner) {
        return NextResponse.json(
          { error: "Owner account not found" },
          { status: 404 },
        );
      }

      // Get businessId directly from the owner's database record
      if (!owner.businessId) {
        return NextResponse.json(
          {
            error:
              "This owner is not associated with a business. Please create a business first.",
          },
          { status: 400 },
        );
      }

      // Check if email already exists
      const existingUser = await db.orm.public.User.where({
        email,
      }).first();

      if (existingUser) {
        return NextResponse.json(
          { error: "A user with this email already exists" },
          { status: 409 },
        );
      }

      const hashPassword = await hash(password, 10);

      // Create employee
      const user = await db.orm.public.User.create({
        username: name,
        email,
        role: "EMPLOYEE",
        address,
        phone,
        passwordHash: hashPassword,
        imageUrl: image,

        // IMPORTANT:
        // This comes from the database, NOT the frontend/session
        businessId: owner.businessId,

        // Owner who created the employee
        whoAdded: owner.id,
      });

      return NextResponse.json(
        {
          message: "Employee created successfully",
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            businessId: user.businessId,
            whoAdded: user.whoAdded,
          },
        },
        { status: 201 },
      );
    }

    // --------------------------------------------------
    // NORMAL REGISTRATION
    // --------------------------------------------------

    // Normal registration creates an OWNER
    // with no business initially.

    const existingUser = await db.orm.public.User.where({
      email,
    }).first();

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 },
      );
    }

    const hashPassword = await hash(password, 10);

    const user = await db.orm.public.User.create({
      username: name,
      email,
      role: "OWNER",
      address,
      phone,
      passwordHash: hashPassword,
      imageUrl: image,

      // Normal owner has no business yet
      businessId: null,

      // No one created this account
      whoAdded: null,
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          businessId: user.businessId,
          whoAdded: user.whoAdded,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("User creation error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}