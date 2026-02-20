import { useState, useEffect } from "react";
import type { SyncStatus } from "../../components/index.js";
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
} from "../../lib/products.js";
import {
  loadPolarCredentials,
  createPolarProduct,
  checkProductExists,
  updatePolarProduct,
  archivePolarProduct,
  unarchivePolarProduct,
  listPolarProducts,
  type PolarCredentials,
  type PolarProductInfo,
} from "../../lib/polar.js";
import type {
  WizardStep,
  ProductDraft,
  ProductsCommandProps,
  OperationType,
  OperationResults,
} from "../products/types.js";

const INITIAL_DRAFT: ProductDraft = {
  name: "",
  slug: "",
  type: "subscription",
  priceType: "fixed",
  displayTitle: "",
  features: [],
  badge: null,
  highlighted: false,
  cta: "Get Started",
};

export function useProductsManager({ env, projectDir, accessToken }: ProductsCommandProps) {
  // Wizard state
  const [step, setStep] = useState<WizardStep>("init");
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [credentials, setCredentials] = useState<PolarCredentials | null>(null);

  // Product draft state
  const [draft, setDraft] = useState<ProductDraft>(INITIAL_DRAFT);
  const [yearlyDraft, setYearlyDraft] = useState<ProductDraft | null>(null);
  const [inheritYearlyFeatures, setInheritYearlyFeatures] = useState(true);

  // Input state
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState<string | undefined>(undefined);

  // Created products
  const [createdProduct, setCreatedProduct] = useState<Product | null>(null);
  const [polarSyncSuccess, setPolarSyncSuccess] = useState<boolean | null>(null);
  const [polarSyncError, setPolarSyncError] = useState<string | null>(null);

  // Menu operation state
  const [syncStatus, setSyncStatus] = useState<Map<string, SyncStatus>>(new Map());
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [operationResults, setOperationResults] = useState<OperationResults>({ successes: [], failures: [] });
  const [lastOperation, setLastOperation] = useState<OperationType | null>(null);

  // Sandbox-to-production sync state
  const [sandboxProducts, setSandboxProducts] = useState<Product[]>([]);
  const [askedSandboxSync, setAskedSandboxSync] = useState(false);
  const [sandboxHasProducts, setSandboxHasProducts] = useState(false);

  // Polar cleanup state
  const [orphanedPolarProducts, setOrphanedPolarProducts] = useState<PolarProductInfo[]>([]);
  const [selectedPolarProductIds, setSelectedPolarProductIds] = useState<string[]>([]);
  const [cleanupAction, setCleanupAction] = useState<"archive" | "import" | null>(null);

  // ============================================================================
  // Helpers
  // ============================================================================

  const buildProduct = (d: ProductDraft): Product => ({
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
        ? { amountType: "custom" as const, amount: d.priceAmountCents, currency: "usd" as const }
        : { amountType: "fixed" as const, amount: d.priceAmountCents, currency: "usd" as const },
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
  });

  const clearInput = () => {
    setInputValue("");
    setInputError(undefined);
  };

  // ============================================================================
  // Lifecycle effects (auto-transition steps only)
  // ============================================================================

  // Initialize: Read products file
  useEffect(() => {
    if (step !== "init") return;
    const init = async () => {
      const result = await readProductsFile(projectDir, env);
      if (!result.success) {
        if (env === "production" && result.error.includes("not found")) {
          const sandboxResult = await readProductsFile(projectDir, "sandbox");
          if (sandboxResult.success && sandboxResult.products.length > 0) {
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
    void init();
  }, [step, projectDir, env]);

  // Load credentials
  useEffect(() => {
    if (step !== "load_credentials") return;
    const load = async () => {
      let creds: PolarCredentials | null = null;

      if (accessToken) {
        creds = { accessToken };
      } else {
        const result = await loadPolarCredentials(projectDir);
        if (result.success) {
          creds = result.credentials;
        }
      }

      if (!creds) {
        setStep("prompt_access_token");
        return;
      }

      setCredentials(creds);
      if (env === "production" && !askedSandboxSync) {
        setAskedSandboxSync(true);
        setStep("ask_sandbox_sync");
      } else {
        setStep("checking_sync_status");
      }
    };
    void load();
  }, [step, projectDir, env, askedSandboxSync, accessToken]);

  // Check sync status for all products
  useEffect(() => {
    if (step !== "checking_sync_status" || !credentials) return;
    const checkSync = async () => {
      const newSyncStatus = new Map<string, SyncStatus>();

      for (const product of products) {
        newSyncStatus.set(product.slug, "checking");
      }
      setSyncStatus(new Map(newSyncStatus));

      for (const product of products) {
        if (!product.polarProductId) {
          newSyncStatus.set(product.slug, "not-synced");
          continue;
        }
        const result = await checkProductExists(credentials, product.polarProductId, env);
        if (result.exists) {
          newSyncStatus.set(product.slug, result.isArchived ? "archived" : "synced");
        } else if ("error" in result) {
          newSyncStatus.set(product.slug, "error");
        } else {
          newSyncStatus.set(product.slug, "not-synced");
        }
      }

      if (env === "production" && products.length === 0) {
        const sandboxResult = await readProductsFile(projectDir, "sandbox");
        setSandboxHasProducts(sandboxResult.success && sandboxResult.products.length > 0);
      } else {
        setSandboxHasProducts(false);
      }

      setSyncStatus(new Map(newSyncStatus));
      setStep("show_menu");
    };
    void checkSync();
  }, [step, credentials, products, env, projectDir]);

  // ============================================================================
  // Credential handlers
  // ============================================================================

  const handleAccessTokenSubmit = (value: string) => {
    if (!value.trim()) {
      setInputError("Access token is required");
      return;
    }
    clearInput();
    setCredentials({ accessToken: value.trim() });
    if (env === "production" && !askedSandboxSync) {
      setAskedSandboxSync(true);
      setStep("ask_sandbox_sync");
    } else {
      setStep("checking_sync_status");
    }
  };

  // ============================================================================
  // Add product handlers
  // ============================================================================

  const handleProductNameSubmit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) { setInputError("Product name is required"); return; }
    if (trimmed.length > 99) { setInputError("Product name must be 99 characters or less"); return; }
    setDraft((d) => ({ ...d, name: trimmed, slug: toKebabCase(trimmed), displayTitle: trimmed }));
    setInputValue(toKebabCase(trimmed));
    setInputError(undefined);
    setStep("product_slug");
  };

  const handleProductSlugSubmit = (value: string) => {
    const trimmed = value.trim();
    const validation = validateSlug(trimmed);
    if (!validation.success) { setInputError(validation.error); return; }
    if (slugExists(products, trimmed)) { setInputError(`Slug "${trimmed}" already exists`); return; }
    setDraft((d) => ({ ...d, slug: trimmed }));
    clearInput();
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
    setDraft((d) => ({ ...d, recurringInterval: value as "day" | "week" | "month" | "year" }));
    setStep("price_type");
  };

  const handlePriceTypeSelect = (value: string) => {
    const priceType = value as "fixed" | "custom" | "free";
    setDraft((d) => ({ ...d, priceType }));
    setStep(priceType === "free" ? "description" : "price_amount");
  };

  const handlePriceAmountSubmit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) { setInputError("Price is required"); return; }
    const amount = parseFloat(trimmed);
    if (isNaN(amount) || amount < 0) { setInputError("Please enter a valid price"); return; }
    const cents = dollarsToCents(amount);
    if (draft.priceType === "fixed") {
      const priceValidation = validatePrice(cents);
      if (!priceValidation.success) { setInputError(priceValidation.error); return; }
    }
    setDraft((d) => ({ ...d, priceAmountCents: cents }));
    clearInput();
    setStep("description");
  };

  const handleDescriptionSubmit = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length > 200) { setInputError("Description must be 200 characters or less"); return; }
    setDraft((d) => ({ ...d, description: trimmed || undefined }));
    setInputValue(draft.displayTitle);
    setInputError(undefined);
    setStep("display_title");
  };

  const handleDisplayTitleSubmit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) { setInputError("Display title is required"); return; }
    setDraft((d) => ({ ...d, displayTitle: trimmed }));
    clearInput();
    setStep("display_subtitle");
  };

  const handleDisplaySubtitleSubmit = (value: string) => {
    setDraft((d) => ({ ...d, displaySubtitle: value.trim() || undefined }));
    clearInput();
    setStep("features");
  };

  const handleFeaturesSubmit = (value: string) => {
    const features = value.split(",").map((f) => f.trim()).filter((f) => f.length > 0);
    setDraft((d) => ({ ...d, features }));
    clearInput();
    setStep("badge");
  };

  const handleBadgeSubmit = (value: string) => {
    setDraft((d) => ({ ...d, badge: value.trim() || null }));
    clearInput();
    setStep("highlighted");
  };

  const handleHighlightedConfirm = (confirmed: boolean) => {
    setDraft((d) => ({ ...d, highlighted: confirmed }));
    setInputValue("Get Started");
    setStep("cta");
  };

  // Create product: handler-driven async (replaces creating effect + ref)
  const handleCtaSubmit = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) { setInputError("CTA text is required"); return; }
    const finalDraft = { ...draft, cta: trimmed };
    setDraft(finalDraft);
    clearInput();
    setStep("creating");

    const product = buildProduct(finalDraft);
    const polarResult = await createPolarProduct(credentials!, product, env);
    if (polarResult.success) {
      product.polarProductId = polarResult.polarProductId;
      setPolarSyncSuccess(true);
    } else {
      setPolarSyncSuccess(false);
      setPolarSyncError(polarResult.error);
    }

    const updatedProducts = [...products, product];
    const writeResult = await writeProductsFile(projectDir, env, updatedProducts);
    if (!writeResult.success) {
      setError(writeResult.error ?? "Failed to save product");
      setStep("error");
      return;
    }
    await generateProductsTs(projectDir);

    setProducts(updatedProducts);
    setCreatedProduct(product);

    if (finalDraft.type === "subscription" && finalDraft.recurringInterval === "month") {
      setStep("ask_yearly");
    } else {
      setStep("complete");
    }
  };

  // ============================================================================
  // Yearly product handlers
  // ============================================================================

  const handleAskYearlyConfirm = (confirmed: boolean) => {
    if (!confirmed) {
      setLastOperation("add");
      setOperationResults({
        successes: [createdProduct?.slug ?? "Product created"],
        failures: polarSyncSuccess ? [] : [{ slug: createdProduct?.slug ?? "product", error: polarSyncError ?? "Polar sync failed" }],
      });
      setStep("operation_complete");
      return;
    }
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
    if (!validation.success) { setInputError(validation.error); return; }
    if (slugExists(products, trimmed)) { setInputError(`Slug "${trimmed}" already exists`); return; }
    setYearlyDraft((d) => (d ? { ...d, slug: trimmed } : null));
    const suggestedPrice = calculateYearlyPrice(draft.priceAmountCents || 0) / 100;
    setInputValue(suggestedPrice.toString());
    setInputError(undefined);
    setStep("yearly_price");
  };

  const handleYearlyPriceSubmit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) { setInputError("Price is required"); return; }
    const amount = parseFloat(trimmed);
    if (isNaN(amount) || amount < 0) { setInputError("Please enter a valid price"); return; }
    const cents = dollarsToCents(amount);
    const priceValidation = validatePrice(cents);
    if (!priceValidation.success) { setInputError(priceValidation.error); return; }
    setYearlyDraft((d) => (d ? { ...d, priceAmountCents: cents } : null));
    setInputValue(yearlyDraft?.displayTitle || "");
    setInputError(undefined);
    setStep("yearly_title");
  };

  const handleYearlyTitleSubmit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) { setInputError("Display title is required"); return; }
    setYearlyDraft((d) => (d ? { ...d, displayTitle: trimmed, name: trimmed } : null));
    clearInput();
    setStep("yearly_description_choice");
  };

  const handleYearlyDescriptionChoiceSelect = (value: string) => {
    if (value === "inherit") {
      setYearlyDraft((d) => (d ? { ...d, description: draft.description } : null));
      setStep("yearly_features_choice");
    } else {
      setStep("yearly_description");
    }
  };

  const handleYearlyDescriptionSubmit = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length > 200) { setInputError("Description must be 200 characters or less"); return; }
    setYearlyDraft((d) => (d ? { ...d, description: trimmed || undefined } : null));
    clearInput();
    setStep("yearly_features_choice");
  };

  const handleYearlyFeaturesChoiceSelect = (value: string) => {
    if (value === "inherit") {
      setInheritYearlyFeatures(true);
      setYearlyDraft((d) => (d ? { ...d, features: draft.features } : null));
      setStep("yearly_subtitle");
    } else if (value === "add") {
      setInheritYearlyFeatures(true);
      clearInput();
      setStep("yearly_features");
    } else {
      setInheritYearlyFeatures(false);
      clearInput();
      setStep("yearly_features");
    }
  };

  const handleYearlyFeaturesSubmit = (value: string) => {
    const newFeatures = value.split(",").map((f) => f.trim()).filter((f) => f.length > 0);
    const features = inheritYearlyFeatures ? [...draft.features, ...newFeatures] : newFeatures;
    setYearlyDraft((d) => (d ? { ...d, features } : null));
    clearInput();
    setStep("yearly_subtitle");
  };

  const handleYearlySubtitleSubmit = (value: string) => {
    setYearlyDraft((d) => (d ? { ...d, displaySubtitle: value.trim() || undefined } : null));
    clearInput();
    setStep("yearly_badge");
  };

  const handleYearlyBadgeSubmit = (value: string) => {
    setYearlyDraft((d) => (d ? { ...d, badge: value.trim() || null } : null));
    clearInput();
    setStep("yearly_highlighted");
  };

  const handleYearlyHighlightedConfirm = (confirmed: boolean) => {
    setYearlyDraft((d) => (d ? { ...d, highlighted: confirmed } : null));
    setInputValue("Get Started");
    setStep("yearly_cta");
  };

  // Create yearly product: handler-driven async (replaces creating_yearly effect + ref)
  const handleYearlyCtaSubmit = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) { setInputError("CTA text is required"); return; }
    const finalYearlyDraft = yearlyDraft ? { ...yearlyDraft, cta: trimmed } : null;
    if (!finalYearlyDraft) return;

    setYearlyDraft(finalYearlyDraft);
    clearInput();
    setStep("creating_yearly");

    const product = buildProduct(finalYearlyDraft);
    const polarResult = await createPolarProduct(credentials!, product, env);
    if (polarResult.success) {
      product.polarProductId = polarResult.polarProductId;
    }

    const updatedProducts = [...products, product];
    const writeResult = await writeProductsFile(projectDir, env, updatedProducts);
    if (!writeResult.success) {
      setError(writeResult.error ?? "Failed to save yearly product");
      setStep("error");
      return;
    }
    await generateProductsTs(projectDir);
    setProducts(updatedProducts);

    const successes: string[] = [];
    const failures: { slug: string; error: string }[] = [];
    if (createdProduct) {
      if (polarSyncSuccess) {
        successes.push(createdProduct.slug);
      } else {
        failures.push({ slug: createdProduct.slug, error: polarSyncError ?? "Polar sync failed" });
      }
    }
    if (polarResult.success) {
      successes.push(product.slug);
    } else {
      failures.push({ slug: product.slug, error: polarResult.error });
    }

    setLastOperation("add");
    setOperationResults({ successes, failures });
    setStep("operation_complete");
  };

  // ============================================================================
  // Menu operation handlers
  // ============================================================================

  const handleOperationSelect = async (operation: OperationType) => {
    setLastOperation(operation);
    setOperationResults({ successes: [], failures: [] });

    switch (operation) {
      case "add":
        setDraft(INITIAL_DRAFT);
        clearInput();
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
      case "unarchive":
        setSelectedSlugs([]);
        setStep("select_for_unarchive");
        break;
      case "sync_from_sandbox":
        await loadSandboxProducts();
        break;
      case "cleanup":
        await loadPolarProducts();
        break;
      case "regenerate":
        await regenerateTs();
        break;
    }
  };

  // ============================================================================
  // Remove operation (handler-driven async, replaces effect + ref)
  // ============================================================================

  const handleRemoveSelect = (slugs: string[]) => {
    if (slugs.length === 0) { setStep("show_menu"); return; }
    setSelectedSlugs(slugs);
    setStep("confirm_remove");
  };

  const handleRemoveConfirm = async (confirmed: boolean) => {
    if (!confirmed) { setStep("show_menu"); return; }
    setStep("removing");

    const successes: string[] = [];
    const failures: { slug: string; error: string }[] = [];
    let currentProducts = [...products];

    for (const slug of selectedSlugs) {
      const product = currentProducts.find((p) => p.slug === slug);
      if (!product) { failures.push({ slug, error: "Product not found" }); continue; }

      if (product.polarProductId) {
        const archiveResult = await archivePolarProduct(credentials!, product.polarProductId, env);
        if (!archiveResult.success) { failures.push({ slug, error: archiveResult.error }); continue; }
      }
      currentProducts = removeProduct(currentProducts, slug);
      successes.push(slug);
    }

    const writeResult = await writeProductsFile(projectDir, env, currentProducts);
    if (!writeResult.success) {
      setError(writeResult.error ?? "Failed to save products");
      setStep("error");
      return;
    }
    await generateProductsTs(projectDir);

    setProducts(currentProducts);
    setOperationResults({ successes, failures });
    setStep("operation_complete");
  };

  // ============================================================================
  // Sync operation (handler-driven async, replaces effect + ref)
  // ============================================================================

  const handleSyncSelect = (slugs: string[]) => {
    if (slugs.length === 0) { setStep("show_menu"); return; }
    setSelectedSlugs(slugs);
    setStep("confirm_sync");
  };

  const handleSyncConfirm = async (confirmed: boolean) => {
    if (!confirmed) { setStep("show_menu"); return; }
    setStep("syncing");

    const successes: string[] = [];
    const failures: { slug: string; error: string }[] = [];
    const currentProducts = [...products];
    let hasChanges = false;

    for (const slug of selectedSlugs) {
      const productIndex = currentProducts.findIndex((p) => p.slug === slug);
      if (productIndex === -1) { failures.push({ slug, error: "Product not found" }); continue; }
      const product = currentProducts[productIndex]!;

      if (product.polarProductId) {
        const updateResult = await updatePolarProduct(credentials!, product.polarProductId, product, env);
        if (updateResult.success) { successes.push(slug); }
        else { failures.push({ slug, error: updateResult.error }); }
      } else {
        const createResult = await createPolarProduct(credentials!, product, env);
        if (createResult.success) {
          currentProducts[productIndex] = { ...product, polarProductId: createResult.polarProductId };
          hasChanges = true;
          successes.push(slug);
        } else { failures.push({ slug, error: createResult.error }); }
      }
    }

    if (hasChanges) {
      const writeResult = await writeProductsFile(projectDir, env, currentProducts);
      if (!writeResult.success) {
        setError(writeResult.error ?? "Failed to save products");
        setStep("error");
        return;
      }
      setProducts(currentProducts);
    }
    await generateProductsTs(projectDir);

    setOperationResults({ successes, failures });
    setStep("operation_complete");
  };

  // ============================================================================
  // Regenerate TypeScript (handler-driven async, replaces effect + ref)
  // ============================================================================

  const regenerateTs = async () => {
    setStep("regenerating");
    const result = await generateProductsTs(projectDir);
    if (result.success) {
      setOperationResults({ successes: ["TypeScript exports regenerated"], failures: [] });
    } else {
      setOperationResults({ successes: [], failures: [{ slug: "regenerate", error: result.error ?? "Unknown error" }] });
    }
    setStep("operation_complete");
  };

  // ============================================================================
  // Sandbox-to-production sync (handler-driven async, replaces effects + refs)
  // ============================================================================

  const handleSandboxSyncPrompt = (wantsSync: boolean) => {
    if (!wantsSync) { setStep("checking_sync_status"); return; }
    void loadSandboxProducts();
  };

  const loadSandboxProducts = async () => {
    setStep("loading_sandbox_products");
    const result = await readProductsFile(projectDir, "sandbox");
    if (!result.success || result.products.length === 0) {
      setStep("checking_sync_status");
      return;
    }
    setSandboxProducts(result.products);
    setStep("select_sandbox_products");
  };

  const handleSandboxProductSelect = (slugs: string[]) => {
    if (slugs.length === 0) { setStep("checking_sync_status"); return; }
    setSelectedSlugs(slugs);
    setStep("confirm_sandbox_sync");
  };

  const handleSandboxSyncConfirm = async (confirmed: boolean) => {
    if (!confirmed) { setStep("checking_sync_status"); return; }
    setStep("syncing_sandbox_to_prod");

    const successes: string[] = [];
    const failures: { slug: string; error: string }[] = [];
    const newProducts: Product[] = [];

    for (const slug of selectedSlugs) {
      const sandboxProduct = sandboxProducts.find((p) => p.slug === slug);
      if (!sandboxProduct) { failures.push({ slug, error: "Product not found in sandbox" }); continue; }

      const productForProd: Product = { ...sandboxProduct, polarProductId: null };
      const createResult = await createPolarProduct(credentials!, productForProd, "production");
      if (createResult.success) {
        productForProd.polarProductId = createResult.polarProductId;
        successes.push(slug);
      } else {
        failures.push({ slug, error: `Polar sync failed: ${createResult.error}` });
      }
      newProducts.push(productForProd);
    }

    if (newProducts.length > 0) {
      const updatedProducts = [...products, ...newProducts];
      const writeResult = await writeProductsFile(projectDir, "production", updatedProducts);
      if (!writeResult.success) {
        setError(writeResult.error ?? "Failed to save products to production file");
        setStep("error");
        return;
      }
      setProducts(updatedProducts);
      await generateProductsTs(projectDir);
    }

    setLastOperation("sandbox_sync");
    setOperationResults({ successes, failures });
    setStep("operation_complete");
  };

  // ============================================================================
  // Unarchive operation (handler-driven async, replaces effect + ref)
  // ============================================================================

  const handleUnarchiveSelect = (slugs: string[]) => {
    if (slugs.length === 0) { setStep("show_menu"); return; }
    setSelectedSlugs(slugs);
    setStep("confirm_unarchive");
  };

  const handleUnarchiveConfirm = async (confirmed: boolean) => {
    if (!confirmed) { setStep("show_menu"); return; }
    setStep("unarchiving");

    const successes: string[] = [];
    const failures: { slug: string; error: string }[] = [];

    for (const slug of selectedSlugs) {
      const product = products.find((p) => p.slug === slug);
      if (!product || !product.polarProductId) {
        failures.push({ slug, error: "Product not found or not synced" });
        continue;
      }
      const result = await unarchivePolarProduct(credentials!, product.polarProductId, env);
      if (result.success) { successes.push(slug); }
      else { failures.push({ slug, error: result.error }); }
    }

    setLastOperation("unarchive");
    setOperationResults({ successes, failures });
    setStep("operation_complete");
  };

  // ============================================================================
  // Cleanup operation (handler-driven async, replaces effects + refs)
  // ============================================================================

  const loadPolarProducts = async () => {
    setStep("loading_polar_products");
    const result = await listPolarProducts(credentials!, env);
    if (!result.success) {
      setError(result.error);
      setStep("error");
      return;
    }

    const localProductIds = new Set(products.map((p) => p.polarProductId).filter(Boolean));
    const orphaned = result.products.filter((p) => !localProductIds.has(p.id) && !p.isArchived);

    if (orphaned.length === 0) {
      setOperationResults({ successes: ["No orphaned products found on Polar"], failures: [] });
      setLastOperation("cleanup");
      setStep("operation_complete");
      return;
    }

    setOrphanedPolarProducts(orphaned);
    setStep("show_orphaned_products");
  };

  const handleCleanupSelect = (productIds: string[]) => {
    if (productIds.length === 0) { setStep("show_menu"); return; }
    setSelectedPolarProductIds(productIds);
    setStep("confirm_cleanup");
  };

  const handleCleanupActionSelect = async (action: string) => {
    const selectedAction = action as "archive" | "import";
    setCleanupAction(selectedAction);
    setStep("cleaning_up");

    const successes: string[] = [];
    const failures: { slug: string; error: string }[] = [];
    let currentProducts = [...products];

    for (const productId of selectedPolarProductIds) {
      const polarProduct = orphanedPolarProducts.find((p) => p.id === productId);
      if (!polarProduct) { failures.push({ slug: productId, error: "Product not found" }); continue; }

      if (selectedAction === "archive") {
        const result = await archivePolarProduct(credentials!, productId, env);
        if (result.success) { successes.push(polarProduct.name); }
        else { failures.push({ slug: polarProduct.name, error: result.error }); }
      } else {
        const slug = polarProduct.slug || toKebabCase(polarProduct.name);
        const productType: "subscription" | "one_time" | "free" = polarProduct.isRecurring
          ? "subscription"
          : polarProduct.prices[0]?.amountType === "free" ? "free" : "one_time";

        const prices: Product["prices"] = polarProduct.prices.map((p) => {
          if (p.amountType === "free") return { amountType: "free" as const };
          if (p.amountType === "custom") return { amountType: "custom" as const, amount: p.priceAmount ?? undefined, currency: "usd" as const };
          return { amountType: "fixed" as const, amount: p.priceAmount ?? undefined, currency: "usd" as const };
        });

        const newProduct: Product = {
          slug,
          name: polarProduct.name,
          description: polarProduct.description ?? undefined,
          type: productType,
          recurringInterval: polarProduct.recurringInterval ?? undefined,
          recurringIntervalCount: polarProduct.isRecurring ? 1 : undefined,
          prices,
          display: { title: polarProduct.name, badge: null, features: [], highlighted: false, cta: "Get Started" },
          polarProductId: productId,
        };

        if (currentProducts.some((p) => p.slug === slug)) {
          failures.push({ slug: polarProduct.name, error: `Slug "${slug}" already exists locally` });
          continue;
        }

        currentProducts = [...currentProducts, newProduct];
        const writeResult = await writeProductsFile(projectDir, env, currentProducts);
        if (writeResult.success) {
          setProducts(currentProducts);
          successes.push(polarProduct.name);
        } else {
          failures.push({ slug: polarProduct.name, error: writeResult.error ?? "Failed to save" });
        }
      }
    }

    if (selectedAction === "import" && successes.length > 0) {
      await generateProductsTs(projectDir);
    }

    setLastOperation("cleanup");
    setOperationResults({ successes, failures });
    setStep("operation_complete");
  };

  // ============================================================================
  // Continue handler
  // ============================================================================

  const handleContinueConfirm = (wantsContinue: boolean) => {
    if (!wantsContinue) { setStep("complete"); return; }
    setStep("checking_sync_status");
  };

  // ============================================================================
  // Computed values
  // ============================================================================

  const getHeaderTitle = () => {
    if (step === "show_menu" || step === "checking_sync_status") return `Products Manager (${env})`;
    if (step === "ask_sandbox_sync" || step === "loading_sandbox_products" || step === "select_sandbox_products" || step === "confirm_sandbox_sync" || step === "syncing_sandbox_to_prod") return `Sandbox → Production Sync`;
    if (step.startsWith("select_for_remove") || step === "confirm_remove" || step === "removing") return `Remove Products (${env})`;
    if (step.startsWith("select_for_sync") || step === "confirm_sync" || step === "syncing") return `Sync Products (${env})`;
    if (step.startsWith("select_for_unarchive") || step === "confirm_unarchive" || step === "unarchiving") return `Unarchive Products (${env})`;
    if (step === "loading_polar_products" || step === "show_orphaned_products" || step === "confirm_cleanup" || step === "cleaning_up") return `Clean Up Polar Products (${env})`;
    if (step === "regenerating") return `Regenerate TypeScript (${env})`;
    if (step === "operation_complete" || step === "ask_continue") return `Products Manager (${env})`;
    return `Create Product (${env})`;
  };

  const hasArchivedProducts = Array.from(syncStatus.values()).some((s) => s === "archived");

  return {
    // State
    step, error, products, draft, yearlyDraft, inheritYearlyFeatures,
    inputValue, inputError, createdProduct, polarSyncSuccess, polarSyncError,
    syncStatus, selectedSlugs, operationResults, lastOperation,
    sandboxProducts, orphanedPolarProducts, selectedPolarProductIds,
    cleanupAction, sandboxHasProducts, env,
    // Input
    setInputValue,
    // Handlers
    handleAccessTokenSubmit,
    handleProductNameSubmit, handleProductSlugSubmit,
    handleProductTypeSelect, handleRecurringIntervalSelect,
    handlePriceTypeSelect, handlePriceAmountSubmit,
    handleDescriptionSubmit, handleDisplayTitleSubmit,
    handleDisplaySubtitleSubmit, handleFeaturesSubmit,
    handleBadgeSubmit, handleHighlightedConfirm, handleCtaSubmit,
    handleAskYearlyConfirm,
    handleYearlySlugSubmit, handleYearlyPriceSubmit,
    handleYearlyTitleSubmit, handleYearlyDescriptionChoiceSelect,
    handleYearlyDescriptionSubmit, handleYearlyFeaturesChoiceSelect,
    handleYearlyFeaturesSubmit, handleYearlySubtitleSubmit,
    handleYearlyBadgeSubmit, handleYearlyHighlightedConfirm,
    handleYearlyCtaSubmit,
    handleOperationSelect,
    handleRemoveSelect, handleRemoveConfirm,
    handleSyncSelect, handleSyncConfirm,
    handleContinueConfirm,
    handleSandboxSyncPrompt, handleSandboxProductSelect, handleSandboxSyncConfirm,
    handleUnarchiveSelect, handleUnarchiveConfirm,
    handleCleanupSelect, handleCleanupActionSelect,
    // Computed
    getHeaderTitle, hasArchivedProducts,
  };
}

export type UseProductsManagerReturn = ReturnType<typeof useProductsManager>;
