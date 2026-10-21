const hre = require("hardhat");
const fs = require("fs");
const { ethers } = hre;

async function main() {
  const [owner, alice, bob] = await ethers.getSigners();
  console.log("=== Accounts (Hardhat local network, used as the 'wallet' accounts) ===");
  console.log("Owner:", owner.address);
  console.log("Alice:", alice.address);
  console.log("Bob  :", bob.address);

  console.log("\n=== 1. Deploy DonationTracker (the DApp's back end) ===");
  const F = await ethers.getContractFactory("DonationTracker");
  const c = await F.connect(owner).deploy();
  await c.waitForDeployment();
  const address = await c.getAddress();
  console.log("DonationTracker deployed at:", address);

  // The front end (dapp/index.html) reads its contract address + ABI from here
  fs.writeFileSync(
    "dapp/deployment.json",
    JSON.stringify({ address, abi: JSON.parse(c.interface.formatJson()) }, null, 2)
  );
  console.log("Wrote dapp/deployment.json (address + ABI for the front end)");

  console.log("\n=== 2. Seed two donations from the command line (before the browser is opened) ===");
  await (await c.connect(alice).donate("Good luck with the project!", { value: ethers.parseEther("1.5") })).wait();
  await (await c.connect(bob).donate("For the library fund", { value: ethers.parseEther("0.75") })).wait();
  console.log("totalDonated:", ethers.formatEther(await c.totalDonated()), "ETH");
  console.log("donationCount:", (await c.donationCount()).toString());
}

main().catch((e) => { console.error(e); process.exit(1); });
