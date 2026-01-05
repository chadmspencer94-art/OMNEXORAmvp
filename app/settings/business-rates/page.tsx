"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BusinessRatesRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/settings/business-profile");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="text-slate-500">Redirecting to Business Profile...</div>
    </div>
  );
}
