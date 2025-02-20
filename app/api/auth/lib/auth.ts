import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { sql } from "@vercel/postgres";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        try {
          const userQuery = await sql`
            SELECT * FROM users WHERE email = ${credentials.email}
          `;

          const user = userQuery.rows[0];

          if (!user) {
            throw new Error("No user found");
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!passwordMatch) {
            throw new Error("Invalid password");
          }

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const existingUser = await sql`
            SELECT * FROM users WHERE email = ${user.email}
          `;

          if (existingUser.rows.length === 0) {
            await sql`
              INSERT INTO users (email, name, image)
              VALUES (${user.email}, ${user.name}, ${user.image})
            `;
          }
          return true;
        } catch (error) {
          console.error("Error during Google sign in:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name ?? undefined;
        token.image = user.image ?? undefined
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name ?? undefined;
        session.user.image = token.image ?? undefined;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
