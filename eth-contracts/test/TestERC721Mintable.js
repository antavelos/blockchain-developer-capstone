var CapstoneRealEstate = artifacts.require('CapstoneRealEstate');

const cleanError = err => {
    try {
        return err.message.replace("VM Exception while processing transaction: revert ", "");
    } catch {
        return err.message;
    }
};
contract('TestCapstoneRealEstate', async (accounts) => {

    const owner = accounts[0];
    const account1 = accounts[1];
    const account2 = accounts[2];
    const account3 = accounts[3];
    const emptyAccount = "0x0000000000000000000000000000000000000000";
    const tokens = [1, 2, 3, 4, 5];
    const tokenName = "Capstone Real Estate"
    const tokenSymbol = "CRS"
    const baseTokenURI = "https://s3-us-west-2.amazonaws.com/udacity-blockchain/capstone/"

    describe("contract ownership", async () => {
        before(async () => {
            this.contract = await CapstoneRealEstate.new({from: owner});
        })

        it('should return contract owner', async () => {
            const contractOwner = await this.contract.getOwner();
            assert.equal(contractOwner, owner);
        })

        it("should fail to transfer contract ownership when called from non-owner", async () => {
            let errorMessage;
            try {
                await this.contract.transferOwnership(account1, {from: account1});
            } catch(err) {
                errorMessage = cleanError(err);
            }
            assert.equal(errorMessage, "not contract owner");
        });

        it("should fail to transfer contract ownership when new owner is invalid", async () => {
            let errorMessage;
            try {
                await this.contract.transferOwnership(emptyAccount, {from: owner});
            } catch(err) {
                errorMessage = cleanError(err);
            }
            assert.equal(errorMessage, "new owner is not a valid address");
        });

        it("should transfer contract ownership when called from owner", async () => {
            assert.isTrue(await this.contract.isOwner(owner));

            await this.contract.transferOwnership(account1, {from: owner});

            assert.isTrue(await this.contract.isOwner(account1));
        });
    });

    describe('erc721 specs', async () => {
        before(async () => {
            this.contract = await CapstoneRealEstate.new({from: owner});

            // account1 owns all the tokens
            for (let i = 0; i < tokens.length; i++) {
                await this.contract.mint(account1, tokens[i]);
            }
        })

        it('should return total supply', async () => {
            const totalSupply = await this.contract.totalSupply();
            assert.equal(Number(totalSupply), tokens.length);
        })

        it('should get token balance', async () => {
            const balance = await this.contract.balanceOf(account1);
            assert.equal(balance, tokens.length);
        })

        // token uri should be complete i.e: https://s3-us-west-2.amazonaws.com/udacity-blockchain/capstone/1
        it('should return token uri', async () => {
            const token = tokens[0];
            const tokenUri = await this.contract.tokenURI(token);
            assert.equal(tokenUri, `${baseTokenURI}${token}`);
        });

        it("should fail to approve account who owns the token", async () => {
            const token = tokens[0];
            let errorMessage;
            try {
                await this.contract.approve(account1, token);
            } catch(err) {
                errorMessage = cleanError(err);
            }
            assert.equal(errorMessage, "owner already owns the token")
        })

        it("should fail to approve account when sent by non-owner or not approved by owner", async () => {
            const token = tokens[0];
            const accountToApprove = account2;

            let errorMessage;
            try {
                await this.contract.approve(accountToApprove, token, {from: account1});
            } catch(err) {
                errorMessage = cleanError(err);
            }
            assert.equal(errorMessage, "not owner or not approved by owner");

            try {
                await this.contract.approve(accountToApprove, token, {from: owner});
            } catch(err) {
                errorMessage = cleanError(err);
            }
            assert.equal(errorMessage, "not owner or not approved by owner");
        })

        it("should approve account when called by owner", async () => {
            const token = tokens[0];
            const accountToApprove = account2;

            await this.contract.approve(accountToApprove, token, {from: owner});

            const approved = await this.contract.getApproved(token);

            assert.equal(approved, accountToApprove);
        });

        it("should approve account when called by account appvoved by owner", async () => {
            const accountApprovedByOwner = account3;

            await this.contract.setApprovalForAll(accountApprovedByOwner, true, {from: owner});

            const token = tokens[0];
            const accountToApprove = account2;

            await this.contract.approve(accountToApprove, token, {from: accountApprovedByOwner});

            const approved = await this.contract.getApproved(token);

            assert.equal(approved, accountToApprove);

            this.contract.getPastEvents('Approval').then(events => {
                assert.equal(events.length, 1);
                assert.equal(events[0].logIndex, 0);
                assert.equal(parseInt(events[0].returnValues['tokenId']), token);
                assert.equal(parseInt(events[0].returnValues['owner']), owner);
                assert.equal(parseInt(events[0].returnValues['approved']), accountToApprove);
            });
        });

        it("should fail to transfer token when called is not owner or approved by owner", async () => {
            const token = tokens[0];
            const tokenOwner = await this.contract.ownerOf(token);
            const from = tokenOwner;
            const to = account2;
            const spender = account3;

            let errorMessage;
            try {
                await this.contract.transferFrom(from, to, token, {from: spender});
            } catch(err) {
                errorMessage = cleanError(err);
            }
            assert.equal(errorMessage, "not owner or approved");
        });

        it("should fail to transfer token 'from' address does not own the token'", async () => {
            const token = tokens[0];
            const tokenOwner = await this.contract.ownerOf(token);
            const from = account2;
            const to = account3;
            const spender = tokenOwner;

            let errorMessage;
            try {
                await this.contract.transferFrom(from, to, token, {from: spender});
            } catch(err) {
                errorMessage = cleanError(err);
            }
            assert.equal(errorMessage, "'from' address does not own the token");
        });

        it("should fail to transfer token 'to' address is invalid'", async () => {
            const token = tokens[0];
            const tokenOwner = await this.contract.ownerOf(token);
            const from = tokenOwner;
            const to = emptyAccount;
            const spender = tokenOwner;

            let errorMessage;
            try {
                await this.contract.transferFrom(from, to, token, {from: spender});
            } catch(err) {
                errorMessage = cleanError(err);
            }
            assert.equal(errorMessage, "'to' is not a valid address");
        });

        it('should transfer token from one owner to another', async () => {
            const token = tokens[0];
            const oldTokenOwner = account1;
            const oldTokenOwnerBalanceBefore = Number(await this.contract.balanceOf(oldTokenOwner));
            const newTokenOwner = account2
            const newTokenOwnerBalanceBefore = Number(await this.contract.balanceOf(newTokenOwner));

            assert.equal(await this.contract.ownerOf(token), oldTokenOwner) ;

            await this.contract.transferFrom(oldTokenOwner, newTokenOwner, token, {from: oldTokenOwner});

            assert.equal(await this.contract.ownerOf(token), newTokenOwner) ;

            oldTokenOwnerBalanceAfter = Number(await this.contract.balanceOf(oldTokenOwner));
            assert.equal(oldTokenOwnerBalanceAfter, oldTokenOwnerBalanceBefore - 1);

            newTokenOwnerBalanceAfter = Number(await this.contract.balanceOf(newTokenOwner));
            assert.equal(newTokenOwnerBalanceAfter, newTokenOwnerBalanceBefore + 1);

            this.contract.getPastEvents('Transfer').then(events => {
                assert.equal(events.length, 1);
                assert.equal(events[0].logIndex, 0);
                assert.equal(parseInt(events[0].returnValues['from']), oldTokenOwner);
                assert.equal(parseInt(events[0].returnValues['to']), newTokenOwner);
                assert.equal(parseInt(events[0].returnValues['tokenId']), token);
            });
        })
    });

    describe("token metadata", async () => {
        before(async () => {
            this.contract = await CapstoneRealEstate.new({from: owner});
        });

        it("should return token name", async () => {
            const name = await this.contract.name();
            assert.equal(name, tokenName);
        });

        it("should return token symbol", async () => {
            const symbol = await this.contract.symbol();
            assert.equal(symbol, tokenSymbol);
        });

        it("should return token base URI", async () => {
            const _baseTokenURI = await this.contract.baseTokenURI();
            assert.equal(_baseTokenURI, baseTokenURI);
        });
    });

    describe('token mint', async () => {
        before(async () => {
            this.contract = await CapstoneRealEstate.new({from: owner});

            // account1 owns all the tokens
            for (let i = 0; i < tokens.length; i++) {
                await this.contract.mint(account1, tokens[i]);
            }
        });

        it('should fail when minting from address that is not contract owner', async () => {
            const mintTo = account2;

            let errorMessage;
            try {
                await this.contract.mint(mintTo, 1, {from: account1});
            } catch(err) {
                errorMessage = cleanError(err);
            }
            assert.equal(errorMessage, "not contract owner");
        });

        it('should fail to mint existing token', async () => {
            const mintTo = account2;
            const token = tokens[0];

            let errorMessage;
            try {
                await this.contract.mint(mintTo, token, {from: owner});
            } catch(err) {
                errorMessage = cleanError(err);
            }
            assert.equal(errorMessage, "token already exists");
        });

        it('should fail to mint existing token', async () => {
            const mintTo = emptyAccount;
            const token = 6;

            let errorMessage;
            try {
                await this.contract.mint(mintTo, token, {from: owner});
            } catch(err) {
                errorMessage = cleanError(err);
            }
            assert.equal(errorMessage, "invalid address");
        });

        it('should  mint token', async () => {
            const mintTo = account2;
            const token = 6;

            await this.contract.mint(mintTo, token, {from: owner});

            const tokenOwner = await this.contract.ownerOf(token);
            assert.equal(tokenOwner, mintTo);

            const tokenURI = await this.contract.tokenURI(token);
            assert.equal(tokenURI, `${baseTokenURI}${token}`);

            const balance = await this.contract.balanceOf(mintTo);
            assert.equal(balance, 1);

            const totalSupply = await this.contract.totalSupply();
            assert.equal(totalSupply, tokens.length + 1);

            this.contract.getPastEvents('Transfer').then(events => {
                assert.equal(events.length, 1);
                assert.equal(events[0].logIndex, 0);
                assert.equal(parseInt(events[0].returnValues['from']), emptyAccount);
                assert.equal(parseInt(events[0].returnValues['to']), mintTo);
                assert.equal(parseInt(events[0].returnValues['tokenId']), token);
            });
        });
    });
});