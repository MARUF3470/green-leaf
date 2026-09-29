import { db } from "@/src/prisma/db";
import { hash } from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { name, email, address, password, phone, image, role } =
      await request.json();

    const hashPassword = await hash(password, 10);

    const user = await db.orm.public.User.create({
      username: name,
      email,
      role,
      address,
      phone,
      passwordHash: hashPassword,
      imageUrl: image,
    });

    return NextResponse.json(
      { message: "User created successfully", user },
      { status: 201 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
