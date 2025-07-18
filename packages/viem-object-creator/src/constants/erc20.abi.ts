import { Abi } from "viem";

// Complete ERC20 ABI with all standard functions
export const ERC20_ABI = [
    // Transfer function
    {
        inputs: [
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        name: "transfer",
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function",
    },
    // Approve function
    {
        inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        name: "approve",
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function",
    },
    // TransferFrom function
    {
        inputs: [
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        name: "transferFrom",
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function",
    },
    // View functions for reading state
    {
        inputs: [{ name: "account", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
        ],
        name: "allowance",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "totalSupply",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "name",
        outputs: [{ name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "symbol",
        outputs: [{ name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "decimals",
        outputs: [{ name: "", type: "uint8" }],
        stateMutability: "view",
        type: "function",
    },
    // Events
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: "from", type: "address" },
            { indexed: true, name: "to", type: "address" },
            { indexed: false, name: "value", type: "uint256" },
        ],
        name: "Transfer",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: "owner", type: "address" },
            { indexed: true, name: "spender", type: "address" },
            { indexed: false, name: "value", type: "uint256" },
        ],
        name: "Approval",
        type: "event",
    },
] as const satisfies Abi;

// Function signatures for quick access
export const ERC20_FUNCTION_SIGNATURES = {
    transfer: "0xa9059cbb",
    approve: "0x095ea7b3",
    transferFrom: "0x23b872dd",
    balanceOf: "0x70a08231",
    allowance: "0xdd62ed3e",
    totalSupply: "0x18160ddd",
    name: "0x06fdde03",
    symbol: "0x95d89b41",
    decimals: "0x313ce567",
} as const;

// Event signatures
export const ERC20_EVENT_SIGNATURES = {
    Transfer: "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    Approval: "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
} as const;

// Minimal ABI for write operations only
export const ERC20_WRITE_ABI = [
    {
        inputs: [
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        name: "transfer",
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        name: "approve",
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        name: "transferFrom",
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function",
    },
] as const satisfies Abi;

// Function parameter types for validation
export const ERC20_FUNCTION_PARAMS = {
    transfer: ["address", "uint256"],
    approve: ["address", "uint256"],
    transferFrom: ["address", "address", "uint256"],
} as const;

// Common gas limits for ERC20 operations
export const ERC20_GAS_LIMITS = {
    transfer: 21000n + 40000n, // base gas + ERC20 transfer
    approve: 21000n + 45000n, // base gas + ERC20 approve
    transferFrom: 21000n + 60000n, // base gas + ERC20 transferFrom
} as const;

// Common token decimals
export const COMMON_DECIMALS = 18;

// Zero address constant
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
