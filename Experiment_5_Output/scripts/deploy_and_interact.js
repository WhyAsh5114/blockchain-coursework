const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [owner, alice] = await ethers.getSigners();

  console.log("=== Accounts (Hardhat local network) ===");
  console.log("Owner:", owner.address);
  console.log("Alice:", alice.address);

  const SolidityBasics = await ethers.getContractFactory("SolidityBasics");
  const basics = await SolidityBasics.connect(owner).deploy("Hello, Blockchain!");
  await basics.waitForDeployment();
  console.log(`\nSolidityBasics deployed at: ${await basics.getAddress()}`);

  // 1. Basic data types
  console.log("\n=== 1. State variables & data types ===");
  console.log("Initial greeting:", await basics.greeting());
  console.log("Initial fixedBytes:", ethers.decodeBytes32String(await basics.fixedBytes()));
  const tx1 = await basics.setNumbers(42, -17);
  await tx1.wait();
  console.log("unsignedNumber =", (await basics.unsignedNumber()).toString());
  console.log("signedNumber   =", (await basics.signedNumber()).toString());

  const tx2 = await basics.toggleFlag();
  await tx2.wait();
  console.log("flag after toggle:", await basics.flag());

  // 2. Modifier-protected function + event
  console.log("\n=== 2. Modifiers, events & access control ===");
  const tx3 = await basics.connect(owner).setGreeting("Hi from the owner!");
  const receipt3 = await tx3.wait();
  const event = receipt3.logs
    .map((log) => {
      try {
        return basics.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((e) => e && e.name === "GreetingChanged");
  console.log(`GreetingChanged event: "${event.args.oldGreeting}" -> "${event.args.newGreeting}"`);

  console.log("Negative test: non-owner (Alice) tries to change the greeting...");
  try {
    await basics.connect(alice).setGreeting("Hijacked!");
    console.log("ERROR: should have reverted but did not");
  } catch (err) {
    console.log(`Reverted as expected: ${err.reason || err.shortMessage || err.message}`);
  }

  // 3. Payable function + mapping
  console.log("\n=== 3. Payable functions & mappings ===");
  const depositTx = await basics.connect(alice).deposit({ value: ethers.parseEther("0.5") });
  await depositTx.wait();
  console.log(`Alice deposited 0.5 ETH (tx ${depositTx.hash})`);
  console.log(`balances[Alice] = ${ethers.formatEther(await basics.balances(alice.address))} ETH`);

  // 4. Structs & arrays via addStudent
  console.log("\n=== 4. Structs, arrays & control structures ===");
  const studentsData = [
    ["Asha", 20, 82],
    ["Ravi", 21, 67],
    ["Meera", 20, 45],
    ["Zoya", 22, 30],
  ];
  for (const [name, age, marks] of studentsData) {
    const tx = await basics.addStudent(name, age, marks);
    await tx.wait();
    console.log(`Added student ${name} (age ${age}, marks ${marks})`);
  }

  const count = await basics.getStudentCount();
  console.log(`Total students: ${count}`);
  console.log(`Average marks: ${await basics.averageMarks()}`);

  for (let i = 0; i < count; i++) {
    const s = await basics.students(i);
    console.log(`Student #${i}: ${s.name}, marks ${s.marks} -> classify() = "${await basics.classify(s.marks)}"`);
  }

  // 5. Pure functions: arithmetic + ternary
  console.log("\n=== 5. Pure functions (arithmetic, ternary) ===");
  console.log(`add(15, 27) = ${await basics.add(15, 27)}`);
  console.log(`isEven(10) = ${await basics.isEven(10)}`);
  console.log(`isEven(7)  = ${await basics.isEven(7)}`);

  // 6. Visibility demo: internal helper reachable only via public wrapper
  console.log("\n=== 6. Function visibility (internal via public wrapper) ===");
  for (let i = 0; i < 3; i++) {
    const tx = await basics.bumpCounter();
    const rcpt = await tx.wait();
    console.log(`bumpCounter() call #${i + 1}, tx ${rcpt.hash.slice(0, 12)}...`);
  }
  console.log("Note: secretCounter itself is private and has no public getter,");
  console.log("      it is only reachable indirectly through bumpCounter().");

  console.log("\n=== Solidity Basics experiment complete ===");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
