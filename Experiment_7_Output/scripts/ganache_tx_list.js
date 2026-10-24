// Lists every block/transaction on the local Ganache chain (what the Ganache UI's Transactions tab shows).
const { JsonRpcProvider, formatEther } = require("ethers");

const names = {
  "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1": "Farmer",
  "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0": "Distributor",
  "0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b": "Retailer",
  "0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d": "Customer",
};
const label = (a) => (a ? (names[a] || a.slice(0, 10) + "...") : "(contract creation)");

(async () => {
  const p = new JsonRpcProvider("http://127.0.0.1:7545");
  const net = await p.getNetwork();
  const head = await p.getBlockNumber();
  console.log(`Ganache  chainId=${net.chainId}  latest block=${head}\n`);
  console.log("BLOCK  TX HASH        FROM         TO                   GAS USED  STATUS");
  for (let n = 1; n <= head; n++) {
    const b = await p.getBlock(n, true);
    for (const tx of b.prefetchedTransactions) {
      const r = await p.getTransactionReceipt(tx.hash);
      const to = r.contractAddress ? `new ${r.contractAddress.slice(0, 8)}...` : label(tx.to);
      console.log(`${String(n).padEnd(6)} ${tx.hash.slice(0, 12)}...  ${label(tx.from).padEnd(12)} ${to.padEnd(20)} ${String(r.gasUsed).padEnd(9)} ${r.status === 1 ? "success" : "failed"}`);
    }
  }
  console.log("\nBALANCES");
  for (const [a, nm] of Object.entries(names)) console.log(`${nm.padEnd(12)} ${a}  ${formatEther(await p.getBalance(a))} ETH`);
})();
