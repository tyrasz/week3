import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { MyVotingToken, TokenizedBallot } from "../typechain-types";
import { token } from "../typechain-types/@openzeppelin/contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const PROPOSALS = ["Proposal 1", "Proposal 2", "Proposal 3"];

function convertStringArrayToBytes32(array: string[]) {
  const bytes32Array = [];
  for (let index = 0; index < array.length; index++) {
    bytes32Array.push(ethers.utils.formatBytes32String(array[index]));
  }
  return bytes32Array;
}

describe("TokenizedBallot", function () {
  let tokenizedBallot: TokenizedBallot;
  let tokenContract: MyVotingToken;
  let deployer: SignerWithAddress;
  let acc1: SignerWithAddress;
  let acc2: SignerWithAddress;
  let targetBlockNumber: number;

  beforeEach(async () => {
    const signers = await ethers.getSigners();
    deployer = signers[0];
    acc1 = signers[1];
    acc2 = signers[2];
    const tokenContractFactory = await ethers.getContractFactory(
      "MyVotingToken"
    );
    tokenContract = await tokenContractFactory.deploy();
    await tokenContract.deployed();
  });

  describe("when ballot contract is deployed", async () => {
    beforeEach(async () => {
      const tokenizedBallotFactory = await ethers.getContractFactory(
        "TokenizedBallot"
      );
      tokenizedBallot = await tokenizedBallotFactory.deploy(
        convertStringArrayToBytes32(PROPOSALS),
        tokenContract.address
      );
      await tokenizedBallot.deployed();
    });

    describe("when the ballot is deployed and voting power is zero", async () => {
      it("has the provided proposals", async () => {
        for (let i = 0; i < PROPOSALS.length; i++) {
          const proposal = await tokenizedBallot.proposals(i);
          expect(ethers.utils.parseBytes32String(proposal.name)).to.equal(
            PROPOSALS[i]
          );
        }
      });
    });

    describe("test voting power and delegation", async () => {
      it("updates the votes correctly", async () => {
        const preVotePower = await tokenContract.getVotes(acc1.address);
        expect(preVotePower).to.equal(0);
      });

      it("voting power is updated after delegating and not minting", async () => {
        const mintingTx = await tokenContract.mint(
          acc1.address,
          ethers.utils.parseEther("100")
        );
        await mintingTx.wait();
        const postMintVotePower = await tokenContract.getVotes(acc1.address);
        expect(postMintVotePower).to.equal(0);

        const delegationTx = await tokenContract
          .connect(acc1)
          .delegate(acc1.address);
        await delegationTx.wait();
        const postDelegationVotePower = await tokenContract.getVotes(
          acc1.address
        );
        expect(postDelegationVotePower).to.equal(
          ethers.utils.parseEther("100")
        );
      });

      it("voting power is correct for past votes", async () => {
        const mintingTx = await tokenContract.mint(
          acc1.address,
          ethers.utils.parseEther("100")
        );
        await mintingTx.wait();
        const postMintVotePower = await tokenContract.getVotes(acc1.address);
        expect(postMintVotePower).to.equal(0);

        const delegationTx = await tokenContract
          .connect(acc1)
          .delegate(acc1.address);
        await delegationTx.wait();
        const postDelegationVotePower = await tokenContract.getVotes(
          acc1.address
        );
        const pastVotePower = await tokenContract.getPastVotes(
          acc1.address,
          delegationTx.blockNumber - 1
        );
        expect(pastVotePower).to.equal(0);
      });
    });
  });
});
