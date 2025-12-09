import { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

import { DocsSidebar } from "@/features/docs";

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <DocsSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-4 px-4">
          <div className="min-h-[100vh] flex-1  bg-muted/50 md:min-h-min p-8">
            <div className="prose dark:prose-invert max-w-3xl">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
