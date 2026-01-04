import { User as UserSchema } from "../drizzle/schema.ts";

declare global {
  namespace Express {
    interface User extends UserSchema {}
  }
}
