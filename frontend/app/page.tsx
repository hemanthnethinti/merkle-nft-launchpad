"use client";

import WalletConnect from "../components/WalletConnect";
import MintInterface from "../components/MintInterface";

export default function Home() {
  return (
    <main className="min-h-screen gradient-bg py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              Generative NFT Collection
            </h1>
            <p className="text-purple-200 text-lg">
              Mint your unique NFT from our exclusive collection
            </p>
          </div>
          <WalletConnect />
        </header>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Left Side - Info */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">About the Collection</h2>
              <p className="text-purple-100 mb-4">
                This is a generative NFT collection featuring unique digital art
                pieces stored on IPFS. Each NFT is one-of-a-kind with various
                traits and attributes.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">*</span>
                  <span>Generative artwork with unique traits</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">*</span>
                  <span>Secure Merkle tree allowlist system</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">*</span>
                  <span>ERC-721 standard with royalties</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">*</span>
                  <span>Metadata stored on IPFS</span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">Minting Phases</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-yellow-300 mb-1">
                    Phase 1: Allowlist
                  </h3>
                  <p className="text-sm text-purple-100">
                    Early access for allowlisted addresses. Max 3 per wallet.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-green-300 mb-1">
                    Phase 2: Public Sale
                  </h3>
                  <p className="text-sm text-purple-100">
                    Open to everyone. Max 5 per wallet.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-400/20 to-orange-400/20 backdrop-blur-lg rounded-2xl p-6 text-white border border-yellow-400/30">
              <h3 className="font-bold text-xl mb-2 flex items-center gap-2">
                <span className="text-2xl">*</span>
                Gas Optimized
              </h3>
              <p className="text-sm text-purple-100">
                This contract uses advanced gas optimization techniques
                including Merkle trees for allowlist verification and custom
                errors to minimize transaction costs.
              </p>
            </div>
          </div>

          {/* Right Side - Mint Interface */}
          <div>
            <MintInterface />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-white/80">
          <p className="text-sm">
            Built with Hardhat, Next.js, RainbowKit, and deployed on Ethereum
          </p>
          <p className="text-xs mt-2">
            Smart Contract: ERC-721 with ERC-2981 Royalties
          </p>
        </footer>
      </div>
    </main>
  );
}
