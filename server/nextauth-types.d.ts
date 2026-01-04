import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: "user" | "admin";
    };
  }

  interface User {
    id: number;
    role: "user" | "admin";
  }
}
