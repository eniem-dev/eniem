import { Box, Text } from "ink";
import React from "react";
import { TextInput, Select, Confirm, Spinner, StatusMessage } from "../../components/index.js";
import type { UseProductsManagerReturn } from "../hooks/useProductsManager.js";

type Props = Pick<
  UseProductsManagerReturn,
  | "step" | "draft" | "yearlyDraft" | "inheritYearlyFeatures"
  | "inputValue" | "inputError" | "polarSyncSuccess" | "polarSyncError"
  | "setInputValue"
  | "handleProductNameSubmit" | "handleProductSlugSubmit"
  | "handleProductTypeSelect" | "handleRecurringIntervalSelect"
  | "handlePriceTypeSelect" | "handlePriceAmountSubmit"
  | "handleDescriptionSubmit" | "handleDisplayTitleSubmit"
  | "handleDisplaySubtitleSubmit" | "handleFeaturesSubmit"
  | "handleBadgeSubmit" | "handleHighlightedConfirm" | "handleCtaSubmit"
  | "handleAskYearlyConfirm"
  | "handleYearlySlugSubmit" | "handleYearlyPriceSubmit"
  | "handleYearlyTitleSubmit" | "handleYearlyDescriptionChoiceSelect"
  | "handleYearlyDescriptionSubmit" | "handleYearlyFeaturesChoiceSelect"
  | "handleYearlyFeaturesSubmit" | "handleYearlySubtitleSubmit"
  | "handleYearlyBadgeSubmit" | "handleYearlyHighlightedConfirm"
  | "handleYearlyCtaSubmit"
>;

