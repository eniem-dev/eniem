import { Box, Text } from "ink";
import React from "react";
import { Confirm, StatusMessage } from "../../components/index.js";
import type { UseProductsManagerReturn } from "../hooks/useProductsManager.js";

type Props = Pick<
  UseProductsManagerReturn,
  "step" | "operationResults" | "lastOperation" | "env" | "handleContinueConfirm"
>;

export const OperationComplete = ({ step, operationResults, lastOperation, env, handleContinueConfirm }: Props) => (
  <>
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
                {operationResults.successes.map((slug) => <Text key={slug} color="green">- {slug}</Text>)}
              </Box>
            )}
            {lastOperation === "cleanup" && operationResults.successes.length > 1 && (
              <Box flexDirection="column" marginLeft={2}>
                {operationResults.successes.map((name) => <Text key={name} color="green">- {name}</Text>)}
              </Box>
            )}
          </Box>
        )}
        {operationResults.failures.length > 0 && (
          <Box flexDirection="column" marginTop={1}>
            <StatusMessage status="error">
              Failed to {lastOperation === "add" ? "sync" : lastOperation === "remove" ? "remove" : lastOperation === "sync" ? "sync" : lastOperation === "sandbox_sync" || lastOperation === "sync_from_sandbox" ? "sync to production" : lastOperation === "unarchive" ? "unarchive" : lastOperation === "cleanup" ? "clean up" : "regenerate"} {operationResults.failures.length} item{operationResults.failures.length !== 1 ? "s" : ""}
            </StatusMessage>
            <Box flexDirection="column" marginLeft={2}>
              {operationResults.failures.map(({ slug, error }) => <Text key={slug} color="red">- {slug}: {error}</Text>)}
            </Box>
            {(lastOperation === "sandbox_sync" || lastOperation === "sync_from_sandbox") && (
              <Box marginTop={1}>
                <Text color="green">Products saved to products.{env}.json. Use "Sync products to Polar" to retry.</Text>
              </Box>
            )}
          </Box>
        )}
        <Box marginTop={1}>
          <Confirm label="Perform another operation?" onConfirm={handleContinueConfirm} defaultValue={true} />
        </Box>
      </Box>
    )}

    {step === "ask_continue" && (
      <Confirm label="Perform another operation?" onConfirm={handleContinueConfirm} defaultValue={true} />
    )}
  </>
);
