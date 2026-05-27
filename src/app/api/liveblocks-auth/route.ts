import { Liveblocks } from "@liveblocks/node";
import { ConvexHttpClient } from "convex/browser";
import { auth, currentUser } from "@clerk/nextjs/server";
import { api } from "../../../../convex/_generated/api";

export const dynamic = "force-dynamic";

let convexInstance: ConvexHttpClient | null = null;
let liveblocksInstance: Liveblocks | null = null;

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

function getLiveblocks() {
  if (!liveblocksInstance) {
    const secret = process.env.LIVEBLOCKS_SECRET_KEY;
    if (!secret) {
      throw new Error("LIVEBLOCKS_SECRET_KEY is not set");
    }
    liveblocksInstance = new Liveblocks({ secret });
  }
  return liveblocksInstance;
}


export async function POST(req: Request) {
  const { sessionClaims } = await auth();

  if (!sessionClaims) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = await currentUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { room } = await req.json();
  
  // Use getByIdForAuth which doesn't check auth in Convex, 
  // so we can fetch the document config and perform auth locally here.
  let document;
  try {
    document = await getConvex().query(api.documents.getByIdForAuth, { id: room });
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!document) {
    return new Response("Not Found", { status: 404 });
  }

  const isOwner = document.ownerId === user.id;
  const isOrganizationMember = !!(
    document.organizationId && document.organizationId === sessionClaims.org_id
  );

  const collaborator = document.collaborators?.find(
    (c: { userId: string; role: string }) => c.userId === user.id
  );
  
  let hasAccess = false;
  let isReadOnly = true;

  if (isOwner || isOrganizationMember) {
    hasAccess = true;
    isReadOnly = false; 
  } else if (collaborator) {
    hasAccess = true;
    isReadOnly = collaborator.role === "viewer";
  } else if (document.linkAccess === "editor") {
    hasAccess = true;
    isReadOnly = false;
  } else if (document.linkAccess === "viewer") {
    hasAccess = true;
    isReadOnly = true;
  }

  if (!hasAccess) {
    return new Response("Unauthorized", { status: 401 });
  }

  const name = user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "Anonymous";
  const nameToNumber = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = Math.abs(nameToNumber) % 360;
  const color = `hsl(${hue}, 80%, 60%)`;
  
  const session = getLiveblocks().prepareSession(user.id, {
    userInfo: {
      name,
      avatar: user.imageUrl,
      color,
    },
  });

  if (isReadOnly) {
    session.allow(room, session.READ_ACCESS);
  } else {
    session.allow(room, session.FULL_ACCESS);
  }

  const { body, status } = await session.authorize();

  return new Response(body, { status });
}
