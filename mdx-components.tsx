import type { MDXComponents } from "mdx/types";
import Image, { ImageProps } from "next/image";
import { Lead, Large, Small, Muted } from "@/components/ui/typography";
import { CodeBlock } from "@/components/ui/code-block";

// This file allows you to provide custom React components
// to be used in MDX files. You can import and use any
// React component you want, including inline styles,
// components from other libraries, and more.

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Typography components following shadcn/ui patterns
    h1: ({ children }) => (
      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">{children}</h4>
    ),
    p: ({ children }) => (
      <p className="leading-7 [&:not(:first-child)]:mt-6">{children}</p>
    ),
    ul: ({ children }) => <ul className="my-6 ml-6 list-disc [&>li]:mt-2">{children}</ul>,
    ol: ({ children }) => (
      <ol className="my-6 ml-6 list-decimal [&>li]:mt-2">{children}</ol>
    ),
    li: ({ children }) => <li>{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="mt-6 border-l-2 pl-6 italic">{children}</blockquote>
    ),
    table: ({ children }) => (
      <div className="my-6 w-full overflow-y-auto">
        <table className="w-full">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead>{children}</thead>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => <tr className="m-0 border-t p-0 even:bg-muted">{children}</tr>,
    th: ({ children }) => (
      <th className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">
        {children}
      </td>
    ),
    code: ({ children, className }) => {
      const isInline = !className?.includes("language-");

      if (isInline) {
        return (
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
            {children}
          </code>
        );
      }

      return <code className={className}>{children}</code>;
    },
    pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
    a: ({ children, ...props }) => (
      <a className="font-medium text-primary underline underline-offset-4" {...props}>
        {children}
      </a>
    ),
    img: (props) => (
      <Image
        sizes="100vw"
        style={{ width: "100%", height: "auto" }}
        {...(props as ImageProps)}
      />
    ),
    hr: () => <hr className="my-4 md:my-8" />,
    // Additional typography components as React components
    Lead,
    Large,
    Small,
    Muted,
    ...components,
  };
}
