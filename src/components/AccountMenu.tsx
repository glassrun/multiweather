"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { EllipsisVertical } from "lucide-react";

export default function AccountMenu({
  email,
  signInLabel,
  signUpLabel,
  signOutLabel,
  onSignOut,
}: {
  email: string | null;
  signInLabel: string;
  signUpLabel: string;
  signOutLabel: string;
  onSignOut: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-expanded={open}
        className="rounded-full p-1.5 text-black/60 hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/10"
      >
        <EllipsisVertical className="h-5 w-5" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-lg border border-black/10 bg-white py-1 text-sm shadow-lg dark:border-white/10 dark:bg-neutral-900">
          {email ? (
            <>
              <p className="truncate px-3 py-2 text-black/50 dark:text-white/50">{email}</p>
              <form action={onSignOut}>
                <button type="submit" className="w-full px-3 py-2 text-left hover:bg-black/5 dark:hover:bg-white/10">
                  {signOutLabel}
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10"
              >
                {signInLabel}
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10"
              >
                {signUpLabel}
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
