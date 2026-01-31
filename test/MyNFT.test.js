const { expect } = require("chai");
const { ethers } = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

describe("MyNFT", function () {
  let nft;
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let addrs;
  let merkleTree;
  let merkleRoot;

  const NAME = "Generative NFT Collection";
  const SYMBOL = "GNFT";
  const PRICE = ethers.parseEther("0.01");
  const UNREVEALED_URI = "ipfs://QmUnrevealed/";
  const REVEALED_URI = "ipfs://QmRevealed/";
  const MAX_SUPPLY = 10000;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();

    // Deploy contract
    const MyNFT = await ethers.getContractFactory("MyNFT");
    nft = await MyNFT.deploy(NAME, SYMBOL, PRICE, UNREVEALED_URI);
    await nft.waitForDeployment();

    // Create Merkle tree for allowlist
    const allowlist = [addr1.address, addr2.address];
    const leaves = allowlist.map((addr) => keccak256(addr));
    merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    merkleRoot = merkleTree.getHexRoot();

    // Set Merkle root
    await nft.setMerkleRoot(merkleRoot);
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await nft.name()).to.equal(NAME);
      expect(await nft.symbol()).to.equal(SYMBOL);
    });

    it("Should set the correct owner", async function () {
      expect(await nft.owner()).to.equal(owner.address);
    });

    it("Should set the correct price", async function () {
      expect(await nft.price()).to.equal(PRICE);
    });

    it("Should start with Paused sale state", async function () {
      expect(await nft.saleState()).to.equal(0); // Paused
    });

    it("Should support ERC721 and ERC2981 interfaces", async function () {
      const ERC721_INTERFACE_ID = "0x80ac58cd";
      const ERC2981_INTERFACE_ID = "0x2a55205a";

      expect(await nft.supportsInterface(ERC721_INTERFACE_ID)).to.be.true;
      expect(await nft.supportsInterface(ERC2981_INTERFACE_ID)).to.be.true;
    });

    it("Should have MAX_SUPPLY of 10000", async function () {
      expect(await nft.MAX_SUPPLY()).to.equal(MAX_SUPPLY);
    });
  });

  describe("Owner Functions", function () {
    describe("setPrice", function () {
      it("Should allow owner to set price", async function () {
        const newPrice = ethers.parseEther("0.05");
        await nft.setPrice(newPrice);
        expect(await nft.price()).to.equal(newPrice);
      });

      it("Should emit PriceUpdated event", async function () {
        const newPrice = ethers.parseEther("0.05");
        await expect(nft.setPrice(newPrice))
          .to.emit(nft, "PriceUpdated")
          .withArgs(newPrice);
      });

      it("Should revert if non-owner tries to set price", async function () {
        const newPrice = ethers.parseEther("0.05");
        await expect(nft.connect(addr1).setPrice(newPrice)).to.be.revertedWithCustomError(
          nft,
          "OwnableUnauthorizedAccount"
        );
      });
    });

    describe("setMerkleRoot", function () {
      it("Should allow owner to set Merkle root", async function () {
        const newRoot = ethers.hexlify(ethers.randomBytes(32));
        await nft.setMerkleRoot(newRoot);
        expect(await nft.merkleRoot()).to.equal(newRoot);
      });

      it("Should emit MerkleRootUpdated event", async function () {
        const newRoot = ethers.hexlify(ethers.randomBytes(32));
        await expect(nft.setMerkleRoot(newRoot))
          .to.emit(nft, "MerkleRootUpdated")
          .withArgs(newRoot);
      });

      it("Should revert if non-owner tries to set Merkle root", async function () {
        const newRoot = ethers.hexlify(ethers.randomBytes(32));
        await expect(
          nft.connect(addr1).setMerkleRoot(newRoot)
        ).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
      });
    });

    describe("setSaleState", function () {
      it("Should allow owner to set sale state", async function () {
        await nft.setSaleState(1); // Allowlist
        expect(await nft.saleState()).to.equal(1);

        await nft.setSaleState(2); // Public
        expect(await nft.saleState()).to.equal(2);
      });

      it("Should emit SaleStateUpdated event", async function () {
        await expect(nft.setSaleState(1))
          .to.emit(nft, "SaleStateUpdated")
          .withArgs(1);
      });

      it("Should revert if non-owner tries to set sale state", async function () {
        await expect(nft.connect(addr1).setSaleState(1)).to.be.revertedWithCustomError(
          nft,
          "OwnableUnauthorizedAccount"
        );
      });
    });

    describe("pause and unpause", function () {
      it("Should allow owner to pause", async function () {
        await nft.setSaleState(1); // Allowlist
        await nft.pause();
        expect(await nft.saleState()).to.equal(0); // Paused
      });

      it("Should allow owner to unpause", async function () {
        await nft.unpause(1); // Allowlist
        expect(await nft.saleState()).to.equal(1);
      });

      it("Should revert if trying to unpause to Paused state", async function () {
        await expect(nft.unpause(0)).to.be.revertedWithCustomError(
          nft,
          "InvalidSaleState"
        );
      });

      it("Should revert if non-owner tries to pause", async function () {
        await expect(nft.connect(addr1).pause()).to.be.revertedWithCustomError(
          nft,
          "OwnableUnauthorizedAccount"
        );
      });
    });

    describe("setBaseURI and setRevealedURI", function () {
      it("Should allow owner to set base URI", async function () {
        const newURI = "ipfs://QmNewBase/";
        await nft.setBaseURI(newURI);
        // URI is internal, so we'll test through tokenURI after minting
      });

      it("Should allow owner to set revealed URI", async function () {
        const newURI = "ipfs://QmNewRevealed/";
        await nft.setRevealedURI(newURI);
        // URI is internal, so we'll test through tokenURI after reveal
      });

      it("Should revert if non-owner tries to set URIs", async function () {
        await expect(
          nft.connect(addr1).setBaseURI("ipfs://test/")
        ).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
        await expect(
          nft.connect(addr1).setRevealedURI("ipfs://test/")
        ).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
      });
    });

    describe("reveal", function () {
      it("Should allow owner to reveal", async function () {
        await nft.setRevealedURI(REVEALED_URI);
        await nft.reveal();
        expect(await nft.isRevealed()).to.be.true;
      });

      it("Should emit Revealed event", async function () {
        await nft.setRevealedURI(REVEALED_URI);
        await expect(nft.reveal()).to.emit(nft, "Revealed").withArgs(REVEALED_URI);
      });

      it("Should revert if non-owner tries to reveal", async function () {
        await expect(nft.connect(addr1).reveal()).to.be.revertedWithCustomError(
          nft,
          "OwnableUnauthorizedAccount"
        );
      });
    });

    describe("withdraw", function () {
      it("Should allow owner to withdraw funds", async function () {
        // Mint to add funds to contract
        await nft.setSaleState(2); // Public
        await nft.connect(addr1).publicMint(1, { value: PRICE });

        const contractBalance = await ethers.provider.getBalance(
          await nft.getAddress()
        );
        const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

        const tx = await nft.withdraw();
        const receipt = await tx.wait();
        const gasUsed = receipt.gasUsed * receipt.gasPrice;

        const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

        expect(ownerBalanceAfter).to.equal(
          ownerBalanceBefore + contractBalance - gasUsed
        );
      });

      it("Should emit Withdrawn event", async function () {
        await nft.setSaleState(2);
        await nft.connect(addr1).publicMint(1, { value: PRICE });

        await expect(nft.withdraw())
          .to.emit(nft, "Withdrawn")
          .withArgs(owner.address, PRICE);
      });

      it("Should revert if non-owner tries to withdraw", async function () {
        await expect(nft.connect(addr1).withdraw()).to.be.revertedWithCustomError(
          nft,
          "OwnableUnauthorizedAccount"
        );
      });
    });
  });

  describe("Allowlist Minting", function () {
    beforeEach(async function () {
      await nft.setSaleState(1); // Allowlist
    });

    it("Should allow allowlisted user to mint with valid proof", async function () {
      const leaf = keccak256(addr1.address);
      const proof = merkleTree.getHexProof(leaf);

      await nft.connect(addr1).allowlistMint(proof, 1, { value: PRICE });
      expect(await nft.totalSupply()).to.equal(1);
      expect(await nft.ownerOf(0)).to.equal(addr1.address);
    });

    it("Should allow minting multiple NFTs", async function () {
      const leaf = keccak256(addr1.address);
      const proof = merkleTree.getHexProof(leaf);
      const quantity = 2;

      await nft
        .connect(addr1)
        .allowlistMint(proof, quantity, { value: PRICE * BigInt(quantity) });
      expect(await nft.totalSupply()).to.equal(quantity);
      expect(await nft.allowlistMinted(addr1.address)).to.equal(quantity);
    });

    it("Should emit Minted event", async function () {
      const leaf = keccak256(addr1.address);
      const proof = merkleTree.getHexProof(leaf);

      await expect(nft.connect(addr1).allowlistMint(proof, 1, { value: PRICE }))
        .to.emit(nft, "Minted")
        .withArgs(addr1.address, 1, 0);
    });

    it("Should revert with invalid Merkle proof", async function () {
      const fakeProof = [ethers.hexlify(ethers.randomBytes(32))];

      await expect(
        nft.connect(addr1).allowlistMint(fakeProof, 1, { value: PRICE })
      ).to.be.revertedWithCustomError(nft, "InvalidMerkleProof");
    });

    it("Should revert if not allowlisted", async function () {
      const leaf = keccak256(addr3.address);
      const proof = merkleTree.getHexProof(leaf);

      await expect(
        nft.connect(addr3).allowlistMint(proof, 1, { value: PRICE })
      ).to.be.revertedWithCustomError(nft, "InvalidMerkleProof");
    });

    it("Should revert if insufficient funds", async function () {
      const leaf = keccak256(addr1.address);
      const proof = merkleTree.getHexProof(leaf);

      await expect(
        nft.connect(addr1).allowlistMint(proof, 1, { value: PRICE / 2n })
      ).to.be.revertedWithCustomError(nft, "InsufficientFunds");
    });

    it("Should revert if exceeds per-wallet limit", async function () {
      const leaf = keccak256(addr1.address);
      const proof = merkleTree.getHexProof(leaf);

      await expect(
        nft.connect(addr1).allowlistMint(proof, 4, { value: PRICE * 4n })
      ).to.be.revertedWithCustomError(nft, "MintLimitExceeded");
    });

    it("Should revert if quantity is zero", async function () {
      const leaf = keccak256(addr1.address);
      const proof = merkleTree.getHexProof(leaf);

      await expect(
        nft.connect(addr1).allowlistMint(proof, 0, { value: 0 })
      ).to.be.revertedWithCustomError(nft, "InvalidQuantity");
    });

    it("Should revert if sale state is not Allowlist", async function () {
      await nft.setSaleState(0); // Paused

      const leaf = keccak256(addr1.address);
      const proof = merkleTree.getHexProof(leaf);

      await expect(
        nft.connect(addr1).allowlistMint(proof, 1, { value: PRICE })
      ).to.be.revertedWithCustomError(nft, "SaleNotActive");
    });
  });

  describe("Public Minting", function () {
    beforeEach(async function () {
      await nft.setSaleState(2); // Public
    });

    it("Should allow anyone to mint during public sale", async function () {
      await nft.connect(addr3).publicMint(1, { value: PRICE });
      expect(await nft.totalSupply()).to.equal(1);
      expect(await nft.ownerOf(0)).to.equal(addr3.address);
    });

    it("Should allow minting multiple NFTs", async function () {
      const quantity = 3;
      await nft
        .connect(addr3)
        .publicMint(quantity, { value: PRICE * BigInt(quantity) });
      expect(await nft.totalSupply()).to.equal(quantity);
      expect(await nft.publicMinted(addr3.address)).to.equal(quantity);
    });

    it("Should emit Minted event", async function () {
      await expect(nft.connect(addr3).publicMint(1, { value: PRICE }))
        .to.emit(nft, "Minted")
        .withArgs(addr3.address, 1, 0);
    });

    it("Should revert if insufficient funds", async function () {
      await expect(
        nft.connect(addr3).publicMint(1, { value: PRICE / 2n })
      ).to.be.revertedWithCustomError(nft, "InsufficientFunds");
    });

    it("Should revert if exceeds per-wallet limit", async function () {
      await expect(
        nft.connect(addr3).publicMint(6, { value: PRICE * 6n })
      ).to.be.revertedWithCustomError(nft, "MintLimitExceeded");
    });

    it("Should revert if quantity is zero", async function () {
      await expect(
        nft.connect(addr3).publicMint(0, { value: 0 })
      ).to.be.revertedWithCustomError(nft, "InvalidQuantity");
    });

    it("Should revert if sale state is not Public", async function () {
      await nft.setSaleState(0); // Paused

      await expect(
        nft.connect(addr3).publicMint(1, { value: PRICE })
      ).to.be.revertedWithCustomError(nft, "SaleNotActive");
    });
  });

  describe("Token URI and Reveal", function () {
    beforeEach(async function () {
      await nft.setSaleState(2);
      await nft.connect(addr1).publicMint(1, { value: PRICE });
    });

    it("Should return unrevealed URI before reveal", async function () {
      const tokenURI = await nft.tokenURI(0);
      expect(tokenURI).to.equal(`${UNREVEALED_URI}0.json`);
    });

    it("Should return revealed URI after reveal", async function () {
      await nft.setRevealedURI(REVEALED_URI);
      await nft.reveal();

      const tokenURI = await nft.tokenURI(0);
      expect(tokenURI).to.equal(`${REVEALED_URI}0.json`);
    });

    it("Should revert when querying URI for non-existent token", async function () {
      await expect(nft.tokenURI(999)).to.be.revertedWithCustomError(
        nft,
        "ERC721NonexistentToken"
      );
    });
  });

  describe("Supply Constraints", function () {
    it("Should track total supply correctly", async function () {
      await nft.setSaleState(2);

      await nft.connect(addr1).publicMint(2, { value: PRICE * 2n });
      expect(await nft.totalSupply()).to.equal(2);

      await nft.connect(addr2).publicMint(3, { value: PRICE * 3n });
      expect(await nft.totalSupply()).to.equal(5);
    });

    it("Should have correct MAX_SUPPLY constant", async function () {
      expect(await nft.MAX_SUPPLY()).to.equal(10000);
    });
  });

  describe("Royalty Info (ERC2981)", function () {
    it("Should return correct royalty info", async function () {
      const salePrice = ethers.parseEther("1");
      const [receiver, royaltyAmount] = await nft.royaltyInfo(0, salePrice);

      expect(receiver).to.equal(owner.address);
      // 5% royalty
      expect(royaltyAmount).to.equal(salePrice / 20n);
    });

    it("Should allow owner to update royalty", async function () {
      await nft.setDefaultRoyalty(addr1.address, 1000); // 10%

      const salePrice = ethers.parseEther("1");
      const [receiver, royaltyAmount] = await nft.royaltyInfo(0, salePrice);

      expect(receiver).to.equal(addr1.address);
      expect(royaltyAmount).to.equal(salePrice / 10n);
    });
  });
});
