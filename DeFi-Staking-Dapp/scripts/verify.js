import hre from "hardhat";

async function main() {
    // Contract addresses
    const STK_TOKEN = "0xd91c39aa7E372C60B02C4FA851cd605950F4483a";
    const GOV_TOKEN = "0xBa887e8b132A9828eaadB570597cd0916DABE28D";
    const LP_TOKEN = "0x0000000000000000000000000000000000000000";
    const STAKING_CONTRACT = "0x05bea5d9aBc8768E96126AaE69F461321b641225";

    console.log("========================================");
    console.log("Starting Contract Verification...");
    console.log("========================================\n");

    // Verify StakingToken (STK)
    console.log("1️⃣  Verifying StakingToken (STK)...");
    console.log(`Address: ${STK_TOKEN}`);
    try {
        await hre.run("verify:verify", {
            address: STK_TOKEN,
            constructorArguments: [],
        });
        console.log("✅ StakingToken verified successfully!\n");
    } catch (error) {
        if (error.message.includes("Already Verified")) {
            console.log("ℹ️  StakingToken is already verified\n");
        } else {
            console.log("❌ StakingToken verification failed:");
            console.log(error.message + "\n");
        }
    }

    // Verify GovernanceToken (GOV)
    console.log("2️⃣  Verifying GovernanceToken (GOV)...");
    console.log(`Address: ${GOV_TOKEN}`);
    try {
        await hre.run("verify:verify", {
            address: GOV_TOKEN,
            constructorArguments: [],
        });
        console.log("✅ GovernanceToken verified successfully!\n");
    } catch (error) {
        if (error.message.includes("Already Verified")) {
            console.log("ℹ️  GovernanceToken is already verified\n");
        } else {
            console.log("❌ GovernanceToken verification failed:");
            console.log(error.message + "\n");
        }
    }

    // Verify DeFiStakingContract
    console.log("3️⃣  Verifying DeFiStakingContract...");
    console.log(`Address: ${STAKING_CONTRACT}`);
    console.log(`Constructor args: [${STK_TOKEN}, ${LP_TOKEN}, ${GOV_TOKEN}]`);
    try {
        await hre.run("verify:verify", {
            address: STAKING_CONTRACT,
            constructorArguments: [STK_TOKEN, LP_TOKEN, GOV_TOKEN],
        });
        console.log("✅ DeFiStakingContract verified successfully!\n");
    } catch (error) {
        if (error.message.includes("Already Verified")) {
            console.log("ℹ️  DeFiStakingContract is already verified\n");
        } else {
            console.log("❌ DeFiStakingContract verification failed:");
            console.log(error.message + "\n");
        }
    }

    console.log("========================================");
    console.log("Verification Complete!");
    console.log("========================================\n");
    console.log("View your verified contracts:");
    console.log(`STK Token: https://sepolia.etherscan.io/address/${STK_TOKEN}#code`);
    console.log(`GOV Token: https://sepolia.etherscan.io/address/${GOV_TOKEN}#code`);
    console.log(`Staking Contract: https://sepolia.etherscan.io/address/${STAKING_CONTRACT}#code`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
