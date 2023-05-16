import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import "dotenv/config";
import { MyVotingToken } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import hre from "hardhat";

function convertStringArrayToBytes32(array: string[]) {
  const bytes32Array = [];
  for (let index = 0; index < array.length; index++) {
    bytes32Array.push(ethers.utils.formatBytes32String(array[index]));
  }
  return bytes32Array;
}

async function main() {
  const PROPOSALS = ["Proposal 1", "Proposal 2", "Proposal 3"];

  const skyyAddress = "0xd60e2f289ff4e54eac21e30c2bdd78c47aa466e7";
  const loungAddress = "0x9620daf4fE148e8dCB58745f35BE24AE30503535";
  const napoAddress = "0xc5CFd52B5813f677CCC0FB309fDbAE289bF6Ef30";
  const billAddress = "0x4fFe51634A07d614D4f198CC87D4FfE88DAf420e";

  const tokenFactory = await ethers.getContractFactory("MyVotingToken");
  const tokenContract = (await tokenFactory.deploy()) as MyVotingToken;
  await tokenContract.deployed();

  const tokenizedBallotFactory = await ethers.getContractFactory(
    "TokenizedBallot"
  );
  const tokenizedBallot = await tokenizedBallotFactory.deploy(
    convertStringArrayToBytes32(PROPOSALS),
    tokenContract.address
  );
  const deployTx = await tokenizedBallot.deployTransaction.wait();
  console.log(deployTx);

  // mint some tokens
  const [deployer, acc1, acc2] = await ethers.getSigners();
  await tokenContract.mint(
    deployer.address,
    ethers.utils.parseUnits("1000", 18)
  );
  await tokenContract.mint(acc1.address, ethers.utils.parseUnits("3000", 18), {
    gasLimit: 1000000,
  });
  await tokenContract.connect(acc1).delegate(acc1.address, {
    gasLimit: 1000000,
  });

  await tokenContract.mint(napoAddress, ethers.utils.parseUnits("3000", 18), {
    gasLimit: 1000000,
  });

  await tokenContract.mint(skyyAddress, ethers.utils.parseUnits("3000", 18), {
    gasLimit: 1000000,
  });

  await tokenContract.mint(loungAddress, ethers.utils.parseUnits("3000", 18), {
    gasLimit: 1000000,
  });

  await tokenContract.mint(billAddress, ethers.utils.parseUnits("3000", 18), {
    gasLimit: 1000000,
  });

  //delegate transaction
  const delegateTx = await tokenContract
    .connect(deployer)
    .delegate(acc1.address, {
      gasLimit: 1000000,
    });

  //vote transaction
  const voteTx = await tokenizedBallot
    .connect(acc1)
    .vote(0, ethers.utils.parseUnits("1000", 18), {
      gasLimit: 1000000,
    });
  console.log(
    `The winning proposal is`,
    await tokenizedBallot.winningProposal()
  );

  await tokenContract.mint(
    deployer.address,
    ethers.utils.parseUnits("2000", 18),
    {
      gasLimit: 10000000,
      gasPrice: ethers.utils.parseUnits("1", "gwei"),
    }
  );
  await tokenContract.connect(deployer).delegate(deployer.address, {
    gasLimit: 10000000,
  });

  const voteTx1 = await tokenizedBallot
    .connect(deployer)
    .vote(1, ethers.utils.parseUnits("2000", 18), {
      gasLimit: 10000000,
      gasPrice: ethers.utils.parseUnits("1", "gwei"),
    });
  console.log(
    `The winning proposal is`,
    await tokenizedBallot.winningProposal()
  );

  await tokenizedBallot.deployTransaction.wait(10);
  //verify contracts
  async function verifyTokenContract(
    hre: HardhatRuntimeEnvironment,
    contractAddress: string
  ) {
    await hre.run("verify:verify", {
      address: contractAddress,
    });
  }
  const verifyTokenTx = await verifyTokenContract(hre, tokenContract.address);
  console.log(verifyTokenTx);

  async function verifyBallotContract(
    hre: HardhatRuntimeEnvironment,
    contractAddress: string,
    proposals: string[],
    tokenContractAddress: string
  ) {
    const proposalBytes = proposals.map(ethers.utils.formatBytes32String);
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [proposalBytes, tokenContractAddress],
    });
  }
  const verifyBallotTx = await verifyBallotContract(
    hre,
    tokenizedBallot.address,
    PROPOSALS,
    tokenContract.address
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
