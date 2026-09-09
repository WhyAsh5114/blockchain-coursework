// Experiment 7 — Supply-chain smart contracts on a local Hardhat network.
// Deploys FarmerContract -> DistributorContract -> RetailerContract -> CustomerContract,
// wires each stage to the previous one's address, then walks one batch through the
// full Farmer -> Distributor -> Retailer -> Customer lifecycle, printing every
// transaction hash and every on-chain read along the way.

const hre = require("hardhat");

async function main() {
  const [farmer, distributor, retailer, customer] = await hre.ethers.getSigners();

  console.log("=== Accounts (Hardhat local network) ===");
  console.log("Farmer     :", farmer.address);
  console.log("Distributor:", distributor.address);
  console.log("Retailer   :", retailer.address);
  console.log("Customer   :", customer.address);
  console.log();

  console.log("=== Deploying contracts ===");
  const Farmer = await hre.ethers.getContractFactory("FarmerContract", farmer);
  const farmerContract = await Farmer.deploy();
  await farmerContract.waitForDeployment();
  console.log("FarmerContract deployed at     :", await farmerContract.getAddress());

  const Distributor = await hre.ethers.getContractFactory("DistributorContract", distributor);
  const distributorContract = await Distributor.deploy(await farmerContract.getAddress());
  await distributorContract.waitForDeployment();
  console.log("DistributorContract deployed at:", await distributorContract.getAddress());

  const Retailer = await hre.ethers.getContractFactory("RetailerContract", retailer);
  const retailerContract = await Retailer.deploy(await distributorContract.getAddress());
  await retailerContract.waitForDeployment();
  console.log("RetailerContract deployed at   :", await retailerContract.getAddress());

  const Customer = await hre.ethers.getContractFactory("CustomerContract", customer);
  const customerContract = await Customer.deploy(await retailerContract.getAddress());
  await customerContract.waitForDeployment();
  console.log("CustomerContract deployed at   :", await customerContract.getAddress());
  console.log();

  const batchID = 1;
  const cropName = "Alphonso Mango";
  const quantity = 500; // kg

  console.log(`=== Stage 1: Farmer creates batch #${batchID} (${cropName}, ${quantity}kg) ===`);
  let tx = await farmerContract.connect(farmer).addBatch(batchID, cropName, quantity);
  let receipt = await tx.wait();
  console.log("addBatch tx hash:", receipt.hash);
  let batch = await farmerContract.getBatch(batchID);
  console.log("FarmerContract.getBatch ->", {
    batchID: batch[0].toString(),
    cropName: batch[1],
    quantity: batch[2].toString(),
    timestamp: batch[3].toString(),
    farmer: batch[4],
  });
  console.log();

  console.log("=== Stage 2: Distributor receives the batch ===");
  tx = await distributorContract.connect(distributor).receiveBatch(batchID);
  receipt = await tx.wait();
  console.log("receiveBatch tx hash:", receipt.hash);
  let received = await distributorContract.getReceivedBatch(batchID);
  console.log("DistributorContract.getReceivedBatch ->", {
    batchID: received[0].toString(),
    cropName: received[1],
    quantity: received[2].toString(),
    timestamp: received[3].toString(),
    farmer: received[4],
    distributor: received[5],
  });
  console.log();

  console.log("=== Stage 3: Retailer receives the batch from the distributor ===");
  tx = await retailerContract.connect(retailer).receiveFromDistributor(batchID);
  receipt = await tx.wait();
  console.log("receiveFromDistributor tx hash:", receipt.hash);
  let retailBatch = await retailerContract.getRetailBatch(batchID);
  console.log("RetailerContract.getRetailBatch ->", {
    batchID: retailBatch[0].toString(),
    cropName: retailBatch[1],
    quantity: retailBatch[2].toString(),
    timestamp: retailBatch[3].toString(),
    farmer: retailBatch[4],
    distributor: retailBatch[5],
    retailer: retailBatch[6],
  });
  console.log();

  console.log("=== Stage 4: Customer purchases the batch from the retailer ===");
  tx = await customerContract.connect(customer).purchaseFromRetailer(batchID);
  receipt = await tx.wait();
  console.log("purchaseFromRetailer tx hash:", receipt.hash);
  let purchased = await customerContract.getPurchasedBatch(batchID);
  console.log("CustomerContract.getPurchasedBatch ->", {
    batchID: purchased[0].toString(),
    cropName: purchased[1],
    quantity: purchased[2].toString(),
    timestamp: purchased[3].toString(),
    farmer: purchased[4],
    distributor: purchased[5],
    retailer: purchased[6],
    customer: purchased[7],
  });
  console.log();

  console.log("=== Negative test: re-purchasing the same batch must revert ===");
  try {
    await customerContract.connect(customer).purchaseFromRetailer(batchID);
    console.log("ERROR: expected a revert but the call succeeded!");
  } catch (err) {
    console.log("Reverted as expected:", err.shortMessage || err.message);
  }

  console.log("\n=== Full supply chain trace for batch", batchID, "complete ===");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
