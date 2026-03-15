import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Quote } from "lucide-react";

interface TestimonialCardProps {
  quote: string;
  name: string;
  role: string;
  initials: string;
  highlighted?: boolean;
}

const avatarColors = [
  "bg-foreground/10 text-foreground",
  "bg-foreground/8 text-foreground/80",
  "bg-foreground/12 text-foreground/90",
];

export function TestimonialCard({
  quote,
  name,
  role,
  initials,
  highlighted = false,
}: TestimonialCardProps) {
  const colorIndex =
    initials.charCodeAt(0) % avatarColors.length;

  return (
    <Card
      className={cn(
        "relative transition-colors",
        highlighted && "border-foreground/20 shadow-md"
      )}
    >
      <CardContent className="pt-6 space-y-4">
        <Quote className="h-5 w-5 text-foreground/20" />
        <blockquote className="text-sm leading-relaxed text-foreground/80">
          &ldquo;{quote}&rdquo;
        </blockquote>
        <div className="flex items-center gap-3 pt-2">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold tracking-tight",
              avatarColors[colorIndex]
            )}
          >
            {initials}
          </div>
          <div>
            <p className="text-sm font-medium leading-none">{name}</p>
            <p className="text-xs text-muted-foreground mt-1">{role}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
