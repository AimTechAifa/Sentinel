import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  Approved: "bg-success-50 text-success-600",
  Passed: "bg-success-50 text-success-600",
  Ready: "bg-success-50 text-success-600",
  Connected: "bg-success-50 text-success-600",
  Shipped: "bg-success-50 text-success-600",
  Go: "bg-success-50 text-success-600",
  Active: "bg-success-50 text-success-600",
  Pending: "bg-warning-50 text-warning-600",
  Running: "bg-warning-50 text-warning-600",
  "At Risk": "bg-warning-50 text-warning-600",
  Scheduled: "bg-brand-50 text-brand-500",
  Rejected: "bg-error-50 text-error-600",
  Failed: "bg-error-50 text-error-600",
  Blocked: "bg-error-50 text-error-600",
  "No-Go": "bg-error-50 text-error-600",
  "N/A": "bg-gray-100 text-gray-600",
  Paused: "bg-gray-100 text-gray-600",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-theme-xs font-medium",
        styles[status] ?? styles["N/A"],
        className
      )}
    >
      {status}
    </span>
  );
}
