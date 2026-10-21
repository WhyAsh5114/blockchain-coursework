# Experiment 10

## Inference

Queries returned the initialized assets and the newly created asset, and read-back after transfer showed its owner changing from Yash to Tomoko. This confirms the writes were committed to the channel ledger; the two-organization chaincode approvals and endorsement requirements illustrate Fabric's permissioned transaction flow.

## Conclusion

The Fabric test network and asset-transfer chaincode successfully supported asset creation, lookup, and ownership transfer. The experiment demonstrated ledger updates on a permissioned channel, with transactions endorsed by both participating organizations.
