const { task } = require("hardhat/config");

task("deploy-fundme", "deploy and verify fundme contract").setAction(
  async (taskArgs, hre) => {
    const fundMeFactory = await ethers.getContractFactory("FundMe");
    console.log("Deploying contract...");
    const fundMe = await fundMeFactory.deploy(300);
    await fundMe.waitForDeployment();
    console.log(
      "contract has been deployed successfully, contract address is:",
      fundMe.target
    );

    //verify contract
    if (
      hre.network.config.chainId == 11155111 &&
      process.env.ETHERSCAN_API_KEY
    ) {
      console.log("waiting for 5 blocks...");
      await fundMe.deploymentTransaction().wait(5);
      await verifyFundMe(fundMe.target, [300]);
    } else {
      console.log("not on sepolia, skipping verification");
    }
  }
);

async function verifyFundMe(contractAddress, constructorArguments) {
  await hre.run("verify:verify", {
    address: contractAddress,
    constructorArguments: constructorArguments,
  });
}

module.exports = {};
