import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "@/sanity/lib/api";

export const clientPublic = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  perspective: "published",
}); 