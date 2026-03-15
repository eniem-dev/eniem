import { ReactNode } from "react";

export function Lead({ children }: { children: ReactNode }) {
  return <p className="text-xl text-muted-foreground">{children}</p>;
}

export function Large({ children }: { children: ReactNode }) {
  return <div className="text-lg font-semibold">{children}</div>;
}

export function Small({ children }: { children: ReactNode }) {
  return <small className="text-sm font-medium leading-none">{children}</small>;
}

export function Muted({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}
