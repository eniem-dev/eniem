import { cn } from "@/lib/utils";
import { AlertCircle, Info, AlertTriangle, Lightbulb } from "lucide-react";

type CalloutType = "info" | "warning" | "tip" | "danger";

interface CalloutProps {
  type?: CalloutType;
  children: React.ReactNode;
}

const calloutStyles: Record<CalloutType, { icon: React.ReactNode; className: string }> = {
  info: {
    icon: <Info className="size-5" />,
    className: "border-blue-500/50 bg-blue-500/10 text-blue-900 dark:text-blue-100",
  },
  warning: {
    icon: <AlertTriangle className="size-5" />,
    className: "border-yellow-500/50 bg-yellow-500/10 text-yellow-900 dark:text-yellow-100",
  },
  tip: {
    icon: <Lightbulb className="size-5" />,
    className: "border-green-500/50 bg-green-500/10 text-green-900 dark:text-green-100",
  },
  danger: {
    icon: <AlertCircle className="size-5" />,
    className: "border-red-500/50 bg-red-500/10 text-red-900 dark:text-red-100",
  },
};

export function Callout({ type = "info", children }: CalloutProps) {
  const { icon, className } = calloutStyles[type];

  return (
    <div
      className={cn(
        "my-6 flex gap-3 rounded-lg border p-4",
        className
      )}
    >
      <div className="shrink-0">{icon}</div>
      <div className="prose-p:my-0 [&>p]:my-0">{children}</div>
    </div>
  );
}
