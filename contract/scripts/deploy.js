const hre = require("hardhat");

async function main() {
  const DecentralizedMail = await hre.ethers.getContractFactory("DecentralizedMail");
  const dMail = await DecentralizedMail.deploy();

  await dMail.waitForDeployment();

  console.log("DecentralizedMail deployed to:", await dMail.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
