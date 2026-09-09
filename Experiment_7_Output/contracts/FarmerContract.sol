// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

contract FarmerContract {
    struct Batch {
        uint256 batchID;
        string cropName;
        uint256 quantity;
        uint256 timestamp;
        address farmer;
    }
    mapping(uint256 => Batch) public batches;
    event BatchCreated(
        uint256 batchID,
        string cropName,
        uint256 quantity,
        uint256 timestamp,
        address farmer
    );
    function addBatch(uint256 _batchID, string memory _cropName, uint256 _quantity) public {
        require(_batchID != 0, "Invalid batch ID");
        require(batches[_batchID].batchID == 0, "Batch already exists!");

        batches[_batchID] = Batch({
            batchID: _batchID,
            cropName: _cropName,
            quantity: _quantity,
            timestamp: block.timestamp,
            farmer: msg.sender
        });
        emit BatchCreated(_batchID, _cropName, _quantity, block.timestamp, msg.sender);
    }
    function getBatch(uint256 _batchID) public view returns (
        uint256,
        string memory,
        uint256,
        uint256,
        address
    ) {
        Batch memory b = batches[_batchID];
        require(b.batchID != 0, "Batch does not exist!");
        return (b.batchID, b.cropName, b.quantity, b.timestamp, b.farmer);
    }
}
