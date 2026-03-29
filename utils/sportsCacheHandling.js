import { prisma } from "@/prisma/db";

// checks if the cache for a given key is stale based on the last updated timestamp and a specified age in minutes
export async function isKeyStale(key, minutes) {
    const row = await prisma.Timestamp.findUnique({ where: { key } });
    if (!row) return true;
  
    const ageMs = Date.now() - new Date(row.updatedAt).getTime();
    return ageMs > minutes * 60 * 1000;
}
