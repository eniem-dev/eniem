import { Box, Text } from "ink";
import React, { useState, useEffect, useRef } from "react";
import {
  TextInput,
  Select,
  Confirm,
  Spinner,
  SectionHeader,
  StatusMessage,
  MultiSelect,
  ProductList,
  OperationMenu,
  type SyncStatus,
} from "../components/index.js";
import {
  readProductsFile,
  writeProductsFile,
  generateProductsTs,
  slugExists,
  toKebabCase,
  validateSlug,
  validatePrice,
  dollarsToCents,
  generateYearlySlug,
  generateYearlyTitle,
  calculateYearlyPrice,
  removeProduct,
  type Product,
} from "../lib/products.js";
import {
  loadPolarCredentials,
  createPolarProduct,
  checkProductExists,
  updatePolarProduct,
  archivePolarProduct,
  unarchivePolarProduct,
  listPolarProducts,
  type PolarCredentials,
  type PolarEnvironment,
} from "../lib/polar.js";

// ============================================================================
// Types
// ============================================================================

type WizardStep =
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

interface ProductsCommandProps {
  env: PolarEnvironment;
  projectDir: string;
}

interface ProductDraft {
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

// ============================================================================
// Component
// ============================================================================

export const ProductsCommand = ({ env, projectDir }: ProductsCommandProps) => {
  // Wizard state
  const [step, setStep] = useState<WizardStep>("init");
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [credentials, setCredentials] = useState<PolarCredentials | null>(null);

  // Product draft state
  const [draft, setDraft] = useState<ProductDraft>({
    name: "",
    slug: "",
    type: "subscription",
    priceType: "fixed",
    displayTitle: "",
    features: [],
    badge: null,
    highlighted: false,
    cta: "Get Started",
  });

  // Yearly product draft state
  const [yearlyDraft, setYearlyDraft] = useState<ProductDraft | null>(null);
  const [, setInheritYearlyDescription] = useState(true);
  const [inheritYearlyFeatures, setInheritYearlyFeatures] = useState(true);

  // Input state for text inputs
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState<string | undefined>(undefined);

  // Created products
  const [createdProduct, setCreatedProduct] = useState<Product | null>(null);
  const [, setCreatedYearlyProduct] = useState<Product | null>(null);
  const [polarSyncSuccess, setPolarSyncSuccess] = useState<boolean | null>(null);
  const [, setYearlyPolarSyncSuccess] = useState<boolean | null>(null);
  const [polarSyncError, setPolarSyncError] = useState<string | null>(null);
  const [, setYearlyPolarSyncError] = useState<string | null>(null);

  // TypeScript generation state (used in effects, results shown via operationResults)
  const [, setTsGenSuccess] = useState<boolean | null>(null);
  const [, setTsGenError] = useState<string | null>(null);

  // Menu operation state
  const [syncStatus, setSyncStatus] = useState<Map<string, SyncStatus>>(new Map());
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [operationResults, setOperationResults] = useState<{
    successes: string[];
    failures: { slug: string; error: string }[];
  }>({ successes: [], failures: [] });
  const [lastOperation, setLastOperation] = useState<"add" | "remove" | "sync" | "regenerate" | "sandbox_sync" | "unarchive" | "cleanup" | null>(null);

  // Sandbox-to-production sync state
  const [sandboxProducts, setSandboxProducts] = useState<Product[]>([]);
  const [askedSandboxSync, setAskedSandboxSync] = useState(false);

  // Polar cleanup state
  const [orphanedPolarProducts, setOrphanedPolarProducts] = useState<Array<{ id: string; name: string; isArchived: boolean; slug?: string }>>([]);
  const [selectedPolarProductIds, setSelectedPolarProductIds] = useState<string[]>([]);
  const [cleanupAction, setCleanupAction] = useState<"archive" | "import" | null>(null);

  // Refs to prevent duplicate effect runs
  const isCreatingRef = useRef(false);
  const isCreatingYearlyRef = useRef(false);
  const isCheckingSyncRef = useRef(false);
  const isRemovingRef = useRef(false);
  const isSyncingRef = useRef(false);
  const isRegeneratingRef = useRef(false);
  const isLoadingSandboxRef = useRef(false);
  const isSyncingSandboxRef = useRef(false);
  const isUnarchivingRef = useRef(false);
  const isLoadingPolarProductsRef = useRef(false);
  const isCleaningUpRef = useRef(false);

  // Initialize: Read products file
  useEffect(() => {
    if (step === "init") {
      const init = async () => {
        const result = await readProductsFile(projectDir, env);
        if (!result.success) {
          // In production mode, if file doesn't exist, check if we can offer sandbox sync
          if (env === "production" && result.error.includes("not found")) {
            // Check if sandbox file exists
            const sandboxResult = await readProductsFile(projectDir, "sandbox");
            if (sandboxResult.success && sandboxResult.products.length > 0) {
              // Sandbox exists with products - offer to sync
              setProducts([]);
              setStep("load_credentials");
              return;
            }
          }
          setError(result.error);
          setStep("error");
          return;
        }
        setProducts(result.products);
        setStep("load_credentials");
      };
      init();
    }
  }, [step, projectDir, env]);

  // Load sandbox products for sandbox-to-production sync
  useEffect(() => {
    if (step === "loading_sandbox_products" && !isLoadingSandboxRef.current) {
      isLoadingSandboxRef.current = true;
      const load = async () => {
        const result = await readProductsFile(projectDir, "sandbox");
        if (!result.success) {
          // No sandbox products or error - proceed to normal menu
          isLoadingSandboxRef.current = false;
          setStep("checking_sync_status");
          return;
        }
        if (result.products.length === 0) {
          // No sandbox products to sync
          isLoadingSandboxRef.current = false;
          setStep("checking_sync_status");
          return;
        }
        setSandboxProducts(result.products);
        isLoadingSandboxRef.current = false;
        setStep("select_sandbox_products");
      };
      load();
    }
  }, [step, projectDir]);

  // Load credentials
  useEffect(() => {
    if (step === "load_credentials") {
      const load = async () => {
        const result = await loadPolarCredentials(projectDir);
        if (result.success) {
          setCredentials(result.credentials);
          // In production mode, ask about sandbox sync first (if not already asked)
          if (env === "production" && !askedSandboxSync) {
            setAskedSandboxSync(true);
            setStep("ask_sandbox_sync");
          } else {
            setStep("checking_sync_status");
          }
        } else {
          setStep("prompt_access_token");
        }
      };
      load();
    }
  }, [step, projectDir, env, askedSandboxSync]);

  // Check sync status for all products
  useEffect(() => {
    if (step === "checking_sync_status" && credentials && !isCheckingSyncRef.current) {
      isCheckingSyncRef.current = true;
      const checkSync = async () => {
        const newSyncStatus = new Map<string, SyncStatus>();

        // Mark all as checking initially
        for (const product of products) {
          newSyncStatus.set(product.slug, "checking");
        }
        setSyncStatus(new Map(newSyncStatus));

        // Check each product with a polarProductId
        for (const product of products) {
          if (!product.polarProductId) {
            newSyncStatus.set(product.slug, "not-synced");
            continue;
          }
          const result = await checkProductExists(credentials, product.polarProductId, env);
          if (result.exists) {
            if (result.isArchived) {
              newSyncStatus.set(product.slug, "archived");
            } else {
              newSyncStatus.set(product.slug, "synced");
            }
          } else if ("error" in result) {
            newSyncStatus.set(product.slug, "error");
          } else {
            newSyncStatus.set(product.slug, "not-synced");
          }
        }

        setSyncStatus(new Map(newSyncStatus));
        isCheckingSyncRef.current = false;
        setStep("show_menu");
      };
      checkSync();
    }
  }, [step, credentials, products, env]);

  // Helper to build Product from draft
  const buildProduct = (d: ProductDraft): Product => {
    return {
      slug: d.slug,
      name: d.name,
      description: d.description,
      type: d.type,
      recurringInterval: d.type === "subscription" ? d.recurringInterval : undefined,
      recurringIntervalCount: d.type === "subscription" ? 1 : undefined,
      prices: [
        d.priceType === "free"
          ? { amountType: "free" as const }
          : d.priceType === "custom"
          ? {
              amountType: "custom" as const,
              amount: d.priceAmountCents,
              currency: "usd" as const,
            }
          : {
              amountType: "fixed" as const,
              amount: d.priceAmountCents,
              currency: "usd" as const,
            },
      ],
      display: {
        title: d.displayTitle,
        subtitle: d.displaySubtitle,
        badge: d.badge,
        features: d.features,
        highlighted: d.highlighted,
        cta: d.cta,
      },
      polarProductId: null,
    };
  };

  // Create product (sync to Polar, save to JSON)
  useEffect(() => {
    if (step === "creating" && credentials && !isCreatingRef.current) {
      isCreatingRef.current = true;
      const create = async () => {
        const product = buildProduct(draft);

        // Sync to Polar
        const polarResult = await createPolarProduct(credentials, product, env);
        if (polarResult.success) {
          product.polarProductId = polarResult.polarProductId;
          setPolarSyncSuccess(true);
        } else {
          setPolarSyncSuccess(false);
          setPolarSyncError(polarResult.error);
        }

        // Save to JSON - use functional update to get latest products
        setProducts((currentProducts) => {
          const updatedProducts = [...currentProducts, product];
          writeProductsFile(projectDir, env, updatedProducts).then(async (writeResult) => {
            if (!writeResult.success) {
              setError(writeResult.error ?? "Failed to save product");
              setStep("error");
              return;
            }

            // Generate TypeScript exports
            const tsResult = await generateProductsTs(projectDir);
            if (tsResult.success) {
              setTsGenSuccess(true);
            } else {
              setTsGenSuccess(false);
              setTsGenError(tsResult.error ?? "Failed to generate TypeScript");
            }

            setCreatedProduct(product);

            // Check if monthly subscription - ask about yearly
            if (
              draft.type === "subscription" &&
              draft.recurringInterval === "month"
            ) {
              setStep("ask_yearly");
            } else {
              setStep("complete");
            }
          });
          return updatedProducts;
        });
      };
      create();
    }
  }, [step, credentials, draft, projectDir, env]);

  // Create yearly product
  useEffect(() => {
    if (step === "creating_yearly" && credentials && yearlyDraft && !isCreatingYearlyRef.current) {
      isCreatingYearlyRef.current = true;
      const create = async () => {
        const product = buildProduct(yearlyDraft);

        // Sync to Polar
        const polarResult = await createPolarProduct(credentials, product, env);
        if (polarResult.success) {
          product.polarProductId = polarResult.polarProductId;
          setYearlyPolarSyncSuccess(true);
        } else {
          setYearlyPolarSyncSuccess(false);
          setYearlyPolarSyncError(polarResult.error);
        }

        // Save to JSON - use functional update to get latest products
        setProducts((currentProducts) => {
          const updatedProducts = [...currentProducts, product];
          writeProductsFile(projectDir, env, updatedProducts).then(async (writeResult) => {
            if (!writeResult.success) {
              setError(writeResult.error ?? "Failed to save yearly product");
              setStep("error");
              return;
            }

            // Generate TypeScript exports
            const tsResult = await generateProductsTs(projectDir);
            if (tsResult.success) {
              setTsGenSuccess(true);
            } else {
              setTsGenSuccess(false);
              setTsGenError(tsResult.error ?? "Failed to generate TypeScript");
            }

            setCreatedYearlyProduct(product);

            // Set up operation results for both products created
            setLastOperation("add");
            const successes: string[] = [];
            const failures: { slug: string; error: string }[] = [];

            // Monthly product
            if (createdProduct) {
              if (polarSyncSuccess) {
                successes.push(createdProduct.slug);
              } else {
                failures.push({ slug: createdProduct.slug, error: polarSyncError ?? "Polar sync failed" });
              }
            }

            // Yearly product
            if (polarResult.success) {
              successes.push(product.slug);
            } else {
              failures.push({ slug: product.slug, error: polarResult.error });
            }

            setOperationResults({ successes, failures });
            setStep("operation_complete");
          });
          return updatedProducts;
        });
      };
      create();
    }
  }, [step, credentials, yearlyDraft, projectDir, env, createdProduct, polarSyncSuccess, polarSyncError]);

  // Handle step transitions
  const handleAccessTokenSubmit = (value: string) => {
    if (!value.trim()) {
      setInputError("Access token is required");
      return;
    }
    setInputValue("");
    setInputError(undefined);
    setCredentials({ accessToken: value.trim() });
    // In production mode, ask about sandbox sync first (if not already asked)
    if (env === "production" && !askedSandboxSync) {
      setAskedSandboxSync(true);
      setStep("ask_sandbox_sync");
    } else {
      setStep("checking_sync_status");
    }
  };

  const handleProductNameSubmit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setInputError("Product name is required");
      return;
    }
    if (trimmed.length > 99) {
      setInputError("Product name must be 99 characters or less");
      return;
    }
    setDraft((d) => ({
      ...d,
      name: trimmed,
      slug: toKebabCase(trimmed),
      displayTitle: trimmed,
    }));
    setInputValue(toKebabCase(trimmed));
    setInputError(undefined);
    setStep("product_slug");
  };

  const handleProductSlugSubmit = (value: string) => {
    const trimmed = value.trim();
    const validation = validateSlug(trimmed);
    if (!validation.success) {
      setInputError(validation.error);
      return;
    }
    if (slugExists(products, trimmed)) {
      setInputError(`Slug "${trimmed}" already exists`);
      return;
    }
    setDraft((d) => ({ ...d, slug: trimmed }));
    setInputValue("");
    setInputError(undefined);
    setStep("product_type");
  };

  const handleProductTypeSelect = (value: string) => {
    const type = value as "subscription" | "one_time" | "free";
    setDraft((d) => ({ ...d, type }));
    if (type === "subscription") {
      setStep("recurring_interval");
    } else if (type === "free") {
      setDraft((d) => ({ ...d, priceType: "free" }));
      setStep("description");
    } else {
      setStep("price_type");
    }
  };

  const handleRecurringIntervalSelect = (value: string) => {
    const interval = value as "day" | "week" | "month" | "year";
    setDraft((d) => ({ ...d, recurringInterval: interval }));
    setStep("price_type");
  };

  const handlePriceTypeSelect = (value: string) => {
    const priceType = value as "fixed" | "custom" | "free";
    setDraft((d) => ({ ...d, priceType }));
    if (priceType === "free") {
      setStep("description");
    } else {
      setStep("price_amount");
    }
  };

  const handlePriceAmountSubmit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setInputError("Price is required");
      return;
    }
    const amount = parseFloat(trimmed);
    if (isNaN(amount) || amount < 0) {
      setInputError("Please enter a valid price");
      return;
    }
    const cents = dollarsToCents(amount);
    if (draft.priceType === "fixed") {
      const priceValidation = validatePrice(cents);
      if (!priceValidation.success) {
        setInputError(priceValidation.error);
        return;
      }
    }
    setDraft((d) => ({ ...d, priceAmountCents: cents }));
    setInputValue("");
    setInputError(undefined);
    setStep("description");
  };

  const handleDescriptionSubmit = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length > 200) {
      setInputError("Description must be 200 characters or less");
      return;
    }
    setDraft((d) => ({ ...d, description: trimmed || undefined }));
    setInputValue(draft.displayTitle);
    setInputError(undefined);
    setStep("display_title");
  };

  const handleDisplayTitleSubmit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setInputError("Display title is required");
      return;
    }
    setDraft((d) => ({ ...d, displayTitle: trimmed }));
    setInputValue("");
    setInputError(undefined);
    setStep("display_subtitle");
  };

  const handleDisplaySubtitleSubmit = (value: string) => {
    setDraft((d) => ({ ...d, displaySubtitle: value.trim() || undefined }));
    setInputValue("");
    setInputError(undefined);
    setStep("features");
  };

  const handleFeaturesSubmit = (value: string) => {
    const features = value
      .split(",")
      .map((f) => f.trim())
      .filter((f) => f.length > 0);
    setDraft((d) => ({ ...d, features }));
    setInputValue("");
    setInputError(undefined);
    setStep("badge");
  };

  const handleBadgeSubmit = (value: string) => {
    setDraft((d) => ({ ...d, badge: value.trim() || null }));
    setInputValue("");
    setInputError(undefined);
    setStep("highlighted");
  };

  const handleHighlightedConfirm = (confirmed: boolean) => {
    setDraft((d) => ({ ...d, highlighted: confirmed }));
    setInputValue("Get Started");
    setStep("cta");
  };

  const handleCtaSubmit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setInputError("CTA text is required");
      return;
    }
    setDraft((d) => ({ ...d, cta: trimmed }));
    setInputValue("");
    setInputError(undefined);
    setStep("creating");
  };

  // Yearly product handlers
  const handleAskYearlyConfirm = (confirmed: boolean) => {
    if (!confirmed) {
      // Set up operation results for "add" to show the created product
      setLastOperation("add");
      setOperationResults({
        successes: [createdProduct?.slug ?? "Product created"],
        failures: polarSyncSuccess ? [] : [{ slug: createdProduct?.slug ?? "product", error: polarSyncError ?? "Polar sync failed" }],
      });
      setStep("operation_complete");
      return;
    }
    // Initialize yearly draft
    const yearlySlug = generateYearlySlug(draft.slug);
    const yearlyTitle = generateYearlyTitle(draft.displayTitle);
    const yearlyPrice = calculateYearlyPrice(draft.priceAmountCents || 0);

    setYearlyDraft({
      ...draft,
      slug: yearlySlug,
      name: yearlyTitle,
      recurringInterval: "year",
      priceAmountCents: yearlyPrice,
      displayTitle: yearlyTitle,
    });
    setInputValue(yearlySlug);
    setStep("yearly_slug");
  };

  const handleYearlySlugSubmit = (value: string) => {
    const trimmed = value.trim();
    const validation = validateSlug(trimmed);
    if (!validation.success) {
      setInputError(validation.error);
      return;
    }
    if (slugExists(products, trimmed)) {
      setInputError(`Slug "${trimmed}" already exists`);
      return;
    }
    setYearlyDraft((d) => (d ? { ...d, slug: trimmed } : null));
    // Show suggested price
    const suggestedPrice = calculateYearlyPrice(draft.priceAmountCents || 0) / 100;
    setInputValue(suggestedPrice.toString());
    setInputError(undefined);
    setStep("yearly_price");
  };

  const handleYearlyPriceSubmit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setInputError("Price is required");
      return;
    }
    const amount = parseFloat(trimmed);
    if (isNaN(amount) || amount < 0) {
      setInputError("Please enter a valid price");
      return;
    }
    const cents = dollarsToCents(amount);
    const priceValidation = validatePrice(cents);
    if (!priceValidation.success) {
      setInputError(priceValidation.error);
      return;
    }
    setYearlyDraft((d) => (d ? { ...d, priceAmountCents: cents } : null));
    setInputValue(yearlyDraft?.displayTitle || "");
    setInputError(undefined);
    setStep("yearly_title");
  };

  const handleYearlyTitleSubmit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setInputError("Display title is required");
      return;
    }
    setYearlyDraft((d) => (d ? { ...d, displayTitle: trimmed, name: trimmed } : null));
    setInputValue("");
    setInputError(undefined);
    setStep("yearly_description_choice");
  };

  const handleYearlyDescriptionChoiceSelect = (value: string) => {
    if (value === "inherit") {
      setInheritYearlyDescription(true);
      setYearlyDraft((d) => (d ? { ...d, description: draft.description } : null));
      setStep("yearly_features_choice");
    } else {
      setInheritYearlyDescription(false);
      setStep("yearly_description");
    }
  };

  const handleYearlyDescriptionSubmit = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length > 200) {
      setInputError("Description must be 200 characters or less");
      return;
    }
    setYearlyDraft((d) => (d ? { ...d, description: trimmed || undefined } : null));
    setInputValue("");
    setInputError(undefined);
    setStep("yearly_features_choice");
  };

  const handleYearlyFeaturesChoiceSelect = (value: string) => {
    if (value === "inherit") {
      setInheritYearlyFeatures(true);
      setYearlyDraft((d) => (d ? { ...d, features: draft.features } : null));
      setStep("yearly_subtitle");
    } else if (value === "add") {
      setInheritYearlyFeatures(true);
      setInputValue("");
      setStep("yearly_features");
    } else {
      setInheritYearlyFeatures(false);
      setInputValue("");
      setStep("yearly_features");
    }
  };

  const handleYearlyFeaturesSubmit = (value: string) => {
    const newFeatures = value
      .split(",")
      .map((f) => f.trim())
      .filter((f) => f.length > 0);
    const features = inheritYearlyFeatures
      ? [...draft.features, ...newFeatures]
      : newFeatures;
    setYearlyDraft((d) => (d ? { ...d, features } : null));
    setInputValue("");
    setInputError(undefined);
    setStep("yearly_subtitle");
  };

  const handleYearlySubtitleSubmit = (value: string) => {
    setYearlyDraft((d) => (d ? { ...d, displaySubtitle: value.trim() || undefined } : null));
    setInputValue("");
    setInputError(undefined);
    setStep("yearly_badge");
  };

  const handleYearlyBadgeSubmit = (value: string) => {
    setYearlyDraft((d) => (d ? { ...d, badge: value.trim() || null } : null));
    setInputValue("");
    setInputError(undefined);
    setStep("yearly_highlighted");
  };

  const handleYearlyHighlightedConfirm = (confirmed: boolean) => {
    setYearlyDraft((d) => (d ? { ...d, highlighted: confirmed } : null));
    setInputValue("Get Started");
    setStep("yearly_cta");
  };

  const handleYearlyCtaSubmit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setInputError("CTA text is required");
      return;
    }
    setYearlyDraft((d) => (d ? { ...d, cta: trimmed } : null));
    setInputValue("");
    setInputError(undefined);
    setStep("creating_yearly");
  };

  // Menu operation handlers
  const handleOperationSelect = (operation: "add" | "remove" | "sync" | "regenerate" | "unarchive" | "cleanup") => {
    setLastOperation(operation);
    setOperationResults({ successes: [], failures: [] });

    switch (operation) {
      case "add":
        // Reset draft for new product
        setDraft({
          name: "",
          slug: "",
          type: "subscription",
          priceType: "fixed",
          displayTitle: "",
          features: [],
          badge: null,
          highlighted: false,
          cta: "Get Started",
        });
        setInputValue("");
        setStep("product_name");
        break;
      case "remove":
        setSelectedSlugs([]);
        setStep("select_for_remove");
        break;
      case "sync":
        setSelectedSlugs([]);
        setStep("select_for_sync");
        break;
      case "regenerate":
        setStep("regenerating");
        break;
      case "unarchive":
        setSelectedSlugs([]);
        setStep("select_for_unarchive");
        break;
      case "cleanup":
        setStep("loading_polar_products");
        break;
    }
  };

  const handleRemoveSelect = (slugs: string[]) => {
    if (slugs.length === 0) {
      setStep("show_menu");
      return;
    }
    setSelectedSlugs(slugs);
    setStep("confirm_remove");
  };

  const handleRemoveConfirm = (confirmed: boolean) => {
    if (!confirmed) {
      setStep("show_menu");
      return;
    }
    setStep("removing");
  };

  const handleSyncSelect = (slugs: string[]) => {
    if (slugs.length === 0) {
      setStep("show_menu");
      return;
    }
    setSelectedSlugs(slugs);
    setStep("confirm_sync");
  };

  const handleSyncConfirm = (confirmed: boolean) => {
    if (!confirmed) {
      setStep("show_menu");
      return;
    }
    setStep("syncing");
  };

  const handleContinueConfirm = (wantsContinue: boolean) => {
    if (!wantsContinue) {
      setStep("complete");
      return;
    }
    // Reset for next operation
    isCheckingSyncRef.current = false;
    setStep("checking_sync_status");
  };

  // Sandbox-to-production sync handlers
  const handleSandboxSyncPrompt = (wantsSync: boolean) => {
    if (!wantsSync) {
      // User declined - proceed to normal production menu
      setStep("checking_sync_status");
      return;
    }
    // Load sandbox products
    setStep("loading_sandbox_products");
  };

  const handleSandboxProductSelect = (slugs: string[]) => {
    if (slugs.length === 0) {
      // No products selected - proceed to normal menu
      setStep("checking_sync_status");
      return;
    }
    setSelectedSlugs(slugs);
    setStep("confirm_sandbox_sync");
  };

  const handleSandboxSyncConfirm = (confirmed: boolean) => {
    if (!confirmed) {
      setStep("checking_sync_status");
      return;
    }
    setStep("syncing_sandbox_to_prod");
  };

  // Unarchive handlers
  const handleUnarchiveSelect = (slugs: string[]) => {
    if (slugs.length === 0) {
      setStep("show_menu");
      return;
    }
    setSelectedSlugs(slugs);
    setStep("confirm_unarchive");
  };

  const handleUnarchiveConfirm = (confirmed: boolean) => {
    if (!confirmed) {
      setStep("show_menu");
      return;
    }
    setStep("unarchiving");
  };

  // Cleanup handlers
  const handleCleanupSelect = (productIds: string[]) => {
    if (productIds.length === 0) {
      setStep("show_menu");
      return;
    }
    setSelectedPolarProductIds(productIds);
    setStep("confirm_cleanup");
  };

  const handleCleanupActionSelect = (action: string) => {
    setCleanupAction(action as "archive" | "import");
    setStep("cleaning_up");
  };

  // Remove operation effect
  useEffect(() => {
    if (step === "removing" && credentials && !isRemovingRef.current) {
      isRemovingRef.current = true;
      const remove = async () => {
        const successes: string[] = [];
        const failures: { slug: string; error: string }[] = [];

        let currentProducts = [...products];

        for (const slug of selectedSlugs) {
          const product = currentProducts.find((p) => p.slug === slug);
          if (!product) {
            failures.push({ slug, error: "Product not found" });
            continue;
          }

          // Archive on Polar if it has a polarProductId
          if (product.polarProductId) {
            const archiveResult = await archivePolarProduct(
              credentials,
              product.polarProductId,
              env
            );
            if (!archiveResult.success) {
              failures.push({ slug, error: archiveResult.error });
              continue;
            }
          }

          // Remove from local array
          currentProducts = removeProduct(currentProducts, slug);
          successes.push(slug);
        }

        // Save to JSON
        const writeResult = await writeProductsFile(projectDir, env, currentProducts);
        if (!writeResult.success) {
          setError(writeResult.error ?? "Failed to save products");
          setStep("error");
          isRemovingRef.current = false;
          return;
        }

        // Regenerate TypeScript
        await generateProductsTs(projectDir);

        setProducts(currentProducts);
        setOperationResults({ successes, failures });
        isRemovingRef.current = false;
        setStep("operation_complete");
      };
      remove();
    }
  }, [step, credentials, selectedSlugs, products, projectDir, env]);

  // Sync operation effect
  useEffect(() => {
    if (step === "syncing" && credentials && !isSyncingRef.current) {
      isSyncingRef.current = true;
      const sync = async () => {
        const successes: string[] = [];
        const failures: { slug: string; error: string }[] = [];

        const currentProducts = [...products];
        let hasChanges = false;

        for (const slug of selectedSlugs) {
          const productIndex = currentProducts.findIndex((p) => p.slug === slug);
          if (productIndex === -1) {
            failures.push({ slug, error: "Product not found" });
            continue;
          }
          const product = currentProducts[productIndex]!;

          if (product.polarProductId) {
            // Update existing product on Polar
            const updateResult = await updatePolarProduct(
              credentials,
              product.polarProductId,
              product,
              env
            );
            if (updateResult.success) {
              successes.push(slug);
            } else {
              failures.push({ slug, error: updateResult.error });
            }
          } else {
            // Create new product on Polar
            const createResult = await createPolarProduct(credentials, product, env);
            if (createResult.success) {
              currentProducts[productIndex] = {
                ...product,
                polarProductId: createResult.polarProductId,
              };
              hasChanges = true;
              successes.push(slug);
            } else {
              failures.push({ slug, error: createResult.error });
            }
          }
        }

        // Save to JSON if any polarProductIds changed
        if (hasChanges) {
          const writeResult = await writeProductsFile(projectDir, env, currentProducts);
          if (!writeResult.success) {
            setError(writeResult.error ?? "Failed to save products");
            setStep("error");
            isSyncingRef.current = false;
            return;
          }
          setProducts(currentProducts);
        }

        // Regenerate TypeScript
        await generateProductsTs(projectDir);

        setOperationResults({ successes, failures });
        isSyncingRef.current = false;
        setStep("operation_complete");
      };
      sync();
    }
  }, [step, credentials, selectedSlugs, products, projectDir, env]);

  // Regenerate operation effect
  useEffect(() => {
    if (step === "regenerating" && !isRegeneratingRef.current) {
      isRegeneratingRef.current = true;
      const regenerate = async () => {
        const result = await generateProductsTs(projectDir);
        if (result.success) {
          setOperationResults({ successes: ["TypeScript exports regenerated"], failures: [] });
        } else {
          setOperationResults({ successes: [], failures: [{ slug: "regenerate", error: result.error ?? "Unknown error" }] });
        }
        isRegeneratingRef.current = false;
        setStep("operation_complete");
      };
      regenerate();
    }
  }, [step, projectDir]);

  // Sandbox-to-production sync effect
  useEffect(() => {
    if (step === "syncing_sandbox_to_prod" && credentials && !isSyncingSandboxRef.current) {
      isSyncingSandboxRef.current = true;
      const syncSandboxToProd = async () => {
        const successes: string[] = [];
        const failures: { slug: string; error: string }[] = [];
        const newProducts: Product[] = [];

        for (const slug of selectedSlugs) {
          const sandboxProduct = sandboxProducts.find((p) => p.slug === slug);
          if (!sandboxProduct) {
            failures.push({ slug, error: "Product not found in sandbox" });
            continue;
          }

          // Create a copy without polarProductId (new product in production)
          const productForProd: Product = {
            ...sandboxProduct,
            polarProductId: null,
          };

          // Create on Polar production
          const createResult = await createPolarProduct(credentials, productForProd, "production");
          if (createResult.success) {
            productForProd.polarProductId = createResult.polarProductId;
            newProducts.push(productForProd);
            successes.push(slug);
          } else {
            failures.push({ slug, error: createResult.error });
          }
        }

        // Add new products to production file
        if (newProducts.length > 0) {
          const updatedProducts = [...products, ...newProducts];
          const writeResult = await writeProductsFile(projectDir, "production", updatedProducts);
          if (!writeResult.success) {
            setError(writeResult.error ?? "Failed to save products to production file");
            setStep("error");
            isSyncingSandboxRef.current = false;
            return;
          }
          setProducts(updatedProducts);

          // Regenerate TypeScript
          await generateProductsTs(projectDir);
        }

        setLastOperation("sandbox_sync");
        setOperationResults({ successes, failures });
        isSyncingSandboxRef.current = false;
        setStep("operation_complete");
      };
      syncSandboxToProd();
    }
  }, [step, credentials, selectedSlugs, sandboxProducts, products, projectDir]);

  // Unarchive operation effect
  useEffect(() => {
    if (step === "unarchiving" && credentials && !isUnarchivingRef.current) {
      isUnarchivingRef.current = true;
      const unarchive = async () => {
        const successes: string[] = [];
        const failures: { slug: string; error: string }[] = [];

        for (const slug of selectedSlugs) {
          const product = products.find((p) => p.slug === slug);
          if (!product || !product.polarProductId) {
            failures.push({ slug, error: "Product not found or not synced" });
            continue;
          }

          const result = await unarchivePolarProduct(credentials, product.polarProductId, env);
          if (result.success) {
            successes.push(slug);
          } else {
            failures.push({ slug, error: result.error });
          }
        }

        setLastOperation("unarchive");
        setOperationResults({ successes, failures });
        isUnarchivingRef.current = false;
        setStep("operation_complete");
      };
      unarchive();
    }
  }, [step, credentials, selectedSlugs, products, env]);

  // Load Polar products for cleanup
  useEffect(() => {
    if (step === "loading_polar_products" && credentials && !isLoadingPolarProductsRef.current) {
      isLoadingPolarProductsRef.current = true;
      const load = async () => {
        const result = await listPolarProducts(credentials, env);
        if (!result.success) {
          setError(result.error);
          isLoadingPolarProductsRef.current = false;
          setStep("error");
          return;
        }

        // Find orphaned products (on Polar but not in local file)
        const localProductIds = new Set(products.map((p) => p.polarProductId).filter(Boolean));
        const orphaned = result.products.filter((p) => !localProductIds.has(p.id) && !p.isArchived);

        if (orphaned.length === 0) {
          setOperationResults({ successes: ["No orphaned products found on Polar"], failures: [] });
          setLastOperation("cleanup");
          isLoadingPolarProductsRef.current = false;
          setStep("operation_complete");
          return;
        }

        setOrphanedPolarProducts(orphaned);
        isLoadingPolarProductsRef.current = false;
        setStep("show_orphaned_products");
      };
      load();
    }
  }, [step, credentials, products, env]);

  // Cleanup operation effect
  useEffect(() => {
    if (step === "cleaning_up" && credentials && !isCleaningUpRef.current) {
      isCleaningUpRef.current = true;
      const cleanup = async () => {
        const successes: string[] = [];
        const failures: { slug: string; error: string }[] = [];

        for (const productId of selectedPolarProductIds) {
          const polarProduct = orphanedPolarProducts.find((p) => p.id === productId);
          if (!polarProduct) {
            failures.push({ slug: productId, error: "Product not found" });
            continue;
          }

          if (cleanupAction === "archive") {
            const result = await archivePolarProduct(credentials, productId, env);
            if (result.success) {
              successes.push(polarProduct.name);
            } else {
              failures.push({ slug: polarProduct.name, error: result.error });
            }
          } else if (cleanupAction === "import") {
            // Create minimal local product entry
            const slug = polarProduct.slug || toKebabCase(polarProduct.name);
            const newProduct: Product = {
              slug,
              name: polarProduct.name,
              type: "one_time",
              prices: [{ amountType: "free" }],
              display: {
                title: polarProduct.name,
                badge: null,
                features: [],
                highlighted: false,
                cta: "Get Started",
              },
              polarProductId: productId,
            };

            // Check for duplicate slug
            if (products.some((p) => p.slug === slug)) {
              failures.push({ slug: polarProduct.name, error: `Slug "${slug}" already exists locally` });
              continue;
            }

            // Add to products
            const updatedProducts = [...products, newProduct];
            const writeResult = await writeProductsFile(projectDir, env, updatedProducts);
            if (writeResult.success) {
              setProducts(updatedProducts);
              successes.push(polarProduct.name);
            } else {
              failures.push({ slug: polarProduct.name, error: writeResult.error ?? "Failed to save" });
            }
          }
        }

        // Regenerate TypeScript if we imported products
        if (cleanupAction === "import" && successes.length > 0) {
          await generateProductsTs(projectDir);
        }

        setLastOperation("cleanup");
        setOperationResults({ successes, failures });
        isCleaningUpRef.current = false;
        setStep("operation_complete");
      };
      cleanup();
    }
  }, [step, credentials, selectedPolarProductIds, orphanedPolarProducts, cleanupAction, products, projectDir, env]);

  // Determine the header title based on step
  const getHeaderTitle = () => {
    if (step === "show_menu" || step === "checking_sync_status") {
      return `Products Manager (${env})`;
    }
    if (step === "ask_sandbox_sync" || step === "loading_sandbox_products" || step === "select_sandbox_products" || step === "confirm_sandbox_sync" || step === "syncing_sandbox_to_prod") {
      return `Sandbox → Production Sync`;
    }
    if (step.startsWith("select_for_remove") || step === "confirm_remove" || step === "removing") {
      return `Remove Products (${env})`;
    }
    if (step.startsWith("select_for_sync") || step === "confirm_sync" || step === "syncing") {
      return `Sync Products (${env})`;
    }
    if (step.startsWith("select_for_unarchive") || step === "confirm_unarchive" || step === "unarchiving") {
      return `Unarchive Products (${env})`;
    }
    if (step === "loading_polar_products" || step === "show_orphaned_products" || step === "confirm_cleanup" || step === "cleaning_up") {
      return `Clean Up Polar Products (${env})`;
    }
    if (step === "regenerating") {
      return `Regenerate TypeScript (${env})`;
    }
    if (step === "operation_complete" || step === "ask_continue") {
      return `Products Manager (${env})`;
    }
    return `Create Product (${env})`;
  };

  // Check if any products are archived
  const hasArchivedProducts = Array.from(syncStatus.values()).some((s) => s === "archived");

  // Render based on step
  return (
    <Box flexDirection="column">
      <SectionHeader title={getHeaderTitle()} />

      {step === "init" && <Spinner label="Loading products file..." />}

      {step === "load_credentials" && <Spinner label="Loading Polar credentials..." />}

      {step === "checking_sync_status" && <Spinner label="Checking product sync status..." />}

      {step === "ask_sandbox_sync" && (
        <Box flexDirection="column">
          <Text>You are running in production mode.</Text>
          <Box marginTop={1}>
            <Confirm
              label="Would you like to sync sandbox products to production?"
              onConfirm={handleSandboxSyncPrompt}
              defaultValue={true}
            />
          </Box>
        </Box>
      )}

      {step === "loading_sandbox_products" && <Spinner label="Loading sandbox products..." />}

      {step === "select_sandbox_products" && (
        <Box flexDirection="column">
          {sandboxProducts.length === 0 ? (
            <Box flexDirection="column">
              <Text>No sandbox products found to sync.</Text>
              <Box marginTop={1}>
                <Text dimColor>Continuing to production menu...</Text>
              </Box>
            </Box>
          ) : (
            <MultiSelect
              label="Select sandbox products to create in production"
              items={sandboxProducts.map((p) => ({ label: `${p.name} (${p.slug})`, value: p.slug }))}
              onSubmit={handleSandboxProductSelect}
            />
          )}
        </Box>
      )}

      {step === "confirm_sandbox_sync" && (
        <Box flexDirection="column">
          <Text>
            You are about to create {selectedSlugs.length} product{selectedSlugs.length !== 1 ? "s" : ""} in production:
          </Text>
          <Box flexDirection="column" marginLeft={2} marginTop={1}>
            {selectedSlugs.map((slug) => {
              const product = sandboxProducts.find((p) => p.slug === slug);
              return (
                <Text key={slug}>- {product?.name ?? slug} ({slug})</Text>
              );
            })}
          </Box>
          <Box marginTop={1}>
            <Text dimColor>These will be created as new products on Polar production.</Text>
          </Box>
          <Box marginTop={1}>
            <Confirm
              label="Continue with sandbox to production sync?"
              onConfirm={handleSandboxSyncConfirm}
              defaultValue={true}
            />
          </Box>
        </Box>
      )}

      {step === "syncing_sandbox_to_prod" && <Spinner label="Creating products in production..." />}

      {step === "show_menu" && (
        <Box flexDirection="column">
          {products.length > 0 && (
            <Box flexDirection="column" marginBottom={1}>
              <Text bold>Products:</Text>
              <ProductList products={products} syncStatus={syncStatus} />
            </Box>
          )}
          <OperationMenu
            onSelect={handleOperationSelect}
            hasProducts={products.length > 0}
            hasArchivedProducts={hasArchivedProducts}
          />
        </Box>
      )}

      {step === "select_for_remove" && (
        <MultiSelect
          label="Select products to remove"
          items={products.map((p) => ({ label: `${p.name} (${p.slug})`, value: p.slug }))}
          onSubmit={handleRemoveSelect}
        />
      )}

      {step === "confirm_remove" && (
        <Box flexDirection="column">
          <Text color="yellow">
            You are about to remove {selectedSlugs.length} product{selectedSlugs.length !== 1 ? "s" : ""}:
          </Text>
          <Box flexDirection="column" marginLeft={2} marginTop={1}>
            {selectedSlugs.map((slug) => (
              <Text key={slug}>- {slug}</Text>
            ))}
          </Box>
          {selectedSlugs.length === products.length && (
            <Box marginTop={1}>
              <Text color="red" bold>Warning: This will remove ALL products!</Text>
            </Box>
          )}
          <Box marginTop={1}>
            <Confirm
              label="Are you sure you want to remove these products?"
              onConfirm={handleRemoveConfirm}
              defaultValue={false}
            />
          </Box>
        </Box>
      )}

      {step === "removing" && <Spinner label="Removing products..." />}

      {step === "select_for_sync" && (
        <MultiSelect
          label="Select products to sync"
          items={products.map((p) => ({ label: `${p.name} (${p.slug})`, value: p.slug }))}
          onSubmit={handleSyncSelect}
        />
      )}

      {step === "confirm_sync" && (
        <Box flexDirection="column">
          <Text>
            You are about to sync {selectedSlugs.length} product{selectedSlugs.length !== 1 ? "s" : ""} to Polar:
          </Text>
          <Box flexDirection="column" marginLeft={2} marginTop={1}>
            {selectedSlugs.map((slug) => {
              const product = products.find((p) => p.slug === slug);
              const hasId = product?.polarProductId;
              return (
                <Text key={slug}>
                  - {slug} {hasId ? "(update)" : "(create new)"}
                </Text>
              );
            })}
          </Box>
          <Box marginTop={1}>
            <Confirm
              label="Continue with sync?"
              onConfirm={handleSyncConfirm}
              defaultValue={true}
            />
          </Box>
        </Box>
      )}

      {step === "syncing" && <Spinner label="Syncing products to Polar..." />}

      {step === "regenerating" && <Spinner label="Regenerating TypeScript exports..." />}

      {step === "select_for_unarchive" && (
        <MultiSelect
          label="Select archived products to unarchive"
          items={products
            .filter((p) => syncStatus.get(p.slug) === "archived")
            .map((p) => ({ label: `${p.name} (${p.slug})`, value: p.slug }))}
          onSubmit={handleUnarchiveSelect}
        />
      )}

      {step === "confirm_unarchive" && (
        <Box flexDirection="column">
          <Text>
            You are about to unarchive {selectedSlugs.length} product{selectedSlugs.length !== 1 ? "s" : ""} on Polar:
          </Text>
          <Box flexDirection="column" marginLeft={2} marginTop={1}>
            {selectedSlugs.map((slug) => (
              <Text key={slug}>- {slug}</Text>
            ))}
          </Box>
          <Box marginTop={1}>
            <Text dimColor>These products will become available for purchase again.</Text>
          </Box>
          <Box marginTop={1}>
            <Confirm
              label="Continue with unarchive?"
              onConfirm={handleUnarchiveConfirm}
              defaultValue={true}
            />
          </Box>
        </Box>
      )}

      {step === "unarchiving" && <Spinner label="Unarchiving products on Polar..." />}

      {step === "loading_polar_products" && <Spinner label="Loading products from Polar..." />}

      {step === "show_orphaned_products" && (
        <Box flexDirection="column">
          <Text>Found {orphanedPolarProducts.length} product{orphanedPolarProducts.length !== 1 ? "s" : ""} on Polar that are not in your local file:</Text>
          <Box flexDirection="column" marginLeft={2} marginTop={1} marginBottom={1}>
            {orphanedPolarProducts.map((p) => (
              <Text key={p.id} dimColor>- {p.name}</Text>
            ))}
          </Box>
          <MultiSelect
            label="Select products to clean up"
            items={orphanedPolarProducts.map((p) => ({ label: p.name, value: p.id }))}
            onSubmit={handleCleanupSelect}
          />
        </Box>
      )}

      {step === "confirm_cleanup" && (
        <Box flexDirection="column">
          <Text>
            What would you like to do with {selectedPolarProductIds.length} selected product{selectedPolarProductIds.length !== 1 ? "s" : ""}?
          </Text>
          <Box marginTop={1}>
            <Select
              label="Cleanup action"
              options={[
                { label: "Archive on Polar (remove from sale)", value: "archive" },
                { label: "Import to local file (create minimal entries)", value: "import" },
              ]}
              onSelect={handleCleanupActionSelect}
            />
          </Box>
        </Box>
      )}

      {step === "cleaning_up" && <Spinner label={cleanupAction === "archive" ? "Archiving products on Polar..." : "Importing products to local file..."} />}

      {step === "operation_complete" && (
        <Box flexDirection="column">
          {operationResults.successes.length > 0 && (
            <Box flexDirection="column">
              <StatusMessage status="success">
                {lastOperation === "regenerate" || lastOperation === "cleanup"
                  ? operationResults.successes[0] ?? `Successfully processed ${operationResults.successes.length} item${operationResults.successes.length !== 1 ? "s" : ""}`
                  : lastOperation === "add"
                  ? `Successfully created ${operationResults.successes.length} product${operationResults.successes.length !== 1 ? "s" : ""}`
                  : lastOperation === "sandbox_sync"
                  ? `Successfully synced ${operationResults.successes.length} product${operationResults.successes.length !== 1 ? "s" : ""} to production`
                  : lastOperation === "unarchive"
                  ? `Successfully unarchived ${operationResults.successes.length} product${operationResults.successes.length !== 1 ? "s" : ""}`
                  : `Successfully ${lastOperation === "remove" ? "removed" : "synced"} ${operationResults.successes.length} product${operationResults.successes.length !== 1 ? "s" : ""}`}
              </StatusMessage>
              {lastOperation !== "regenerate" && lastOperation !== "cleanup" && (
                <Box flexDirection="column" marginLeft={2}>
                  {operationResults.successes.map((slug) => (
                    <Text key={slug} color="green">- {slug}</Text>
                  ))}
                </Box>
              )}
              {lastOperation === "cleanup" && operationResults.successes.length > 1 && (
                <Box flexDirection="column" marginLeft={2}>
                  {operationResults.successes.map((name) => (
                    <Text key={name} color="green">- {name}</Text>
                  ))}
                </Box>
              )}
            </Box>
          )}
          {operationResults.failures.length > 0 && (
            <Box flexDirection="column" marginTop={1}>
              <StatusMessage status="error">
                Failed to {lastOperation === "add" ? "sync" : lastOperation === "remove" ? "remove" : lastOperation === "sync" ? "sync" : lastOperation === "sandbox_sync" ? "sync to production" : lastOperation === "unarchive" ? "unarchive" : lastOperation === "cleanup" ? "clean up" : "regenerate"} {operationResults.failures.length} item{operationResults.failures.length !== 1 ? "s" : ""}
              </StatusMessage>
              <Box flexDirection="column" marginLeft={2}>
                {operationResults.failures.map(({ slug, error }) => (
                  <Text key={slug} color="red">- {slug}: {error}</Text>
                ))}
              </Box>
            </Box>
          )}
          <Box marginTop={1}>
            <Confirm
              label="Perform another operation?"
              onConfirm={handleContinueConfirm}
              defaultValue={true}
            />
          </Box>
        </Box>
      )}

      {step === "ask_continue" && (
        <Confirm
          label="Perform another operation?"
          onConfirm={handleContinueConfirm}
          defaultValue={true}
        />
      )}

      {step === "prompt_access_token" && (
        <TextInput
          label="Polar Access Token"
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleAccessTokenSubmit}
          placeholder="polar_..."
          mask="*"
          error={inputError}
        />
      )}

      {step === "product_name" && (
        <TextInput
          label="Product Name"
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleProductNameSubmit}
          placeholder="e.g., Pro Monthly"
          error={inputError}
        />
      )}

      {step === "product_slug" && (
        <TextInput
          label="Product Slug"
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleProductSlugSubmit}
          placeholder="e.g., pro-monthly"
          error={inputError}
        />
      )}

      {step === "product_type" && (
        <Select
          label="Product Type"
          options={[
            { label: "Subscription", value: "subscription" },
            { label: "One-time purchase", value: "one_time" },
            { label: "Free", value: "free" },
          ]}
          onSelect={handleProductTypeSelect}
        />
      )}

      {step === "recurring_interval" && (
        <Select
          label="Billing Interval"
          options={[
            { label: "Monthly", value: "month" },
            { label: "Yearly", value: "year" },
            { label: "Weekly", value: "week" },
            { label: "Daily", value: "day" },
          ]}
          onSelect={handleRecurringIntervalSelect}
        />
      )}

      {step === "price_type" && (
        <Select
          label="Price Type"
          options={[
            { label: "Fixed price", value: "fixed" },
            { label: "Pay what you want", value: "custom" },
            { label: "Free", value: "free" },
          ]}
          onSelect={handlePriceTypeSelect}
        />
      )}

      {step === "price_amount" && (
        <TextInput
          label={draft.priceType === "custom" ? "Minimum Price (USD)" : "Price (USD)"}
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handlePriceAmountSubmit}
          placeholder="e.g., 19.00"
          error={inputError}
        />
      )}

      {step === "description" && (
        <TextInput
          label="Description (optional)"
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleDescriptionSubmit}
          placeholder="Short description of the product"
          error={inputError}
        />
      )}

      {step === "display_title" && (
        <TextInput
          label="Display Title"
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleDisplayTitleSubmit}
          placeholder="Title shown on pricing page"
          error={inputError}
        />
      )}

      {step === "display_subtitle" && (
        <TextInput
          label="Display Subtitle (optional)"
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleDisplaySubtitleSubmit}
          placeholder="e.g., Billed monthly"
          error={inputError}
        />
      )}

      {step === "features" && (
        <TextInput
          label="Features (comma-separated)"
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleFeaturesSubmit}
          placeholder="e.g., Unlimited projects, Priority support"
          error={inputError}
        />
      )}

      {step === "badge" && (
        <TextInput
          label="Badge (optional)"
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleBadgeSubmit}
          placeholder="e.g., Popular, Best Value"
          error={inputError}
        />
      )}

      {step === "highlighted" && (
        <Confirm
          label="Highlight this product?"
          onConfirm={handleHighlightedConfirm}
          defaultValue={false}
        />
      )}

      {step === "cta" && (
        <TextInput
          label="CTA Button Text"
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleCtaSubmit}
          placeholder="e.g., Get Started"
          error={inputError}
        />
      )}

      {step === "creating" && <Spinner label="Creating product..." />}

      {step === "ask_yearly" && (
        <Box flexDirection="column">
          <StatusMessage status={polarSyncSuccess ? "success" : "error"}>
            {polarSyncSuccess
              ? `Product created and synced to Polar`
              : `Product saved locally (Polar sync failed)`}
          </StatusMessage>
          {polarSyncError && (
            <Box marginTop={1}>
              <Text dimColor>Error: {polarSyncError}</Text>
            </Box>
          )}
          <Box marginTop={1}>
            <Confirm
              label="Create yearly version? (10x monthly = 2 months free)"
              onConfirm={handleAskYearlyConfirm}
              defaultValue={true}
            />
          </Box>
        </Box>
      )}

      {step === "yearly_slug" && (
        <TextInput
          label="Yearly Slug"
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleYearlySlugSubmit}
          placeholder="e.g., pro-yearly"
          error={inputError}
        />
      )}

      {step === "yearly_price" && (
        <Box flexDirection="column">
          <Text dimColor>
            Suggested: ${((draft.priceAmountCents || 0) * 10 / 100).toFixed(2)}/year (2 months free)
          </Text>
          <TextInput
            label="Yearly Price (USD)"
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleYearlyPriceSubmit}
            placeholder="e.g., 190.00"
            error={inputError}
          />
        </Box>
      )}

      {step === "yearly_title" && (
        <TextInput
          label="Yearly Display Title"
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleYearlyTitleSubmit}
          placeholder="e.g., Pro Yearly"
          error={inputError}
        />
      )}

      {step === "yearly_description_choice" && (
        <Select
          label="Description"
          options={[
            { label: "Same as monthly", value: "inherit" },
            { label: "Write new description", value: "new" },
          ]}
          onSelect={handleYearlyDescriptionChoiceSelect}
        />
      )}

      {step === "yearly_description" && (
        <TextInput
          label="Yearly Description"
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleYearlyDescriptionSubmit}
          placeholder="Description for yearly plan"
          error={inputError}
        />
      )}

      {step === "yearly_features_choice" && (
        <Select
          label="Features"
          options={[
            { label: "Same as monthly", value: "inherit" },
            { label: "Same + add more", value: "add" },
            { label: "Write new features", value: "new" },
          ]}
          onSelect={handleYearlyFeaturesChoiceSelect}
        />
      )}

      {step === "yearly_features" && (
        <TextInput
          label={inheritYearlyFeatures ? "Additional Features (comma-separated)" : "Features (comma-separated)"}
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleYearlyFeaturesSubmit}
          placeholder="e.g., Exclusive yearly bonus"
          error={inputError}
        />
      )}

      {step === "yearly_subtitle" && (
        <TextInput
          label="Yearly Subtitle (optional)"
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleYearlySubtitleSubmit}
          placeholder="e.g., Save 2 months"
          error={inputError}
        />
      )}

      {step === "yearly_badge" && (
        <TextInput
          label="Yearly Badge (optional)"
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleYearlyBadgeSubmit}
          placeholder="e.g., Best Value"
          error={inputError}
        />
      )}

      {step === "yearly_highlighted" && (
        <Confirm
          label="Highlight yearly product?"
          onConfirm={handleYearlyHighlightedConfirm}
          defaultValue={true}
        />
      )}

      {step === "yearly_cta" && (
        <TextInput
          label="Yearly CTA Button Text"
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleYearlyCtaSubmit}
          placeholder="e.g., Get Started"
          error={inputError}
        />
      )}

      {step === "creating_yearly" && <Spinner label="Creating yearly product..." />}

      {step === "complete" && (
        <Box flexDirection="column">
          <StatusMessage status="success">Done!</StatusMessage>
          <Box marginTop={1}>
            <Text dimColor>Products saved to products.{env}.json</Text>
          </Box>
        </Box>
      )}

      {step === "error" && (
        <Box flexDirection="column">
          <StatusMessage status="error">{error}</StatusMessage>
          <Box marginTop={1}>
            <Text dimColor>
              Make sure you are running this command from an eniem project directory.
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};
