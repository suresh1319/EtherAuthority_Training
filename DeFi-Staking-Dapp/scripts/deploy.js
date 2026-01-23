import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


async function main() {
    console.log("🚀 Starting DeFi Staking Dapp deployment...\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("📍 Deploying contracts with account:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

    // Deploy StakingToken (STK)
    console.log("1️⃣  Deploying Staking Token (STK)...");
    const StakingToken = await hre.ethers.getContractFactory("StakingToken");
    const initialSupply = hre.ethers.parseEther("10000000"); // 10M tokens
    const stakingToken = await StakingToken.deploy(initialSupply);
    await stakingToken.waitForDeployment();
    const stakingTokenAddress = await stakingToken.getAddress();
    console.log("✅ StakingToken deployed to:", stakingTokenAddress);

    // Deploy GovernanceToken (GOV)
    console.log("\n2️⃣  Deploying Governance Token (GOV)...");
    const GovernanceToken = await hre.ethers.getContractFactory("GovernanceToken");
    const govToken = await GovernanceToken.deploy();
    await govToken.waitForDeployment();
    const govTokenAddress = await govToken.getAddress();
    console.log("✅ GovernanceToken deployed to:", govTokenAddress);

    // For now, use a placeholder LP token address (you can deploy actual Uniswap pair later)
    // On testnets, you'd need to create a pair on Uniswap V2
    const lpTokenAddress = "0x0000000000000000000000000000000000000000"; // Placeholder
    console.log("\n⚠️  LP Token: Using placeholder address (deploy Uniswap pair separately)");

    // Deploy DeFiStakingContract
    console.log("\n3️⃣  Deploying DeFi Staking Contract...");
    const DeFiStakingContract = await hre.ethers.getContractFactory("DeFiStakingContract");
    const stakingContract = await DeFiStakingContract.deploy(
        stakingTokenAddress,
        lpTokenAddress === "0x0000000000000000000000000000000000000000" ? stakingTokenAddress : lpTokenAddress, // Use STK as fallback
        govTokenAddress
    );
    await stakingContract.waitForDeployment();
    const stakingContractAddress = await stakingContract.getAddress();
    console.log("✅ DeFiStakingContract deployed to:", stakingContractAddress);

    // Set staking contract as minter for GOV token
    console.log("\n4️⃣  Setting staking contract as GOV token minter...");
    const tx = await govToken.setStakingContract(stakingContractAddress);
    await tx.wait();
    console.log("✅ Staking contract authorized to mint GOV tokens");

    // Fund staking contract with rewards
    console.log("\n5️⃣  Funding staking contract with reward tokens...");
    const rewardAmount = hre.ethers.parseEther("5000000"); // 5M tokens for rewards
    const approveTx = await stakingToken.approve(stakingContractAddress, rewardAmount);
    await approveTx.wait();
    const fundTx = await stakingContract.fundRewards(rewardAmount);
    await fundTx.wait();
    console.log("✅ Funded contract with", hre.ethers.formatEther(rewardAmount), "STK tokens");

    // Save deployment addresses
    const deployments = {
        network: hre.network.name,
        chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
        deployer: deployer.address,
        contracts: {
            StakingToken: stakingTokenAddress,
            GovernanceToken: govTokenAddress,
            DeFiStakingContract: stakingContractAddress,
            LPToken: lpTokenAddress
        },
        deployedAt: new Date().toISOString()
    };

    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentPath = path.join(deploymentsDir, `${hre.network.name}.json`);
    fs.writeFileSync(deploymentPath, JSON.stringify(deployments, null, 2));
    console.log("\n💾 Deployment info saved to:", deploymentPath);

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 DeFi Staking Dapp Deployment Complete!");
    console.log("=".repeat(60));
    console.log("\n📋 Contract Addresses:");
    console.log("   STK Token:        ", stakingTokenAddress);
    console.log("   GOV Token:        ", govTokenAddress);
    console.log("   Staking Contract: ", stakingContractAddress);
    console.log("   LP Token:         ", lpTokenAddress, "(placeholder)");

    console.log("\n📊 Initial State:");
    console.log("   STK Total Supply: ", hre.ethers.formatEther(await stakingToken.totalSupply()));
    console.log("   GOV Total Supply: ", hre.ethers.formatEther(await govToken.totalSupply()));
    console.log("   Reward Pool:      ", hre.ethers.formatEther(await stakingContract.getContractBalance()));

    console.log("\n🔍 Next Steps:");
    console.log("   1. Verify contracts on Etherscan (if on testnet)");
    console.log("   2. Create Uniswap V2 pair for STK-ETH");
    console.log("   3. Update LP token address in deployment config");
    console.log("   4. Test staking with different lock periods");
    console.log("\n" + "=".repeat(60) + "\n");

    // Verification commands (if on testnet)
    if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
        console.log("🔍 To verify contracts, run:");
        console.log(`   npx hardhat verify --network ${hre.network.name} ${stakingTokenAddress} "${initialSupply}"`);
        console.log(`   npx hardhat verify --network ${hre.network.name} ${govTokenAddress}`);
        console.log(`   npx hardhat verify --network ${hre.network.name} ${stakingContractAddress} "${stakingTokenAddress}" "${lpTokenAddress === "0x0000000000000000000000000000000000000000" ? stakingTokenAddress : lpTokenAddress}" "${govTokenAddress}"`);
    }
}

(async function () {
    try {
        await main();
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();
