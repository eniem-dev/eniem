import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AuthFormLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function AuthFormLayout({ title, description, children }: AuthFormLayoutProps) {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-lg md:text-xl">{title}</CardTitle>
        <CardDescription className="text-xs md:text-sm">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}