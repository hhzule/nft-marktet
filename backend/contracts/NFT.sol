// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "hardhat/console.sol";

contract NFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter public _tokenIds;
    address contractAddress;
    string public baseURI;

    constructor(address marketplaceAddress,
    string memory name,
    string memory symbol,
    string memory baseURI_) ERC721(name,symbol) {
        contractAddress = marketplaceAddress;
        baseURI = baseURI_;
    }

    function createToken(string memory URI) public virtual returns (uint) {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();

        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, URI);
        setApprovalForAll(contractAddress, true);
        return newItemId;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    

}