// Run: node --env-file=../.env --env-file=<donor.env> scripts/sepolia_crowdfunding.js
// SEPOLIA_PRIVATE_KEY = funded owner account, DONOR_PRIVATE_KEY = second account (contributor).
const { ethers } = require("ethers");
const artifact = require("../artifacts/contracts/Crowdfunding.sol/Crowdfunding.json");

const RPC = "https://ethereum-sepolia-rpc.publicnode.com";
const provider = new ethers.JsonRpcProvider(RPC);
const owner = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY, provider);
const donor = new ethers.Wallet(process.env.DONOR_PRIVATE_KEY, provider);
const eth = (v) => ethers.formatEther(v);
const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));
const log = {};

async function send(label, txPromise) {
  const tx = await txPromise;
  const rc = await tx.wait();
  log[label] = rc.hash;
  console.log(`${label.padEnd(28)} ${rc.hash}  block ${rc.blockNumber}`);
  return rc;
}

async function deploy(label, goalEth, seconds) {
  const f = new ethers.ContractFactory(artifact.abi, artifact.bytecode, owner);
  const c = await f.deploy(ethers.parseEther(goalEth), seconds);
  const rc = await c.deploymentTransaction().wait();
  log[label] = rc.hash;
  const addr = await c.getAddress();
  log[label + "_address"] = addr;
  console.log(`${label.padEnd(28)} ${addr}  (goal ${goalEth} ETH, ${seconds}s)  tx ${rc.hash}`);
  return c;
}

async function main() {
  console.log("Network :", (await provider.getNetwork()).name, (await provider.getNetwork()).chainId);
  console.log("Owner   :", owner.address, eth(await provider.getBalance(owner.address)), "ETH");
  console.log("Donor   :", donor.address, eth(await provider.getBalance(donor.address)), "ETH");

  // 1. transfer between accounts: fund the donor
  await send("fund_donor", owner.sendTransaction({ to: donor.address, value: ethers.parseEther("0.02") }));

  // 2. two campaigns
  const A = await deploy("deploy_A", "0.003", 150); // goal reachable
  const B = await deploy("deploy_B", "1", 120); // goal unreachable
  log.deadlines = { A: Number(await A.deadline()), B: Number(await B.deadline()) };

  // 3. contributions
  await send("A_donor_contribute", A.connect(donor).contribute({ value: ethers.parseEther("0.002") }));
  await send("A_owner_contribute", A.connect(owner).contribute({ value: ethers.parseEther("0.002") }));
  await send("B_donor_contribute", B.connect(donor).contribute({ value: ethers.parseEther("0.001") }));
  console.log("A totalRaised:", eth(await A.totalRaised()), "goalReached:", await A.goalReached());
  console.log("B totalRaised:", eth(await B.totalRaised()), "goalReached:", await B.goalReached());

  // 4. negative test while the campaign is still active
  try { await A.connect(owner).withdraw.staticCall(); } catch (e) { console.log("withdraw before deadline ->", e.reason || e.shortMessage); }

  // 5. wait for deadline of A, then withdraw
  const waitFor = async (c) => {
    const left = Number(await c.timeLeft());
    if (left > 0) { console.log(`waiting ${left + 15}s ...`); await sleep(left + 15); }
  };
  await waitFor(B);
  try { await B.connect(owner).withdraw.staticCall(); } catch (e) { console.log("B withdraw (goal missed) ->", e.reason || e.shortMessage); }
  await send("B_donor_refund", B.connect(donor).refund());
  console.log("B donor contribution after refund:", eth(await B.contributions(donor.address)));

  await waitFor(A);
  const before = await provider.getBalance(owner.address);
  await send("A_owner_withdraw", A.connect(owner).withdraw());
  console.log("A contract balance after withdraw:", eth(await provider.getBalance(await A.getAddress())));
  console.log("A withdrawn flag:", await A.withdrawn());
  console.log(JSON.stringify(log, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
