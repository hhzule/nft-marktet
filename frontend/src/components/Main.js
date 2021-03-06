import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { useWeb3React } from "@web3-react/core";
import Web3Modal from "web3modal";
import { nftaddress, nftmarketaddress , factoryaddress, collectionaddress} from "../config";
import Market from "./../artifacts/contracts/Market.sol/Market.json";
import NFT from "./../artifacts/contracts/NFT.sol/NFT.json";
import Factory from "./../artifacts/contracts/Factory.sol/Factory.json";
import Collection from "./../artifacts/contracts/Collection.sol/Collection.json";
let rpcEndpoint = "https://polygon-mumbai.infura.io/v3/89aa0cf029e948ee883b0bf906f2f3df"



export default function Home() {
    const {
    library,
    account,
    chainId,

  } = useWeb3React();
  const [nfts, setNfts] = useState([])
  const [loadingState, setLoadingState] = useState('not-loaded')
  useEffect(() => {
    (async () => {
      if (library && account) {
        try {
          loadNFTs()
        }
        catch (error) {
          console.log("Error ", error.message);
        }
        return () => {
        };
      }
    })();
  }, [library, account, chainId]);


  
  async function loadNFTs() {  
    try {
      const provider = new ethers.providers.JsonRpcProvider(rpcEndpoint)
      const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
    
      const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, provider)
      const data = await marketContract.fetchMarketItems()
      console.log("data", data)
      let items = await Promise.all(data.map(async i => {
        let address = i[1];
        if(address == nftaddress){
          console.log("nft")
      const tokenUri = await tokenContract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price,
        address,
        itemId: i.itemId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
        name: meta.data.name,
        description: meta.data.description,
        isAuction: i.isAuction
      }
      return item
        }else{
          console.log("coll")
          const collectionContract = new ethers.Contract(address, Collection.abi, provider)
          const tokenUri = await collectionContract.tokenURI(i.tokenId)
          const meta = await axios.get(tokenUri)
          let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
          let item = {
            price,
            address,
            itemId: i.itemId.toNumber(),
            seller: i.seller,
            owner: i.owner,
            image: meta.data.image,
            name: meta.data.name,
            description: meta.data.description,
            isAuction: i.isAuction
          }
          return item
        }
      }))
      console.log("item", items)
      items = items.filter(nft => nft.isAuction == false);
      setNfts(items)
      setLoadingState('loaded') 
    } catch (error) {
      console.log("err", error)
    }  

  }
  async function buyNft(nft) {
    try {
      const web3Modal = new Web3Modal()
      const connection = await web3Modal.connect()
      const provider = new ethers.providers.Web3Provider(connection)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
  
      const price = ethers.utils.parseUnits(nft.price.toString(), 'ether')
      const transaction = await contract.createMarketSale(nftaddress, nft.itemId, {
        value: price
      })
      await transaction.wait()
      loadNFTs() 
    } catch (error) {
      console.log("err", error)
    }

  }

  if (!account) {
    //  setConnectError("Connect wallet")
    return <h1>connect wallet</h1>
  }
  if (loadingState === 'loaded' && !nfts.length) return (<h1 className="px-20 py-10 text-3xl">No items in marketplace</h1>)
  return (
    <>
    <h1 className="text-center text-5xl font-bold bg-white">MarketPlace</h1>
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: '1600px' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
            nfts && nfts.map((nft, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden">
                <img src={nft.image} />
                <div className="p-4">
                  <p style={{ height: '64px' }} className="text-2xl font-semibold">{nft.name}</p>
                  <div style={{ height: '70px', overflow: 'hidden' }}>
                    <p className="text-gray-400">{nft.description}</p>
                  </div>
                </div>
                <div className="p-4 bg-black">
                  <p className="text-2xl mb-4 font-bold text-white">{nft.price} Matic</p>
                  <button className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={() => buyNft(nft)}>{nft.isAuction&& nft.isAuction ? "Bid" : "Buy"}</button>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
    </>
  )
}