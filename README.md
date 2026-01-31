# Generative NFT Collection Launchpad

A full-featured, production-ready NFT launchpad built with Solidity, Hardhat, Next.js, and RainbowKit. This project demonstrates a complete NFT collection launch workflow including smart contracts, off-chain scripts, and a user-friendly minting DApp.

![NFT Launchpad](https://img.shields.io/badge/NFT-Launchpad-purple?style=for-the-badge)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=for-the-badge)
## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Smart Contract](#smart-contract)
- [Deployment](#deployment)
- [Testing](#testing)
- [Frontend DApp](#frontend-dapp)
- [Gas Optimization](#gas-optimization)
- [Security](#security)

## Features

### Smart Contract

- **ERC-721 Standard**: Full compliance with OpenZeppelin implementation
- **ERC-2981 Royalties**: Built-in royalty support for secondary sales
- **Merkle Tree Allowlist**: Gas-efficient allowlist verification
- **Phased Minting**: Allowlist and public sale phases
- **Reveal Mechanism**: Hidden metadata with post-mint reveal
- **Pausable**: Emergency pause functionality
- **Gas Optimized**: Custom errors and efficient storage patterns
- **Secure**: Follows checks-effects-interactions pattern

### Frontend DApp

- **Wallet Connection**: RainbowKit integration for seamless wallet connection
- **Real-time Data**: Live contract state updates
- **Merkle Proof Generation**: Client-side proof generation for allowlist
- **Responsive UI**: Beautiful, mobile21`   2-friendly interface
- **Transaction Feedback**: Clear status updates for all operations
- **TypeScript**: Full type safety

### Infrastructure

- **Docker Containerized**: Complete Docker and Docker Compose setup
- **Automated Testing**: Comprehensive unit test suite
- **IPFS Integration**: Scripts for metadata and asset upload
- **Deployment Scripts**: Automated deployment to any EVM chain

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend DApp                        │
│              (Next.js + RainbowKit)                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Web3 Provider (Wagmi)
                     │
┌────────────────────▼────────────────────────────────────┐
│                  Smart Contract                          │
│              (MyNFT.sol - ERC721)                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │ - Merkle Root Verification                       │   │
│  │ - Phased Minting (Allowlist → Public)            │   │
│  │ - Reveal Mechanism                               │   │
│  │ - Royalty Management (ERC-2981)                  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                     │
                     │ Metadata URI
                     │
┌────────────────────▼────────────────────────────────────┐
│                     IPFS Storage                         │
│         (Pinata / NFT.Storage)                           │
│  - NFT Images                                            │
│  - Metadata JSON                                         │
└─────────────────────────────────────────────────────────┘
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Docker** and **Docker Compose**
- **Git**

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/merkle-nft-launchpad.git
cd merkle-nft-launchpad
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your values
```

### 4. Start with Docker (Recommended)

```bash
# Start all services (Hardhat node + Frontend)
docker-compose up --build

# The Hardhat node will be available at: http://localhost:8545
# The frontend will be available at: http://localhost:3000
```

### 5. Deploy the Contract (In a new terminal)

```bash
# Deploy to local Hardhat network
npm run deploy:local

# The contract address will be displayed
# Update NEXT_PUBLIC_CONTRACT_ADDRESS in .env
```

### 6. Generate Merkle Root

```bash
# Generate Merkle tree from allowlist.json
npm run generate-merkle

# Copy the Merkle root and set it in the contract
```

### 7. Configure the Contract

```bash
npx hardhat console --network localhost
```

```javascript
const MyNFT = await ethers.getContractFactory("MyNFT");
const nft = await MyNFT.attach("YOUR_CONTRACT_ADDRESS");

// Set the Merkle root
await nft.setMerkleRoot("YOUR_MERKLE_ROOT");

// Set sale state (1 = Allowlist, 2 = Public)
await nft.setSaleState(1);
```

### 8. Access the DApp

```
http://localhost:3000
```

## Project Structure

```
merkle-nft-launchpad/
├── contracts/
│   └── MyNFT.sol                 # Main NFT smart contract
├── scripts/
│   ├── deploy.js                 # Deployment script
│   ├── generate-merkle.js        # Merkle tree generation
│   └── ipfs-upload.js            # IPFS upload utilities
├── test/
│   └── MyNFT.test.js             # Comprehensive test suite
├── frontend/
│   ├── app/                      # Next.js app directory
│   ├── components/               # React components
│   ├── config/                   # Configuration files
│   ├── contracts/                # Contract ABIs
│   ├── data/                     # Static data (allowlist)
│   └── utils/                    # Utility functions
├── docker-compose.yml
├── Dockerfile
├── hardhat.config.js
├── package.json
└── README.md
```

## Smart Contract

### Key Functions

#### Owner Functions

- `setPrice(uint256)` - Update mint price
- `setMerkleRoot(bytes32)` - Update allowlist
- `setSaleState(SaleState)` - Change sale phase
- `setBaseURI(string)` - Set unrevealed URI
- `setRevealedURI(string)` - Set revealed URI
- `reveal()` - Reveal the collection
- `pause()` - Pause minting
- `unpause(SaleState)` - Resume minting
- `withdraw()` - Withdraw funds

#### Public Functions

- `allowlistMint(bytes32[], uint256)` - Allowlist minting
- `publicMint(uint256)` - Public minting
- `totalSupply()` - Get current supply
- `tokenURI(uint256)` - Get token metadata URI

### Constants

- `MAX_SUPPLY`: 10,000 NFTs
- `MAX_PER_WALLET_ALLOWLIST`: 3 NFTs
- `MAX_PER_WALLET_PUBLIC`: 5 NFTs

## Deployment

### Local Deployment

```bash
npm run deploy:local
```

### Sepolia Testnet

```bash
npm run deploy:sepolia
```

## Testing

```bash
# Run all tests
npm test

# With coverage
npx hardhat coverage

# With gas reporting
REPORT_GAS=true npm test
```

### Test Coverage

- Contract deployment and initialization
- Owner-only functions and access control
- Allowlist minting with Merkle proofs
- Public minting
- Per-wallet limits
- Supply constraints
- Pausable functionality
- Reveal mechanism
- Withdrawal
- ERC-2981 royalties

## Frontend DApp

Built with:

- **Next.js 14** - React framework
- **RainbowKit** - Wallet connection
- **Wagmi** - React hooks for Ethereum
- **Tailwind CSS** - Styling

### Features

- Wallet connection (MetaMask, WalletConnect, etc.)
- Real-time contract data
- Automatic allowlist detection
- Client-side Merkle proof generation
- Transaction status feedback
- Responsive design

## Gas Optimization

- Custom errors instead of require strings
- Merkle trees for allowlist (saves ~15K gas per mint)
- Batch minting optimization
- No ERC721Enumerable (saves ~30% on transfers)
- Efficient storage packing

### Estimated Gas Costs

- Deploy: ~3.5M gas
- Allowlist Mint: ~150K gas
- Public Mint: ~130K gas
- Reveal: ~50K gas

## Security

### Features

- Checks-Effects-Interactions pattern
- OpenZeppelin contracts
- Access control
- Merkle proof verification
- Input validation
- Pausable mechanism

### Best Practices

- No arithmetic overflow (Solidity 0.8+)
- Pull payment pattern
- Comprehensive event logging
- Front-running protection

## Resources

- [OpenZeppelin](https://docs.openzeppelin.com/contracts/)
- [Hardhat](https://hardhat.org/docs)
- [RainbowKit](https://www.rainbowkit.com/docs)
- [Wagmi](https://wagmi.sh/)
- [ERC-721](https://eips.ethereum.org/EIPS/eip-721)
- [ERC-2981](https://eips.ethereum.org/EIPS/eip-2981)

## License

MIT License

---

**Built for the Web3 Community**
