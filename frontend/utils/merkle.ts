import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

export function generateMerkleProof(
  userAddress: string,
  allowlist: string[],
): string[] {
  const leaves = allowlist.map((addr) => keccak256(addr));
  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const leaf = keccak256(userAddress);
  const proof = tree.getHexProof(leaf);
  return proof;
}

export function isAddressAllowlisted(
  userAddress: string,
  allowlist: string[],
): boolean {
  return allowlist.some(
    (addr) => addr.toLowerCase() === userAddress.toLowerCase(),
  );
}

export function getMerkleRoot(allowlist: string[]): string {
  const leaves = allowlist.map((addr) => keccak256(addr));
  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  return tree.getHexRoot();
}
