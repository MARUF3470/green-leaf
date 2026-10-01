import { db } from "@/src/prisma/db";
import { hash } from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { name, email, address, password, phone, image, role, whoAdded } =
      await request.json();

    const hashPassword = await hash(password, 10);

    const user = await db.orm.public.User.create({
      username: name,
      email,
      role: role ? role : "OWNER",
      address,
      phone,
      passwordHash: hashPassword,
      imageUrl: image,
      whoAdded: role === "EMPLOYEE" ? whoAdded : null,
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          whoAdded: user.whoAdded,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
