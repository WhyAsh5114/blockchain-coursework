const hre = require("hardhat");
const { ethers, network } = hre;

function eth(v) {
  return ethers.formatEther(v);
}

async function main() {
  const [owner, alice, bob, carol, dave] = await ethers.getSigners();

  console.log("=== Accounts (Hardhat local network) ===");
  console.log("Owner:", owner.address);
  console.log("Alice:", alice.address);
  console.log("Bob  :", bob.address);
  console.log("Carol:", carol.address);
  console.log("Dave :", dave.address);

  const Crowdfunding = await ethers.getContractFactory("Crowdfunding");

  // ---------------------------------------------------------------------
  // Scenario A: goal is reached -> owner withdraws
  // ---------------------------------------------------------------------
  console.log("\n=== Scenario A: Campaign that reaches its goal ===");
  const goalA = ethers.parseEther("3");
  const durationA = 60; // seconds
  const campaignA = await Crowdfunding.connect(owner).deploy(goalA, durationA);
  await campaignA.waitForDeployment();
  console.log(`Campaign A deployed at: ${await campaignA.getAddress()}`);
  console.log(`Goal: ${eth(goalA)} ETH, duration: ${durationA}s`);

  const pledgesA = [
    [alice, "1.0"],
    [bob, "1.0"],
    [carol, "1.5"],
  ];
  for (const [signer, amount] of pledgesA) {
    const tx = await campaignA.connect(signer).contribute({ value: ethers.parseEther(amount) });
    await tx.wait();
    console.log(`${signer.address} contributed ${amount} ETH (tx ${tx.hash})`);
  }

  console.log(`Total raised: ${eth(await campaignA.totalRaised())} ETH`);
  console.log(`Goal reached before deadline? ${await campaignA.goalReached()}`);

  console.log(`Fast-forwarding chain past the deadline (+${durationA + 5}s)...`);
  await network.provider.send("evm_increaseTime", [durationA + 5]);
  await network.provider.send("evm_mine");

  const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
  const withdrawTx = await campaignA.connect(owner).withdraw();
  const withdrawReceipt = await withdrawTx.wait();
  const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
  console.log(`Owner withdraw tx hash: ${withdrawTx.hash}`);
  console.log(
    `Owner balance change: +${eth(ownerBalanceAfter - ownerBalanceBefore + withdrawReceipt.fee)} ETH (gross, before gas)`
  );
  console.log(`Contract balance after withdraw: ${eth(await ethers.provider.getBalance(await campaignA.getAddress()))} ETH`);

  console.log("Negative test: owner tries to withdraw a second time...");
  try {
    await campaignA.connect(owner).withdraw();
    console.log("ERROR: second withdraw should have reverted but did not");
  } catch (err) {
    console.log(`Reverted as expected: ${err.reason || err.shortMessage || err.message}`);
  }

  // ---------------------------------------------------------------------
  // Scenario B: goal is NOT reached -> contributors get refunded
  // ---------------------------------------------------------------------
  console.log("\n=== Scenario B: Campaign that misses its goal ===");
  const goalB = ethers.parseEther("10");
  const durationB = 60;
  const campaignB = await Crowdfunding.connect(owner).deploy(goalB, durationB);
  await campaignB.waitForDeployment();
  console.log(`Campaign B deployed at: ${await campaignB.getAddress()}`);
  console.log(`Goal: ${eth(goalB)} ETH, duration: ${durationB}s`);

  const daveTx = await campaignB.connect(dave).contribute({ value: ethers.parseEther("2") });
  await daveTx.wait();
  console.log(`${dave.address} contributed 2 ETH (tx ${daveTx.hash})`);
  console.log(`Total raised: ${eth(await campaignB.totalRaised())} ETH (goal ${eth(goalB)} ETH)`);

  console.log(`Fast-forwarding chain past the deadline (+${durationB + 5}s)...`);
  await network.provider.send("evm_increaseTime", [durationB + 5]);
  await network.provider.send("evm_mine");

  console.log("Negative test: owner tries to withdraw an unmet goal...");
  try {
    await campaignB.connect(owner).withdraw();
    console.log("ERROR: withdraw should have reverted but did not");
  } catch (err) {
    console.log(`Reverted as expected: ${err.reason || err.shortMessage || err.message}`);
  }

  const daveBalanceBefore = await ethers.provider.getBalance(dave.address);
  const refundTx = await campaignB.connect(dave).refund();
  const refundReceipt = await refundTx.wait();
  const daveBalanceAfter = await ethers.provider.getBalance(dave.address);
  console.log(`Dave refund tx hash: ${refundTx.hash}`);
  console.log(
    `Dave balance change: +${eth(daveBalanceAfter - daveBalanceBefore + refundReceipt.fee)} ETH (gross, before gas)`
  );
  console.log(`Contract balance after refund: ${eth(await ethers.provider.getBalance(await campaignB.getAddress()))} ETH`);

  console.log("Negative test: Dave tries to refund a second time...");
  try {
    await campaignB.connect(dave).refund();
    console.log("ERROR: second refund should have reverted but did not");
  } catch (err) {
    console.log(`Reverted as expected: ${err.reason || err.shortMessage || err.message}`);
  }

  console.log("\n=== Crowdfunding experiment complete ===");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
