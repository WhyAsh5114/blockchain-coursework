// Run: node --env-file=../.env --env-file=<donor.env> scripts/sepolia_token.js
// SEPOLIA_PRIVATE_KEY = funded owner account, DONOR_PRIVATE_KEY = second account (holder / spender).
const { ethers } = require("ethers");
const artifact = require("../artifacts/contracts/VESToken.sol/VESToken.json");

const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
const owner = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY, provider);
const donor = new ethers.Wallet(process.env.DONOR_PRIVATE_KEY, provider);
const tok = (v) => ethers.formatUnits(v, 18);
const log = {};

async function send(label, txPromise) {
  const rc = await (await txPromise).wait();
  log[label] = rc.hash;
  console.log(`${label.padEnd(22)} ${rc.hash}  block ${rc.blockNumber}`);
}
async function show(t, label) {
  console.log(`${label}: owner ${tok(await t.balanceOf(owner.address))} | donor ${tok(await t.balanceOf(donor.address))} | supply ${tok(await t.totalSupply())} VEST`);
}

async function main() {
  console.log("Network:", (await provider.getNetwork()).name, "Owner:", owner.address, "Donor:", donor.address);
  const f = new ethers.ContractFactory(artifact.abi, artifact.bytecode, owner);
  const t = await f.deploy(1000);
  const rc = await t.deploymentTransaction().wait();
  log.deploy = rc.hash; log.address = await t.getAddress();
  console.log("deploy                 ", log.address, " tx", rc.hash);
  console.log("name/symbol/decimals   ", await t.name(), await t.symbol(), await t.decimals());
  await show(t, "after deploy");

  await send("transfer_250", t.transfer(donor.address, ethers.parseUnits("250", 18)));
  await show(t, "after transfer");
  await send("approve_100", t.approve(donor.address, ethers.parseUnits("100", 18)));
  console.log("allowance(owner,donor) ", tok(await t.allowance(owner.address, donor.address)));
  await send("transferFrom_40", t.connect(donor).transferFrom(owner.address, donor.address, ethers.parseUnits("40", 18)));
  await send("mint_500", t.mint(owner.address, ethers.parseUnits("500", 18)));
  await send("burn_100", t.burn(ethers.parseUnits("100", 18)));
  await show(t, "after mint+burn");
  await send("pause", t.pause());
  try { await t.connect(donor).transfer.staticCall(owner.address, 1n); } catch (e) { console.log("transfer while paused ->", e.revert ? e.revert.name : e.shortMessage); }
  await send("unpause", t.unpause());
  await send("transfer_after", t.connect(donor).transfer(owner.address, ethers.parseUnits("10", 18)));
  await show(t, "final");
  console.log(JSON.stringify(log, null, 2));
}
main().catch((e) => { console.error(e); process.exit(1); });
