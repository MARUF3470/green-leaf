"use server";

import { authOptions } from "@/lib/auth";
import { db } from "@/src/prisma/db";
import { getServerSession } from "next-auth";

export const getAllEmployees = async () => {
  const session = await getServerSession(authOptions);
  try {
    const employees = await db.orm.public.User.where({
      role: "EMPLOYEE",
      whoAdded: session?.user?.id,
    }).all();

    return employees.map((employee) => ({
      id: employee.id,
      username: employee.username,
      email: employee.email,
      phone: employee.phone,
      address: employee.address,
      imageUrl: employee.imageUrl,
      role: employee.role,
      isActive: employee.isActive,
      createdAt: employee.createdAt.toString(),
      updatedAt: employee.updatedAt.toString(),
    }));
  } catch (error) {
    console.error("Error fetching employees:", error);
    throw error;
  }
};
