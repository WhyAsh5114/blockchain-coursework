# Experiment 8

## Inference

The DApp read the donation contract's state through its MetaMask connection and refreshed the displayed values after transactions. The total increased from 2.25 ETH to 4.5 ETH after a donation approved in MetaMask; a non-owner's withdrawal reverted, while the owner completed the withdrawal successfully.

## Conclusion

MetaMask and the DApp successfully interacted with the DonationTracker contract on a local Ganache chain. The experiment demonstrated wallet-approved donations, live contract-state updates that follow account changes in the wallet, and owner-only withdrawal.
