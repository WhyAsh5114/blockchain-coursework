const hre = require("hardhat");
const { ethers } = hre;

async function expectRevert(label, promise) {
  try {
    await (await promise).wait();
    console.log(`${label}: UNEXPECTEDLY SUCCEEDED`);
  } catch (e) {
    const m = /reverted with reason string '([^']*)'/.exec(e.message);
    console.log(`${label}: reverted as expected -> '${m ? m[1] : e.message}'`);
  }
}

async function main() {
  const [chair, alice, bob, carol, dave] = await ethers.getSigners();
  const names = { [chair.address]: "Chairperson", [alice.address]: "Alice", [bob.address]: "Bob", [carol.address]: "Carol", [dave.address]: "Dave" };

  console.log("=== Accounts (Hardhat local network) ===");
  for (const [a, n] of Object.entries(names)) console.log(`${n.padEnd(12)}: ${a}`);

  console.log("\n=== 1. Deploy Ballot with STRING proposal names (no bytes32 conversion needed) ===");
  const proposalNames = ["Proposal A: Library Upgrade", "Proposal B: Sports Complex", "Proposal C: Cafeteria Renovation"];
  const Ballot = await ethers.getContractFactory("Ballot");
  const ballot = await Ballot.connect(chair).deploy(proposalNames);
  await ballot.waitForDeployment();
  console.log("Ballot deployed at:", await ballot.getAddress());
  console.log("chairperson():", await ballot.chairperson());
  for (let i = 0; i < proposalNames.length; i++) {
    const p = await ballot.proposals(i);
    console.log(`proposals(${i}) -> name: "${p.name}", voteCount: ${p.voteCount}`);
  }

  console.log("\n=== 2. Chairperson gives right to vote ===");
  for (const v of [alice, bob, carol]) {
    const tx = await ballot.connect(chair).giveRightToVote(v.address);
    await tx.wait();
    console.log(`giveRightToVote(${names[v.address]}) tx ${tx.hash}`);
  }
  console.log("voters(Alice).weight =", (await ballot.voters(alice.address)).weight.toString());
  console.log("voters(Dave).weight  =", (await ballot.voters(dave.address)).weight.toString(), "(never given the right)");

  console.log("\n=== 3. Delegation: Carol delegates her vote to Bob (Bob's weight becomes 2) ===");
  await (await ballot.connect(carol).delegate(bob.address)).wait();
  console.log("voters(Bob).weight =", (await ballot.voters(bob.address)).weight.toString());
  console.log("voters(Carol).voted =", (await ballot.voters(carol.address)).voted);

  console.log("\n=== 4. Voting ===");
  await (await ballot.connect(alice).vote(0)).wait();
  console.log("Alice voted for proposal 0");
  await (await ballot.connect(bob).vote(1)).wait();
  console.log("Bob voted for proposal 1 (carrying Carol's delegated vote, weight 2)");
  await (await ballot.connect(chair).vote(1)).wait();
  console.log("Chairperson voted for proposal 1");
  for (let i = 0; i < proposalNames.length; i++) {
    const p = await ballot.proposals(i);
    console.log(`proposals(${i}) "${p.name}" -> voteCount ${p.voteCount}`);
  }

  console.log("\n=== 5. Winner ===");
  console.log("winningProposal() =", (await ballot.winningProposal()).toString());
  console.log('winnerName()      =', `"${await ballot.winnerName()}"`);

  console.log("\n=== 6. Negative tests: require() statements revert and roll back state ===");
  await expectRevert("Alice votes a second time", ballot.connect(alice).vote(2));
  await expectRevert("Dave (no right) votes", ballot.connect(dave).vote(0));
  await expectRevert("Non-chairperson (Alice) gives right to vote", ballot.connect(alice).giveRightToVote(dave.address));
  await expectRevert("Carol delegates again after delegating", ballot.connect(carol).delegate(alice.address));
  console.log("proposal 2 voteCount still:", (await ballot.proposals(2)).voteCount.toString(), "(failed txs changed nothing)");
}

main().catch((e) => { console.error(e); process.exit(1); });
