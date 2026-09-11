const hre = require("hardhat");

async function main() {
  console.log("Deploying Mailora contract to BOT Chain (Chain ID:", hre.network.config.chainId, ")...");
  const Mailora = await hre.ethers.getContractFactory("Mailora");
  const mailora = await Mailora.deploy();

  await mailora.waitForDeployment();
  const address = await mailora.getAddress();

  console.log("✅ Mailora successfully deployed to:", address);
  console.log("🔍 Block Explorer:", `https://scan.botchain.ai/address/${address}`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
