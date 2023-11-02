pragma solidity >=0.4.21 <0.6.0;
pragma experimental ABIEncoderV2;

import 'openzeppelin-solidity/contracts/drafts/Counters.sol';
import "./ERC721Mintable.sol";
import "./SquareVerifier.sol";

library Types {
    using Pairing for *;

    struct Proof {
        Pairing.G1Point a;
        Pairing.G2Point b;
        Pairing.G1Point c;
    }
}

contract ISquareVerifier {
    function verifyTx(Types.Proof memory, uint[2] memory) public view returns (bool) { }
}

contract SolnSquareVerifier is CapstoneRealEstate {
    using Counters for Counters.Counter;

    struct Solution {
        uint256 index;
        address from;
    }

    mapping(bytes32 => Solution) private uniqueSolutions;

    Counters.Counter private tokenIndexes;

    ISquareVerifier private verifier;

    event SolutionAdded(address submitter, uint256 tokenId);

    constructor(address _verifier) public {
        verifier = ISquareVerifier(_verifier);
    }

    function submitSolution(
        Types.Proof memory proof,
        uint[2] memory input,
        address submitter
    )
        public
    {
        bool verified = verifier.verifyTx(proof, input);

        require(verified, "not verified");

        bytes32 key = hashInput(proof, input);

        require(uniqueSolutions[key].from == address(0), "solution already submitted");

        uint256 currentTokenIndex = tokenIndexes.current();

        uniqueSolutions[key] = Solution(currentTokenIndex, submitter);

        mint(submitter, currentTokenIndex);

        tokenIndexes.increment();

        emit SolutionAdded(submitter, currentTokenIndex);
    }

    function hashInput(Types.Proof memory proof, uint[2] memory input) private pure returns (bytes32) {
        return keccak256(
            abi.encodePacked(
                proof.a.X,
                proof.a.Y,
                proof.b.X[0],
                proof.b.Y[0],
                proof.b.X[1],
                proof.b.Y[1],
                proof.c.X,
                proof.c.Y,
                input
            )
        );
    }
}