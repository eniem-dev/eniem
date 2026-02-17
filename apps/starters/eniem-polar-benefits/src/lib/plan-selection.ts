export interface PlanSelection {
  slug?: string;
  products?: string[];
}

export function getPlanSelectionFromSearchParams(searchParams: URLSearchParams): PlanSelection {
  const slug = searchParams.get("slug") ?? undefined;
  const productsParam = searchParams.get("products");
  const products = productsParam?.split(",").filter(Boolean);
  return { slug, products: products?.length ? products : undefined };
}

export function buildPlanSelectionParams(selection: PlanSelection): string {
  const params = new URLSearchParams();
  if (selection.slug) params.set("slug", selection.slug);
  if (selection.products?.length) params.set("products", selection.products.join(","));
  return params.toString();
}

export function appendPlanSelectionToUrl(baseUrl: string, selection: PlanSelection): string {
  const params = buildPlanSelectionParams(selection);
  return params ? `${baseUrl}?${params}` : baseUrl;
}

export function hasPlanSelection(selection: PlanSelection): boolean {
  return !!(selection.slug || selection.products?.length);
}
