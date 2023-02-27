const Voting = artifacts.require("Voting");

module.exports = async (deployer, accounts) => {
    await deployer.deploy(Voting);
    let instance = await Voting.deployed();
    console.log(await instance);
};