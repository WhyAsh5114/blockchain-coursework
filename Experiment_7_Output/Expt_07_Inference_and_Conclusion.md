# Experiment 7

## Inference

The output shows that a batch's details were carried from the farmer through the distributor and retailer to the customer, with each stage signed by a different MetaMask account on the Ganache chain. Each transition read the prior contract's recorded data, and the second purchase attempt reverted with the expected error, confirming that a batch cannot be processed twice at the final stage.

## Conclusion

The four supply-chain contracts were deployed and interacted with successfully on a local Ganache blockchain using MetaMask and Remix IDE. The run demonstrated traceability across all stages, and the transactions, gas usage and balances were verified on the Ganache chain.
