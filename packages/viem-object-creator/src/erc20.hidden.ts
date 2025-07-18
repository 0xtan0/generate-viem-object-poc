import * as dotenv from "dotenv";
import { formatUnits } from "viem";

import { ERCTransactionCreator } from "./erc20-transaction-creator.js";

dotenv.config();

// Helper function to format amounts for display (AI returns string/number, not BigInt)
function formatAmount(amount: string | number | undefined, decimals: number = 18): string {
    if (amount === undefined) return "undefined";

    try {
        // Convert to string for processing
        const amountStr = typeof amount === "number" ? amount.toString() : amount.trim();

        // Try to parse as bigint first (for wei amounts)
        if (amountStr.length > 15 && !amountStr.includes(".") && /^\d+$/.test(amountStr)) {
            const bigintValue = BigInt(amountStr);
            const formatted = formatUnits(bigintValue, decimals);
            return `${formatted} tokens (${bigintValue.toString()} wei)`;
        }

        // For decimal amounts, show original format and attempt conversion
        if (amountStr.includes(".") || amountStr.toLowerCase().includes("e")) {
            return `${amountStr} (original format - would be converted to wei)`;
        }

        // For regular numbers, show both formats
        const bigintValue = BigInt(amountStr);
        const formatted = formatUnits(bigintValue, decimals);
        return `${formatted} tokens (${bigintValue.toString()} wei)`;
    } catch (error) {
        return `${amount} (parsing error: ${error instanceof Error ? error.message : "unknown"})`;
    }
}

// Create a test instance
const creator = new ERCTransactionCreator({
    model: "gpt-4o-mini",
    apiKey: process.env.OPENAI_API_KEY || "your-api-key-here",
    defaultGasLimit: 100000n,
});

// Test examples - start with just one to debug
const testCases: string[] = [
    "Send 100 USDC to 0x4DaBbbFFcbD798e98803d9C3717764da76210e33",
    "Send 100 USDC",
];

// Test context
const testContext = {
    userAddress: "0xBcA85b1FBbAa644E9eEd46e4632AFFA18E0Ab959" as `0x${string}`,
    knownTokens: {
        USDC: {
            address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            name: "USD Coin",
            symbol: "USDC",
            decimals: 6,
        },
        USDT: {
            address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            name: "Tether USD",
            symbol: "USDT",
            decimals: 6,
        },
        DAI: {
            address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
            name: "Dai Stablecoin",
            symbol: "DAI",
            decimals: 18,
        },
    },
    chainId: 1,
};

async function runTests() {
    console.log("🚀 Testing ERC20 Transaction Creator\n");

    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        console.log(`\n📝 Test ${i + 1}: "${testCase}"`);
        console.log("─".repeat(60));

        try {
            const result = await creator.parseHumanInput(testCase!, testContext);

            console.log("✅ Parsed successfully!");
            console.log(`🎯 Transaction Type: ${result.parsedTransaction.type}`);
            console.log(`✅ Complete: ${result.isComplete ? "Yes" : "No"}`);

            if (result.isComplete && result.transaction) {
                console.log("\n🔗 Viem Transaction:");
                console.log(
                    JSON.stringify(
                        result.transaction,
                        (key, value) => {
                            if (typeof value === "bigint") {
                                return `${value.toString()} (${value.toString()})`;
                            }
                            return value;
                        },
                        2,
                    ),
                );
            }

            if (!result.isComplete) {
                console.log("\n❌ Missing Properties:");
                Object.entries(result.missingProperties).forEach(([key, value]) => {
                    console.log(`  • ${key}: ${value}`);
                });
            }

            console.log(`\n💬 Message: ${result.message}`);
        } catch (error) {
            console.error("❌ Error:", error instanceof Error ? error.message : "Unknown error");
        }
    }
}

// Main execution
async function main() {
    if (!process.env.OPENAI_API_KEY) {
        console.error("❌ Please set OPENAI_API_KEY environment variable");
        process.exit(1);
    }

    try {
        await runTests();
    } catch (error) {
        console.error("❌ Test failed:", error instanceof Error ? error.message : "Unknown error");
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}
