// types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";
import type { JWT } from "next-auth/jwt";

// Extend the User type from NextAuth.js
declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id?: string;
      role?: string;
      college?: string;
    };
  }

  interface User extends DefaultUser {
    role?: string;
    college?: string;
  }
}

// Extend the JWT (JSON Web Token) type
declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    college?: string;
  }
}
