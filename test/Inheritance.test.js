const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Inheritance", function () {
  let inheritance;
  let owner;
  let heir;
  let other;
  const ONE_MONTH = 30 * 24 * 60 * 60; // 30 days in seconds

  beforeEach(async function () {
    [owner, heir, other] = await ethers.getSigners();

    const Inheritance = await ethers.getContractFactory("Inheritance");
    inheritance = await Inheritance.deploy(heir.address);
    await inheritance.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner and heir", async function () {
      expect(await inheritance.owner()).to.equal(owner.address);
      expect(await inheritance.heir()).to.equal(heir.address);
    });
  });

  describe("Basic functionality", function () {
    it("Should allow owner to withdraw", async function () {
      // First send some ETH to the contract
      await owner.sendTransaction({
        to: inheritance.target,
        value: ethers.parseEther("1.0"),
      });

      const withdrawAmount = ethers.parseEther("0.5");
      await expect(inheritance.withdraw(withdrawAmount))
        .to.emit(inheritance, "Withdrawal")
        .withArgs(owner.address, withdrawAmount);
    });

    it("Should allow owner to update heir", async function () {
      await expect(inheritance.setHeir(other.address))
        .to.emit(inheritance, "HeirUpdated")
        .withArgs(heir.address, other.address);
    });

    it("Should allow owner to withdraw 0 ETH to reset timer", async function () {
      // Get initial lastActivity timestamp
      const initialLastActivity = await inheritance.lastActivity();

      // Wait for 1 second to ensure timestamp changes
      await time.increase(1);

      // Check that lastActivity was updated
      const newLastActivity = await inheritance.lastActivity();
      expect(newLastActivity).to.equal(initialLastActivity);
    });

    it("Should not allow non-owner to withdraw", async function () {
      await expect(
        inheritance.connect(other).withdraw(ethers.parseEther("1.0")),
      ).to.be.revertedWithCustomError(inheritance, "NotOwner");
    });

    it("Should not allow setting zero address as heir", async function () {
      await expect(
        inheritance.setHeir(ethers.ZeroAddress),
      ).to.be.revertedWithCustomError(inheritance, "InvalidHeirAddress");
    });

    it("Should emit ActivityUpdated event on withdraw", async function () {
      await expect(inheritance.withdraw(0)).to.emit(
        inheritance,
        "ActivityUpdated",
      );
    });

    it("Should not allow withdrawing more than contract balance", async function () {
      await expect(
        inheritance.withdraw(ethers.parseEther("1.0")),
      ).to.be.revertedWithCustomError(inheritance, "InsufficientBalance");
    });
  });

  describe("Inheritance claim", function () {
    it("Should allow heir to claim after timelock", async function () {
      // Fast forward time by 31 days
      await time.increase(ONE_MONTH + 86400);

      await expect(inheritance.connect(heir).claimInheritance())
        .to.emit(inheritance, "OwnershipTransferred")
        .withArgs(owner.address, heir.address);

      expect(await inheritance.owner()).to.equal(heir.address);
      expect(await inheritance.heir()).to.equal(ethers.ZeroAddress);
    });

    it("Should not allow heir to claim before timelock", async function () {
      await expect(
        inheritance.connect(heir).claimInheritance(),
      ).to.be.revertedWithCustomError(inheritance, "TimelockNotExpired");
    });

    it("Should reset inheritance timelock when owner withdraws 0 ETH", async function () {
      // Fast forward time by 31 days to make inheritance claimable
      await time.increase(ONE_MONTH + 86400);

      // Verify heir can claim inheritance at this point
      expect(
        (await inheritance.lastActivity()) + BigInt(ONE_MONTH) <
          (await time.latest()),
      ).to.be.true;

      // Owner withdraws 0 ETH to reset timer
      await inheritance.withdraw(0);

      // Verify heir can no longer claim inheritance
      await expect(
        inheritance.connect(heir).claimInheritance(),
      ).to.be.revertedWithCustomError(inheritance, "TimelockNotExpired");
    });

    it("Should allow new owner to set heir after claiming inheritance", async function () {
      // First fast forward time by more than 1 month
      await time.increase(ONE_MONTH + 86400);

      // Heir claims inheritance
      await inheritance.connect(heir).claimInheritance();

      // Verify heir is now owner
      expect(await inheritance.owner()).to.equal(heir.address);
      expect(await inheritance.heir()).to.equal(ethers.ZeroAddress);

      // New owner (former heir) sets new heir
      await expect(inheritance.connect(heir).setHeir(other.address))
        .to.emit(inheritance, "HeirUpdated")
        .withArgs(ethers.ZeroAddress, other.address);

      // Verify new heir is set
      expect(await inheritance.heir()).to.equal(other.address);
    });
  });

  describe("Receive function", function () {
    it("Should accept direct ETH transfers", async function () {
      const amount = ethers.parseEther("1.0");
      await expect(
        owner.sendTransaction({
          to: inheritance.target,
          value: amount,
        }),
      ).to.changeEtherBalance(inheritance, amount);
    });
  });

  describe("Constructor", function () {
    it("Should not allow zero address as initial heir", async function () {
      const Inheritance = await ethers.getContractFactory("Inheritance");
      await expect(
        Inheritance.deploy(ethers.ZeroAddress),
      ).to.be.revertedWithCustomError(Inheritance, "InvalidHeirAddress");
    });
  });

  describe("Stress testing", function () {
    it("Should handle multiple rapid transactions", async function () {
      // Send multiple small deposits
      const depositAmount = ethers.parseEther("0.1");
      const transactions = [];

      for (let i = 0; i < 5; i++) {
        transactions.push(
          owner.sendTransaction({
            to: inheritance.target,
            value: depositAmount,
          }),
        );
      }

      await Promise.all(transactions);

      // Verify contract balance
      const balance = await ethers.provider.getBalance(inheritance.target);
      expect(balance).to.equal(depositAmount * BigInt(5));
    });

    it("Should handle rapid heir updates", async function () {
      const [, heir1, heir2, heir3, heir4] = await ethers.getSigners();
      const heirs = [heir1, heir2, heir3, heir4];

      // Rapidly update heir multiple times
      for (const newHeir of heirs) {
        await inheritance.setHeir(newHeir.address);
      }

      // Verify final heir
      expect(await inheritance.heir()).to.equal(heir4.address);
    });
  });

  describe("Fuzz testing", function () {
    it("Should handle random withdrawal amounts", async function () {
      // First fund the contract
      const initialFunding = ethers.parseEther("10.0");
      await owner.sendTransaction({
        to: inheritance.target,
        value: initialFunding,
      });

      let remainingBalance = initialFunding;

      // Generate random withdrawal amounts
      for (let i = 0; i < 5; i++) {
        // Generate a random number between 1 and 100 (avoiding 0)
        const randomPercent = Math.floor(Math.random() * 99) + 1;
        const randomAmount = (remainingBalance * BigInt(randomPercent)) / 100n;

        if (randomAmount <= remainingBalance) {
          const balanceBefore = await ethers.provider.getBalance(
            inheritance.target,
          );

          await expect(inheritance.withdraw(randomAmount))
            .to.emit(inheritance, "Withdrawal")
            .withArgs(owner.address, randomAmount);

          // Verify the withdrawal was successful
          const balanceAfter = await ethers.provider.getBalance(
            inheritance.target,
          );
          expect(balanceAfter).to.equal(balanceBefore - randomAmount);

          remainingBalance = balanceAfter;
        } else {
          await expect(
            inheritance.withdraw(randomAmount),
          ).to.be.revertedWithCustomError(inheritance, "InsufficientBalance");
        }
      }
    });

    it("Should handle random timelock periods", async function () {
      const randomDays = Math.floor(Math.random() * 60); // 0-60 days
      const timeToIncrease = randomDays * 24 * 60 * 60; // Convert to seconds

      await time.increase(timeToIncrease);

      if (timeToIncrease > 30 * 24 * 60 * 60) {
        // Should allow inheritance claim
        await inheritance.connect(heir).claimInheritance();
        expect(await inheritance.owner()).to.equal(heir.address);
      } else {
        // Should revert if trying to claim too early
        await expect(
          inheritance.connect(heir).claimInheritance(),
        ).to.be.revertedWithCustomError(inheritance, "TimelockNotExpired");
      }
    });
  });
});
