import { UserRole, UserStatus } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: UserRole | null;
      status?: UserStatus;
    } & DefaultSession["user"];
  }

  interface User {
    role?: UserRole | null;
    status?: UserStatus;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole | null;
    status?: UserStatus;
  }
}
