"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

export default function LogoutPage() {
  useEffect(() => {
    void signOut({ callbackUrl: "/" });
  }, []);
  return <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4">Deconnexion...</main>;
}