export const AddProductWizard = ({
  step, draft, yearlyDraft: _yearlyDraft, inheritYearlyFeatures,
  inputValue, inputError, polarSyncSuccess, polarSyncError,
  setInputValue,
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
}: Props) => (
  <>
    {step === "product_name" && (
      <TextInput label="Product Name" value={inputValue} onChange={setInputValue}
        onSubmit={handleProductNameSubmit} placeholder="e.g., Pro Monthly" error={inputError} />
    )}

    {step === "product_slug" && (
      <TextInput label="Product Slug" value={inputValue} onChange={setInputValue}
        onSubmit={handleProductSlugSubmit} placeholder="e.g., pro-monthly" error={inputError} />
    )}

    {step === "product_type" && (
      <Select label="Product Type" options={[
        { label: "Subscription", value: "subscription" },
        { label: "One-time purchase", value: "one_time" },
        { label: "Free", value: "free" },
      ]} onSelect={handleProductTypeSelect} />
    )}

    {step === "recurring_interval" && (
      <Select label="Billing Interval" options={[
        { label: "Monthly", value: "month" },
        { label: "Yearly", value: "year" },
        { label: "Weekly", value: "week" },
        { label: "Daily", value: "day" },
      ]} onSelect={handleRecurringIntervalSelect} />
    )}

    {step === "price_type" && (
      <Select label="Price Type" options={[
        { label: "Fixed price", value: "fixed" },
        { label: "Pay what you want", value: "custom" },
        { label: "Free", value: "free" },
      ]} onSelect={handlePriceTypeSelect} />
    )}

    {step === "price_amount" && (
      <TextInput label={draft.priceType === "custom" ? "Minimum Price (USD)" : "Price (USD)"}
        value={inputValue} onChange={setInputValue} onSubmit={handlePriceAmountSubmit}
        placeholder="e.g., 19.00" error={inputError} />
    )}

    {step === "description" && (
      <TextInput label="Description (optional)" value={inputValue} onChange={setInputValue}
        onSubmit={handleDescriptionSubmit} placeholder="Short description of the product" error={inputError} />
    )}

    {step === "display_title" && (
      <TextInput label="Display Title" value={inputValue} onChange={setInputValue}
        onSubmit={handleDisplayTitleSubmit} placeholder="Title shown on pricing page" error={inputError} />
    )}

    {step === "display_subtitle" && (
      <TextInput label="Display Subtitle (optional)" value={inputValue} onChange={setInputValue}
        onSubmit={handleDisplaySubtitleSubmit} placeholder="e.g., Billed monthly" error={inputError} />
    )}

    {step === "features" && (
      <TextInput label="Features (comma-separated)" value={inputValue} onChange={setInputValue}
        onSubmit={handleFeaturesSubmit} placeholder="e.g., Unlimited projects, Priority support" error={inputError} />
    )}

    {step === "badge" && (
      <TextInput label="Badge (optional)" value={inputValue} onChange={setInputValue}
        onSubmit={handleBadgeSubmit} placeholder="e.g., Popular, Best Value" error={inputError} />
    )}

    {step === "highlighted" && (
      <Confirm label="Highlight this product?" onConfirm={handleHighlightedConfirm} defaultValue={false} />
    )}

    {step === "cta" && (
      <TextInput label="CTA Button Text" value={inputValue} onChange={setInputValue}
        onSubmit={handleCtaSubmit} placeholder="e.g., Get Started" error={inputError} />
    )}

    {step === "creating" && <Spinner label="Creating product..." />}

    {step === "ask_yearly" && (
      <Box flexDirection="column">
        <StatusMessage status={polarSyncSuccess ? "success" : "error"}>
          {polarSyncSuccess ? `Product created and synced to Polar` : `Product saved locally (Polar sync failed)`}
        </StatusMessage>
        {polarSyncError && (
          <Box marginTop={1}><Text dimColor>Error: {polarSyncError}</Text></Box>
        )}
        <Box marginTop={1}>
          <Confirm label="Create yearly version? (10x monthly = 2 months free)"
            onConfirm={handleAskYearlyConfirm} defaultValue={true} />
        </Box>
      </Box>
    )}

    {step === "yearly_slug" && (
      <TextInput label="Yearly Slug" value={inputValue} onChange={setInputValue}
        onSubmit={handleYearlySlugSubmit} placeholder="e.g., pro-yearly" error={inputError} />
    )}

    {step === "yearly_price" && (
      <Box flexDirection="column">
        <Text dimColor>Suggested: ${((draft.priceAmountCents || 0) * 10 / 100).toFixed(2)}/year (2 months free)</Text>
        <TextInput label="Yearly Price (USD)" value={inputValue} onChange={setInputValue}
          onSubmit={handleYearlyPriceSubmit} placeholder="e.g., 190.00" error={inputError} />
      </Box>
    )}

    {step === "yearly_title" && (
      <TextInput label="Yearly Display Title" value={inputValue} onChange={setInputValue}
        onSubmit={handleYearlyTitleSubmit} placeholder="e.g., Pro Yearly" error={inputError} />
    )}

    {step === "yearly_description_choice" && (
      <Select label="Description" options={[
        { label: "Same as monthly", value: "inherit" },
        { label: "Write new description", value: "new" },
      ]} onSelect={handleYearlyDescriptionChoiceSelect} />
    )}

    {step === "yearly_description" && (
      <TextInput label="Yearly Description" value={inputValue} onChange={setInputValue}
        onSubmit={handleYearlyDescriptionSubmit} placeholder="Description for yearly plan" error={inputError} />
    )}

    {step === "yearly_features_choice" && (
      <Select label="Features" options={[
        { label: "Same as monthly", value: "inherit" },
        { label: "Same + add more", value: "add" },
        { label: "Write new features", value: "new" },
      ]} onSelect={handleYearlyFeaturesChoiceSelect} />
    )}

    {step === "yearly_features" && (
      <TextInput label={inheritYearlyFeatures ? "Additional Features (comma-separated)" : "Features (comma-separated)"}
        value={inputValue} onChange={setInputValue} onSubmit={handleYearlyFeaturesSubmit}
        placeholder="e.g., Exclusive yearly bonus" error={inputError} />
    )}

    {step === "yearly_subtitle" && (
      <TextInput label="Yearly Subtitle (optional)" value={inputValue} onChange={setInputValue}
        onSubmit={handleYearlySubtitleSubmit} placeholder="e.g., Save 2 months" error={inputError} />
    )}

    {step === "yearly_badge" && (
      <TextInput label="Yearly Badge (optional)" value={inputValue} onChange={setInputValue}
        onSubmit={handleYearlyBadgeSubmit} placeholder="e.g., Best Value" error={inputError} />
    )}

    {step === "yearly_highlighted" && (
      <Confirm label="Highlight yearly product?" onConfirm={handleYearlyHighlightedConfirm} defaultValue={true} />
    )}

    {step === "yearly_cta" && (
      <TextInput label="Yearly CTA Button Text" value={inputValue} onChange={setInputValue}
        onSubmit={handleYearlyCtaSubmit} placeholder="e.g., Get Started" error={inputError} />
    )}

    {step === "creating_yearly" && <Spinner label="Creating yearly product..." />}
  </>
);
