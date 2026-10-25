'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DealersPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/approval?tab=dealers');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-xs font-bold text-slate-500 animate-pulse">
        Opening Partner Shops & Ledger...
      </div>
    </div>
  );
}
