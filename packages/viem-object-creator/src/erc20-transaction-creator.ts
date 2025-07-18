import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { encodeFunctionData, isAddress, parseUnits, TransactionRequest } from "viem";

import {
    COMMON_DECIMALS,
    ERC20_ABI,
    ERC20_GAS_LIMITS,
    ERC20_WRITE_ABI,
} from "./constants/erc20.abi.js";
import {
    CompleteERC20Transaction,
    CompleteTransactionSchema,
    ERC20Response,
    ERC20ResponseSchema,
    PartialERC20Transaction,
} from "./schemas/erc20.schemas.js";
import {
    ERC20ParseError,
    ERC20TransactionCreatorConfig,
    ERC20TransactionResult,
    ERC20ValidationError,
    MissingPropertyDetails,
    TransactionContext,
} from "./types/erc20.types.js";

/**
 * ERCTransactionCreator - AI-powered ERC20 transaction parser
 *
 * This class uses AI to parse human input and convert it into valid Viem transactions
 * for ERC20 token operations like transfer, approve, and transferFrom.
 */
export class ERCTransactionCreator {
    private openai: ReturnType<typeof createOpenAI>;
    private config: ERC20TransactionCreatorConfig;

    constructor(config: ERC20TransactionCreatorConfig) {
        this.config = config;
        this.openai = createOpenAI({
            apiKey: config.apiKey,
        });
    }

    /**
     * Parse human input and convert it to a Viem transaction
     *
     * @param msg - Human input describing the desired transaction
     * @param context - Optional context for enhanced parsing
     * @returns Promise<ERC20TransactionResult>
     */
    async parseHumanInput(
        msg: string,
        context?: TransactionContext,
    ): Promise<ERC20TransactionResult> {
        try {
            // Generate structured object from human input using AI
            console.log("🔍 Parsing human input...");
            const result = await generateObject({
                model: this.openai(this.config.model),
                schema: ERC20ResponseSchema,
                prompt: this.buildPrompt(msg, context),
            });

            const aiResponse = result.object;

            // Process the parsed transaction (always succeeds with partial data)
            return this.processAIResponse(aiResponse);
        } catch (error) {
            console.error("❌ AI Generation Error:", error);

            throw new ERC20ParseError(
                `Failed to parse human input: ${error instanceof Error ? error.message : "Unknown error"}`,
                error instanceof Error ? error : undefined,
            );
        }
    }

    /**
     * Build the AI prompt with context and examples
     */
    private buildPrompt(msg: string, context?: TransactionContext): string {
        const contextInfo = context ? this.buildContextInfo(context) : "";

        return `
You are an expert at parsing human input for ERC20 token transactions. 

${contextInfo}

Parse the following message and return a JSON object. Fill in what you can identify, leave the rest undefined:

{
  "transaction": {
    "type": "transfer" | "approve" | "transferFrom",
    "to": "recipient address or undefined",
    "amount": "amount as string or number or undefined",
    "tokenAddress": "token contract address or undefined",
    "from": "source address or undefined",
    "spender": "spender address or undefined"
  },
  "missingProperties": {
    "fieldName": "explanation of what's missing"
  },
  "message": "Brief description of what was parsed"
}

Rules:
- ALWAYS determine the transaction type first
- For "Send/Transfer to" use type="transfer"
- For "Approve" use type="approve" 
- For "Transfer from X to Y" use type="transferFrom"
- Set fields to undefined if not mentioned in the input
- Add missing fields to missingProperties with explanations
- Amount should be string or number, never BigInt
- If a field is missing, explain what's needed in missingProperties

Human input: "${msg}"

Return the JSON object:
`;
    }

    /**
     * Build context information for the AI prompt
     */
    private buildContextInfo(context: TransactionContext): string {
        let contextInfo = "";

        if (context.userAddress) {
            contextInfo += `User's address: ${context.userAddress}\n`;
        }

        if (context.tokenBalances) {
            contextInfo += `Token balances:\n`;
            Object.entries(context.tokenBalances).forEach(([token, balance]) => {
                contextInfo += `  ${token}: ${balance.toString()}\n`;
            });
        }

        if (context.knownTokens) {
            contextInfo += `Known tokens:\n`;
            Object.entries(context.knownTokens).forEach(([symbol, info]) => {
                contextInfo += `  ${symbol}: ${info.address} (${info.name})\n`;
            });
        }

        if (context.chainId) {
            contextInfo += `Chain ID: ${context.chainId}\n`;
        }

        return contextInfo;
    }

