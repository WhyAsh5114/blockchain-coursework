#!/bin/bash
# Experiment 10: Hyperledger Fabric test-network + asset-transfer-basic chaincode (steps 6-15 of the manual)
set -x
export PATH=$PWD/fabric-samples/bin:$PATH
export FABRIC_CFG_PATH=$PWD/fabric-samples/config
peer version
cd fabric-samples/test-network
./network.sh down
./network.sh up createChannel
./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-javascript -ccl javascript

export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_TLS_ROOTCERT_FILE=$PWD/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=$PWD/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
ORDERER_CA=$PWD/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
ORG2_TLS=$PWD/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
INVOKE=(peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "$ORDERER_CA" -C mychannel -n basic
  --peerAddresses localhost:7051 --tlsRootCertFiles "$CORE_PEER_TLS_ROOTCERT_FILE" --peerAddresses localhost:9051 --tlsRootCertFiles "$ORG2_TLS")

"${INVOKE[@]}" -c '{"function":"InitLedger","Args":[]}'
sleep 3
peer chaincode query -C mychannel -n basic -c '{"Args":["GetAllAssets"]}'
peer chaincode query -C mychannel -n basic -c '{"Args":["ReadAsset","asset5"]}'
"${INVOKE[@]}" -c '{"function":"CreateAsset","Args":["asset7","green","12","Yash","950"]}'
sleep 3
peer chaincode query -C mychannel -n basic -c '{"Args":["ReadAsset","asset7"]}'
"${INVOKE[@]}" -c '{"function":"TransferAsset","Args":["asset7","Tomoko"]}'
sleep 3
peer chaincode query -C mychannel -n basic -c '{"Args":["ReadAsset","asset7"]}'
peer chaincode query -C mychannel -n basic -c '{"Args":["AssetExists","asset99"]}'
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'
./network.sh down
