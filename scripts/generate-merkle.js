const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const fs = require("fs");
const path = require("path");

/**
 * Generate Merkle tree and root from allowlist addresses
 */
function generateMerkleTree() {
  try {
    // Read allowlist addresses
    const allowlistPath = path.join(__dirname, "..", "allowlist.json");
    const allowlistData = fs.readFileSync(allowlistPath, "utf8");
    const addresses = JSON.parse(allowlistData);

    if (!Array.isArray(addresses) || addresses.length === 0) {
      throw new Error("Invalid allowlist format. Expected an array of addresses.");
    }

    console.log(`\nGenerating Merkle tree for ${addresses.length} addresses...\n`);

    // Hash each address
    const leaves = addresses.map((addr) => keccak256(addr));

    // Create Merkle tree
    const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });

    // Get Merkle root
    const root = merkleTree.getHexRoot();

    console.log("Merkle Root:", root);
    console.log("\nAllowlist Addresses:");
    addresses.forEach((addr, idx) => {
      console.log(`  ${idx + 1}. ${addr}`);
    });

    // Generate proofs for each address
    console.log("\nMerkle Proofs:");
    const proofs = {};
    addresses.forEach((addr) => {
      const leaf = keccak256(addr);
      const proof = merkleTree.getHexProof(leaf);
      proofs[addr] = proof;
      console.log(`\n  Address: ${addr}`);
      console.log(`  Proof: [${proof.map(p => `"${p}"`).join(", ")}]`);
    });

    // Save proofs to file
    const proofsPath = path.join(__dirname, "..", "merkle-proofs.json");
    fs.writeFileSync(
      proofsPath,
      JSON.stringify({ root, proofs }, null, 2)
    );

    console.log(`\nProofs saved to: ${proofsPath}`);
    console.log("\nMerkle tree generation complete!\n");

    return { root, tree: merkleTree, proofs };
  } catch (error) {
    console.error("Error generating Merkle tree:", error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  generateMerkleTree();
}

module.exports = { generateMerkleTree };
