// Set sale state to Public
const hre = require("hardhat");

async function main() {
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  console.log("Setting sale state to Public...");
  
  const contract = await hre.ethers.getContractAt("MyNFT", contractAddress);
  
  // Set sale state to Public (2)
  const tx = await contract.setSaleState(2);
  await tx.wait();
  
  const state = await contract.saleState();
  console.log("Sale state is now:", state.toString(), "(2 = Public)");
  console.log("Done! Refresh your browser.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
