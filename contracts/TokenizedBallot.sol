// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

interface IMyVotingToken {
    function balanceOf(address account) external view returns (uint256);

    function getPastVotes(address, uint256) external view returns (uint256);
}

contract TokenizedBallot {
    struct Proposal {
        bytes32 name;
        uint voteCount;
    }

    IMyVotingToken public tokenContract;
    Proposal[] public proposals;
    uint256 public targetBlockNumber;

    // keep track of voting power spent
    mapping(address => uint256) public votingPowerSpent;

    constructor(bytes32[] memory proposalNames, address _tokenContract) {
        tokenContract = IMyVotingToken(_tokenContract);
        targetBlockNumber = block.number;
        for (uint i = 0; i < proposalNames.length; i++) {
            proposals.push(Proposal({name: proposalNames[i], voteCount: 0}));
        }
    }

    function vote(uint proposal, uint256 amount) external {
        //TODO: voting power
        require(
            votingPower(msg.sender) >= amount,
            "TokenizedBallot: voting more than allocated voting power"
        );
        votingPowerSpent[msg.sender] += amount;
        //TODO: update voting power
        proposals[proposal].voteCount += amount;
    }

    function votingPower(address account) public view returns (uint256) {
        return tokenContract.balanceOf(account) - votingPowerSpent[account];
    }

    function winningProposal() public view returns (uint winningProposal_) {
        uint winningVoteCount = 0;
        for (uint p = 0; p < proposals.length; p++) {
            if (proposals[p].voteCount > winningVoteCount) {
                winningVoteCount = proposals[p].voteCount;
                winningProposal_ = p;
            }
        }
    }

    function winnerName() external view returns (bytes32 winnerName_) {
        winnerName_ = proposals[winningProposal()].name;
    }
}
