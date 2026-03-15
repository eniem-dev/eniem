"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export default function AuthStatus() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="w-full max-w-md p-4 bg-gray-50 rounded-lg border">
        <p className="text-gray-600">Loading session...</p>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="w-full max-w-md p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex flex-col gap-3">
          <h3 className="font-semibold text-red-800">Not authenticated</h3>
          <p className="text-red-600 text-sm">You are not logged in.</p>
          <Link href="/signup">
            <Button className="w-full" variant="outline">
              Go to Signup/Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="w-full max-w-md p-4 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex flex-col gap-3">
        <h3 className="font-semibold text-green-800">Authenticated ✓</h3>
        <div className="text-green-700 text-sm space-y-1">
          <p><strong>Email:</strong> {session.user.email}</p>
          <p><strong>Name:</strong> {session.user.name || "Not provided"}</p>
          <p><strong>ID:</strong> {session.user.id}</p>
          {session.user.image && (
            <p><strong>Avatar:</strong>
              <Image
                src={session.user.image}
                alt="Avatar"
                width={24}
                height={24}
                className="inline-block w-6 h-6 rounded-full ml-2"
              />
            </p>
          )}
        </div>
        <Button onClick={handleLogout} variant="destructive" className="w-full">
          Logout
        </Button>
      </div>
    </div>
  );
}