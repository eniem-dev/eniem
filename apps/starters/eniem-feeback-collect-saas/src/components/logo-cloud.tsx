import { locales } from "@/locales";

const fontStyles = [
  "font-black tracking-tighter",
  "font-light tracking-widest uppercase text-[0.8em]",
  "font-bold italic",
  "font-mono font-semibold tracking-tight",
  "font-extralight tracking-[0.2em] uppercase text-[0.85em]",
  "font-black tracking-tight",
];

export function LogoCloud() {
  return (
    <section className="py-16 border-y border-border/40">
      <div className="container mx-auto px-4">
        <p className="text-center text-xs font-medium tracking-widest uppercase text-muted-foreground/60 mb-10">
          {locales.HomePage.logoCloud.title}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {locales.HomePage.logoCloud.items.map((name, index) => (
            <span
              key={name}
              className={`text-lg text-muted-foreground/40 select-none transition-colors hover:text-foreground/60 ${fontStyles[index % fontStyles.length]}`}
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
