import { polar } from "@/lib/polar/index";
import type { Downloadable } from "../models/downloadable.model";

export async function getDownloadables(userId: string): Promise<Downloadable[]> {
  return polar.listDownloadables(userId);
}
