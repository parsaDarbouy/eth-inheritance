const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Inheritance contract...");

  // Get the default signer (deployer)
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Get the initial heir address from command line or use deployer as default
  const defaultHeir = process.env.HEIR_ADDRESS || deployer.address;

  // Deploy the contract
  const Inheritance = await ethers.getContractFactory("Inheritance");
  const inheritance = await Inheritance.deploy(defaultHeir);
  await inheritance.waitForDeployment();

  const address = await inheritance.getAddress();
  console.log("Inheritance contract deployed to:", address);
  console.log("Initial heir set to:", defaultHeir);

  // Wait for a few block confirmations
  console.log("Waiting for confirmations...");
  await inheritance.deploymentTransaction().wait(5);

  console.log("Deployment completed!");

  // Log information needed for verification
  console.log("\nVerification information:");
  console.log("Contract address:", address);
  console.log("Constructor arguments:", [defaultHeir]);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });