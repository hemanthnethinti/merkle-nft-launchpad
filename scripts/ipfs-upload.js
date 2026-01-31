const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

/**
 * Upload metadata and images to Pinata IPFS
 */
async function uploadToPinata() {
  const apiKey = process.env.PINATA_API_KEY;
  const secretApiKey = process.env.PINATA_SECRET_API_KEY;

  if (!apiKey || !secretApiKey) {
    console.error("Error: PINATA_API_KEY and PINATA_SECRET_API_KEY must be set in .env");
    process.exit(1);
  }

  console.log("\nUploading to Pinata IPFS...\n");

  try {
    // Example: Upload a single metadata file
    const metadata = {
      name: "My NFT #1",
      description: "A unique generative NFT from our collection.",
      image: "ipfs://YOUR_IMAGE_CID/1.png",
      attributes: [
        { trait_type: "Background", value: "Blue" },
        { trait_type: "Eyes", value: "Laser" },
        { trait_type: "Mouth", value: "Smile" },
      ],
    };

    const data = JSON.stringify(metadata);
    const formData = new FormData();
    formData.append("pinataContent", data);
    formData.append(
      "pinataMetadata",
      JSON.stringify({
        name: "nft-metadata-1.json",
      })
    );

    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      formData,
      {
        headers: {
          "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
          pinata_api_key: apiKey,
          pinata_secret_api_key: secretApiKey,
        },
      }
    );

    const ipfsHash = response.data.IpfsHash;
    console.log("Metadata uploaded successfully!");
    console.log("IPFS Hash:", ipfsHash);
    console.log("IPFS URL:", `ipfs://${ipfsHash}`);
    console.log("Gateway URL:", `https://gateway.pinata.cloud/ipfs/${ipfsHash}`);

    return ipfsHash;
  } catch (error) {
    console.error("Error uploading to Pinata:", error.response?.data || error.message);
    process.exit(1);
  }
}

// Generate example metadata files
function generateExampleMetadata() {
  console.log("\nGenerating example metadata files...\n");

  const metadataDir = path.join(__dirname, "..", "metadata");
  if (!fs.existsSync(metadataDir)) {
    fs.mkdirSync(metadataDir);
  }

  const backgrounds = ["Blue", "Red", "Green", "Purple", "Orange"];
  const eyes = ["Laser", "Normal", "Closed", "Wink", "Stars"];
  const mouths = ["Smile", "Frown", "Neutral", "Tongue", "Laugh"];

  for (let i = 1; i <= 10; i++) {
    const metadata = {
      name: `Generative NFT #${i}`,
      description: `A unique generative NFT from our collection. NFT number ${i}.`,
      image: `ipfs://YOUR_IMAGE_CID/${i}.png`,
      attributes: [
        {
          trait_type: "Background",
          value: backgrounds[Math.floor(Math.random() * backgrounds.length)],
        },
        {
          trait_type: "Eyes",
          value: eyes[Math.floor(Math.random() * eyes.length)],
        },
        {
          trait_type: "Mouth",
          value: mouths[Math.floor(Math.random() * mouths.length)],
        },
        {
          trait_type: "Rarity",
          value: i <= 2 ? "Legendary" : i <= 5 ? "Rare" : "Common",
        },
      ],
    };

    const filePath = path.join(metadataDir, `${i}.json`);
    fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
  }

  console.log(`Generated 10 example metadata files in ${metadataDir}`);
  console.log("\nNote: Update the 'image' field with actual IPFS CIDs after uploading images.");
}

// Run if executed directly
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args[0] === "generate") {
    generateExampleMetadata();
  } else if (args[0] === "upload") {
    uploadToPinata();
  } else {
    console.log("\nIPFS Upload Script");
    console.log("\nUsage:");
    console.log("  node scripts/ipfs-upload.js generate  - Generate example metadata");
    console.log("  node scripts/ipfs-upload.js upload    - Upload to Pinata IPFS\n");
  }
}

module.exports = { uploadToPinata, generateExampleMetadata };
