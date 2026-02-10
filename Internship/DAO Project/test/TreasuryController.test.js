const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("TreasuryController", function () {
    let treasury, governance, controller;
    let admin, executor, user1, user2, user3, recipient;
    const VOTING_PERIOD = 3 * 24 * 60 * 60; // 3 days

    beforeEach(async function () {
        [admin, executor, user1, user2, user3, recipient] = await ethers.getSigners();

        // Deploy Treasury
        const Treasury = await ethers.getContractFactory("CommunityTreasury");
        treasury = await Treasury.deploy(admin.address, admin.address); // Use admin as governance placeholder initially
        await treasury.waitForDeployment();

        // Deploy Governance
        const Governance = await ethers.getContractFactory("Governance");
        governance = await Governance.deploy(admin.address);
        await governance.waitForDeployment();

        // Deploy TreasuryController
        const Controller = await ethers.getContractFactory("TreasuryController");
        controller = await Controller.deploy(
            admin.address,
            await governance.getAddress(),
            await treasury.getAddress()
        );
        await controller.waitForDeployment();

        // Grant CONTROLLER_ROLE to TreasuryController in Treasury
        await treasury.connect(admin).setController(await controller.getAddress());

        // Set totalVoters for quorum
        await governance.connect(admin).setTotalVoters(10);

        // Fund the treasury
        await treasury.connect(user1).deposit({ value: ethers.parseEther("100") });
    });

    /* ----------------------------------------------------------- */
    /*                      DEPLOYMENT TESTS                        */
    /* ----------------------------------------------------------- */

    describe("Deployment", function () {
        it("Should deploy with correct admin", async function () {
            const DEFAULT_ADMIN_ROLE = await controller.DEFAULT_ADMIN_ROLE();
            expect(await controller.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
        });

        it("Should deploy with correct governance address", async function () {
            expect(await controller.getGovernanceAddress()).to.equal(await governance.getAddress());
        });

        it("Should deploy with correct treasury address", async function () {
            expect(await controller.getTreasuryAddress()).to.equal(await treasury.getAddress());
        });

        it("Should revert deployment with zero addresses", async function () {
            const Controller = await ethers.getContractFactory("TreasuryController");

            await expect(
                Controller.deploy(ethers.ZeroAddress, await governance.getAddress(), await treasury.getAddress())
            ).to.be.revertedWithCustomError(controller, "ZeroAddress");

            await expect(
                Controller.deploy(admin.address, ethers.ZeroAddress, await treasury.getAddress())
            ).to.be.revertedWithCustomError(controller, "ZeroAddress");

            await expect(
                Controller.deploy(admin.address, await governance.getAddress(), ethers.ZeroAddress)
            ).to.be.revertedWithCustomError(controller, "ZeroAddress");
        });

        it("Should initialize with unpaused state", async function () {
            expect(await controller.isPaused()).to.be.false;
        });

        it("Should grant EXECUTOR_ROLE to admin", async function () {
            const EXECUTOR_ROLE = await controller.EXECUTOR_ROLE();
            expect(await controller.hasRole(EXECUTOR_ROLE, admin.address)).to.be.true;
        });
    });

    /* ----------------------------------------------------------- */
    /*                 PROPOSAL EXECUTION TESTS                     */
    /* ----------------------------------------------------------- */

    describe("Proposal Execution", function () {
        let proposalId;

        beforeEach(async function () {
            // Create a proposal
            const tx = await governance.connect(user1).createProposal(
                recipient.address,
                ethers.parseEther("10"),
                "Fund community event"
            );
            const receipt = await tx.wait();
            proposalId = 0;

            // Vote on proposal
            await governance.connect(user1).vote(proposalId, true);
            await governance.connect(user2).vote(proposalId, true);
            await governance.connect(user3).vote(proposalId, true);

            // Wait for voting period to end
            await time.increase(VOTING_PERIOD + 1);

            // Finalize proposal
            await governance.connect(admin).finalizeProposal(proposalId);
        });

        it("Should execute valid passed proposal", async function () {
            const initialBalance = await ethers.provider.getBalance(recipient.address);
            const treasuryBalanceBefore = await treasury.getBalance();

            await expect(controller.connect(admin).executeProposal(proposalId))
                .to.emit(controller, "ProposalExecuted")
                .withArgs(proposalId, recipient.address, ethers.parseEther("10"), admin.address, await time.latest() + 1);

            const finalBalance = await ethers.provider.getBalance(recipient.address);
            expect(finalBalance - initialBalance).to.equal(ethers.parseEther("10"));

            const treasuryBalanceAfter = await treasury.getBalance();
            expect(treasuryBalanceBefore - treasuryBalanceAfter).to.equal(ethers.parseEther("10"));
        });

        it("Should mark proposal as executed in Governance", async function () {
            await controller.connect(admin).executeProposal(proposalId);

            const proposal = await governance.getProposal(proposalId);
            expect(proposal.state).to.equal(4); // Executed state
        });

        it("Should mark proposal as executed locally", async function () {
            expect(await controller.isProposalExecuted(proposalId)).to.be.false;

            await controller.connect(admin).executeProposal(proposalId);

            expect(await controller.isProposalExecuted(proposalId)).to.be.true;
        });

        it("Should prevent double execution", async function () {
            await controller.connect(admin).executeProposal(proposalId);

            await expect(
                controller.connect(admin).executeProposal(proposalId)
            ).to.be.revertedWithCustomError(controller, "ProposalAlreadyExecuted");
        });

        it("Should reject non-passed proposals", async function () {
            // Create another proposal that gets rejected
            await governance.connect(user1).createProposal(
                recipient.address,
                ethers.parseEther("5"),
                "Another proposal"
            );
            const rejectedId = 1;

            // Vote no
            await governance.connect(user1).vote(rejectedId, false);
            await governance.connect(user2).vote(rejectedId, false);

            // Wait and finalize
            await time.increase(VOTING_PERIOD + 1);
            await governance.connect(admin).finalizeProposal(rejectedId);

            await expect(
                controller.connect(admin).executeProposal(rejectedId)
            ).to.be.revertedWithCustomError(controller, "ProposalNotPassed");
        });

        it("Should reject non-existent proposals", async function () {
            await expect(
                controller.connect(admin).executeProposal(999)
            ).to.be.revertedWithCustomError(controller, "ProposalNotFound");
        });

        it("Should handle insufficient treasury balance", async function () {
            // Create proposal for more than treasury has
            await governance.connect(user1).createProposal(
                recipient.address,
                ethers.parseEther("200"),
                "Large proposal"
            );
            const largeId = 1;

            await governance.connect(user1).vote(largeId, true);
            await governance.connect(user2).vote(largeId, true);
            await governance.connect(user3).vote(largeId, true);

            await time.increase(VOTING_PERIOD + 1);
            await governance.connect(admin).finalizeProposal(largeId);

            await expect(
                controller.connect(admin).executeProposal(largeId)
            ).to.be.revertedWithCustomError(controller, "InsufficientTreasuryBalance");
        });

        it("Should allow executor role to execute", async function () {
            // Grant executor role to executor address
            const EXECUTOR_ROLE = await controller.EXECUTOR_ROLE();
            await controller.connect(admin).grantRole(EXECUTOR_ROLE, executor.address);

            await expect(controller.connect(executor).executeProposal(proposalId))
                .to.not.be.reverted;
        });

        it("Should reject execution from non-executor", async function () {
            const EXECUTOR_ROLE = await controller.EXECUTOR_ROLE();

            await expect(
                controller.connect(user1).executeProposal(proposalId)
            ).to.be.revertedWithCustomError(controller, "AccessControlUnauthorizedAccount");
        });
    });

    /* ----------------------------------------------------------- */
    /*                   ACCESS CONTROL TESTS                       */
    /* ----------------------------------------------------------- */

    describe("Access Control", function () {
        it("Should allow admin to update governance address", async function () {
            const newGovernance = user1.address;

            await expect(controller.connect(admin).setGovernanceContract(newGovernance))
                .to.emit(controller, "GovernanceUpdated")
                .withArgs(newGovernance);

            expect(await controller.getGovernanceAddress()).to.equal(newGovernance);
        });

        it("Should allow admin to update treasury address", async function () {
            const newTreasury = user1.address;

            await expect(controller.connect(admin).setTreasuryContract(newTreasury))
                .to.emit(controller, "TreasuryUpdated")
                .withArgs(newTreasury);

            expect(await controller.getTreasuryAddress()).to.equal(newTreasury);
        });

        it("Should reject non-admin updating governance", async function () {
            await expect(
                controller.connect(user1).setGovernanceContract(user2.address)
            ).to.be.revertedWithCustomError(controller, "AccessControlUnauthorizedAccount");
        });

        it("Should reject non-admin updating treasury", async function () {
            await expect(
                controller.connect(user1).setTreasuryContract(user2.address)
            ).to.be.revertedWithCustomError(controller, "AccessControlUnauthorizedAccount");
        });

        it("Should reject zero address for governance", async function () {
            await expect(
                controller.connect(admin).setGovernanceContract(ethers.ZeroAddress)
            ).to.be.revertedWithCustomError(controller, "ZeroAddress");
        });

        it("Should reject zero address for treasury", async function () {
            await expect(
                controller.connect(admin).setTreasuryContract(ethers.ZeroAddress)
            ).to.be.revertedWithCustomError(controller, "ZeroAddress");
        });
    });

    /* ----------------------------------------------------------- */
    /*                    PAUSE FUNCTIONALITY                       */
    /* ----------------------------------------------------------- */

    describe("Pause Functionality", function () {
        let proposalId;

        beforeEach(async function () {
            // Create and approve a proposal
            await governance.connect(user1).createProposal(
                recipient.address,
                ethers.parseEther("10"),
                "Test proposal"
            );
            proposalId = 0;

            await governance.connect(user1).vote(proposalId, true);
            await governance.connect(user2).vote(proposalId, true);
            await governance.connect(user3).vote(proposalId, true);

            await time.increase(VOTING_PERIOD + 1);
            await governance.connect(admin).finalizeProposal(proposalId);
        });

        it("Should allow admin to pause contract", async function () {
            await expect(controller.connect(admin).pause())
                .to.emit(controller, "Paused")
                .withArgs(admin.address);

            expect(await controller.isPaused()).to.be.true;
        });

        it("Should allow admin to unpause contract", async function () {
            await controller.connect(admin).pause();

            await expect(controller.connect(admin).unpause())
                .to.emit(controller, "Unpaused")
                .withArgs(admin.address);

            expect(await controller.isPaused()).to.be.false;
        });

        it("Should reject execution when paused", async function () {
            await controller.connect(admin).pause();

            await expect(
                controller.connect(admin).executeProposal(proposalId)
            ).to.be.revertedWithCustomError(controller, "ContractPaused");
        });

        it("Should allow execution after unpause", async function () {
            await controller.connect(admin).pause();
            await controller.connect(admin).unpause();

            await expect(controller.connect(admin).executeProposal(proposalId))
                .to.not.be.reverted;
        });

        it("Should reject non-admin pause", async function () {
            await expect(
                controller.connect(user1).pause()
            ).to.be.revertedWithCustomError(controller, "AccessControlUnauthorizedAccount");
        });

        it("Should reject non-admin unpause", async function () {
            await controller.connect(admin).pause();

            await expect(
                controller.connect(user1).unpause()
            ).to.be.revertedWithCustomError(controller, "AccessControlUnauthorizedAccount");
        });
    });

    /* ----------------------------------------------------------- */
    /*                    INTEGRATION TESTS                         */
    /* ----------------------------------------------------------- */

    describe("Integration Tests", function () {
        it("Should handle end-to-end proposal lifecycle", async function () {
            // 1. Create proposal
            await governance.connect(user1).createProposal(
                recipient.address,
                ethers.parseEther("15"),
                "Complete workflow test"
            );
            const proposalId = 0;

            // 2. Vote
            await governance.connect(user1).vote(proposalId, true);
            await governance.connect(user2).vote(proposalId, true);
            await governance.connect(user3).vote(proposalId, true);

            // 3. Wait for voting period
            await time.increase(VOTING_PERIOD + 1);

            // 4. Finalize
            await governance.connect(admin).finalizeProposal(proposalId);

            // 5. Execute
            const recipientBalanceBefore = await ethers.provider.getBalance(recipient.address);
            await controller.connect(admin).executeProposal(proposalId);
            const recipientBalanceAfter = await ethers.provider.getBalance(recipient.address);

            // Verify
            expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(ethers.parseEther("15"));
            expect(await controller.isProposalExecuted(proposalId)).to.be.true;

            const proposal = await governance.getProposal(proposalId);
            expect(proposal.state).to.equal(4); // Executed
        });

        it("Should handle multiple proposals execution", async function () {
            // Create multiple proposals
            for (let i = 0; i < 3; i++) {
                await governance.connect(user1).createProposal(
                    recipient.address,
                    ethers.parseEther("5"),
                    `Proposal ${i}`
                );

                // Vote
                await governance.connect(user1).vote(i, true);
                await governance.connect(user2).vote(i, true);
                await governance.connect(user3).vote(i, true);

                // Wait and finalize
                await time.increase(VOTING_PERIOD + 1);
                await governance.connect(admin).finalizeProposal(i);
            }

            // Execute all
            for (let i = 0; i < 3; i++) {
                await controller.connect(admin).executeProposal(i);
                expect(await controller.isProposalExecuted(i)).to.be.true;
            }
        });

        it("Should maintain correct treasury balance across executions", async function () {
            const initialTreasuryBalance = await treasury.getBalance();

            // Create and execute first proposal
            await governance.connect(user1).createProposal(recipient.address, ethers.parseEther("10"), "First");
            await governance.connect(user1).vote(0, true);
            await governance.connect(user2).vote(0, true);
            await governance.connect(user3).vote(0, true);
            await time.increase(VOTING_PERIOD + 1);
            await governance.connect(admin).finalizeProposal(0);
            await controller.connect(admin).executeProposal(0);

            let treasuryBalance = await treasury.getBalance();
            expect(treasuryBalance).to.equal(initialTreasuryBalance - ethers.parseEther("10"));

            // Create and execute second proposal
            await governance.connect(user1).createProposal(recipient.address, ethers.parseEther("20"), "Second");
            await governance.connect(user1).vote(1, true);
            await governance.connect(user2).vote(1, true);
            await governance.connect(user3).vote(1, true);
            await time.increase(VOTING_PERIOD + 1);
            await governance.connect(admin).finalizeProposal(1);
            await controller.connect(admin).executeProposal(1);

            treasuryBalance = await treasury.getBalance();
            expect(treasuryBalance).to.equal(initialTreasuryBalance - ethers.parseEther("30"));
        });
    });

    /* ----------------------------------------------------------- */
    /*                    VIEW FUNCTIONS TESTS                      */
    /* ----------------------------------------------------------- */

    describe("View Functions", function () {
        it("Should return correct execution status", async function () {
            expect(await controller.isProposalExecuted(0)).to.be.false;
            expect(await controller.isProposalExecuted(999)).to.be.false;
        });

        it("Should return correct pause state", async function () {
            expect(await controller.isPaused()).to.be.false;
            await controller.connect(admin).pause();
            expect(await controller.isPaused()).to.be.true;
        });

        it("Should return correct contract addresses", async function () {
            expect(await controller.getGovernanceAddress()).to.equal(await governance.getAddress());
            expect(await controller.getTreasuryAddress()).to.equal(await treasury.getAddress());
        });
    });
});
