// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

interface IFarmerContract {
    function getBatch(uint256 _batchID) external view returns (
        uint256,
        string memory,
        uint256,
        uint256,
        address
    );
}

contract DistributorContract {
    struct ReceivedBatch {
        uint256 batchID;
        string cropName;
        uint256 quantity;
        uint256 timestamp;
        address farmer;
        address distributor;
    }
    mapping(uint256 => ReceivedBatch) public receivedBatches;
    IFarmerContract public farmerContract;
    event BatchReceived(
        uint256 batchID,
        string cropName,
        uint256 quantity,
        address farmer,
        address distributor,
        uint256 timestamp
    );
    constructor(address _farmerContractAddress) {
        farmerContract = IFarmerContract(_farmerContractAddress);
    }
    function receiveBatch(uint256 _batchID) public {
        (
            uint256 id,
            string memory cropName,
            uint256 quantity,
            , // ignore farmer timestamp
            address farmer
        ) = farmerContract.getBatch(_batchID);
        require(id != 0, "Batch does not exist in FarmerContract");
        require(receivedBatches[_batchID].batchID == 0, "Batch already received!");
        receivedBatches[_batchID] = ReceivedBatch({
            batchID: id,
            cropName: cropName,
            quantity: quantity,
            timestamp: block.timestamp,
            farmer: farmer,
            distributor: msg.sender
        });
        emit BatchReceived(id, cropName, quantity, farmer, msg.sender, block.timestamp);
    }
    function getReceivedBatch(uint256 _batchID) public view returns (
        uint256,
        string memory,
        uint256,
        uint256,
        address,
        address
    ) {
        ReceivedBatch memory rb = receivedBatches[_batchID];
        require(rb.batchID != 0, "Batch not received!");
        return (
            rb.batchID,
            rb.cropName,
            rb.quantity,
            rb.timestamp,
            rb.farmer,
            rb.distributor
        );
    }
}
