import { z } from "zod";

// Strict address schema for complete transactions
export const StrictAddressSchema = z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format")
    .describe("A valid Ethereum address starting with 0x");

// Flexible address schema for partial transactions (allows placeholders)
export const FlexibleAddressSchema = z
    .union([StrictAddressSchema, z.string().min(1).describe("Address placeholder")])
    .describe("A valid Ethereum address or placeholder");

// Amount schema that can handle various formats (AI-compatible, no BigInt)
export const AmountSchema = z
    .union([
        z.string().regex(/^\d+(\.\d+)?([eE][-+]?\d+)?$/, "Invalid amount format"),
        z.string().regex(/^\d{15,}$/, "Wei amount (very large integer)"), // For wei amounts
        z.number().positive("Amount must be positive"),
    ])
    .describe(
        "Token amount (string or number - supports decimal, scientific notation, and wei amounts)",
    );

// Optional address schema for cases where address might be missing
export const OptionalAddressSchema = z
    .union([FlexibleAddressSchema, z.undefined(), z.null()])
    .transform((val) => (val === null ? undefined : val))
    .describe("Optional Ethereum address");

// Optional amount schema
export const OptionalAmountSchema = z
    .union([AmountSchema, z.undefined(), z.null()])
    .transform((val) => (val === null ? undefined : val))
    .describe("Optional token amount");

// Complete transaction schemas (strict validation for complete transactions)
export const CompleteTransferSchema = z
    .object({
        type: z.literal("transfer").describe("Transaction type"),
        to: StrictAddressSchema.describe("Recipient address (required)"),
        amount: AmountSchema.describe("Amount to transfer (required)"),
        tokenAddress: StrictAddressSchema.describe("ERC20 token contract address (required)"),
    })
    .describe("Complete transfer transaction");

export const CompleteApproveSchema = z
    .object({
        type: z.literal("approve").describe("Transaction type"),
        spender: StrictAddressSchema.describe("Spender address (required)"),
        amount: AmountSchema.describe("Amount to approve (required)"),
        tokenAddress: StrictAddressSchema.describe("ERC20 token contract address (required)"),
    })
    .describe("Complete approve transaction");

export const CompleteTransferFromSchema = z
    .object({
        type: z.literal("transferFrom").describe("Transaction type"),
        from: StrictAddressSchema.describe("Source address (required)"),
        to: StrictAddressSchema.describe("Recipient address (required)"),
        amount: AmountSchema.describe("Amount to transfer (required)"),
        tokenAddress: StrictAddressSchema.describe("ERC20 token contract address (required)"),
    })
    .describe("Complete transferFrom transaction");

// Union of complete transaction schemas
export const CompleteTransactionSchema = z
    .discriminatedUnion("type", [
        CompleteTransferSchema,
        CompleteApproveSchema,
        CompleteTransferFromSchema,
    ])
    .describe("Complete ERC20 transaction (all required fields present)");

// Partial transaction schema (lenient for AI generation)
export const PartialTransactionSchema = z
    .object({
        type: z.enum(["transfer", "approve", "transferFrom"]).describe("Transaction type"),
        to: OptionalAddressSchema.describe("Recipient address"),
        amount: OptionalAmountSchema.describe("Amount to transfer/approve"),
        tokenAddress: OptionalAddressSchema.describe("ERC20 token contract address"),
        from: OptionalAddressSchema.describe("Source address (for transferFrom)"),
        spender: OptionalAddressSchema.describe("Spender address (for approve)"),
    })
    .describe("Partial ERC20 transaction (fields can be missing)");

// Types derived from schemas
export type ERC20Address = z.infer<typeof StrictAddressSchema>;
export type ERC20Amount = z.infer<typeof AmountSchema>; // string | number (no BigInt from AI)
export type CompleteERC20Transaction = z.infer<typeof CompleteTransactionSchema>;
export type PartialERC20Transaction = z.infer<typeof PartialTransactionSchema>;

// Response schema uses partial transaction (for AI generation)
export const ERC20ResponseSchema = z
    .object({
        transaction: PartialTransactionSchema.describe(
            "The parsed ERC20 transaction (can be partial)",
        ),
        missingProperties: z
            .record(z.string())
            .optional()
            .default({})
            .describe("Object containing missing required properties"),
        message: z
            .string()
            .optional()
            .default("Transaction parsed")
            .describe("Human-readable message about the transaction"),
    })
    .describe("ERC20 transaction parsing response");

export type ERC20Response = z.infer<typeof ERC20ResponseSchema>;
