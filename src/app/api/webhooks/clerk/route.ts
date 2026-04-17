import { headers } from "next/headers";
import { Webhook } from "svix";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) return new Response("Missing webhook secret", { status: 500 });

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: { type: string; data: Record<string, unknown> };
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as typeof evt;
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (evt.type === "user.created" || evt.type === "user.updated") {
    const data = evt.data as {
      id: string;
      email_addresses: { email_address: string }[];
      first_name?: string;
      last_name?: string;
      image_url?: string;
    };
    const email = data.email_addresses[0]?.email_address ?? "";

    await db.insert(users).values({
      clerkId: data.id,
      email,
      firstName: data.first_name ?? null,
      lastName: data.last_name ?? null,
      imageUrl: data.image_url ?? null,
    }).onConflictDoUpdate({
      target: users.clerkId,
      set: { email, firstName: data.first_name ?? null, lastName: data.last_name ?? null, imageUrl: data.image_url ?? null, updatedAt: new Date() },
    });
  }

  return new Response("OK", { status: 200 });
}
