// Test if a new solution can be added for contract - SolnSquareVerifier

// Test if an ERC721 token can be minted for contract - SolnSquareVerifier

var SquareVerifier = artifacts.require('SquareVerifier');
var SolnSquareVerifier = artifacts.require('SolnSquareVerifier');

const cleanError = err => {
    try {
        return err.message.replace("VM Exception while processing transaction: revert ", "");
    } catch {
        return err.message;
    }
};

const proof = {
  "scheme": "g16",
  "curve": "bn128",
  "proof": {
    "a": [
      "0x207e8084e254c145be4e6eca2ade10c5685e8d3d79b6be6a135ee4d957081d68",
      "0x202ee08ad55576ee072dcbffb14b2f31320ef60fdca9882a5bb83ae46292de4b"
    ],
    "b": [
      [
        "0x02ab0e3b8bb02597829967fe2f2aab48847b81eeff4f9736b60940dcb5f31a16",
        "0x087b928b4a85b81e371eb64c15b1376658ab6b0c3817ca2b87ad31f288c6f690"
      ],
      [
        "0x05c1bd57f6366fdadb1fc2e8458febb432e4db583d93eea393554d3be0420a5d",
        "0x0875c88997f84aa807dd7004d8b1f80bf0b252114bcc7a9b673222b907e458ba"
      ]
    ],
    "c": [
      "0x29f6915415ede1e6b45b48d8b10673e8171f393abb4a82b6f72caa8fb1006946",
      "0x2a6df4b2673766d7cc4f82b8302ad32308ea1d4471521cfae651becf587f34b8"
    ]
  },
  "inputs": [
    "0x00000000000000000000000000000000000000000000000000000000000000e1",
    "0x0000000000000000000000000000000000000000000000000000000000000001"
  ]
};

const invalidProof = {
  "scheme": "g16",
  "curve": "bn128",
  "proof": {
    "a": [
      "0x207e8084e254c145be4e6eca2ade10c5685e8d3d79b6be6a135ee4d957081d68",
      "0x202ee08ad55576ee072dcbffb14b2f31320ef60fdca9882a5bb83ae46292de4b"
    ],
    "b": [
      [
        "0x02ab0e3b8bb02597829967fe2f2aab48847b81eeff4f9736b60940dcb5f31a16",
        "0x087b928b4a85b81e371eb64c15b1376658ab6b0c3817ca2b87ad31f288c6f690"
      ],
      [
        "0x05c1bd57f6366fdadb1fc2e8458febb432e4db583d93eea393554d3be0420a5d",
        "0x0875c88997f84aa807dd7004d8b1f80bf0b252114bcc7a9b673222b907e458ba"
      ]
    ],
    "c": [
      "0x29f6915415ede1e6b45b48d8b10673e8171f393abb4a82b6f72caa8fb1006946",
      "0x2a6df4b2673766d7cc4f82b8302ad32308ea1d4471521cfae651becf587f34b8"
    ]
  },
  "inputs": [
    "0x00000000000000000000000000000000000000000000000000000000000000e0",
    "0x0000000000000000000000000000000000000000000000000000000000000001"
  ]
};
contract('TestSolnSquareVerifier', async (accounts) => {

  const owner = accounts[0];
  const account1 = accounts[1];
  // let contract;

  describe("SolnSquareVerifier", async () => {

    beforeEach('setup', async () => {
      verifier = await SquareVerifier.new();
      this.contract = await SolnSquareVerifier.new(verifier.address);
    });

    it("should fail to submit not verified solution", async () => {
      const submitter = account1;

      let errorMessage;
      try {
        await this.contract.submitSolution(invalidProof.proof, invalidProof.inputs, submitter, {from: owner});
      } catch(err) {
        errorMessage = cleanError(err);
      }
      assert.equal(errorMessage, "not verified");
    });

    it("should fail to submit existing solution", async () => {
      const submitter = account1;

      await this.contract.submitSolution(proof.proof, proof.inputs, submitter, {from: owner});

      let errorMessage;
      try {
        await this.contract.submitSolution(proof.proof, proof.inputs, submitter, {from: owner});
      } catch(err) {
        errorMessage = cleanError(err);
      }
      assert.equal(errorMessage, "solution already submitted");
    });

    it("should mint token upon successful solution submition", async () => {
      const submitter = account1;
      const expectedTokenId = 0;
      const expectedTokenName = "Capstone Real Estate";
      const expectedTokenSymbol = "CRS";
      const expectedTokenURI = `https://s3-us-west-2.amazonaws.com/udacity-blockchain/capstone/${expectedTokenId}`;

      await this.contract.submitSolution(proof.proof, proof.inputs, submitter, {from: owner});

      assert.equal(await this.contract.totalSupply(), 1);
      assert.equal(await this.contract.balanceOf(submitter), 1);

      const events = await this.contract.getPastEvents('SolutionAdded')
      assert.equal(events.length, 1);
      assert.equal(events[0].returnValues['submitter'], submitter);
      assert.equal(events[0].returnValues['tokenId'], expectedTokenId);

      assert.equal(await this.contract.ownerOf(expectedTokenId), submitter);
      assert.equal(await this.contract.name(), expectedTokenName);
      assert.equal(await this.contract.symbol(), expectedTokenSymbol);
      assert.equal(await this.contract.tokenURI(expectedTokenId), expectedTokenURI);
    });
  });

});