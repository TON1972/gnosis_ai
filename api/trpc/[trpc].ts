import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../server/routers.js";
import { createContext } from "../../server/_core/context.js";

export const runtime = "nodejs";

const handler = (req: Request) =>
    fetchRequestHandler({
        endpoint: "/api/trpc",
        req,
        router: appRouter,
        createContext,
    });

export { handler as GET, handler as POST };
