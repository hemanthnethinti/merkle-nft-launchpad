const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const { generateMerkleTree } = require("./generate-merkle");

/**
 * Automated setup script for local development
 * This script will:
 * 1. Deploy the contract
 * 2. Generate Merkle root
 * 3. Configure the contract
 * 4. Save all necessary information
 */
async function main() {
  console.log("\nStarting automated setup...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  // 1. Deploy Contract
  console.log("\n[1/5] Deploying MyNFT contract...");
  const MyNFT = await ethers.getContractFactory("MyNFT");
  const nft = await MyNFT.deploy(
    "Generative NFT Collection",
    "GNFT",
    ethers.parseEther("0.01"),
    "ipfs://QmUnrevealed/"
  );
  await nft.waitForDeployment();
  const contractAddress = await nft.getAddress();
  console.log("[OK] Contract deployed to:", contractAddress);

  // 2. Generate Merkle Root
  console.log("\n[2/5] Generating Merkle root...");
  const { root } = generateMerkleTree();
  console.log("[OK] Merkle root generated:", root);

  // 3. Configure Contract
  console.log("\n[3/5] Configuring contract...");

  // Set Merkle root
  await nft.setMerkleRoot(root);
  console.log("[OK] Merkle root set in contract");

  // Set revealed URI
  await nft.setRevealedURI("ipfs://QmRevealed/");
  console.log("[OK] Revealed URI set");

  // Start allowlist phase
  await nft.setSaleState(1);
  console.log("[OK] Sale state set to Allowlist");

  // 4. Verify Configuration
  console.log("\n[4/5] Verifying configuration...");
  const price = await nft.price();
  const merkleRootSet = await nft.merkleRoot();
  const saleState = await nft.saleState();
  const totalSupply = await nft.totalSupply();
  const maxSupply = await nft.MAX_SUPPLY();

  console.log("  Price:", ethers.formatEther(price), "ETH");
  console.log("  Merkle Root:", merkleRootSet);
  console.log("  Sale State:", saleState === 1n ? "Allowlist" : "Other");
  console.log("  Supply:", totalSupply.toString(), "/", maxSupply.toString());

  // 5. Save Frontend Config
  console.log("\n[5/5] Saving frontend configuration...");
  
  // Save contract ABI and address
  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "MyNFT.sol",
    "MyNFT.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  
  const frontendContractsDir = path.join(__dirname, "..", "frontend", "contracts");
  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(frontendContractsDir, "MyNFT.json"),
    JSON.stringify({
      address: contractAddress,
      abi: artifact.abi,
    }, null, 2)
  );
  console.log("[OK] Contract ABI saved for frontend");

  // Create .env.local for frontend if it doesn't exist
  const frontendEnvPath = path.join(__dirname, "..", "frontend", ".env.local");
  if (!fs.existsSync(frontendEnvPath)) {
    const envContent = `NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}\nNEXT_PUBLIC_RPC_URL=http://localhost:8545\n`;
    fs.writeFileSync(frontendEnvPath, envContent);
    console.log("[OK] Frontend .env.local created");
  } else {
    console.log("[INFO] Frontend .env.local already exists, please update manually");
  }

  // 6. Summary
  console.log("\n" + "=".repeat(60));
  console.log("Setup Complete!");
  console.log("=".repeat(60));
  console.log("\nContract Information:");
  console.log("  Address:", contractAddress);
  console.log("  Network: Hardhat Local");
  console.log("  Merkle Root:", root);
  console.log("\nNext Steps:");
  console.log("  1. Start the frontend: cd frontend && npm run dev");
  console.log("  2. Open browser: http://localhost:3000");
  console.log("  3. Connect wallet (use Hardhat accounts)");
  console.log("  4. Start minting!");
  console.log("\nTest Accounts (Allowlisted):");
  console.log("  Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
  console.log("  Account #2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC");
  console.log("\nUseful Commands:");
  console.log("  - Run tests: npm test");
  console.log("  - Hardhat console: npx hardhat console --network localhost");
  console.log("  - View contract: npx hardhat verify --network localhost", contractAddress);
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n[ERROR]:", error);
    process.exit(1);
  });
