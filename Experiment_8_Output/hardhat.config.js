require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: { version: "0.8.24", settings: { evmVersion: "shanghai" } }, // newest fork Ganache supports
  networks: {
    // Ganache CLI started with: ganache --server.port 7545 --wallet.deterministic --chain.chainId 5777
    ganache: {
      url: "http://127.0.0.1:7545",
      chainId: 5777,
      accounts: {
        mnemonic: "myth like bonus scare over problem client lizard pioneer submit female collect",
        initialIndex: 4, // Ganache accounts #4, #5, #6 = owner, alice, bob
        count: 3,
      },
    },
  },
};
