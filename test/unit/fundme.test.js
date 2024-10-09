const { assert, expect } = require("chai");
const { ethers, deployments } = require("hardhat");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { devlopmentChains } = require("../../helper-hardhat-config");

!devlopmentChains.includes(network.name)
  ? describe.skip
  : describe("test fundme contract", async function () {
      let fundMe;
      let secondFundMe;
      let firstAccount;
      let secondAccount;
      let mockV3Aggregator;
      this.beforeEach(async function () {
        await deployments.fixture("all");
        firstAccount = (await getNamedAccounts()).firstAccount;
        secondAccount = (await getNamedAccounts()).secondAccount;
        const fundMeDeployment = await deployments.get("FundMe");
        fundMe = await ethers.getContractAt("FundMe", fundMeDeployment.address);
        secondFundMe = await ethers.getContract("FundMe", secondAccount);
      });
      it("test if the owner is msg.sender", async function () {
        await fundMe.waitForDeployment();
        const owner = await fundMe.owner();
        assert.equal(owner, firstAccount);
      });
      it("test if the feedData is assigned correctly", async function () {
        await fundMe.waitForDeployment();
        const feedData = await fundMe.dataFeed();
        mockV3Aggregator = await deployments.get("MockV3Aggregator");
        assert.equal(feedData, mockV3Aggregator.address);
      });
      // fund,getFunds,rfund
      // unit test for fund function
      // window open,value greater than minimum value, funder balance
      it("window cloesd , value greater than minimum value, fund failed", async function () {
        await helpers.time.increase(200);
        await helpers.mine();
        // value greater than minimum value
        expect(
          fundMe.fund({ value: ethers.parseEther("0.1") })
        ).to.be.revertedWith("window is closed");
      });
      it("window open,value less than minimum value, fund failed", async function () {
        expect(
          fundMe.fund({ value: ethers.parseEther("0.01") })
        ).to.be.revertedWith("Send more ETH");
      });

      it("window open, value greater than minimum value, fund success", async function () {
        await fundMe.fund({ value: ethers.parseEther("0.1") });
        const balance = await fundMe.fundersToAmount(firstAccount);
        expect(balance).to.equal(ethers.parseEther("0.1"));
      });

      // unit test for getFund
      // only owner, window closed,target reached,
      it("not owner,window closed,target reached,getFund failed", async function () {
        await fundMe.fund({ value: ethers.parseEther("1") });
        await helpers.time.increase(300);
        await helpers.mine();
        await expect(secondFundMe.getFund()).to.be.revertedWith(
          "this function can only be called by owner"
        );
      });

      it("only owner , window open, target reached, getFund failed", async function () {
        await fundMe.fund({ value: ethers.parseEther("1") });
        await expect(fundMe.getFund()).to.be.revertedWith(
          "window is not closed"
        );
      });

      it("only owner , window closed, target not reached, getFund failed", async function () {
        await fundMe.fund({ value: ethers.parseEther("0.1") });
        await helpers.time.increase(200);
        await helpers.mine();
        await expect(fundMe.getFund()).to.be.revertedWith(
          "Target is not reached"
        );
      });

      it("only owner , window closed, target reached, getFund success", async function () {
        await fundMe.fund({ value: ethers.parseEther("1") });
        await helpers.time.increase(300);
        await helpers.mine();
        expect(fundMe.getFund())
          .to.emit(fundMe, "FundWithdrawByOwner")
          .withArgs(ethers.parseEther("1"));
      });

      // window closed, target not reached,funder balance not 0
      // unit test for reFund

      it("window open, target not reached,funder balance not 0, reFund failed", async function () {
        await fundMe.fund({ value: ethers.parseEther("0.1") });
        expect(fundMe.refund()).to.be.revertedWith("window is not closed");
      });

      it("window closed, target reached,funder balance not 0, reFund failed", async function () {
        await fundMe.fund({ value: ethers.parseEther("1") });
        await helpers.time.increase(300);
        await helpers.mine();
        expect(fundMe.refund()).to.be.revertedWith("Target is reached");
      });

      it("window closed, target not reached,funder balance 0, reFund failed", async function () {
        await fundMe.fund({ value: ethers.parseEther("0.1") });
        await helpers.time.increase(200);
        await helpers.mine();
        expect(secondFundMe.refund()).to.be.revertedWith(
          "there is no fund for you"
        );
      });

      it("window closed, target not reached,funder balance not 0, reFund success", async function () {
        await fundMe.fund({ value: ethers.parseEther("0.1") });
        await helpers.time.increase(200);
        await helpers.mine();
        expect(fundMe.refund())
          .to.emit(fundMe, "RefundByFunder")
          .withArgs(firstAccount, ethers.parseEther("0.1"));
      });
    });
