const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("Starting deployment...\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

    // Deploy StakingToken
    console.log("Deploying StakingToken...");
    const initialSupply = hre.ethers.parseEther("1000000"); // 1 million tokens
    const StakingToken = await hre.ethers.getContractFactory("StakingToken");
    const stakingToken = await StakingToken.deploy(initialSupply);
    await stakingToken.waitForDeployment();
    const stakingTokenAddress = await stakingToken.getAddress();
    console.log("StakingToken deployed to:", stakingTokenAddress);

    // Deploy StakingContract
    console.log("\nDeploying StakingContract...");
    const StakingContract = await hre.ethers.getContractFactory("StakingContract");
    const stakingContract = await StakingContract.deploy(stakingTokenAddress);
    await stakingContract.waitForDeployment();
    const stakingContractAddress = await stakingContract.getAddress();
    console.log("StakingContract deployed to:", stakingContractAddress);

    // Fund the staking contract with reward tokens
    console.log("\nFunding StakingContract with rewards...");
    const rewardAmount = hre.ethers.parseEther("500000"); // 500k tokens for rewards
    const approveTx = await stakingToken.approve(stakingContractAddress, rewardAmount);
    await approveTx.wait();
    const fundTx = await stakingContract.fundRewards(rewardAmount);
    await fundTx.wait();
    console.log("Funded with:", hre.ethers.formatEther(rewardAmount), "STK tokens");

    // Save deployment addresses
    const deploymentInfo = {
        network: hre.network.name,
        chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
        deployer: deployer.address,
        contracts: {
            StakingToken: stakingTokenAddress,
            StakingContract: stakingContractAddress
        },
        timestamp: new Date().toISOString()
    };

    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir);
    }

    const deploymentFile = path.join(deploymentsDir, `${hre.network.name}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

    console.log("\n✅ Deployment completed!");
    console.log("Deployment info saved to:", deploymentFile);
    console.log("\nContract Addresses:");
    console.log("- StakingToken:", stakingTokenAddress);
    console.log("- StakingContract:", stakingContractAddress);

    // Verify contracts on Etherscan (only on testnets/mainnet)
    if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
        console.log("\n⏳ Waiting for block confirmations before verification...");
        await stakingToken.deploymentTransaction().wait(6);

        console.log("\nVerifying contracts on Etherscan...");
        try {
            await hre.run("verify:verify", {
                address: stakingTokenAddress,
                constructorArguments: [initialSupply]
            });
            console.log("✅ StakingToken verified");
        } catch (error) {
            console.log("❌ StakingToken verification failed:", error.message);
        }

        try {
            await hre.run("verify:verify", {
                address: stakingContractAddress,
                constructorArguments: [stakingTokenAddress]
            });
            console.log("✅ StakingContract verified");
        } catch (error) {
            console.log("❌ StakingContract verification failed:", error.message);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
