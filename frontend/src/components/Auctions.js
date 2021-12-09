import { ethers } from "ethers";
import { useEffect, useState } from "react";
import axios from "axios";
import { useWeb3React } from "@web3-react/core";
import Web3Modal from "web3modal";
import {
  nftaddress,
  nftmarketaddress,
} from "../config";
import { useNavigate } from 'react-router'
import Market from "./../artifacts/contracts/Market.sol/Market.json";
import Collection from "./../artifacts/contracts/Collection.sol/Collection.json";
import Auction from "./../artifacts/contracts/AuctionV1.sol/AuctionV1.json";
let rpcEndpoint =
  "https://polygon-mumbai.infura.io/v3/89aa0cf029e948ee883b0bf906f2f3df";

export default function Auctions() {
  const {
    library,
    account,
    chainId,

  } = useWeb3React();
  const navigate = useNavigate()
  const [modalstate, setModalstate] = useState(false);
  const [modalmidbtn, setModalmidbtn] = useState({disabled:"false"});
  const [nfts, setNfts] = useState([]);
  const [bid, setBid] = useState();
  const [loadingState, setLoadingState] = useState("not-loaded");
  const [error, setError] = useState();
  const [ signer, setSigner] = useState()
  const [ address, setAddress] = useState()
 
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
      const provider = new ethers.providers.JsonRpcProvider(rpcEndpoint);
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();

          const providerS = new ethers.providers.Web3Provider(connection);
          const signer = providerS.getSigner();
      const useraddress = signer.provider.provider.selectedAddress;
      setSigner(useraddress)
      setAddress(address)
      console.log(address)
      // const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider);
      const marketContract = new ethers.Contract(
        nftmarketaddress,
        Market.abi,
        provider
      );
        let auction = await marketContract.auction_addr();
        // let aucAddress =  ethers.utils.getAddress(`${auction}`)
        let auctioncontract = new ethers.Contract(auction, Auction.abi,provider );
        // let numofbids = await auctioncontract.auctions()
        // console.log("number", numofbids)
      const data = await marketContract.fetchMarketItems();
      let items = await Promise.all(
        data.map(async (i) => {
          // console.log("iiiiii", i)
          let address = i[1];
            console.log("from else")
            const collectionContract = new ethers.Contract(
              address,
              Collection.abi,
              provider
            );
            let lastTime = await auctioncontract.getLastTime(address, i.itemId)
            // console.log("status", lastTime)
            let highestBid = await auctioncontract.getHighestBid(address, i.itemId)
            // console.log("getHighestBid", highestBid)
            let highestBidder = await auctioncontract.getHighestBidder(address, i.itemId)
            // console.log("highestBidder", highestBidder)
            let canSell = await auctioncontract.canSell(address, i.itemId)
            console.log("canSell", canSell)
      
            const tokenUri = await collectionContract.tokenURI(i.tokenId);
            const meta = await axios.get(tokenUri);
            let price = ethers.utils.formatUnits(i.price.toString(), "ether");
             highestBid = ethers.utils.formatUnits(highestBid.toString(), "ether");
            var d = new Date(0); // The 0 there is the key, which sets the date to the epoch
            d.setUTCSeconds(lastTime.toNumber());
            let item = {
              tokenId:i.itemId,
              price,
              address,
              lastTime:`${d}`,
              canSell,
              highestBidder,
              highestBid,
              itemId: i.itemId.toNumber(),
              seller: i.seller,
              owner: i.owner,
              image: meta.data.image,
              name: meta.data.name,
              description: meta.data.description,
              isAuction: i.isAuction,
            };
            return item;
       
        })
      );
      items = items.filter((nft) => nft.isAuction === true);
      console.log("item", items);
      setNfts(items);
      setLoadingState("loaded");
    } catch (error) {
      console.log("err", error);
    }
  }
  async function bidNft(nftId, address, seller) {
if(!bid) return setError("Give a price") 
    try {
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();

      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();
      const NFTMarketcontract = new ethers.Contract(
        nftmarketaddress,
        Market.abi,
        provider
      );
      let auction = await NFTMarketcontract.auction_addr();
      // let aucAddress = ethers.utils.getAddress(`${auction}`);
      let auctioncontract = new ethers.Contract(auction, Auction.abi, signer);
      let numofbids = await auctioncontract.auctions();
      console.log("number", numofbids);
      let nftAddress = ethers.utils.getAddress(`${address}`);
      console.log("price", bid.toString());
      const bidprice = ethers.utils.parseUnits(bid.toString(), "ether");
      let trans = await auctioncontract.bid(nftAddress, nftId, {
        value: bidprice,
      });
      await trans.wait();
      console.log("done", trans);
      setModalstate(false);
    } catch (error) {
      console.log("err", error);
      setError(`${error}`)
    }
  }

  async function createMarketSale(nft){
    let signer
        try {
          const web3Modal = new Web3Modal();
          const connection = await web3Modal.connect();
          const provider = new ethers.providers.Web3Provider(connection);
          signer = provider.getSigner();
        /* then list the item for sale on the marketplace */
         let  contract = new ethers.Contract(nftmarketaddress, Market.abi, signer);
          let listingPrice = await contract.getListingPrice();
          listingPrice = listingPrice.toString();
    
         let  transaction = await contract.createMarketItem(nftaddress, nft.tokenId, nft.price,true,0, {
            value: listingPrice,
          });
          await transaction.wait();
          navigate('/my-assets')
    } catch (error) {
      setError(`${error.message}`)
      console.log("error", error)
    }
    
      }
      if (!account) {
        //  setConnectError("Connect wallet")
        return <h1>connect wallet</h1>
      }
  if (loadingState === "loaded" && !nfts.length)
    return <h1 className="px-20 py-10 text-3xl">No items in marketplace</h1>;
  return (
    <>
      <h1 className="text-center text-5xl font-bold bg-white">
        MarketPlace Auctions
      </h1>
      <div style={{ width: "100%" }}>
        <div style={{ display: "flex", flexDirection: "row" }}>
        {nfts &&
            nfts.map((nft, i) => (
              <div
                key={i}
                style={{ width: "100%", margin: "20px", flexDirection:"column", maxWidth:"500px" }}
                className="card shadow flex overflow-hidden"
              >
                <div
                  className=""
                  style={{ width: "75%", margin:"0 auto" }}
                >
                  <img
                  alt={`NFT ${nft.name}`}
                    className=" bg-white rounded-xl"
                    style={{ width: "100%" }}
                    src={nft.image}
                  />
                </div>
                <div style={{ display: "flex", flexDirection:"column" }}>
                 
                    <p>Name: {nft.name}</p>
                    <p className="text-white">Description: {nft.description}</p>
            
                    <p> Owner : {nft.owner}</p>
                   
                   <p> Seller: {nft.seller}</p>
                     <p> Highest Bid : {nft.highestBid}</p>
                  
                    <p> Highest Bidder : {nft.highestBidder}</p>
     
                    <p className="text-2xl mb-4 font-bold text-white">
                      {nft.price} Matic
                    </p>
                    <p className="text-2xl mb-4 font-bold text-white">
                      {nft.lastTime} Sec
                    </p>

                      {nft.canSell && nft.canSell === true
                       ?   <button
                      className="bgthemebtn disabledbtn w-full text-white font-bold py-2 px-12"
                      onClick={() => setModalstate(true)}
                    > Bid</button> 
                    : nft.highestBidder  && nft.highestBidder === signer
                     ?  <button
                      className="bgthemebtn disabledbtn w-full text-white font-bold py-2 px-12"
                      onClick={() => createMarketSale(nft)}
                    > Claim</button> 
                    : nft.seller && nft.seller === signer
                     ? <button
                    className="bgthemebtn disabledbtn w-full text-white font-bold py-2 px-12"
                    onClick={() => createMarketSale(nft)}
                  > Sale</button>
                      : "Bid Ended" }
                   
             
                </div>

                <div className={modalstate ? "mintmodal" : "none"}>
                  <div className="modal-content">
                    <span
                      onClick={() => {
                        setModalstate(false);
                        modalmidbtn.disabled = false


                      }}
                      className="close"
                    >
                      &times;
                    </span>
                    <h1 className="text-center text-5xl font-bold bg-white">
                      Bid onNFTs
                    </h1>
                    <div className="flex justify-center">
                      <div className="w-1/2 flex flex-col pb-12">
                        <p>{error}</p>
                        <textarea
                          placeholder="Asset Bid"
                          className="mt-2 border rounded p-4"
                          onChange={(e) => setBid(e.target.value)}
                        />

                        <button
                          onClick={(e) => {
                            bidNft(nft.itemId, nft.address, nft.seller);
                           
                            setModalmidbtn(e.target)
                            modalmidbtn.disabled = true
                          }}
                          className="font-bold mt-4  text-white bgthemebtn disabledbtn p-4 shadow-lg"
                        >
                          Bid
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
    
            ))}
        </div>
      </div>
    </>
  );
}
