// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title DonationTracker - a small DApp back end: donations with a message, owner-only withdrawal
contract DonationTracker {
    struct Donation {
        address donor;
        uint256 amount;
        string message;
        uint256 timestamp;
    }

    address public owner;
    uint256 public totalDonated;
    Donation[] private donations;

    event DonationReceived(address indexed donor, uint256 amount, string message);
    event Withdrawn(address indexed owner, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    function donate(string calldata message) external payable {
        require(msg.value > 0, "Donation must be greater than 0");
        donations.push(Donation(msg.sender, msg.value, message, block.timestamp));
        totalDonated += msg.value;
        emit DonationReceived(msg.sender, msg.value, message);
    }

    function donationCount() external view returns (uint256) {
        return donations.length;
    }

    function getDonation(uint256 i) external view returns (address, uint256, string memory, uint256) {
        Donation storage d = donations[i];
        return (d.donor, d.amount, d.message, d.timestamp);
    }

    function withdraw() external {
        require(msg.sender == owner, "Only owner can withdraw");
        uint256 bal = address(this).balance;
        require(bal > 0, "Nothing to withdraw");
        (bool ok, ) = owner.call{value: bal}("");
        require(ok, "Transfer failed");
        emit Withdrawn(owner, bal);
    }
}
