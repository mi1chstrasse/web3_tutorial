// function deployfunction() {
//   console.log("deploying fundme contract");
// }

const { network } = require("hardhat");
const {
  devlopmentChains,
  networkConfig,
  LOCK_TIME,
  CONFIRMATIONS,
} = require("../helper-hardhat-config");
// module.exports.default = deployfunction;
// module.exports = async (hre) => {
//   const getNamedAccounts = hre.getNamedAccounts;
//   const deployments = hre.deployment;
//   console.log("deploying fundme contract");
// };

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { firstAccount } = await getNamedAccounts();
  const { deploy } = deployments;

  let datafeedAddress;
  let confirmations;
  if (devlopmentChains.includes(network.name)) {
    datafeedAddress = (await deployments.get("MockV3Aggregator")).address;
    confirmations = 0;
  } else {
    datafeedAddress = networkConfig[network.config.chainId].ehtUsdPriceFeed;
    confirmations = CONFIRMATIONS;
  }

  const fundMe = await deploy("FundMe", {
    from: firstAccount,
    args: [LOCK_TIME, datafeedAddress],
    log: true,
    waitConfirmations: confirmations,
  });
  //remove deployments directory or add --reset flag if you redeploy contract

  if (hre.network.config.chainId == 11155111 && process.env.ETHERSCAN_API_KEY) {
    await hre.run("verify:verify", {
      address: fundMe.address,
      constructorArguments: [LOCK_TIME, datafeedAddress],
    });
  } else {
    console.log("not on sepolia, skipping verification");
  }
};

module.exports.tags = ["all", "fundme"];
