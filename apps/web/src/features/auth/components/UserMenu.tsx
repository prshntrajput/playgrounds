"use client";

import Image from "next/image";
import { createSupabaseBrowserClient } from "../../../lib/supabase-browser";
import { useSession } from "../hooks/useSession";
import { SignInButton } from "./SignInButton";

export function UserMenu() {
  const { session, loading } = useSession();

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) return <div className="h-8 w-24 animate-pulse rounded bg-muted" />;

  if (!session) return <SignInButton />;

  return (
    <div className="flex items-center gap-3">
      {session.user.user_metadata?.avatar_url && (
        <Image
          src={session.user.user_metadata.avatar_url as string}
          alt="avatar"
          width={32}
          height={32}
          className="rounded-full"
          unoptimized
        />
      )}
      <span className="text-sm text-muted-foreground hidden sm:block">
        {session.user.user_metadata?.full_name ?? session.user.email}
      </span>
      <button
        onClick={handleSignOut}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}
