import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/lib/storage/uploadthing";

export const { useUploadThing } = generateReactHelpers<OurFileRouter>();
