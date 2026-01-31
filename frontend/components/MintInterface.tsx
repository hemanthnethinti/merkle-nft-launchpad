"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import contractData from "../contracts/MyNFT.json";
import allowlistData from "../data/allowlist.json";
import { generateMerkleProof, isAddressAllowlisted } from "../utils/merkle";

const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || contractData.address;

export default function MintInterface() {
  const { address, isConnected } = useAccount();
  const [quantity, setQuantity] = useState(1);
  const [isAllowlisted, setIsAllowlisted] = useState(false);
  const [merkleProof, setMerkleProof] = useState<string[]>([]);
  const [txStatus, setTxStatus] = useState<string>("");

  // Read contract data
  const { data: totalSupply } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: contractData.abi,
    functionName: "totalSupply",
  }) as { data: bigint | undefined };

  const { data: maxSupply } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: contractData.abi,
    functionName: "MAX_SUPPLY",
  }) as { data: bigint | undefined };

  const { data: price } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: contractData.abi,
    functionName: "price",
  }) as { data: bigint | undefined };

  const { data: saleState } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: contractData.abi,
    functionName: "saleState",
  }) as { data: number | undefined };

  // Write functions
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Check if user is allowlisted
  useEffect(() => {
    if (address) {
      const allowed = isAddressAllowlisted(address, allowlistData);
      setIsAllowlisted(allowed);

      if (allowed) {
        const proof = generateMerkleProof(address, allowlistData);
        setMerkleProof(proof);
      }
    }
  }, [address]);

  // Update transaction status
  useEffect(() => {
    if (isPending) {
      setTxStatus("Confirming transaction...");
    } else if (isConfirming) {
      setTxStatus("Processing...");
    } else if (isSuccess) {
      setTxStatus("Minted successfully!");
      setTimeout(() => setTxStatus(""), 5000);
    } else if (error) {
      setTxStatus(`Error: ${error.message}`);
      setTimeout(() => setTxStatus(""), 5000);
    }
  }, [isPending, isConfirming, isSuccess, error]);

  const handleMint = () => {
    if (!isConnected || price === undefined) return;

    const value = (price as bigint) * BigInt(quantity);

    if (saleState === 1 && isAllowlisted) {
      // Allowlist mint
      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: contractData.abi,
        functionName: "allowlistMint",
        args: [merkleProof, quantity],
        value,
      });
    } else if (saleState === 2) {
      // Public mint
      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: contractData.abi,
        functionName: "publicMint",
        args: [quantity],
        value,
      });
    }
  };

  const getSaleStatus = () => {
    if (saleState === 0) return "Paused";
    if (saleState === 1) return "Allowlist";
    if (saleState === 2) return "Public";
    return "Unknown";
  };

  const canMint = () => {
    if (!isConnected) return false;
    if (saleState === 0) return false;
    if (saleState === 1 && !isAllowlisted) return false;
    if (totalSupply && maxSupply && totalSupply >= maxSupply) return false;
    return true;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Mint Your NFT
      </h2>

      {/* Status Display */}
      <div className="space-y-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Sale Status:</span>
          <span
            data-testid="sale-status"
            className={`font-semibold px-3 py-1 rounded-full text-sm ${
              saleState === 2
                ? "bg-green-100 text-green-800"
                : saleState === 1
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {getSaleStatus()}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Minted:</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            <span data-testid="mint-count">
              {totalSupply ? (totalSupply as bigint).toString() : "0"}
            </span>
            {" / "}
            <span data-testid="total-supply">
              {maxSupply ? (maxSupply as bigint).toString() : "10000"}
            </span>
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Price:</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {price ? formatEther(price as bigint) : "0"} ETH
          </span>
        </div>

        {saleState === 1 && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">
              Allowlist Status:
            </span>
            <span
              className={`font-semibold ${
                isAllowlisted ? "text-green-600" : "text-red-600"
              }`}
            >
              {isAllowlisted ? "Eligible" : "Not Eligible"}
            </span>
          </div>
        )}
      </div>

      {/* Quantity Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Quantity
        </label>
        <input
          type="number"
          data-testid="quantity-input"
          min="1"
          max={saleState === 1 ? "3" : "5"}
          value={quantity}
          onChange={(e) =>
            setQuantity(Math.max(1, parseInt(e.target.value) || 1))
          }
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          disabled={!canMint()}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Max per wallet: {saleState === 1 ? "3" : "5"}
        </p>
      </div>

      {/* Total Cost */}
      {price && (
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-purple-900 dark:text-purple-300 font-medium">
              Total Cost:
            </span>
            <span className="text-2xl font-bold text-purple-900 dark:text-purple-300">
              {formatEther(BigInt(price.toString()) * BigInt(quantity))} ETH
            </span>
          </div>
        </div>
      )}

      {/* Mint Button */}
      <button
        data-testid="mint-button"
        onClick={handleMint}
        disabled={!canMint() || isPending || isConfirming}
        className={`w-full py-4 rounded-lg font-bold text-lg transition-all duration-200 ${
          canMint() && !isPending && !isConfirming
            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl"
            : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
        }`}
      >
        {!isConnected
          ? "Connect Wallet First"
          : saleState === 0
          ? "Sale Not Active"
          : saleState === 1 && !isAllowlisted
          ? "Not Allowlisted"
          : isPending || isConfirming
          ? "Minting..."
          : totalSupply && maxSupply && totalSupply >= maxSupply
          ? "Sold Out"
          : "Mint Now"}
      </button>

      {/* Transaction Status */}
      {txStatus && (
        <div
          className={`mt-4 p-4 rounded-lg ${
            txStatus.includes("Error")
              ? "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300"
              : txStatus.includes("successfully")
              ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300"
              : "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300"
          }`}
        >
          {txStatus}
        </div>
      )}
    </div>
  );
}
