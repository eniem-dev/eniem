import { Box, Text } from "ink";
import React from "react";
import {
  TextInput,
  Spinner,
  SectionHeader,
  StatusMessage,
  ProductList,
  OperationMenu,
} from "../components/index.js";
import { useProductsManager } from "./hooks/useProductsManager.js";
import {
  AddProductWizard,
  SandboxSyncView,
  RemoveProductView,
  SyncProductView,
  UnarchiveProductView,
  CleanupProductView,
  OperationComplete,
} from "./products/index.js";
import type { ProductsCommandProps } from "./products/types.js";

export const ProductsCommand = ({ env, projectDir, accessToken }: ProductsCommandProps) => {
  const manager = useProductsManager({ env, projectDir, accessToken });
  const { step, products, syncStatus } = manager;

  return (
    <Box flexDirection="column">
      <SectionHeader title={manager.getHeaderTitle()} />

      {/* Loading states */}
      {step === "init" && <Spinner label="Loading products file..." />}
      {step === "load_credentials" && <Spinner label="Loading Polar credentials..." />}
      {step === "checking_sync_status" && <Spinner label="Checking product sync status..." />}

      {/* Credential prompt */}
      {step === "prompt_access_token" && (
        <TextInput label="Polar Access Token" value={manager.inputValue} onChange={manager.setInputValue}
          onSubmit={manager.handleAccessTokenSubmit} placeholder="polar_..." mask="*" error={manager.inputError} />
      )}

      {/* Sandbox sync flow */}
      <SandboxSyncView step={step} sandboxProducts={manager.sandboxProducts} selectedSlugs={manager.selectedSlugs}
        handleSandboxSyncPrompt={manager.handleSandboxSyncPrompt}
        handleSandboxProductSelect={manager.handleSandboxProductSelect}
        handleSandboxSyncConfirm={manager.handleSandboxSyncConfirm} />

      {/* Main menu */}
      {step === "show_menu" && (
        <Box flexDirection="column">
          {products.length > 0 && (
            <Box flexDirection="column" marginBottom={1}>
              <Text bold>Products:</Text>
              <ProductList products={products} syncStatus={syncStatus} />
            </Box>
          )}
          <OperationMenu onSelect={manager.handleOperationSelect} hasProducts={products.length > 0}
            hasArchivedProducts={manager.hasArchivedProducts} showSyncFromSandbox={manager.sandboxHasProducts} />
        </Box>
      )}

      {/* Add product wizard */}
      <AddProductWizard
        step={step} draft={manager.draft} yearlyDraft={manager.yearlyDraft}
        inheritYearlyFeatures={manager.inheritYearlyFeatures}
        inputValue={manager.inputValue} inputError={manager.inputError}
        polarSyncSuccess={manager.polarSyncSuccess} polarSyncError={manager.polarSyncError}
        setInputValue={manager.setInputValue}
        handleProductNameSubmit={manager.handleProductNameSubmit}
        handleProductSlugSubmit={manager.handleProductSlugSubmit}
        handleProductTypeSelect={manager.handleProductTypeSelect}
        handleRecurringIntervalSelect={manager.handleRecurringIntervalSelect}
        handlePriceTypeSelect={manager.handlePriceTypeSelect}
        handlePriceAmountSubmit={manager.handlePriceAmountSubmit}
        handleDescriptionSubmit={manager.handleDescriptionSubmit}
        handleDisplayTitleSubmit={manager.handleDisplayTitleSubmit}
        handleDisplaySubtitleSubmit={manager.handleDisplaySubtitleSubmit}
        handleFeaturesSubmit={manager.handleFeaturesSubmit}
        handleBadgeSubmit={manager.handleBadgeSubmit}
        handleHighlightedConfirm={manager.handleHighlightedConfirm}
        handleCtaSubmit={manager.handleCtaSubmit}
        handleAskYearlyConfirm={manager.handleAskYearlyConfirm}
        handleYearlySlugSubmit={manager.handleYearlySlugSubmit}
        handleYearlyPriceSubmit={manager.handleYearlyPriceSubmit}
        handleYearlyTitleSubmit={manager.handleYearlyTitleSubmit}
        handleYearlyDescriptionChoiceSelect={manager.handleYearlyDescriptionChoiceSelect}
        handleYearlyDescriptionSubmit={manager.handleYearlyDescriptionSubmit}
        handleYearlyFeaturesChoiceSelect={manager.handleYearlyFeaturesChoiceSelect}
        handleYearlyFeaturesSubmit={manager.handleYearlyFeaturesSubmit}
        handleYearlySubtitleSubmit={manager.handleYearlySubtitleSubmit}
        handleYearlyBadgeSubmit={manager.handleYearlyBadgeSubmit}
        handleYearlyHighlightedConfirm={manager.handleYearlyHighlightedConfirm}
        handleYearlyCtaSubmit={manager.handleYearlyCtaSubmit}
      />

      {/* Remove products */}
      <RemoveProductView step={step} products={products} selectedSlugs={manager.selectedSlugs}
        handleRemoveSelect={manager.handleRemoveSelect} handleRemoveConfirm={manager.handleRemoveConfirm} />

      {/* Sync products */}
      <SyncProductView step={step} products={products} selectedSlugs={manager.selectedSlugs}
        handleSyncSelect={manager.handleSyncSelect} handleSyncConfirm={manager.handleSyncConfirm} />

      {/* Regenerate */}
      {step === "regenerating" && <Spinner label="Regenerating TypeScript exports..." />}

      {/* Unarchive products */}
      <UnarchiveProductView step={step} products={products} syncStatus={syncStatus}
        selectedSlugs={manager.selectedSlugs}
        handleUnarchiveSelect={manager.handleUnarchiveSelect}
        handleUnarchiveConfirm={manager.handleUnarchiveConfirm} />

      {/* Cleanup Polar products */}
      <CleanupProductView step={step} orphanedPolarProducts={manager.orphanedPolarProducts}
        selectedPolarProductIds={manager.selectedPolarProductIds} cleanupAction={manager.cleanupAction}
        handleCleanupSelect={manager.handleCleanupSelect}
        handleCleanupActionSelect={manager.handleCleanupActionSelect} />

      {/* Operation results */}
      <OperationComplete step={step} operationResults={manager.operationResults}
        lastOperation={manager.lastOperation} env={manager.env}
        handleContinueConfirm={manager.handleContinueConfirm} />

      {/* Completion */}
      {step === "complete" && (
        <Box flexDirection="column">
          <StatusMessage status="success">Done!</StatusMessage>
          <Box marginTop={1}><Text dimColor>Products saved to products.{env}.json</Text></Box>
        </Box>
      )}

      {/* Error */}
      {step === "error" && (
        <Box flexDirection="column">
          <StatusMessage status="error">{manager.error}</StatusMessage>
          <Box marginTop={1}>
            <Text dimColor>Make sure you are running this command from an eniem project directory.</Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};
