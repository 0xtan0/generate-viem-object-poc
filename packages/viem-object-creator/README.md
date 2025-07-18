# ERC20 Transaction Creator

An AI-powered ERC20 transaction parser that converts human input into Viem-compatible transactions using OpenAI's structured object generation.

## Features

-   🤖 **AI-Powered Parsing**: Uses OpenAI's `generateObject` to parse natural language into structured ERC20 transactions
-   🔗 **Viem Compatible**: Generates transactions ready for use with Viem
-   📝 **Comprehensive Support**: Handles `transfer`, `approve`, and `transferFrom` operations
-   ⚡ **Missing Property Detection**: Automatically identifies and reports missing required information
-   🎯 **Smart Validation**: Validates addresses, amounts, and transaction completeness
-   🔧 **TypeScript**: Fully typed with comprehensive error handling

## Installation

```bash
npm install
```

## Usage

### Basic Example

```typescript
import { ERCTransactionCreator } from "@ts-turborepo-boilerplate/viem-object-creator";

const creator = new ERCTransactionCreator({
    model: "gpt-4o-mini",
    apiKey: process.env.OPENAI_API_KEY,
    defaultGasLimit: 100000n,
});

// Parse human input
const result = await creator.parseHumanInput(
    "Send 100 USDC to 0x742d35Cc6634C0532925a3b8D4aFF5e6C154F9e0",
);

if (result.isComplete && result.transaction) {
    console.log("Ready to send:", result.transaction);
} else {
    console.log("Missing info:", result.missingProperties);
}
```

### Supported Operations

1. **Transfer**: Send tokens from your address to another

    - `"Send 100 USDC to 0x123..."`
    - `"Transfer 50 tokens to Alice"`

2. **Approve**: Give permission to another address to spend your tokens

    - `"Approve Uniswap to spend 500 tokens"`
    - `"Allow DEX to use 1000 USDT"`

3. **TransferFrom**: Transfer tokens from one address to another (requires approval)
    - `"Transfer 50 tokens from 0x123 to 0x456"`
    - `"Move 25 DAI from Alice to Bob"`

### Test the Implementation

1. Set your OpenAI API key:

```bash
export OPENAI_API_KEY=your-api-key-here
```

2. Run the test script:

```bash
npm run start
```

This will run through various test cases and show you how the AI parses different types of human input.

### Response Structure

```typescript
interface ERC20TransactionResult {
    transaction: TransactionRequest | null; // Viem transaction (null if incomplete)
    isComplete: boolean; // Whether transaction is ready to send
    parsedTransaction: ERC20Transaction; // Parsed transaction data
    missingProperties: Record<string, string>; // Missing required properties
    message: string; // Human-readable message
    confidence: number; // AI confidence (0-1)
}
```

### Configuration Options

```typescript
interface ERC20TransactionCreatorConfig {
    model: string; // AI model (e.g., 'gpt-4o-mini')
    apiKey: string; // OpenAI API key
    defaultTokenAddress?: string; // Default token contract address
    defaultGasLimit?: bigint; // Default gas limit
    defaultGasPrice?: bigint; // Default gas price
}
```

## Architecture

The package includes:

-   **Schemas** (`schemas/erc20.schemas.ts`): Zod schemas for validation
-   **Types** (`types/erc20.types.ts`): TypeScript type definitions
-   **Constants** (`constants/erc20.abi.ts`): ERC20 ABI and constants
-   **Main Class** (`erc20-transaction-creator.ts`): Core parsing logic

## Examples

### Complete Transaction

```typescript
const result = await creator.parseHumanInput(
    "Send 100 USDC to 0x742d35Cc6634C0532925a3b8D4aFF5e6C154F9e0",
    {
        knownTokens: {
            USDC: {
                address: "0xA0b86a33E6441c1bE71a3d7e0c5B4b8a1B7C6E7D",
                name: "USD Coin",
                symbol: "USDC",
                decimals: 6,
            },
        },
    },
);
// Result: Complete transaction ready to send
```

### Incomplete Transaction

```typescript
const result = await creator.parseHumanInput("Send some tokens to someone");
// Result: Missing properties detected with helpful messages
```

## Error Handling

The package provides specific error types:

-   `ERC20ParseError`: AI parsing failures
-   `ERC20ValidationError`: Validation failures
