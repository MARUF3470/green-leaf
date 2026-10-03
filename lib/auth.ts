import { compare } from "bcrypt";
import { db } from "@/src/prisma/db";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/authentication",
  },

  adapter: PrismaAdapter(db),

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",

      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const existingUser = await db.orm.public.User.first({
          email: credentials.email,
        });

        console.log("User from database:", existingUser);

        if (!existingUser) {
          throw new Error("No user found with this email");
        }

        const passwordMatch = await compare(
          credentials.password,
          existingUser.passwordHash,
        );

        if (!passwordMatch) {
          throw new Error("Password Invalid");
        }

        return {
          id: `${existingUser.id}`,
          username: existingUser.username,
          email: existingUser.email,
          role: existingUser.role,
          businessId: existingUser.businessId,
        };
      },
    }),
  ],

  callbacks: {
    // --------------------------------------------------
    // JWT CALLBACK
    // --------------------------------------------------
    async jwt({ token, user }) {
      // This runs when the user initially logs in
      if (user) {
        token.id = user.id;
        token.email = user.email;

        token.role = (
          user as typeof user & {
            role: string;
          }
        ).role;

        token.username = (
          user as typeof user & {
            username: string;
          }
        ).username;

        token.businessId = (
          user as typeof user & {
            businessId: string | null;
          }
        ).businessId;
      }

      if (token.id) {
        const existingUser = await db.orm.public.User.where({
          id: token.id as string,
        }).first();

        if (existingUser) {
          token.email = existingUser.email;
          token.role = existingUser.role;
          token.username = existingUser.username;
          token.businessId = existingUser.businessId;
        }
      }

      return token;
    },

    // --------------------------------------------------
    // SESSION CALLBACK
    // --------------------------------------------------
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.role = token.role as string;
        session.user.username = token.username as string;

        session.user.businessId =
          (token.businessId as string | null) ?? null;
      }

      return session;
    },
  },
};