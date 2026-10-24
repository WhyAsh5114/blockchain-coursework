# Experiment 10

## Implementation of Hyperledger Fabric Network and Asset Management using Chaincode

## Aim

To implement a Hyperledger Fabric network, deploy chaincode, and perform asset creation, querying, and transfer operations.

## Theory

**Hyperledger Fabric** is a permissioned, enterprise blockchain framework: every participant has an identity issued by a certificate authority and belongs to an organization, unlike public chains where anyone can join. Its main components are:

- **Peers** — hold a copy of the ledger and execute chaincode to endorse transactions. The test network has `peer0.org1.example.com` (Org1MSP) and `peer0.org2.example.com` (Org2MSP).
- **Orderer** — orders endorsed transactions into blocks (`orderer.example.com`); it does not execute chaincode.
- **Channel** — a private ledger shared by chosen organizations; here `mychannel`.
- **Chaincode (smart contract)** — business logic installed on peers; here the `asset-transfer-basic` JavaScript chaincode, which manages assets with the fields ID, Color, Size, Owner and AppraisedValue.
- **Membership Service Provider (MSP)** and **TLS certificates** — identities and secured communication; the `CORE_PEER_*` variables select which identity the `peer` CLI acts as.

Fabric transactions follow *execute-order-validate*: a client sends a proposal to endorsing peers, which simulate it and sign the result; the client submits the endorsed transaction to the orderer, which puts it in a block; peers then validate and commit it. This is why `peer chaincode invoke` must name the orderer and the endorsing peers of **both** organizations (the chaincode's endorsement policy), whereas `peer chaincode query` is read-only and only talks to the local peer.

**Tools used:** Hyperledger Fabric 2.5.16 binaries and Docker images, `fabric-samples` `test-network` (2 peer organizations, 1 orderer, channel `mychannel`), the `asset-transfer-basic` JavaScript chaincode, Docker (OrbStack) on macOS. The manual's Windows Subsystem for Linux + Ubuntu environment was not used; the same commands were run natively on macOS through `run_fabric.sh`, with the elided `peer chaincode invoke ...` flags written out in full.

## Output

![Terminal: peer version](screenshots/exp10_01_peer_version.png)
*The Fabric CLI is on the `PATH` with `FABRIC_CFG_PATH` set (manual step 6); `peer version` reports v2.5.16 on darwin/arm64.*

![Terminal: tail of ./network.sh up createChannel](screenshots/exp10_02_network_up_tail.png)
*Step 7: `./network.sh up createChannel` generates the certificates, starts the containers, creates `mychannel`, joins both peers and sets the anchor peers. The last lines of its output are shown: "Anchor peer set for org 'Org2MSP'" and "Channel 'mychannel' joined".*

![Terminal: Fabric containers running](screenshots/exp10_03_containers_running.png)
*`docker ps` shows the two peers (`peer0.org1`, `peer0.org2`) and the orderer running.*

![Terminal: tail of ./network.sh deployCC](screenshots/exp10_04_deploy_chaincode_tail.png)
*Step 8: `./network.sh deployCC` packages, installs, approves and commits the `basic` chaincode. Both organizations show `true` in the commit-readiness check, and "Committed chaincode definition for chaincode 'basic' on channel 'mychannel'" confirms Version 1.0, Sequence 1, Approvals [Org1MSP: true, Org2MSP: true].*

![Terminal: environment variables selecting the Org1 admin identity](screenshots/exp10_05_peer_env.png)
*The `CORE_PEER_*` variables make the `peer` CLI act as the Org1 admin against `peer0.org1` with TLS enabled.*

![Terminal: InitLedger invoke, GetAllAssets and ReadAsset](screenshots/exp10_06_initledger_query.png)
*Steps 10 to 12: the `InitLedger` invoke (naming the orderer and the endorsing peers of both organizations) returns "Chaincode invoke successful. result: status:200". `GetAllAssets` lists the six sample assets and `ReadAsset` returns `asset5`.*

![Terminal: creating asset7 owned by Yash](screenshots/exp10_07_create_asset.png)
*Step 13: `CreateAsset` adds `asset7` (green, size 12, owner Yash, value 950), and a `ReadAsset` query confirms it is on the ledger.*

![Terminal: transferring asset7 to Tomoko](screenshots/exp10_08_transfer_asset.png)
*Step 14: `TransferAsset` returns the previous owner ("Yash"). `ReadAsset` then shows the owner is Tomoko, and `AssetExists` for a non-existent ID returns `false`.*

![Terminal: ./network.sh down](screenshots/exp10_09_network_down.png)
*Step 15: before shutdown, `docker ps` lists the peers, the orderer and the two chaincode containers. `./network.sh down` removes them, along with the volumes and the generated chaincode images, and a final `docker ps` shows no Fabric containers left.*

*(The run log for an earlier pass of the same commands is saved as `fabric_run_clean.log`, produced by `run_fabric.sh`, both in this folder.)*

## Conclusion

This experiment implemented a Hyperledger Fabric network (two peer organizations, one orderer and a channel, `mychannel`) and deployed the `asset-transfer-basic` chaincode with both organizations approving the definition. Asset management was demonstrated end to end: the ledger was initialized with six assets, queried (all assets and one by ID), a new asset `asset7` was created with owner Yash, and ownership was then transferred to Tomoko, with a read-back after each transaction confirming the committed state. Read operations (`query`) worked directly against one peer, while writes (`invoke`) had to be endorsed by both organizations and ordered into a block, illustrating Fabric's execute-order-validate model and the difference from the public, Proof-of-Work chains of the earlier experiments. The run was done natively on macOS rather than in WSL/Ubuntu as the manual assumes, and used the standard sample asset case study with the asset owned by the author, not a separately designed case.
