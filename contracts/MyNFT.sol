// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title MyNFT
 * @dev ERC721 NFT contract with Merkle tree allowlist, reveal mechanism, and royalties
 */
contract MyNFT is ERC721, ERC2981, Ownable {
    using Strings for uint256;

    // Custom errors for gas optimization
    error InsufficientFunds();
    error InvalidMerkleProof();
    error MaxSupplyReached();
    error MintLimitExceeded();
    error SaleNotActive();
    error InvalidSaleState();
    error WithdrawalFailed();
    error InvalidQuantity();

    // Sale states
    enum SaleState {
        Paused,
        Allowlist,
        Public
    }

    // Constants
    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public constant MAX_PER_WALLET_ALLOWLIST = 3;
    uint256 public constant MAX_PER_WALLET_PUBLIC = 5;

    // State variables
    uint256 private _currentTokenId;
    uint256 public price;
    bytes32 public merkleRoot;
    SaleState public saleState;
    bool public isRevealed;

    string private _baseTokenURI;
    string private _revealedURI;

    // Tracking mints per wallet
    mapping(address => uint256) public allowlistMinted;
    mapping(address => uint256) public publicMinted;

    // Events
    event Minted(address indexed to, uint256 quantity, uint256 startTokenId);
    event PriceUpdated(uint256 newPrice);
    event MerkleRootUpdated(bytes32 newMerkleRoot);
    event SaleStateUpdated(SaleState newState);
    event BaseURIUpdated(string newBaseURI);
    event Revealed(string revealedURI);
    event Withdrawn(address indexed to, uint256 amount);

    /**
     * @dev Constructor to initialize the NFT collection
     * @param _name Token name
     * @param _symbol Token symbol
     * @param _initialPrice Initial mint price in wei
     * @param _initialBaseURI Initial base URI for unrevealed metadata
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _initialPrice,
        string memory _initialBaseURI
    ) ERC721(_name, _symbol) Ownable(msg.sender) {
        price = _initialPrice;
        _baseTokenURI = _initialBaseURI;
        saleState = SaleState.Paused;
        
        // Set default royalty to 5% (500 basis points)
        _setDefaultRoyalty(msg.sender, 500);
    }

    /**
     * @dev Allowlist minting with Merkle proof verification
     * @param merkleProof Merkle proof for the sender's address
     * @param quantity Number of NFTs to mint
     */
    function allowlistMint(bytes32[] calldata merkleProof, uint256 quantity) 
        external 
        payable 
    {
        if (saleState != SaleState.Allowlist) revert SaleNotActive();
        if (quantity == 0) revert InvalidQuantity();
        if (_currentTokenId + quantity > MAX_SUPPLY) revert MaxSupplyReached();
        if (allowlistMinted[msg.sender] + quantity > MAX_PER_WALLET_ALLOWLIST) 
            revert MintLimitExceeded();
        if (msg.value < price * quantity) revert InsufficientFunds();

        // Verify Merkle proof
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        if (!MerkleProof.verify(merkleProof, merkleRoot, leaf)) 
            revert InvalidMerkleProof();

        allowlistMinted[msg.sender] += quantity;
        _mintBatch(msg.sender, quantity);
    }

    /**
     * @dev Public minting function
     * @param quantity Number of NFTs to mint
     */
    function publicMint(uint256 quantity) external payable {
        if (saleState != SaleState.Public) revert SaleNotActive();
        if (quantity == 0) revert InvalidQuantity();
        if (_currentTokenId + quantity > MAX_SUPPLY) revert MaxSupplyReached();
        if (publicMinted[msg.sender] + quantity > MAX_PER_WALLET_PUBLIC) 
            revert MintLimitExceeded();
        if (msg.value < price * quantity) revert InsufficientFunds();

        publicMinted[msg.sender] += quantity;
        _mintBatch(msg.sender, quantity);
    }

    /**
     * @dev Internal function to mint multiple tokens
     * @param to Address to mint tokens to
     * @param quantity Number of tokens to mint
     */
    function _mintBatch(address to, uint256 quantity) internal {
        uint256 startTokenId = _currentTokenId;
        
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _currentTokenId;
            _currentTokenId++;
            _safeMint(to, tokenId);
        }

        emit Minted(to, quantity, startTokenId);
    }

    /**
     * @dev Set the mint price (owner only)
     * @param newPrice New price in wei
     */
    function setPrice(uint256 newPrice) external onlyOwner {
        price = newPrice;
        emit PriceUpdated(newPrice);
    }

    /**
     * @dev Set the Merkle root for allowlist (owner only)
     * @param newMerkleRoot New Merkle root
     */
    function setMerkleRoot(bytes32 newMerkleRoot) external onlyOwner {
        merkleRoot = newMerkleRoot;
        emit MerkleRootUpdated(newMerkleRoot);
    }

    /**
     * @dev Set the sale state (owner only)
     * @param newState New sale state
     */
    function setSaleState(SaleState newState) external onlyOwner {
        saleState = newState;
        emit SaleStateUpdated(newState);
    }

    /**
     * @dev Pause the sale (owner only)
     */
    function pause() external onlyOwner {
        saleState = SaleState.Paused;
        emit SaleStateUpdated(SaleState.Paused);
    }

    /**
     * @dev Unpause the sale to a specific state (owner only)
     * @param targetState Target sale state (Allowlist or Public)
     */
    function unpause(SaleState targetState) external onlyOwner {
        if (targetState == SaleState.Paused) revert InvalidSaleState();
        saleState = targetState;
        emit SaleStateUpdated(targetState);
    }

    /**
     * @dev Set the base URI for unrevealed metadata (owner only)
     * @param newBaseURI New base URI
     */
    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    /**
     * @dev Set the revealed URI (owner only)
     * @param newRevealedURI New revealed URI
     */
    function setRevealedURI(string calldata newRevealedURI) external onlyOwner {
        _revealedURI = newRevealedURI;
    }

    /**
     * @dev Reveal the collection (owner only)
     */
    function reveal() external onlyOwner {
        isRevealed = true;
        emit Revealed(_revealedURI);
    }

    /**
     * @dev Withdraw contract balance (owner only)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = payable(owner()).call{value: balance}("");
        if (!success) revert WithdrawalFailed();
        emit Withdrawn(owner(), balance);
    }

    /**
     * @dev Update royalty information (owner only)
     * @param receiver Address to receive royalties
     * @param feeNumerator Royalty fee in basis points (e.g., 500 = 5%)
     */
    function setDefaultRoyalty(address receiver, uint96 feeNumerator) 
        external 
        onlyOwner 
    {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    /**
     * @dev Get the total supply minted
     */
    function totalSupply() public view returns (uint256) {
        return _currentTokenId;
    }

    /**
     * @dev Get token URI based on reveal status
     * @param tokenId Token ID
     */
    function tokenURI(uint256 tokenId) 
        public 
        view 
        virtual 
        override 
        returns (string memory) 
    {
        _requireOwned(tokenId);

        if (isRevealed) {
            return bytes(_revealedURI).length > 0
                ? string(abi.encodePacked(_revealedURI, tokenId.toString(), ".json"))
                : "";
        } else {
            return bytes(_baseTokenURI).length > 0
                ? string(abi.encodePacked(_baseTokenURI, tokenId.toString(), ".json"))
                : "";
        }
    }

    /**
     * @dev Override supportsInterface to support ERC2981
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
}
