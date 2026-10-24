# Experiment 8

## Configuring a Cryptocurrency Wallet and integrating it with a DApp

## Aim

To configure the MetaMask wallet with a local blockchain and funded accounts, and to integrate it with a decentralized application (DApp): a web front end that connects to MetaMask, reads a smart contract's state, and sends transactions that the user approves in the wallet.

## Theory

A **cryptocurrency wallet** does not store coins; it stores the private keys that control accounts on the blockchain and uses them to sign transactions. A browser wallet such as MetaMask exposes itself to web pages as an injected provider, `window.ethereum`, which follows the **EIP-1193** standard: the page calls `ethereum.request({method, params})` (for example `eth_requestAccounts` to ask the user to connect, then `eth_sendTransaction`), and the wallet asks the user for approval, signs, and forwards the call to whichever network it is pointed at. The page never sees a private key.

A **DApp** is a front end plus smart contracts instead of a conventional back-end server:

1. **Smart contract (back end)** — `DonationTracker.sol`: `donate(message)` is `payable` and records the donor, amount and message; `withdraw()` is restricted to the owner and sends the collected balance to them; `DonationReceived` and `Withdrawn` events are emitted.
2. **Wallet** — MetaMask holds the user's accounts and signs.
3. **Front end** — `dapp/index.html` uses `ethers.js` (`BrowserProvider`, `Contract`) over `window.ethereum` to read `owner()`, `totalDonated()` and the donation list, and to call `donate()` and `withdraw()`.

**Integration steps:** (1) configure MetaMask with the local network and funded accounts; (2) deploy the contract and publish its address and ABI to the front end (`deployment.json`); (3) the page asks MetaMask to connect (`eth_requestAccounts`) and makes sure the wallet is on the right network (`wallet_switchEthereumChain`); (4) reads go straight to the node, while writes are approved and signed in MetaMask and mined into a block; (5) the page refreshes from on-chain state after each confirmed transaction, and again whenever the user switches account or network in MetaMask.

**Tools used:** Ganache CLI 7.9.2 as the local blockchain (`--server.port 7545 --chain.chainId 5777 --wallet.deterministic`, the same chain as Experiment 7), MetaMask 13.53 with Ganache added as a custom network, Node.js 24, Hardhat 2.29 with `@nomicfoundation/hardhat-toolbox` (bundles `ethers.js` v6) for deploying the contract, Solidity 0.8.24 compiled for the Shanghai fork, and a static HTML page served with `python3 -m http.server`. The contract owner and the donor are two different MetaMask accounts imported from Ganache ("DApp Owner" and "Donor").

## Output

![MetaMask: Ganache added as a custom network](screenshots/exp8_01_mm_add_network.png)
*Step 1: the local Ganache chain is added to MetaMask as a custom network with RPC URL `127.0.0.1:7545`, chain ID 5777 and currency symbol ETH (the same setup as in Experiment 7).*

![MetaMask: accounts imported from Ganache and renamed](screenshots/exp8_02_mm_accounts.png)
*Two more Ganache accounts are imported by private key and renamed "DApp Owner" and "Donor". They sit below the accounts imported for Experiment 7.*

![Terminal: deploying the DApp's contract to Ganache](screenshots/exp8_03_deploy_terminal.png)
*Step 2: `hardhat run` deploys `DonationTracker` to Ganache from the owner account and writes its address and ABI to `dapp/deployment.json` for the front end. Two donations (1.5 ETH and 0.75 ETH) are seeded from the command line so the page has data to show.*

![DApp before the wallet is connected](screenshots/exp8_04_dapp_before_connect.png)
*Step 3: the DApp front end on first load, with the wallet showing "not connected" and no contract data read yet.*

![MetaMask: connection request from the DApp](screenshots/exp8_05_mm_connect_request.png)
*Clicking "Connect Wallet" makes MetaMask ask whether the website (127.0.0.1) may see the two selected accounts and request transactions. The wallet lists what the site can and cannot do ("Cannot move funds without your permission").*

![Wallet connected and contract state read](screenshots/exp8_06_wallet_connected.png)
*After "Connect", the page shows the network (Ganache, chain ID 5777), the connected account (the DApp Owner) and its balance, and reads the contract's owner, 2.25 ETH total and 2 donations from the chain.*

![MetaMask: transaction request for a donation](screenshots/exp8_07_mm_donate_confirm.png)
*Step 4: after switching MetaMask to the "Donor" account, clicking "Donate" produces a MetaMask transaction request: the network (Ganache), the requesting site, the contract being called, and an amount of 2.25 ETH.*

![A donation sent through the wallet](screenshots/exp8_08_donation_sent.png)
*After approval, the donation is mined in block 12 and the page refreshes: the total rises to 4.5 ETH, a third row appears in the on-chain donations table, and the transaction hash is shown in the log. The donor's balance has dropped by the donation plus gas.*

![Non-owner withdraw rejected](screenshots/exp8_09_withdraw_rejected_non_owner.png)
*Step 5: with the Donor account selected, "Withdraw" is rejected by the contract's `require` with "Only owner can withdraw"; no funds move and no transaction is sent.*

![MetaMask: transaction request for the owner's withdrawal](screenshots/exp8_10_mm_withdraw_confirm.png)
*Step 6: after switching MetaMask to the "DApp Owner" account, "Withdraw" shows a transaction request to the same contract.*

![Owner withdraw succeeds](screenshots/exp8_11_owner_withdraw.png)
*Once approved, `withdraw()` is mined in block 13 and the owner's balance rises from 999.9983 to 1004.4982 ETH, which is the 4.5 ETH collected minus gas.*

![MetaMask activity for the owner account](screenshots/exp8_12_mm_activity.png)
*The Activity tab of the owner account lists the contract interaction on the Ganache network.*

*(The deployment log is saved as `deploy_output.log` in this folder; the contract is `contracts/DonationTracker.sol` and the front end is `dapp/index.html`.)*

## Conclusion

This experiment configured MetaMask with a local Ganache blockchain and funded accounts and integrated it with a DApp: a web page that connects to MetaMask's injected EIP-1193 provider, reads a `DonationTracker` contract's live state with `ethers.js`, and sends transactions that are approved in MetaMask and mined into blocks. A donation from the Donor account raised the on-chain total from 2.25 to 4.5 ETH and added a record to the table. The contract's access control was verified from the UI: the Donor's withdrawal was rejected on-chain with the contract's own message, while the owner's withdrawal went through MetaMask and moved the 4.5 ETH to the owner's account. The page follows account and network changes made in the wallet, which is how a real DApp is expected to behave.
