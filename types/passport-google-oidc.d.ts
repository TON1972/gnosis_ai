declare module "passport-google-oidc" {
  import { Strategy as PassportStrategy } from "passport-strategy";
  export class Strategy extends PassportStrategy {
    constructor(options: any, verify: any);
    authenticate(req: any, options?: any): void;
  }
}
