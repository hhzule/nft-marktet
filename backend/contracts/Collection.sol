// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./NFT.sol";

import "hardhat/console.sol";


contract Collection is NFT, ERC721Enumerable , Ownable{
    

    constructor(address marketplaceAddress,
    string memory name,
    string memory symbol,
    string memory baseURI_,address newOwner) NFT(marketplaceAddress,name,symbol,baseURI_){
        transferOwnership(newOwner);
    }

    function createToken(string memory URI) public override onlyOwner returns (uint) {  
       return super.createToken(URI);
    }

   function _baseURI() internal view override(ERC721,NFT) returns (string memory) {
        return NFT.baseURI;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721,ERC721Enumerable) {
        ERC721Enumerable._beforeTokenTransfer(from,to,tokenId);
    }

    function _burn(uint256 tokenId) internal override(ERC721,ERC721URIStorage) {
        ERC721URIStorage._burn(tokenId);
    }
    function supportsInterface(bytes4 interfaceId) public view override( ERC721 ,ERC721Enumerable) returns (bool) {
        return ERC721Enumerable.supportsInterface(interfaceId);
    }
    function tokenURI(uint256 tokenId) public view override(ERC721,ERC721URIStorage) returns (string memory) {
        return ERC721URIStorage.tokenURI(tokenId);
    }
}