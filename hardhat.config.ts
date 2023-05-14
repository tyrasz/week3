import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

const mnemonic = process.env.MNEMONIC;
const mnemonic1 = process.env.MNEMONIC1;

if (!mnemonic) {
  throw new Error("Mnemonic phrase not defined");
}
const wallet = ethers.Wallet.fromMnemonic(mnemonic);

if (!mnemonic1) {
  throw new Error("Mnemonic phrase not defined");
}
const wallet1 = ethers.Wallet.fromMnemonic(mnemonic1);

const privateKey = wallet.privateKey;
const privateKey1 = wallet1.privateKey;

const config: HardhatUserConfig = {
  solidity: "0.8.18",
  paths: { tests: "tests" },
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [privateKey, privateKey1],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
