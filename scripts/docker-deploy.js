// scripts/docker-deploy.js
// Automated deployment script for Docker environment
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\nDocker Environment: Starting automated deployment...\n");

  // Wait for network to be ready
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Contract parameters
  const name = "Generative NFT Collection";
  const symbol = "GNFT";
  const price = hre.ethers.parseEther("0.01");
  const unrevealedURI = "ipfs://QmUnrevealedPlaceholder/";

  console.log("Contract Parameters:");
  console.log("  Name:", name);
  console.log("  Symbol:", symbol);
  console.log("  Price:", hre.ethers.formatEther(price), "ETH");
  console.log();

  // Deploy contract
  console.log("Deploying MyNFT contract...");
  const MyNFT = await hre.ethers.getContractFactory("MyNFT");
  const nft = await MyNFT.deploy(name, symbol, price, unrevealedURI);

  await nft.waitForDeployment();
  const contractAddress = await nft.getAddress();

  console.log("MyNFT deployed to:", contractAddress);

  // Set sale state to Public (2) for testing
  console.log("Setting sale state to Public...");
  await nft.setSaleState(2);
  console.log("Sale state set to Public");

  // Generate Merkle root if allowlist exists
  try {
    const allowlistPath = path.join(__dirname, "..", "allowlist.json");
    if (fs.existsSync(allowlistPath)) {
      const { MerkleTree } = require("merkletreejs");
      const keccak256 = require("keccak256");
      const allowlist = JSON.parse(fs.readFileSync(allowlistPath, "utf8"));
      
      const leaves = allowlist.map(addr => keccak256(addr));
      const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
      const merkleRoot = tree.getHexRoot();
      
      console.log("Setting Merkle root...");
      await nft.setMerkleRoot(merkleRoot);
      console.log("Merkle root set:", merkleRoot);
    }
  } catch (error) {
    console.log("Skipping Merkle root setup:", error.message);
  }

  // Get ABI from artifacts
  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "MyNFT.sol",
    "MyNFT.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  // Save deployment info for frontend
  const frontendContractsDir = path.join(__dirname, "..", "frontend", "contracts");
  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }

  const contractInfo = {
    address: contractAddress,
    abi: artifact.abi,
    network: "localhost",
    chainId: 31337,
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(frontendContractsDir, "MyNFT.json"),
    JSON.stringify(contractInfo, null, 2)
  );

  console.log("\nContract info saved to frontend/contracts/MyNFT.json");
  console.log("\nDocker deployment complete!");
  console.log(`\nContract Address: ${contractAddress}`);
  console.log("Sale State: Public (ready for minting)");
  console.log("\nFrontend will be available at: http://localhost:3000");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
