const SquareVerifier = artifacts.require("SquareVerifier");

let proof = {
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

contract('Zokrates Verifier Tests', async (accounts) => {
  const account = accounts[0];

  it(`should verify the tx`, async () => {
    const verifier = await SquareVerifier.deployed();

    const result = await verifier.verifyTx(proof.proof, proof.inputs, { from: accounts[0] })

    assert.isTrue(result, "Should be verified");
  });

  it(`should not verify the tx when proof is invalid`, async () => {
    const verifier = await SquareVerifier.deployed();

    // invalidating proof
    let temp = proof["proof"]["a"];
    proof["proof"]["a"] = proof["proof"]["c"];
    proof["proof"]["c"] = temp;

    const result = await verifier.verifyTx(proof.proof, proof.inputs, { from: accounts[0] })

    assert.isFalse(result, "Should not be verified");
  });

  it(`should not verify the tx when input is not correct`, async () => {
    const verifier = await SquareVerifier.deployed();

    // invalidating input
    proof["inputs"][0] = "0x00000000000000000000000000000000000000000000000000000000000000e2";

    const result = await verifier.verifyTx(proof.proof, proof.inputs, { from: accounts[0] })

    assert.isFalse(result, "Should not be verified");
  });

});
