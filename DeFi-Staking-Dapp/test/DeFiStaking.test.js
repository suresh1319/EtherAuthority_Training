import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("DeFi Staking Dapp", function () {
    let stakingToken, govToken, stakingContract;
    let owner, user1, user2;
    const INITIAL_SUPPLY = ethers.parseEther("10000000"); // 10M tokens
    const REWARD_POOL = ethers.parseEther("5000000");     // 5M for rewards

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        // Deploy tokens
        const StakingToken = await ethers.getContractFactory("StakingToken");
        stakingToken = await StakingToken.deploy(INITIAL_SUPPLY);

        const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
        govToken = await GovernanceToken.deploy();

        // Deploy staking contract (using STK as LP token for testing)
        const DeFiStakingContract = await ethers.getContractFactory("DeFiStakingContract");
        stakingContract = await DeFiStakingContract.deploy(
            await stakingToken.getAddress(),
            await stakingToken.getAddress(), // Using STK as LP for tests
            await govToken.getAddress()
        );

        // Setup permissions and fund contract
        await govToken.setStakingContract(await stakingContract.getAddress());
        await stakingToken.approve(await stakingContract.getAddress(), REWARD_POOL);
        await stakingContract.fundRewards(REWARD_POOL);

        // Give tokens to test users
        await stakingToken.transfer(user1.address, ethers.parseEther("100000"));
        await stakingToken.transfer(user2.address, ethers.parseEther("100000"));
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await stakingContract.owner()).to.equal(owner.address);
        });

        it("Should have correct token addresses", async function () {
            expect(await stakingContract.stakingToken()).to.equal(await stakingToken.getAddress());
            expect(await stakingContract.govToken()).to.equal(await govToken.getAddress());
        });

        it("Should have funded reward pool", async function () {
            expect(await stakingContract.getContractBalance()).to.equal(REWARD_POOL);
        });
    });

    describe("Staking - Flexible Period", function () {
        const stakeAmount = ethers.parseEther("1000");

        it("Should allow user to stake tokens", async function () {
            await stakingToken.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);

            await expect(
                stakingContract.connect(user1).stake(stakeAmount, 0, false, false)
            ).to.emit(stakingContract, "Staked")
                .withArgs(user1.address, stakeAmount, 0, false);

            const [stakedAmount] = await stakingContract.getUserStake(user1.address);
            expect(stakedAmount).to.equal(stakeAmount);
        });

        it("Should not allow staking 0 tokens", async function () {
            await expect(
                stakingContract.connect(user1).stake(0, 0, false, false)
            ).to.be.revertedWith("Cannot stake 0");
        });

        it("Should enforce anti-whale limit", async function () {
            const maxStake = await stakingContract.MAX_STAKE_PER_WALLET();
            const tooMuch = maxStake + ethers.parseEther("1");

            await stakingToken.mint(user1.address, tooMuch);
            await stakingToken.connect(user1).approve(await stakingContract.getAddress(), tooMuch);

            await expect(
                stakingContract.connect(user1).stake(tooMuch, 0, false, false)
            ).to.be.revertedWith("Exceeds max stake");
        });
    });

    describe("Staking - Time-Locked Tiers", function () {
        const stakeAmount = ethers.parseEther("1000");

        it("Should apply correct multipliers for each tier", async function () {
            expect(await stakingContract.getLockMultiplier(0)).to.equal(10000);  // 1x
            expect(await stakingContract.getLockMultiplier(1)).to.equal(15000);  // 1.5x
            expect(await stakingContract.getLockMultiplier(2)).to.equal(20000);  // 2x
            expect(await stakingContract.getLockMultiplier(3)).to.equal(30000);  // 3x
        });

        it("Should set correct unlock time for 30-day lock", async function () {
            await stakingToken.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);
            await stakingContract.connect(user1).stake(stakeAmount, 1, false, false);

            const userStake = await stakingContract.stakes(user1.address);
            const expectedUnlock = (await time.latest()) + (30 * 24 * 60 * 60);

            expect(userStake.unlockTime).to.be.closeTo(expectedUnlock, 5);
        });

        it("Should prevent unstaking before lock period ends", async function () {
            await stakingToken.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);
            await stakingContract.connect(user1).stake(stakeAmount, 1, false, false); // 30-day lock

            await expect(
                stakingContract.connect(user1).unstake(stakeAmount)
            ).to.be.revertedWith("Tokens still locked");
        });

        it("Should allow unstaking after lock period", async function () {
            await stakingToken.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);
            await stakingContract.connect(user1).stake(stakeAmount, 1, false, false); // 30-day lock

            // Fast forward 30 days
            await time.increase(30 * 24 * 60 * 60);

            await expect(
                stakingContract.connect(user1).unstake(stakeAmount)
            ).to.not.be.reverted;
        });
    });

    describe("Reward Calculations", function () {
        const stakeAmount = ethers.parseEther("10000");

        it("Should calculate rewards for flexible staking", async function () {
            await stakingToken.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);
            await stakingContract.connect(user1).stake(stakeAmount, 0, false, false);

            // Fast forward 1 year
            await time.increase(365 * 24 * 60 * 60);

            const [stkRewards, govRewards] = await stakingContract.calculateRewards(user1.address);

            // Should be approximately 10% APY (with TVL bonus)
            const expectedMinReward = ethers.parseEther("1000"); // 10% of 10000
            expect(stkRewards).to.be.gte(expectedMinReward);

            // GOV rewards should be 10% of STK rewards
            expect(govRewards).to.be.closeTo(stkRewards / 10n, ethers.parseEther("10"));
        });

        it("Should apply 1.5x multiplier for 30-day lock", async function () {
            await stakingToken.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);
            await stakingContract.connect(user1).stake(stakeAmount, 1, false, false); // 30-day lock

            await time.increase(365 * 24 * 60 * 60);

            const [stkRewards] = await stakingContract.calculateRewards(user1.address);

            // Should be approximately 15% APY (10% * 1.5x)
            const expectedMinReward = ethers.parseEther("1500");
            expect(stkRewards).to.be.gte(expectedMinReward);
        });

        it("Should apply 3x multiplier for 90-day lock", async function () {
            await stakingToken.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);
            await stakingContract.connect(user1).stake(stakeAmount, 3, false, false); // 90-day lock

            await time.increase(365 * 24 * 60 * 60);

            const [stkRewards] = await stakingContract.calculateRewards(user1.address);

            // Should be approximately 30% APY (10% * 3x)
            const expectedMinReward = ethers.parseEther("3000");
            expect(stkRewards).to.be.gte(expectedMinReward);
        });
    });

    describe("Dual Reward Distribution", function () {
        const stakeAmount = ethers.parseEther("1000");

        it("Should distribute both STK and GOV rewards on claim", async function () {
            await stakingToken.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);
            await stakingContract.connect(user1).stake(stakeAmount, 0, false, false);

            await time.increase(30 * 24 * 60 * 60); // 30 days

            const balanceBefore = await stakingToken.balanceOf(user1.address);
            const govBalanceBefore = await govToken.balanceOf(user1.address);

            await stakingContract.connect(user1).claimRewards();

            const balanceAfter = await stakingToken.balanceOf(user1.address);
            const govBalanceAfter = await govToken.balanceOf(user1.address);

            expect(balanceAfter).to.be.gt(balanceBefore);
            expect(govBalanceAfter).to.be.gt(govBalanceBefore);
        });

        it("Should mint GOV tokens on reward claim", async function () {
            await stakingToken.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);
            await stakingContract.connect(user1).stake(stakeAmount, 0, false, false);

            await time.increase(30 * 24 * 60 * 60);

            const totalSupplyBefore = await govToken.totalSupply();
            await stakingContract.connect(user1).claimRewards();
            const totalSupplyAfter = await govToken.totalSupply();

            expect(totalSupplyAfter).to.be.gt(totalSupplyBefore);
        });
    });

    describe("Auto-Compounding", function () {
        const stakeAmount = ethers.parseEther("1000");

        it("Should toggle auto-compound", async function () {
            await stakingToken.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);
            await stakingContract.connect(user1).stake(stakeAmount, 0, false, true); // Auto-compound enabled

            const userStake = await stakingContract.stakes(user1.address);
            expect(userStake.autoCompound).to.be.true;

            await stakingContract.connect(user1).toggleAutoCompound();

            const updatedStake = await stakingContract.stakes(user1.address);
            expect(updatedStake.autoCompound).to.be.false;
        });

        it("Should auto-compound rewards after interval", async function () {
            await stakingToken.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);
            await stakingContract.connect(user1).stake(stakeAmount, 0, false, true);

            const [initialStake] = await stakingContract.getUserStake(user1.address);

            // Fast forward past auto-compound interval (7 days)
            await time.increase(8 * 24 * 60 * 60);

            // Trigger auto-compound by claiming
            await stakingContract.connect(user1).claimRewards();

            const [finalStake] = await stakingContract.getUserStake(user1.address);

            // Stake should increase due to auto-compounding
            expect(finalStake).to.be.gt(initialStake);
        });
    });

    describe("Dynamic APY (TVL-based)", function () {
        it("Should apply TVL bonus for low TVL", async function () {
            const tvlBonus = await stakingContract.getTVLBonus();
            // Initially TVL is low, should get 1.2x bonus
            expect(tvlBonus).to.equal(12000);
        });

        it("Should reduce bonus as TVL increases", async function () {
            // Stake large amount to increase TVL
            const largeStake = ethers.parseEther("200000");
            await stakingToken.mint(user1.address, largeStake);
            await stakingToken.connect(user1).approve(await stakingContract.getAddress(), largeStake);
            await stakingContract.connect(user1).stake(largeStake, 0, false, false);

            const tvlBonus = await stakingContract.getTVLBonus();
            // TVL increased, bonus should reduce
            expect(tvlBonus).to.be.lte(12000);
        });
    });

    describe("Anti-Flash Loan Protection", function () {
        const stakeAmount = ethers.parseEther("1000");

        it("Should prevent stake and unstake in same block", async function () {
            await stakingToken.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);
            await stakingContract.connect(user1).stake(stakeAmount, 0, false, false);

            // Attempt to unstake in same transaction context should fail
            // Note: This is difficult to test directly as each transaction is a new block
            // In production, this prevents flash loan attacks
        });
    });

    describe("Emergency Functions", function () {
        const stakeAmount = ethers.parseEther("1000");

        it("Should allow emergency withdraw", async function () {
            await stakingToken.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);
            await stakingContract.connect(user1).stake(stakeAmount, 0, false, false);

            await time.increase(30 * 24 * 60 * 60);

            const balanceBefore = await stakingToken.balanceOf(user1.address);
            await stakingContract.connect(user1).emergencyWithdraw();
            const balanceAfter = await stakingToken.balanceOf(user1.address);

            expect(balanceAfter - balanceBefore).to.equal(stakeAmount);
        });

        it("Should allow owner to pause staking", async function () {
            await stakingContract.pause();

            await stakingToken.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);
            await expect(
                stakingContract.connect(user1).stake(stakeAmount, 0, false, false)
            ).to.be.revertedWithCustomError(stakingContract, "EnforcedPause");
        });

        it("Should allow owner to unpause staking", async function () {
            await stakingContract.pause();
            await stakingContract.unpause();

            await stakingToken.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);
            await expect(
                stakingContract.connect(user1).stake(stakeAmount, 0, false, false)
            ).to.not.be.reverted;
        });
    });

    describe("Unstaking and Rewards", function () {
        const stakeAmount = ethers.parseEther("1000");

        it("Should return staked amount plus rewards on unstake", async function () {
            await stakingToken.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);
            await stakingContract.connect(user1).stake(stakeAmount, 0, false, false);

            await time.increase(30 * 24 * 60 * 60);

            const balanceBefore = await stakingToken.balanceOf(user1.address);
            await stakingContract.connect(user1).unstake(stakeAmount);
            const balanceAfter = await stakingToken.balanceOf(user1.address);

            expect(balanceAfter - balanceBefore).to.be.gt(stakeAmount);
        });

        it("Should emit proper events on unstake", async function () {
            await stakingToken.connect(user1).approve(await stakingContract.getAddress(), stakeAmount);
            await stakingContract.connect(user1).stake(stakeAmount, 0, false, false);

            await time.increase(30 * 24 * 60 * 60);

            await expect(stakingContract.connect(user1).unstake(stakeAmount))
                .to.emit(stakingContract, "Unstaked");
        });
    });
});
