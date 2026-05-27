"use client";

import { ReactNode, useMemo } from "react";
import { FullscreenLoader } from "./fullscreen-loader";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth, SignIn } from "@clerk/nextjs";
import { AuthLoading, Authenticated, ConvexReactClient, Unauthenticated } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

function MissingEnvError({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="max-w-xl rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Thiếu cấu hình môi trường</h1>
        <p className="mt-2 text-sm text-slate-600">
          {label} chưa được cấu hình đúng. Hãy kiểm tra biến môi trường trên Vercel hoặc file
          <code>.env.local</code> và build lại ứng dụng.
        </p>
        <div className="mt-4 rounded-lg bg-slate-100 p-3 text-sm text-slate-800">
          <div className="font-medium">Giá trị hiện tại</div>
          <div className="mt-1 break-all font-mono">{value ? value : "(trống)"}</div>
        </div>
      </div>
    </div>
  );
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convex = useMemo(() => {
    if (!convexUrl) {
      return null;
    }

    return new ConvexReactClient(convexUrl);
  }, []);

  if (!clerkPublishableKey) {
    return <MissingEnvError label="NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" value={clerkPublishableKey} />;
  }

  if (!convexUrl || !convex) {
    return <MissingEnvError label="NEXT_PUBLIC_CONVEX_URL" value={convexUrl} />;
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <ConvexProviderWithClerk useAuth={useAuth} client={convex}>
        <Authenticated>{children}</Authenticated>
        <Unauthenticated>
          <div className="flex min-h-screen flex-col items-center justify-center">
            <SignIn routing="hash" />
          </div>
        </Unauthenticated>
        <AuthLoading>
          <FullscreenLoader label="Auth loading..." />
        </AuthLoading>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
