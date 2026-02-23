import type { PolarEnvironment } from "../../lib/polar.js";

// ============================================================================
// Types
// ============================================================================

export type WizardStep =
  // Initial and credentials
  | "init"
  | "load_credentials"
  | "prompt_access_token"
  // Production mode: sandbox-to-production sync
  | "ask_sandbox_sync"
  | "loading_sandbox_products"
  | "select_sandbox_products"
  | "confirm_sandbox_sync"
  | "syncing_sandbox_to_prod"
  // Menu steps
  | "checking_sync_status"
  | "show_menu"
  // Add product steps (existing)
  | "product_name"
  | "product_slug"
  | "product_type"
  | "recurring_interval"
  | "price_type"
  | "price_amount"
  | "description"
  | "display_title"
  | "display_subtitle"
  | "features"
  | "badge"
  | "highlighted"
  | "cta"
  | "creating"
  | "ask_yearly"
  | "yearly_slug"
  | "yearly_price"
  | "yearly_title"
  | "yearly_description_choice"
  | "yearly_description"
  | "yearly_features_choice"
  | "yearly_features"
  | "yearly_subtitle"
  | "yearly_badge"
  | "yearly_highlighted"
  | "yearly_cta"
  | "creating_yearly"
  // Remove operation steps
  | "select_for_remove"
  | "confirm_remove"
  | "removing"
  // Sync operation steps
  | "select_for_sync"
  | "confirm_sync"
  | "syncing"
  // Regenerate operation steps
  | "regenerating"
  // Unarchive operation steps
  | "select_for_unarchive"
  | "confirm_unarchive"
  | "unarchiving"
  // Cleanup operation steps
  | "loading_polar_products"
  | "show_orphaned_products"
  | "confirm_cleanup"
  | "cleaning_up"
  // Completion steps
  | "operation_complete"
  | "ask_continue"
  | "complete"
  | "error";

export interface ProductsCommandProps {
  env: PolarEnvironment;
  projectDir: string;
  accessToken?: string;
}

export interface ProductDraft {
  name: string;
  slug: string;
  type: "subscription" | "one_time" | "free";
  recurringInterval?: "day" | "week" | "month" | "year";
  priceType: "fixed" | "custom" | "free";
  priceAmountCents?: number;
  description?: string;
  displayTitle: string;
  displaySubtitle?: string;
  features: string[];
  badge: string | null;
  highlighted: boolean;
  cta: string;
}

export type OperationType = "add" | "remove" | "sync" | "regenerate" | "sandbox_sync" | "unarchive" | "cleanup" | "sync_from_sandbox";

export interface OperationResults {
  successes: string[];
  failures: { slug: string; error: string }[];
}
