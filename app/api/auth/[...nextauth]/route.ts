import NextAuth from "next-auth";
import { DefaultSession } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";
import { authOptions } from "../lib/auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user?: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    email: string;
  }
}


const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
