import { TransactionRequest } from "viem";

import {
    CompleteERC20Transaction,
    ERC20Response,
    PartialERC20Transaction,
} from "../schemas/erc20.schemas.js";

// Configuration for the ERC20 transaction creator
export interface ERC20TransactionCreatorConfig {
    /** AI model to use for parsing (e.g., 'gpt-4o-mini') */
    model: string;
    /** API key for the AI service */
    apiKey: string;
    /** Default token address to use when not specified */
    defaultTokenAddress?: string;
    /** Default gas limit for transactions */
    defaultGasLimit?: bigint;
    /** Default gas price for transactions */
    defaultGasPrice?: bigint;
}

// Result type that combines Viem transaction with parsing metadata
export interface ERC20TransactionResult {
    /** Viem-compatible transaction request */
    transaction: TransactionRequest | null;
    /** Whether the transaction is complete and ready to send */
    isComplete: boolean;
    /** Parsed ERC20 transaction data */
    parsedTransaction: PartialERC20Transaction;
    /** Missing required properties */
    missingProperties: Record<string, string>;
    /** Human-readable message about the transaction or missing info */
    message: string;
}

// Error types for better error handling
export class ERC20ParseError extends Error {
    constructor(
        message: string,
        public override readonly cause?: Error,
    ) {
        super(message);
        this.name = "ERC20ParseError";
    }
}

export class ERC20ValidationError extends Error {
    constructor(
        message: string,
        public readonly validationErrors: string[],
    ) {
        super(message);
        this.name = "ERC20ValidationError";
    }
}

// ERC20 function signatures for ABI encoding
export interface ERC20Function {
    name: string;
    inputs: Array<{ name: string; type: string }>;
    outputs: Array<{ name: string; type: string }>;
    stateMutability: "view" | "pure" | "nonpayable" | "payable";
}

// Missing property details for better UX
export interface MissingPropertyDetails {
    /** Property name */
    property: string;
    /** Human-readable description */
    description: string;
    /** Example value */
    example?: string;
    /** Whether this property is required */
    required: boolean;
}

// Enhanced result type with missing property details
export interface DetailedERC20TransactionResult extends ERC20TransactionResult {
    /** Detailed information about missing properties */
    missingPropertyDetails: MissingPropertyDetails[];
}

// Gas estimation result
export interface GasEstimation {
    /** Estimated gas limit */
    gasLimit: bigint;
    /** Estimated gas price */
    gasPrice: bigint;
    /** Estimated total cost in wei */
    estimatedCost: bigint;
}

// Token information interface
export interface TokenInfo {
    /** Token contract address */
    address: string;
    /** Token name */
    name?: string;
    /** Token symbol */
    symbol?: string;
    /** Token decimals */
    decimals?: number;
    /** Total supply */
    totalSupply?: bigint;
}

// Transaction context for enhanced parsing
export interface TransactionContext {
    /** User's wallet address */
    userAddress?: string;
    /** Available token balances */
    tokenBalances?: Record<string, bigint>;
    /** Known token contracts */
    knownTokens?: Record<string, TokenInfo>;
    /** Chain ID */
    chainId?: number;
}
