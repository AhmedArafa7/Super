
"use client";

import React, { use } from "react";
import { CoursePlayer } from "@/components/features/learning/course-player";
import { useAuth } from "@/components/auth/auth-provider";
import { LoginView } from "@/components/auth/login-view";
import { useSearchParams } from "next/navigation";

interface LearnPageProps {
  params: Promise<{ collectionId: string }>;
}

export default function LearnPage({ params }: LearnPageProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { collectionId } = use(params);
  const searchParams = useSearchParams();
  const subjectId = searchParams.get('subjectId');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div className="h-screen bg-black overflow-hidden">
      <CoursePlayer collectionId={collectionId} subjectId={subjectId} />
    </div>
  );
}
