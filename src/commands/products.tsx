import { Box, Text } from "ink";
import React, { useState, useEffect, useRef } from "react";
import {
  TextInput,
  Select,
  Confirm,
  Spinner,
  SectionHeader,
  StatusMessage,
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
  type Product,
} from "../lib/products.js";
import {
  loadPolarCredentials,
  createPolarProduct,
  type PolarCredentials,
  type PolarEnvironment,
} from "../lib/polar.js";

// ============================================================================
// Types
// ============================================================================

type WizardStep =
  | "init"
  | "load_credentials"
  | "prompt_access_token"
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
  const [createdYearlyProduct, setCreatedYearlyProduct] = useState<Product | null>(null);
  const [polarSyncSuccess, setPolarSyncSuccess] = useState<boolean | null>(null);
  const [yearlyPolarSyncSuccess, setYearlyPolarSyncSuccess] = useState<boolean | null>(null);
  const [polarSyncError, setPolarSyncError] = useState<string | null>(null);
  const [yearlyPolarSyncError, setYearlyPolarSyncError] = useState<string | null>(null);

  // TypeScript generation state
  const [tsGenSuccess, setTsGenSuccess] = useState<boolean | null>(null);
  const [tsGenError, setTsGenError] = useState<string | null>(null);

  // Refs to prevent duplicate effect runs
  const isCreatingRef = useRef(false);
  const isCreatingYearlyRef = useRef(false);

  // Initialize: Read products file
  useEffect(() => {
    if (step === "init") {
      const init = async () => {
        const result = await readProductsFile(projectDir, env);
        if (!result.success) {
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

  // Load credentials
  useEffect(() => {
    if (step === "load_credentials") {
      const load = async () => {
        const result = await loadPolarCredentials(projectDir);
        if (result.success) {
          setCredentials(result.credentials);
          setStep("product_name");
        } else {
          setStep("prompt_access_token");
        }
      };
      load();
    }
  }, [step, projectDir]);

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
            setStep("complete");
          });
          return updatedProducts;
        });
      };
      create();
    }
  }, [step, credentials, yearlyDraft, projectDir, env]);

  // Handle step transitions
  const handleAccessTokenSubmit = (value: string) => {
    if (!value.trim()) {
      setInputError("Access token is required");
      return;
    }
    setInputValue("");
    setInputError(undefined);
    setCredentials({ accessToken: value.trim() });
    setStep("product_name");
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
      setStep("complete");
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

  // Render based on step
  return (
    <Box flexDirection="column">
      <SectionHeader title={`Create Product (${env})`} />

      {step === "init" && <Spinner label="Loading products file..." />}

      {step === "load_credentials" && <Spinner label="Loading Polar credentials..." />}

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
          <StatusMessage status="success">Product creation complete!</StatusMessage>
          <Box flexDirection="column" marginTop={1}>
            {createdProduct && (
              <Box flexDirection="column">
                <Text bold>Monthly Product:</Text>
                <Text>  Name: {createdProduct.name}</Text>
                <Text>  Slug: {createdProduct.slug}</Text>
                <Text>
                  {polarSyncSuccess
                    ? `  Polar ID: ${createdProduct.polarProductId}`
                    : "  Polar: Not synced (saved locally only)"}
                </Text>
                {polarSyncError && <Text dimColor>  Error: {polarSyncError}</Text>}
              </Box>
            )}
            {createdYearlyProduct && (
              <Box flexDirection="column" marginTop={1}>
                <Text bold>Yearly Product:</Text>
                <Text>  Name: {createdYearlyProduct.name}</Text>
                <Text>  Slug: {createdYearlyProduct.slug}</Text>
                <Text>
                  {yearlyPolarSyncSuccess
                    ? `  Polar ID: ${createdYearlyProduct.polarProductId}`
                    : "  Polar: Not synced (saved locally only)"}
                </Text>
                {yearlyPolarSyncError && <Text dimColor>  Error: {yearlyPolarSyncError}</Text>}
              </Box>
            )}
          </Box>
          <Box marginTop={1} flexDirection="column">
            <Text dimColor>Products saved to products.{env}.json</Text>
            {tsGenSuccess === true && (
              <Text dimColor>TypeScript exports generated: src/features/subscription/products.generated.ts</Text>
            )}
            {tsGenSuccess === false && (
              <Text color="yellow">Warning: TypeScript generation failed: {tsGenError}</Text>
            )}
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
