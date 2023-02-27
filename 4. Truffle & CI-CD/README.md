# Voting Test Helpers

## Overview
the file VotingTest contains all test for different tests cases of voting system.

### Dependencies Installation

to install different dependencies:


### Truffle

```bash
npm install
```

Using truffle : 

```bash
truffle migrate
```

To launch tests : 

```bash
truffle test
```

Tests are organized by timeline executions 
1. test of getters and modifiers.
2. test of different functions : addVoter, addProposal, setVote, tallyVotes
3. test of different states : startProposalsRegistering , endProposalsRegistering , startVotingSession, endVotingSession
4. a beforeEach hook is made for each tests groups.