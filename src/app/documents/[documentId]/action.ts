"use server";

import { ConvexHttpClient } from "convex/browser";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";

let convexInstance: ConvexHttpClient | null = null;

function getConvex() {
  if (!convexInstance) {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
    }
    convexInstance = new ConvexHttpClient(url);
  }
  return convexInstance;
}

export async function getDocuments(ids: Id<"documents">[]) {
  return await getConvex().query(api.documents.getByIds, { ids });
}

export async function getUsers() {
  const { sessionClaims } = await auth();
  const clerk = await clerkClient();

  const response = await clerk.users.getUserList({
    organizationId: [sessionClaims?.org_id as string],
  });

  const users = response.data.map((user) => ({
    id: user.id,
    name: user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "Anonymous",
    avatar: user.imageUrl,
    color: "",
  }));

  return users;
}

export async function getUserByEmail(email: string) {
  const clerk = await clerkClient();
  const response = await clerk.users.getUserList({ emailAddress: [email] });
  if (response.data.length === 0) return null;
  const user = response.data[0];
  return {
    id: user.id,
    name: user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "Anonymous",
    avatar: user.imageUrl,
  };
}

export async function getUsersByIds(ids: string[]) {
  if (!ids || ids.length === 0) return [];
  const clerk = await clerkClient();
  const response = await clerk.users.getUserList({ userId: ids });
  return response.data.map((user) => ({
    id: user.id,
    name: user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "Anonymous",
    avatar: user.imageUrl,
  }));
}
