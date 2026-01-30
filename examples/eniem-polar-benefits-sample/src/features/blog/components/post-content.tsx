"use client";

import * as runtime from "react/jsx-runtime";
import { Callout } from "./callout";

const useMDXComponent = (code: string) => {
  const fn = new Function(code);
  return fn({ ...runtime }).default;
};

const components = {
  Callout,
};

interface PostContentProps {
  code: string;
}

export function PostContent({ code }: PostContentProps) {
  const Component = useMDXComponent(code);
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <Component components={components} />
    </article>
  );
}
