import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "@/lib/storage/uploadthing";

export const { GET, POST } = createRouteHandler({
    router: ourFileRouter,
});
