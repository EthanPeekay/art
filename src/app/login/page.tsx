import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/shared/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal px-6 py-16">
      <div className="w-full max-w-md">
        <Link href="/" className="font-display text-2xl text-parchment">
          African Art <span className="text-sienna">Showroom</span>
        </Link>
        <h1 className="mt-8 font-display text-3xl text-parchment">Welcome back</h1>

        <div className="mt-8 rounded-sm bg-parchment p-7">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-sm text-parchment/60">
          New to African Art Showroom?{" "}
          <Link href="/signup" className="text-gold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
