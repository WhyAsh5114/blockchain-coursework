# Experiment 8

## Inference

The DApp read the donation contract's state through its wallet connection and refreshed the displayed values after transactions. The total increased from 2.25 ETH to 4.5 ETH after a donation; a non-owner's withdrawal reverted, while the owner completed the withdrawal successfully.

## Conclusion

The local wallet provider and DApp successfully interacted with the DonationTracker contract on Hardhat. The experiment demonstrated wallet-signed donations, live contract-state updates, and owner-only withdrawal; the provider simulated MetaMask's interface for this run.
