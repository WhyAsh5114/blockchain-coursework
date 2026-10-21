# Experiment 9

## Inference

The transfer and approval results confirm the ERC-20 balance and allowance flows, including rejection when a spender exceeds the remaining allowance. Minting and burning changed total supply as expected, and pausing blocked transfers until the owner unpaused the contract; the final balances summed to the reported supply.

## Conclusion

VESToken was deployed and its standard ERC-20 operations were demonstrated in Remix IDE on the Remix VM. Owner-only minting, holder burning, and the pause control also worked as intended, with invalid operations rejected by the contract.
