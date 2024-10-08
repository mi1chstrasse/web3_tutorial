const { task } = require("hardhat/config");

task("interact-fundme", "interact with fundme contract")
  .addParam("addr", "fundme contract address")
  .setAction(async (taskArgs, hre) => {
    const fundMeFactory = await ethers.getContractFactory("FundMe");
    const fundMe = await fundMeFactory.attach(taskArgs.addr);
    // init 2 accounts
    const [firstAccount, secondAccount] = await ethers.getSigners();
    // fund contract with first account
    const fundTx = await fundMe.fund({ value: ethers.parseEther("0.5") });
    await fundTx.wait();
    // check the balance of the contract
    const baleanceOfContract = await ethers.provider.getBalance(fundMe.target);
    console.log("balance of contract:", baleanceOfContract);
    // fund contract with second account
    const fundTxWithSecondAccount = await fundMe.connect(secondAccount).fund({
      value: ethers.parseEther("0.0015"),
    });
    await fundTxWithSecondAccount.wait();
    // check the balance of the contract
    const baleanceOfContractAfterSecondFund = await ethers.provider.getBalance(
      fundMe.target
    );
    console.log(
      "balance of contract after secondFund:",
      baleanceOfContractAfterSecondFund
    );
    // check the mapping fundersToAmount
    const firstAccountBalance = await fundMe.fundersToAmount(
      firstAccount.address
    );
    const secondAccountBalance = await fundMe.fundersToAmount(
      secondAccount.address
    );
    console.log("fundersToFirstAccountAmount:", firstAccountBalance);
    console.log("fundersToSecondAccountAmount:", secondAccountBalance);
  });

module.exports = {};
