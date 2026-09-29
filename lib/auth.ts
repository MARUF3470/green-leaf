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
        console.log("dasdasdasd", existingUser);
        if (!existingUser) {
          throw new Error("No user found with this email");
        }

        // as we encypt the password using bcrypt, we need to decrypt the password to compare
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
        };
      },
    }),
  ],
  callbacks: {
    // Store user information in the JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = (user as typeof user & { role: string }).role;
        token.username = (user as typeof user & { username: string }).username;
      }

      return token;
    },

    // Make user information available through the session
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email;
        session.user.role = token.role as string;
        session.user.username = token.username as string;
      }

      return session;
    },
  },
};
