let Voting = artifacts.require("Voting");
const {BN, expectRevert, expectEvent} = require('@openzeppelin/test-helpers');
const {expect} = require('chai');


contract("Voting Tests", accounts => {
    const owner = accounts[0];
    const nonVoterUser = accounts[1];
    const nonRegisteredVoter = accounts[2];
    const voter = accounts[3];

    let votingInstance;

// Tests of getVoter Function
    describe("GETTER voter tests", () => {
        beforeEach(async function () {
            votingInstance = await Voting.new({from: owner});
        });

        it("...should not return a non voter, revert ", async () => {
            await expectRevert(votingInstance.getVoter(nonVoterUser, {from: owner}), "You're not a voter");
        });

        it("... should not return a non registered voter", async () => {
            await votingInstance.addVoter(owner, {from: owner});
            const storedData = await votingInstance.getVoter(nonRegisteredVoter, {from: owner});
            expect(storedData.isRegistered).to.equal(false);
        });

        it("... should return a registered user", async () => {
            await votingInstance.addVoter(voter, {from: owner});
            const storedData = await votingInstance.getVoter(voter, {from: voter});
            expect(storedData.isRegistered).to.equal(true);
        });

    });

// Tests of getOneProposal Function
    describe("GETTER proposal tests", () => {
        it("...should not return a non voter, revert ", async () => {
            votingInstance = await Voting.new({from: owner});
            await expectRevert(votingInstance.getVoter(nonVoterUser, {from: owner}), "You're not a voter");
        });
    });

// Tests of addVoter Function
    describe("Add voters tests", () => {
        beforeEach(async () => {
            votingInstance = await Voting.new({from: owner});
        });

        it("... should revert if the adder is not the owner", async () => {
            await expectRevert(votingInstance.addVoter(voter, {from: voter}), 'caller is not the owner');
        });

        it("... the first workflow status of the voting system should be RegisteringVoters", async () => {
            const storedData = await votingInstance.workflowStatus.call();
            expect(storedData).to.be.bignumber.equal(new BN(0));
        });

        it("... should add a voter", async () => {
            await votingInstance.addVoter(voter, {from: owner});
            const storedData = await votingInstance.getVoter(voter, {from: voter});
            expect(storedData.isRegistered).to.equal(true);
        });


        it("... should not add a voter already registered, revert", async () => {
            await votingInstance.addVoter(voter, {from: owner});
            await expectRevert(votingInstance.addVoter(voter, {from: owner}), "Already registered");
        });


        it("... should emit VoterRegistered event", async () => {
            const findEvent = await votingInstance.addVoter(voter, {from: owner});
            expectEvent(findEvent, "VoterRegistered", {voterAddress: voter});
        });

        it("... should not add a voter when registration proposals is opened, revert", async () => {
            await votingInstance.startProposalsRegistering({from: owner});
            await expectRevert(votingInstance.addVoter(voter, {from: owner}), "Voters registration is not open yet");
        });

    });

// Tests of startProposalsRegistering state Function
    describe("STATE REGISTERING proposal tests", () => {
        beforeEach(async () => {
            votingInstance = await Voting.new({from: owner});
        });

        it("... should revert if the state changer is not the owner", async () => {
            await expectRevert(votingInstance.startProposalsRegistering({from: voter}), 'caller is not the owner');
        });

        it("... should revert if the previous status is different from RegisteringVoters", async () => {
            await votingInstance.addVoter(voter, {from: owner});
            await votingInstance.startProposalsRegistering({from: owner});
            await expectRevert(votingInstance.startProposalsRegistering({from: owner}), 'Registering proposals cant be started now');
        });

        it("...should push a GENESIS proposal", async () => {
            await votingInstance.addVoter(voter, {from: owner});
            await votingInstance.startProposalsRegistering({from: owner});
            const storedData = await votingInstance.getOneProposal(0, {from: voter})
            expect(storedData.description).to.equal("GENESIS");
        });

        it("... should emit WorkflowStatusChange event when a startProposalsRegistering", async () => {
            await votingInstance.addVoter(voter, {from: owner});
            const findEvent = await votingInstance.startProposalsRegistering({from: owner});
            expectEvent(findEvent, "WorkflowStatusChange", {previousStatus: new BN(0), newStatus: new BN(1)});
        });


    });

// Tests of addProposal Function
    describe("REGISTRATION proposals tests", () => {

        beforeEach(async () => {
            votingInstance = await Voting.new({from: owner});
        });

        it("... should not add a proposals when registration proposals is not opened yet, revert", async () => {
            await votingInstance.addVoter(voter, {from: owner});
            await expectRevert(votingInstance.addProposal(voter, {from: voter}), "Proposals are not allowed yet");
        });

        it("... should not add a proposals when a non voter, revert", async () => {
            await votingInstance.startProposalsRegistering({from: owner});
            await expectRevert(votingInstance.addProposal("proposal", {from: nonRegisteredVoter}), "You're not a voter");
        });

        it("... should not add a proposal if there is no description", async () => {
            await votingInstance.addVoter(voter, {from: owner});
            await votingInstance.startProposalsRegistering({from: owner});
            await expectRevert(votingInstance.addProposal("", {from: voter}), "Vous ne pouvez pas ne rien proposer");
        });

        it("... should add a proposal", async () => {
            await votingInstance.addVoter(voter, {from: owner});
            await votingInstance.startProposalsRegistering({from: owner});
            await votingInstance.addProposal("proposal", {from: voter});
            const storedData = await votingInstance.getOneProposal(1, {from: voter})
            expect(storedData.description).to.equal("proposal");
        });

        it("... should emit ProposalRegistered event when a proposal is added", async () => {
            await votingInstance.addVoter(voter, {from: owner});
            await votingInstance.startProposalsRegistering({from: owner});
            const findEvent = await votingInstance.addProposal("proposal", {from: voter});
            expectEvent(findEvent, "ProposalRegistered", {proposalId: new BN(1)});
        });
    });

// Tests of endProposalsRegistering state Function
    describe("STATE END proposal tests", () => {
        beforeEach(async () => {
            votingInstance = await Voting.new({from: owner});
        });

        it("... should revert if the state changer is not the owner", async () => {
            await expectRevert(votingInstance.endProposalsRegistering({from: voter}), 'caller is not the owner');
        });

        it("... should revert if the previous status is different from ProposalsRegistrationStarted", async () => {
            await votingInstance.addVoter(voter, {from: owner});
            await expectRevert(votingInstance.endProposalsRegistering({from: owner}), 'Registering proposals havent started yet');
        });

        it("... should emit WorkflowStatusChange event when a endProposalsRegistering", async () => {
            await votingInstance.addVoter(voter, {from: owner});
            await votingInstance.startProposalsRegistering({from: owner});
            const findEvent = await votingInstance.endProposalsRegistering({from: owner});
            expectEvent(findEvent, "WorkflowStatusChange", {previousStatus: new BN(1), newStatus: new BN(2)});
        });
    });

// Tests of start vote session state Function
    describe("STATE START vote tests", () => {
        beforeEach(async () => {
            votingInstance = await Voting.new({from: owner});
        });

        it("... should revert if the state changer is not the owner", async () => {
            await expectRevert(votingInstance.startVotingSession({from: voter}), 'caller is not the owner');
        });

        it("... should revert if the previous status is different from ProposalsRegistrationEnded", async () => {
            await votingInstance.addVoter(voter, {from: owner});
            await expectRevert(votingInstance.startVotingSession({from: owner}), 'Registering proposals phase is not finished');
        });

        it("... should emit WorkflowStatusChange event when a startVotingSession", async () => {
            await votingInstance.addVoter(voter, {from: owner});
            await votingInstance.startProposalsRegistering({from: owner});
            await votingInstance.endProposalsRegistering({from: owner});
            const findEvent = await votingInstance.startVotingSession({from: owner});
            expectEvent(findEvent, "WorkflowStatusChange", {previousStatus: new BN(2), newStatus: new BN(3)});
        });
    });

// Tests of setVote Function
    describe("SET vote tests", () => {

        beforeEach(async () => {
            votingInstance = await Voting.new({from: owner});
        });

        it("... should not vote when a non voter, revert", async () => {
            await votingInstance.addVoter(voter, {from: owner});
            await votingInstance.startProposalsRegistering({from: owner});
            await votingInstance.addProposal("proposal", {from: voter});
            await votingInstance.endProposalsRegistering({from: owner});
            await votingInstance.startVotingSession({from: owner});
            await expectRevert(votingInstance.setVote(0, {from: nonRegisteredVoter}), "You're not a voter");
        });


        it("... should not vote when vote session is not opened yet, revert", async () => {
            await votingInstance.addVoter(voter, {from: owner});
            await votingInstance.startProposalsRegistering({from: owner});
            await votingInstance.addProposal("proposal", {from: voter});
            await votingInstance.endProposalsRegistering({from: owner});
            await expectRevert(votingInstance.setVote(0, {from: voter}), "Voting session havent started yet");
        });

        it("... should not vote twice", async () => {
            await votingInstance.addVoter(voter, {from: owner});
            await votingInstance.startProposalsRegistering({from: owner});
            await votingInstance.addProposal("proposal", {from: voter});
            await votingInstance.endProposalsRegistering({from: owner});
            await votingInstance.startVotingSession({from: owner});
            await votingInstance.setVote(0, {from: voter});
            await expectRevert(votingInstance.setVote(0, {from: voter}), "You have already voted");
        });

        it("... should not vote on undefined proposal", async () => {
            await votingInstance.addVoter(voter, {from: owner});
            await votingInstance.startProposalsRegistering({from: owner});
            await votingInstance.addProposal("proposal", {from: voter});
            await votingInstance.endProposalsRegistering({from: owner});
            await votingInstance.startVotingSession({from: owner});
            await expectRevert(votingInstance.setVote(3, {from: voter}), "Proposal not found");
        });

        it("... should vote on proposal", async () => {
            await votingInstance.addVoter(voter, {from: owner});
            await votingInstance.startProposalsRegistering({from: owner});
            await votingInstance.addProposal("proposal", {from: voter});
            await votingInstance.endProposalsRegistering({from: owner});
            await votingInstance.startVotingSession({from: owner});
            await votingInstance.setVote(0, {from: voter});
            let storedData = await votingInstance.getVoter(voter, {from: voter});
            expect(storedData.votedProposalId).to.be.bignumber.equal(new BN(0));
            expect(storedData.hasVoted).to.equal(true);
            storedData = await votingInstance.getOneProposal(0,{from: voter});
            expect(storedData.voteCount).to.be.bignumber.equal(new BN(1));
        });

        it("... should emit vote event", async () => {
            await votingInstance.addVoter(voter, {from: owner});
            await votingInstance.startProposalsRegistering({from: owner});
            await votingInstance.addProposal("proposal", {from: voter});
            await votingInstance.endProposalsRegistering({from: owner});
            await votingInstance.startVotingSession({from: owner});
            const findEvent = await votingInstance.setVote(0, {from: voter});
            expectEvent(findEvent, "Voted", {voter: voter, proposalId: new BN(0)});
        });
    });

// Tests of end vote session state Function
    describe("STATE End vote tests", () => {
        beforeEach(async () => {
            votingInstance = await Voting.new({from: owner});
        });

        it("... should revert if the state changer is not the owner", async () => {
            await expectRevert(votingInstance.endVotingSession({from: voter}), 'caller is not the owner');
        });

        it("... should revert if the previous status is different from VotingSessionStarted", async () => {
            await expectRevert(votingInstance.endVotingSession({from: owner}), 'Voting session havent started yet');
        });

        it("... should emit WorkflowStatusChange event when a endVotingSession", async () => {
            await votingInstance.addVoter(voter, {from: owner});
            await votingInstance.startProposalsRegistering({from: owner});
            await votingInstance.endProposalsRegistering({from: owner});
            await votingInstance.startVotingSession({from: owner});
            const findEvent = await votingInstance.endVotingSession({from: owner});
            expectEvent(findEvent, "WorkflowStatusChange", {previousStatus: new BN(3), newStatus: new BN(4)});
        });
    });

// Tests of tallyVotes Function
    describe("TALLY votes tests", () => {

        beforeEach(async () => {
            votingInstance = await Voting.new({from: owner});
        });

        it("... should revert if the state changer is not the owner", async () => {
            await expectRevert(votingInstance.tallyVotes({from: voter}), 'caller is not the owner');
        });


        it("... should tally votes", async () => {
            await votingInstance.addVoter(voter, {from: owner});
            await votingInstance.addVoter(owner, {from: owner});
            await votingInstance.addVoter(accounts[4], {from: owner});
            await votingInstance.addVoter(accounts[5], {from: owner});
            await votingInstance.startProposalsRegistering({from: owner});
            await votingInstance.addProposal("proposal", {from: voter});
            await votingInstance.addProposal("proposal1", {from: accounts[4]});
            await votingInstance.addProposal("proposal2", {from: accounts[5]});
            await votingInstance.endProposalsRegistering({from: owner});
            await votingInstance.startVotingSession({from: owner});
            await votingInstance.setVote(0, {from: voter});
            await votingInstance.setVote(0, {from: owner});
            await votingInstance.setVote(0, {from: accounts[4]});
            await votingInstance.setVote(1, {from: accounts[5]});
            await votingInstance.endVotingSession({from: owner});
            await votingInstance.tallyVotes({from: owner});
            const winnerProposalId = await votingInstance.winningProposalID.call();
            expect(winnerProposalId).to.be.bignumber.equal(new BN(0));
            const storeData = await votingInstance.getOneProposal(winnerProposalId, {from: voter});
            expect(storeData.description).equals("GENESIS");
            expect(storeData.voteCount).to.be.bignumber.equal(new BN(3));

        });

        it("... should emit VotesTallied event", async () => {
            await votingInstance.addVoter(voter, {from: owner});
            await votingInstance.startProposalsRegistering({from: owner});
            await votingInstance.addProposal("proposal", {from: voter});
            await votingInstance.endProposalsRegistering({from: owner});
            await votingInstance.startVotingSession({from: owner});
            await votingInstance.setVote(0, {from: voter});
            await votingInstance.endVotingSession({from: owner});
            const findEvent =  await votingInstance.tallyVotes({from: owner});
            expectEvent(findEvent, "WorkflowStatusChange", {previousStatus: new BN(4), newStatus: new BN(5)});
        });
    });

})