    /**
     * Process AI response and convert to Viem transaction
     */
    private processAIResponse(aiResponse: ERC20Response): ERC20TransactionResult {
        const {
            transaction: parsedTx,
            missingProperties: aiMissingProperties,
            message,
        } = aiResponse;

        // Validate if partial transaction is complete
        const validation = this.validateTransactionCompleteness(parsedTx);
        const allMissing = { ...aiMissingProperties, ...validation.missingProperties };

        // Create Viem transaction if complete
        let viemTransaction: TransactionRequest | null = null;
        if (validation.isComplete) {
            try {
                viemTransaction = this.createViemTransaction(parsedTx as CompleteERC20Transaction);
            } catch (error) {
                throw new ERC20ValidationError(
                    `Failed to create Viem transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
                    [error instanceof Error ? error.message : "Unknown error"],
                );
            }
        }

        return {
            transaction: viemTransaction,
            isComplete: validation.isComplete,
            parsedTransaction: parsedTx,
            missingProperties: allMissing,
            message: validation.isComplete
                ? message
                : this.buildMissingPropertiesMessage(allMissing),
        };
    }

    /**
     * Validate if partial transaction is complete by checking against complete schema
     */
    private validateTransactionCompleteness(partialTx: PartialERC20Transaction): {
        isComplete: boolean;
        missingProperties: Record<string, string>;
    } {
        try {
            // Try to parse as complete transaction
            const result = CompleteTransactionSchema.parse(partialTx);
            return { isComplete: true, missingProperties: {} };
        } catch (error) {
            // If validation fails, determine what's missing
            const missing = this.identifyMissingProperties(partialTx);
            return { isComplete: false, missingProperties: missing };
        }
    }

    /**
     * Identify missing properties based on transaction type
     */
    private identifyMissingProperties(tx: PartialERC20Transaction): Record<string, string> {
        const missing: Record<string, string> = {};

        // Common validations
        if (!tx.tokenAddress) {
            missing.tokenAddress = "Token contract address is required";
        }

        switch (tx.type) {
            case "transfer":
                if (!tx.to) {
                    missing.to = "Recipient address is required for transfer";
                }
                if (!tx.amount) {
                    missing.amount = "Amount is required for transfer";
                }
                break;

            case "approve":
                if (!tx.spender) {
                    missing.spender = "Spender address is required for approve";
                }
                if (!tx.amount) {
                    missing.amount = "Amount is required for approve";
                }
                break;

            case "transferFrom":
                if (!tx.from) {
                    missing.from = "Source address is required for transferFrom";
                }
                if (!tx.to) {
                    missing.to = "Recipient address is required for transferFrom";
                }
                if (!tx.amount) {
                    missing.amount = "Amount is required for transferFrom";
                }
                break;
        }

        return missing;
    }

    /**
     * Create Viem transaction from complete ERC20 transaction
     */
    private createViemTransaction(tx: CompleteERC20Transaction): TransactionRequest {
        // Validate addresses
        if (tx.tokenAddress && !isAddress(tx.tokenAddress)) {
            throw new Error(`Invalid token address: ${tx.tokenAddress}`);
        }

        // Convert amount to BigInt (use 18 decimals as default, could be enhanced to detect token decimals)
        const amount = this.parseAmount(tx.amount!, COMMON_DECIMALS);

        // Encode function data based on transaction type
        let functionData: `0x${string}`;

        if (tx.type === "transfer") {
            if (!isAddress(tx.to!)) {
                throw new Error(`Invalid recipient address: ${tx.to}`);
            }
            functionData = encodeFunctionData({
                abi: ERC20_WRITE_ABI,
                functionName: "transfer",
                args: [tx.to!, amount],
            });
        } else if (tx.type === "approve") {
            if (!isAddress(tx.spender!)) {
                throw new Error(`Invalid spender address: ${tx.spender}`);
            }
            functionData = encodeFunctionData({
                abi: ERC20_WRITE_ABI,
                functionName: "approve",
                args: [tx.spender!, amount],
            });
        } else if (tx.type === "transferFrom") {
            if (!isAddress(tx.from!)) {
                throw new Error(`Invalid source address: ${tx.from}`);
            }
            if (!isAddress(tx.to!)) {
                throw new Error(`Invalid recipient address: ${tx.to}`);
            }
            functionData = encodeFunctionData({
                abi: ERC20_WRITE_ABI,
                functionName: "transferFrom",
                args: [tx.from!, tx.to!, amount],
            });
        } else {
            throw new Error(`Unsupported transaction type: ${(tx as any).type}`);
        }

        return {
            to: tx.tokenAddress! as `0x${string}`,
            data: functionData,
            gas:
                this.config.defaultGasLimit ||
                ERC20_GAS_LIMITS[tx.type as keyof typeof ERC20_GAS_LIMITS],
            gasPrice: this.config.defaultGasPrice,
            value: 0n, // ERC20 transfers don't send ETH
        } as TransactionRequest;
    }

    /**
     * Parse amount string/number to BigInt with proper decimals
     * Note: AI returns string/number, we convert to BigInt for Viem
     */
    private parseAmount(amount: string | number, decimals: number = COMMON_DECIMALS): bigint {
        let amountStr: string;

        if (typeof amount === "number") {
            amountStr = amount.toString();
        } else {
            amountStr = amount.trim();
        }

        // Handle different amount formats
        try {
            // If it's a very large number (likely already in wei), convert directly
            if (amountStr.length > 15 && !amountStr.includes(".") && /^\d+$/.test(amountStr)) {
                return BigInt(amountStr);
            }

            // If it contains 'e' or 'E' (scientific notation), handle it
            if (amountStr.toLowerCase().includes("e")) {
                const num = parseFloat(amountStr);
                if (isNaN(num)) {
                    throw new Error("Invalid scientific notation");
                }
                return parseUnits(num.toString(), decimals);
            }

            // Handle decimal amounts by parsing with specified decimals
            return parseUnits(amountStr, decimals);
        } catch (error) {
            throw new Error(
                `Invalid amount format: ${amountStr}. Expected formats: "100", "100.5", "1000000000000000000" (wei), or scientific notation.`,
            );
        }
    }

    /**
     * Build human-readable message for missing properties
     */
    private buildMissingPropertiesMessage(missing: Record<string, string>): string {
        const missingKeys = Object.keys(missing);
        if (missingKeys.length === 0) {
            return "Transaction is complete and ready to send.";
        }

        const missingList = missingKeys.map((key) => `• ${key}: ${missing[key]}`).join("\n");
        return `The following information is missing to complete the transaction:\n${missingList}`;
    }

    /**
     * Get detailed information about missing properties
     */
    getMissingPropertyDetails(missingProperties: Record<string, string>): MissingPropertyDetails[] {
        return Object.entries(missingProperties).map(([property, description]) => ({
            property,
            description,
            required: true,
            example: this.getExampleForProperty(property),
        }));
    }

    /**
     * Get example value for a property
     */
    private getExampleForProperty(property: string): string {
        switch (property) {
            case "tokenAddress":
                return "0xA0b86a33E6441c1bE71a3d7e0c5B4b8a1B7C6E7D (USDC contract address)";
            case "to":
                return "0x742d35Cc6634C0532925a3b8D4aFF5e6C154F9e0 (recipient address)";
            case "from":
                return "0x742d35Cc6634C0532925a3b8D4aFF5e6C154F9e0 (source address)";
            case "spender":
                return "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984 (Uniswap router)";
            case "amount":
                return "100 (for 100 tokens), 1000000000000000000 (for 1 token in wei), or 1e18 (scientific notation)";
            default:
                return "Please provide a valid value";
        }
    }

    /**
     * Public method to test amount parsing (useful for debugging)
     */
    public testParseAmount(
        amount: string | number,
        decimals?: number,
    ): {
        parsed: bigint;
        formatted: string;
        original: string | number;
    } {
        try {
            const parsed = this.parseAmount(amount, decimals);
            return {
                parsed,
                formatted: `${parsed.toString()} wei`,
                original: amount,
            };
        } catch (error) {
            throw new ERC20ParseError(
                `Failed to parse amount: ${error instanceof Error ? error.message : "Unknown error"}`,
                error instanceof Error ? error : undefined,
            );
        }
    }
}
