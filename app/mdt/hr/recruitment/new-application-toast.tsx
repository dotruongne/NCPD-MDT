"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

export function NewApplicationToast({
  applicationId,
  applicantName,
}: {
  applicationId: string | null;
  applicantName: string | null;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const lastApplicationId = useRef(applicationId);

  useEffect(() => {
    const interval = window.setInterval(() => router.refresh(), 20000);
    return () => window.clearInterval(interval);
  }, [router]);

  useEffect(() => {
    if (!applicationId || !lastApplicationId.current) {
      lastApplicationId.current = applicationId;
      return;
    }
    if (applicationId === lastApplicationId.current) return;

    lastApplicationId.current = applicationId;
    showToast({
      type: "info",
      title: "Có đơn ứng tuyển mới",
      message: `${applicantName ?? "Ứng viên mới"} vừa nộp hồ sơ tuyển dụng.`,
    });
  }, [applicantName, applicationId, showToast]);

  return null;
}