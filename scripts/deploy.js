const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\nStarting NFT contract deployment...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Contract parameters
  const name = "Generative NFT Collection";
  const symbol = "GNFT";
  const price = hre.ethers.parseEther("0.01"); // 0.01 ETH
  const unrevealedURI = "ipfs://QmUnrevealedPlaceholder/";

  console.log("Contract Parameters:");
  console.log("  Name:", name);
  console.log("  Symbol:", symbol);
  console.log("  Price:", hre.ethers.formatEther(price), "ETH");
  console.log("  Unrevealed URI:", unrevealedURI);
  console.log();

  // Deploy contract
  console.log("Deploying MyNFT contract...");
  const MyNFT = await hre.ethers.getContractFactory("MyNFT");
  const nft = await MyNFT.deploy(name, symbol, price, unrevealedURI);

  await nft.waitForDeployment();
  const contractAddress = await nft.getAddress();

  console.log("MyNFT deployed to:", contractAddress);
  console.log();

  // Verify contract supports ERC721 and ERC2981
  const ERC721_INTERFACE_ID = "0x80ac58cd";
  const ERC2981_INTERFACE_ID = "0x2a55205a";

  const supportsERC721 = await nft.supportsInterface(ERC721_INTERFACE_ID);
  const supportsERC2981 = await nft.supportsInterface(ERC2981_INTERFACE_ID);

  console.log("Interface Support:");
  console.log("  ERC-721:", supportsERC721 ? "Yes" : "No");
  console.log("  ERC-2981:", supportsERC2981 ? "Yes" : "No");
  console.log();

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    name,
    symbol,
    price: price.toString(),
    unrevealedURI,
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const deploymentPath = path.join(
    deploymentsDir,
    `${hre.network.name}-deployment.json`
  );
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

  console.log("Deployment info saved to:", deploymentPath);

  // Save ABI for frontend
  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "MyNFT.sol",
    "MyNFT.json"
  );

  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const frontendContractsDir = path.join(__dirname, "..", "frontend", "contracts");
    
    if (!fs.existsSync(frontendContractsDir)) {
      fs.mkdirSync(frontendContractsDir, { recursive: true });
    }

    const frontendAbiPath = path.join(frontendContractsDir, "MyNFT.json");
    fs.writeFileSync(
      frontendAbiPath,
      JSON.stringify(
        {
          address: contractAddress,
          abi: artifact.abi,
        },
        null,
        2
      )
    );

    console.log("ABI saved for frontend:", frontendAbiPath);
  }

  console.log("\nDeployment complete!");
  console.log("\nNext steps:");
  console.log("  1. Generate Merkle root: npm run generate-merkle");
  console.log("  2. Set Merkle root in contract");
  console.log("  3. Set sale state to Allowlist or Public");
  console.log("  4. Update frontend .env with contract address");
  console.log(`\n  NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
