import { Suspense } from "react";
import Link from "next/link";
import { SignupForm } from "@/components/shared/SignupForm";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal px-6 py-16">
      <div className="w-full max-w-md">
        <Link href="/" className="font-display text-2xl text-parchment">
          Medawa <span className="text-sienna">Showroom</span>
        </Link>
        <h1 className="mt-8 font-display text-3xl text-parchment">
          Join the showroom
        </h1>
        <p className="mt-2 text-parchment/60">
          Collect work or exhibit it — choose how you&apos;ll use Medawa.
        </p>

        <div className="mt-8 rounded-sm bg-parchment p-7">
          <Suspense>
            <SignupForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-sm text-parchment/60">
          Already have an account?{" "}
          <Link href="/login" className="text-gold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
