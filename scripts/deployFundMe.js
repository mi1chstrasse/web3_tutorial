//import ethers
//create main function
//execute main function
const { ethers } = require("hardhat");

async function main() {
  const fundMeFactory = await ethers.getContractFactory("FundMe");
  console.log("Deploying contract...");
  const fundMe = await fundMeFactory.deploy(300);
  await fundMe.waitForDeployment();
  console.log(
    "contract has been deployed successfully, contract address is:",
    fundMe.target
  );

  //verify contract
  if (hre.network.config.chainId == 11155111 && process.env.ETHERSCAN_API_KEY) {
    console.log("waiting for 5 blocks...");
    await fundMe.deploymentTransaction().wait(5);
    await verifyFundMe(fundMe.target, [300]);
  } else {
    console.log("not on sepolia, skipping verification");
  }

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
}
async function verifyFundMe(contractAddress, constructorArguments) {
  await hre.run("verify:verify", {
    address: contractAddress,
    constructorArguments: constructorArguments,
  });
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
