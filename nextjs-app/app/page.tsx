"use client";
import React from "react";
import Sidebar from "@/app/components/Sidebar";

export default function Page() {
  return (
    <div className="min-h-screen flex flex-row bg-white">
      <Sidebar />
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-xl flex flex-col gap-8">
          {/* Main content intentionally left blank */}
        </div>
      </main>
    </div>
  );
}
