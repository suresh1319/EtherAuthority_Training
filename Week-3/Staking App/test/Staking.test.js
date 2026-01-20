const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Staking Contract", function () {
    let stakingToken;
    let stakingContract;
    let owner;
    let addr1;
    let addr2;

    const INITIAL_SUPPLY = ethers.parseEther("1000000");
    const REWARD_POOL = ethers.parseEther("500000");

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        // Deploy StakingToken
        const StakingToken = await ethers.getContractFactory("StakingToken");
        stakingToken = await StakingToken.deploy(INITIAL_SUPPLY);
        await stakingToken.waitForDeployment();

        // Deploy StakingContract
        const StakingContract = await ethers.getContractFactory("StakingContract");
        stakingContract = await StakingContract.deploy(await stakingToken.getAddress());
        await stakingContract.waitForDeployment();

        // Fund staking contract with rewards
        await stakingToken.approve(await stakingContract.getAddress(), REWARD_POOL);
        await stakingContract.fundRewards(REWARD_POOL);

        // Transfer some tokens to test accounts
        await stakingToken.transfer(addr1.address, ethers.parseEther("10000"));
        await stakingToken.transfer(addr2.address, ethers.parseEther("10000"));
    });

    describe("Deployment", function () {
        it("Should set the correct staking token", async function () {
            expect(await stakingContract.stakingToken()).to.equal(await stakingToken.getAddress());
        });

        it("Should have correct initial values", async function () {
            expect(await stakingContract.totalStaked()).to.equal(0);
            expect(await stakingContract.totalRewardsPaid()).to.equal(0);
        });

        it("Should have correct APY (10%)", async function () {
            expect(await stakingContract.getAPY()).to.equal(1000); // 1000 basis points = 10%
        });
    });

    describe("Staking", function () {
        it("Should allow users to stake tokens", async function () {
            const stakeAmount = ethers.parseEther("1000");

            await stakingToken.connect(addr1).approve(await stakingContract.getAddress(), stakeAmount);
            await stakingContract.connect(addr1).stake(stakeAmount);

            const userStake = await stakingContract.stakes(addr1.address);
            expect(userStake.amount).to.equal(stakeAmount);
            expect(await stakingContract.totalStaked()).to.equal(stakeAmount);
        });

        it("Should fail when staking 0 tokens", async function () {
            await expect(
                stakingContract.connect(addr1).stake(0)
            ).to.be.revertedWith("Cannot stake 0 tokens");
        });

        it("Should emit Staked event", async function () {
            const stakeAmount = ethers.parseEther("1000");

            await stakingToken.connect(addr1).approve(await stakingContract.getAddress(), stakeAmount);

            await expect(stakingContract.connect(addr1).stake(stakeAmount))
                .to.emit(stakingContract, "Staked")
                .withArgs(addr1.address, stakeAmount, await time.latest() + 1);
        });

        it("Should allow multiple stakes from same user", async function () {
            const stakeAmount1 = ethers.parseEther("500");
            const stakeAmount2 = ethers.parseEther("500");

            await stakingToken.connect(addr1).approve(await stakingContract.getAddress(), ethers.parseEther("1000"));

            await stakingContract.connect(addr1).stake(stakeAmount1);
            await stakingContract.connect(addr1).stake(stakeAmount2);

            const userStake = await stakingContract.stakes(addr1.address);
            expect(userStake.amount).to.equal(ethers.parseEther("1000"));
        });
    });

    describe("Rewards Calculation", function () {
        it("Should calculate rewards correctly after 1 year (10% APY)", async function () {
            const stakeAmount = ethers.parseEther("1000");

            await stakingToken.connect(addr1).approve(await stakingContract.getAddress(), stakeAmount);
            await stakingContract.connect(addr1).stake(stakeAmount);

            // Increase time by 1 year
            await time.increase(365 * 24 * 60 * 60);

            const rewards = await stakingContract.calculateRewards(addr1.address);
            const expectedRewards = ethers.parseEther("100"); // 10% of 1000

            // Allow 1% margin due to timestamp precision
            const margin = expectedRewards / 100n;
            expect(rewards).to.be.closeTo(expectedRewards, margin);
        });

        it("Should calculate rewards correctly after 30 days", async function () {
            const stakeAmount = ethers.parseEther("1000");

            await stakingToken.connect(addr1).approve(await stakingContract.getAddress(), stakeAmount);
            await stakingContract.connect(addr1).stake(stakeAmount);

            // Increase time by 30 days
            await time.increase(30 * 24 * 60 * 60);

            const rewards = await stakingContract.calculateRewards(addr1.address);
            // 10% APY for 30 days: 1000 * 0.1 * (30/365) ≈ 8.22 tokens
            const expectedRewards = ethers.parseEther("8.219178082191780821");

            expect(rewards).to.be.closeTo(expectedRewards, ethers.parseEther("0.01"));
        });

        it("Should return 0 rewards for no stake", async function () {
            expect(await stakingContract.calculateRewards(addr1.address)).to.equal(0);
        });
    });

    describe("Claiming Rewards", function () {
        it("Should allow users to claim rewards", async function () {
            const stakeAmount = ethers.parseEther("1000");

            await stakingToken.connect(addr1).approve(await stakingContract.getAddress(), stakeAmount);
            await stakingContract.connect(addr1).stake(stakeAmount);

            // Increase time by 30 days
            await time.increase(30 * 24 * 60 * 60);

            const rewardsBefore = await stakingContract.calculateRewards(addr1.address);
            const balanceBefore = await stakingToken.balanceOf(addr1.address);

            await stakingContract.connect(addr1).claimRewards();

            const balanceAfter = await stakingToken.balanceOf(addr1.address);
            expect(balanceAfter - balanceBefore).to.be.closeTo(rewardsBefore, ethers.parseEther("0.001"));
        });

        it("Should emit RewardsClaimed event", async function () {
            const stakeAmount = ethers.parseEther("1000");

            await stakingToken.connect(addr1).approve(await stakingContract.getAddress(), stakeAmount);
            await stakingContract.connect(addr1).stake(stakeAmount);

            await time.increase(30 * 24 * 60 * 60);

            const rewards = await stakingContract.calculateRewards(addr1.address);

            await expect(stakingContract.connect(addr1).claimRewards())
                .to.emit(stakingContract, "RewardsClaimed");
        });

        it("Should fail when claiming with no stake", async function () {
            await expect(
                stakingContract.connect(addr1).claimRewards()
            ).to.be.revertedWith("No active stake");
        });
    });

    describe("Unstaking", function () {
        it("Should allow users to unstake tokens", async function () {
            const stakeAmount = ethers.parseEther("1000");

            await stakingToken.connect(addr1).approve(await stakingContract.getAddress(), stakeAmount);
            await stakingContract.connect(addr1).stake(stakeAmount);

            await time.increase(10 * 24 * 60 * 60); // 10 days

            const balanceBefore = await stakingToken.balanceOf(addr1.address);
            await stakingContract.connect(addr1).unstake(stakeAmount);
            const balanceAfter = await stakingToken.balanceOf(addr1.address);

            // Should receive staked amount + rewards
            expect(balanceAfter).to.be.gt(balanceBefore + stakeAmount);
            expect(await stakingContract.totalStaked()).to.equal(0);
        });

        it("Should allow partial unstaking", async function () {
            const stakeAmount = ethers.parseEther("1000");
            const unstakeAmount = ethers.parseEther("500");

            await stakingToken.connect(addr1).approve(await stakingContract.getAddress(), stakeAmount);
            await stakingContract.connect(addr1).stake(stakeAmount);

            await stakingContract.connect(addr1).unstake(unstakeAmount);

            const userStake = await stakingContract.stakes(addr1.address);
            expect(userStake.amount).to.equal(unstakeAmount);
            expect(await stakingContract.totalStaked()).to.equal(unstakeAmount);
        });

        it("Should fail when unstaking more than staked", async function () {
            const stakeAmount = ethers.parseEther("1000");

            await stakingToken.connect(addr1).approve(await stakingContract.getAddress(), stakeAmount);
            await stakingContract.connect(addr1).stake(stakeAmount);

            await expect(
                stakingContract.connect(addr1).unstake(ethers.parseEther("2000"))
            ).to.be.revertedWith("Insufficient staked amount");
        });

        it("Should emit Unstaked event", async function () {
            const stakeAmount = ethers.parseEther("1000");

            await stakingToken.connect(addr1).approve(await stakingContract.getAddress(), stakeAmount);
            await stakingContract.connect(addr1).stake(stakeAmount);

            await expect(stakingContract.connect(addr1).unstake(stakeAmount))
                .to.emit(stakingContract, "Unstaked");
        });
    });

    describe("Emergency Withdraw", function () {
        it("Should allow emergency withdrawal without rewards", async function () {
            const stakeAmount = ethers.parseEther("1000");

            await stakingToken.connect(addr1).approve(await stakingContract.getAddress(), stakeAmount);
            await stakingContract.connect(addr1).stake(stakeAmount);

            await time.increase(30 * 24 * 60 * 60);

            const balanceBefore = await stakingToken.balanceOf(addr1.address);
            await stakingContract.connect(addr1).emergencyWithdraw();
            const balanceAfter = await stakingToken.balanceOf(addr1.address);

            // Should only receive staked amount, no rewards
            expect(balanceAfter - balanceBefore).to.equal(stakeAmount);
        });
    });

    describe("Pause Functionality", function () {
        it("Should allow owner to pause staking", async function () {
            await stakingContract.pause();

            const stakeAmount = ethers.parseEther("1000");
            await stakingToken.connect(addr1).approve(await stakingContract.getAddress(), stakeAmount);

            await expect(
                stakingContract.connect(addr1).stake(stakeAmount)
            ).to.be.reverted;
        });

        it("Should allow owner to unpause", async function () {
            await stakingContract.pause();
            await stakingContract.unpause();

            const stakeAmount = ethers.parseEther("1000");
            await stakingToken.connect(addr1).approve(await stakingContract.getAddress(), stakeAmount);
            await stakingContract.connect(addr1).stake(stakeAmount);

            expect(await stakingContract.totalStaked()).to.equal(stakeAmount);
        });
    });

    describe("View Functions", function () {
        it("Should return correct user stake info", async function () {
            const stakeAmount = ethers.parseEther("1000");

            await stakingToken.connect(addr1).approve(await stakingContract.getAddress(), stakeAmount);
            await stakingContract.connect(addr1).stake(stakeAmount);

            const [amount, timestamp, pending, claimed] = await stakingContract.getUserStake(addr1.address);

            expect(amount).to.equal(stakeAmount);
            expect(timestamp).to.be.gt(0);
            expect(pending).to.equal(0); // No time passed yet
            expect(claimed).to.equal(0);
        });

        it("Should return total staked", async function () {
            const stakeAmount1 = ethers.parseEther("1000");
            const stakeAmount2 = ethers.parseEther("2000");

            await stakingToken.connect(addr1).approve(await stakingContract.getAddress(), stakeAmount1);
            await stakingContract.connect(addr1).stake(stakeAmount1);

            await stakingToken.connect(addr2).approve(await stakingContract.getAddress(), stakeAmount2);
            await stakingContract.connect(addr2).stake(stakeAmount2);

            expect(await stakingContract.getTotalStaked()).to.equal(ethers.parseEther("3000"));
        });
    });
});
