"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { hardhat, sepolia } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "NFT Launchpad",
  projectId: "YOUR_WALLETCONNECT_PROJECT_ID",
  chains: [hardhat, sepolia],
  ssr: true,
});
