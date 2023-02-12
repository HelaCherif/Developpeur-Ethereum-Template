// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Voting contract
 */
contract Voting is Ownable {

    uint public winningProposalId;
    mapping (address => Voter) public voters;
    WorkflowStatus public currentStatus; 
    Proposal[] public proposals;

    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint votedProposalId;
    }

    struct Proposal {
        string description;
        uint voteCount;
    }

    enum WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }

    // Events
    event VoterRegistered(address voterAddress); 
    event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);
    event ProposalRegistered(uint proposalId);
    event Voted (address voter, uint proposalId);

   constructor() {
        currentStatus=WorkflowStatus.RegisteringVoters;
    }

    // Modifiers
    modifier onlyRegistredVoter() {
        require(voters[msg.sender].isRegistered,"this voter is not registred");
        _;
    }

    modifier onlyDuringVotersRegistration() {
        require(currentStatus==WorkflowStatus.RegisteringVoters,"this operation can be done only during voters registration session");
        _;
    }

    modifier onlyDuringPropositionRegistration() {
        require(currentStatus==WorkflowStatus.ProposalsRegistrationStarted,"this operation can be done only during propositions registration session");
        _;
    }

    modifier onlyWhenPropositionRegistrationClosed() {
        require(currentStatus==WorkflowStatus.ProposalsRegistrationEnded,"this operation can be done only when propositions registration session was ended");
        _;
    }

    modifier onlyDuringVotingRegistration() {
        require(currentStatus==WorkflowStatus.VotingSessionStarted,"this operation can be done only during voting registration session");
        _;
    }

    modifier onlyWhenVotingRegistrationClosed() {
        require(currentStatus==WorkflowStatus.VotingSessionEnded,"this operation can be done only when voting registration session was ended");
        _;
    }

    modifier onlyAfterVotesTallied() {
         require(currentStatus==WorkflowStatus.VotesTallied,"this operation can be done only when votes are already tallied");
        _;
    }

    //Functions
    function registerVoters(address _addr) external onlyOwner onlyDuringVotersRegistration {  
        require(!voters[_addr].isRegistered,"the voter is already registred");
        voters[_addr].isRegistered = true;
        emit VoterRegistered(_addr);
    }

    function getRegisterVoterByAddress(address _addr) view external returns (Voter memory) {
         return voters[_addr];
    }

    function startRegisterProposition() external onlyOwner onlyDuringVotersRegistration {
        currentStatus=WorkflowStatus.ProposalsRegistrationStarted;
        emit WorkflowStatusChange(WorkflowStatus.RegisteringVoters, WorkflowStatus.ProposalsRegistrationStarted);
    }
    // Control added to verify the unicity of the proposition
    function registerProposition(string memory _proposal) external onlyDuringPropositionRegistration onlyRegistredVoter {
        for (uint i=0 ;i<proposals.length ; i++) {
            if (keccak256(abi.encodePacked(proposals[i].description)) == keccak256(abi.encodePacked(_proposal))){
                emit ProposalRegistered(i);
                return;
            }
        }
        proposals.push(Proposal(_proposal,0));
        emit ProposalRegistered(proposals.length-1);
    }

     function getAllPropositions() external view returns (Proposal[] memory) {
        return proposals;
    }

    function closeRegisterProposition() external onlyOwner onlyDuringPropositionRegistration {
        currentStatus=WorkflowStatus.ProposalsRegistrationEnded;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationStarted, WorkflowStatus.ProposalsRegistrationEnded);
    }

    
    function startVoteSession() external onlyOwner onlyWhenPropositionRegistrationClosed {
        currentStatus=WorkflowStatus.VotingSessionStarted;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationEnded, WorkflowStatus.VotingSessionStarted);
    }

     function vote(uint _proposalId) external onlyDuringVotingRegistration onlyRegistredVoter {  
        require(!voters[msg.sender].hasVoted, "The Voter has already voted");
        voters[msg.sender].hasVoted=true;
        voters[msg.sender].votedProposalId=_proposalId;
        proposals[_proposalId].voteCount++;
        emit Voted(msg.sender,_proposalId);
    }

    function closeVoteSession() external onlyOwner onlyDuringVotingRegistration {
        currentStatus=WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionStarted, WorkflowStatus.VotingSessionEnded);
    }

    function tallyVotes() onlyOwner onlyWhenVotingRegistrationClosed external {
        uint winningVoteCount = 0;
        uint winningProposalIndex = 0;   
        for (uint i = 0; i < proposals.length; i++) {
            if (proposals[i].voteCount > winningVoteCount) {
                winningVoteCount = proposals[i].voteCount;
                winningProposalIndex = i;
            }
        }    
        winningProposalId = winningProposalIndex;
        currentStatus = WorkflowStatus.VotesTallied;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionEnded, WorkflowStatus.VotesTallied);
    }

    function getWinnerId() external view onlyAfterVotesTallied returns (uint) {
        return winningProposalId;
    }

    function getWinnerDescription() external view onlyAfterVotesTallied returns (string memory) {
        return proposals[winningProposalId].description;
    }

    function getWinnerVoteCount() external view onlyAfterVotesTallied returns (uint) {
        return proposals[winningProposalId].voteCount;
    }

    function getVoteResults() external view onlyAfterVotesTallied returns (Proposal[] memory) {
        return proposals;
    }
}
