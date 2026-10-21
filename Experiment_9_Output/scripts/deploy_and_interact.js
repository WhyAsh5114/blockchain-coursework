const hre = require("hardhat");
const { ethers } = hre;

const fmt = (v) => ethers.formatUnits(v, 18);

async function expectRevert(label, promise) {
  try {
    await (await promise).wait();
    console.log(`${label}: UNEXPECTEDLY SUCCEEDED`);
  } catch (e) {
    const m = /reverted with (?:reason string|custom error) '?([^'\n]*)'?/.exec(e.message);
    console.log(`${label}: reverted as expected -> ${m ? m[1] : e.message.split("\n")[0]}`);
  }
}

function events(token, receipt) {
  return receipt.logs
    .map((l) => { try { return token.interface.parseLog(l); } catch { return null; } })
    .filter(Boolean);
}

async function main() {
  const [owner, alice, bob] = await ethers.getSigners();
  const who = { [owner.address]: "Owner", [alice.address]: "Alice", [bob.address]: "Bob" };

  console.log("=== Accounts (Hardhat local network) ===");
  for (const [a, n] of Object.entries(who)) console.log(`${n.padEnd(6)}: ${a}`);

  console.log("\n=== 1. Deploy the ERC-20 token ===");
  const Token = await ethers.getContractFactory("VESToken");
  const token = await Token.connect(owner).deploy(1000);
  await token.waitForDeployment();
  console.log("VESToken deployed at:", await token.getAddress());
  console.log("name()        :", await token.name());
  console.log("symbol()      :", await token.symbol());
  console.log("decimals()    :", (await token.decimals()).toString());
  console.log("totalSupply() :", fmt(await token.totalSupply()), "VEST");
  console.log("balanceOf(Owner):", fmt(await token.balanceOf(owner.address)), "VEST");

  console.log("\n=== 2. transfer(): Owner -> Alice 100 VEST ===");
  let tx = await token.connect(owner).transfer(alice.address, ethers.parseUnits("100", 18));
  let rc = await tx.wait();
  const t = events(token, rc)[0];
  console.log(`Transfer event: from ${who[t.args.from]} to ${who[t.args.to]} value ${fmt(t.args.value)} VEST`);
  console.log("balanceOf(Owner):", fmt(await token.balanceOf(owner.address)));
  console.log("balanceOf(Alice):", fmt(await token.balanceOf(alice.address)));

  console.log("\n=== 3. approve() + transferFrom(): Alice lets Bob spend 40 VEST ===");
  tx = await token.connect(alice).approve(bob.address, ethers.parseUnits("40", 18));
  rc = await tx.wait();
  const a = events(token, rc)[0];
  console.log(`Approval event: owner ${who[a.args.owner]} spender ${who[a.args.spender]} value ${fmt(a.args.value)} VEST`);
  console.log("allowance(Alice, Bob):", fmt(await token.allowance(alice.address, bob.address)));
  tx = await token.connect(bob).transferFrom(alice.address, bob.address, ethers.parseUnits("25", 18));
  await tx.wait();
  console.log("Bob calls transferFrom(Alice, Bob, 25)");
  console.log("balanceOf(Alice):", fmt(await token.balanceOf(alice.address)));
  console.log("balanceOf(Bob)  :", fmt(await token.balanceOf(bob.address)));
  console.log("allowance(Alice, Bob) now:", fmt(await token.allowance(alice.address, bob.address)));
  await expectRevert("Bob tries to spend 20 more than the remaining 15 allowance",
    token.connect(bob).transferFrom(alice.address, bob.address, ethers.parseUnits("20", 18)));

  console.log("\n=== 4. Mintable: owner mints 500 VEST to Bob ===");
  await (await token.connect(owner).mint(bob.address, ethers.parseUnits("500", 18))).wait();
  console.log("totalSupply():", fmt(await token.totalSupply()));
  console.log("balanceOf(Bob):", fmt(await token.balanceOf(bob.address)));
  await expectRevert("Alice (non-owner) tries to mint", token.connect(alice).mint(alice.address, 1n));

  console.log("\n=== 5. Burnable: Bob burns 100 VEST ===");
  await (await token.connect(bob).burn(ethers.parseUnits("100", 18))).wait();
  console.log("totalSupply():", fmt(await token.totalSupply()));
  console.log("balanceOf(Bob):", fmt(await token.balanceOf(bob.address)));

  console.log("\n=== 6. Pausable: owner pauses all transfers ===");
  await (await token.connect(owner).pause()).wait();
  console.log("paused():", await token.paused());
  await expectRevert("Alice tries to transfer while paused", token.connect(alice).transfer(bob.address, 1n));
  await (await token.connect(owner).unpause()).wait();
  console.log("paused() after unpause():", await token.paused());
  await (await token.connect(alice).transfer(bob.address, ethers.parseUnits("5", 18))).wait();
  console.log("Alice -> Bob 5 VEST succeeds after unpause; balanceOf(Alice):", fmt(await token.balanceOf(alice.address)));

  console.log("\n=== 7. Final balances ===");
  for (const s of [owner, alice, bob]) console.log(`${who[s.address].padEnd(6)}: ${fmt(await token.balanceOf(s.address))} VEST`);
  console.log("totalSupply():", fmt(await token.totalSupply()), "VEST");
}

main().catch((e) => { console.error(e); process.exit(1); });
