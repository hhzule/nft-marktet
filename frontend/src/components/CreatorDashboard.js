import { ethers } from "ethers";
import { useEffect, useState } from "react";
import axios from "axios";
import { useWeb3React } from "@web3-react/core";
import Web3Modal from "web3modal";
import { nftaddress, nftmarketaddress , factoryaddress, collectionaddress} from "../config";
import Market from "./../artifacts/contracts/Market.sol/Market.json";
import NFT from "./../artifacts/contracts/NFT.sol/NFT.json";
import Factory from "./../artifacts/contracts/Factory.sol/Factory.json";
import Collection from "./../artifacts/contracts/Collection.sol/Collection.json";
import { Link } from "react-router-dom";

export default function CreatorDashboard() {
    const {
    library,
    account,
    chainId,

  } = useWeb3React();
  const [modalstate, setModalstate] = useState(false);
  const [auction, setAuction] = useState(false);
  const [endingUnix, setEndingUnix] = useState(0);
  const [error, setError] = useState()
  const [price, setPrice] = useState()
  const [collections, setCollections] = useState([]);
  const [nfts, setNfts] = useState([]);
  const [sold, setSold] = useState([]);
  const [loadingState, setLoadingState] = useState("not-loaded");
  const [collectionloadingState, setCollectionLoadingState] =
    useState("not-loaded");

  useEffect(() => {
    (async () => {
      if (library && account) {
        try {
          loadNFTs()
          loadCollections();
        }
        catch (error) {
          console.log("Error ", error.message);
        }
        return () => {

        };
      }
    })();
  }, [library, account, chainId]);

  async function loadCollections() {
    try {
      const web3Modal = new Web3Modal({
        network: "mainnet",
        cacheProvider: true,
      });
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();
      const address = signer.provider.provider.selectedAddress;
      // console.log(signer.provider.provider.selectedAddress)
      const FactoryContract = new ethers.Contract(
        factoryaddress,
        Factory.abi,
        signer
      );
      const NumberOfCollections = await FactoryContract.collections(address);
      let listOfCollections = [];
      for (let index = 0; index < NumberOfCollections.toNumber(); index++) {
        let itm = await FactoryContract.ownerIdToCollection(address, index);
        listOfCollections.push(itm);
      }
      console.log("listofcoll", listOfCollections);

      let collectionObj = await Promise.all(
        listOfCollections.map(async (address) => {
          const CollectionContract = new ethers.Contract(
            address,
            Collection.abi,
            provider
          );
          const name = await CollectionContract.name();
          const symbol = await CollectionContract.symbol();
          return {
            name,
            symbol,
            address
          };
        })
      );

      setCollections(collectionObj);
      setCollectionLoadingState("loaded");
    } catch (error) {
      console.log("erro", error);
    }
  }

  async function loadNFTs() {
    try {
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()

    const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
    const data = await marketContract.fetchItemsCreated()
    const items = await Promise.all(data.map(async i => {
      let id = i.tokenId.toNumber()
      let address = i[1];
      const tokenUri = await tokenContract.tokenURI(i.tokenId.toNumber())
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price,
        address,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        sold: i.sold,
        image: meta.data.image,
        name: meta.data.name
      }
      console.log("item", item)
      return item
    }))

    /* create a filtered array of items that have been sold */
    const soldItems = items.filter(i => i.sold)
    setSold(soldItems)
    setNfts(items)
    setLoadingState('loaded')
  } catch (error) {
     console.log("erro", error)
  }
  }

  async function create(tokenId){
    if ( !price) return setError("Kindly provide the required fields");
    if(auction){
      if(!endingUnix) return setError("Kindly provide the required fields");
    }else{
      let signer
      try {
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        signer = provider.getSigner();
      } catch (error) {
        setError(`Error uploading file: ${JSON.stringify(error)}`)
        console.log("error", error)
      }
    
    try {  /* next, create the item */
        // let collectionAddress =  ethers.utils.getAddress(`${collection.collAdd}`)
        // const CollectionContract = new ethers.Contract(
        //   collectionAddress,
        //       Collection.abi,
        //       signer
        //     )
      const ethprice = ethers.utils.parseUnits(price, "ether");
       /* then list the item for sale on the marketplace */
     let NFTMarketcontract = new ethers.Contract(nftmarketaddress, Market.abi, signer);
       let listingPrice = await NFTMarketcontract.getListingPrice();
        listingPrice = listingPrice.toString();
        let transaction = await NFTMarketcontract.createMarketItem(nftaddress, tokenId, ethprice,auction,endingUnix, {
                  value: listingPrice,
                });
       await transaction.wait();
       console.log("done")
    }catch(e){
      console.log("error", e)
    }
    
    
      
    }
 
}
if (!account) {
  //  setConnectError("Connect wallet")
  return <h1>connect wallet</h1>
}
  return (
    <div>
      {loadingState === "loaded" && !nfts.length ? (
        <h1 className="py-10 px-20 text-3xl">No NFTs created</h1>
      ) : (
        <>
          <div className="p-4">
            <h2 className="text-2xl py-2">NFTs Created</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              {nfts.map((nft, i) => (
                <div
                  key={i}
                  className="border shadow rounded-xl overflow-hidden"
                >
                  <img src={nft.image} className="rounded" />
                  <div className="p-4 bg-black">
                    <p className="text-2xl font-bold text-white">
                      Price - {nft.price} Matic
                    </p>
                    <p className="text-2xl font-bold text-white">
                      Name - {nft.name} 
                    </p>
                    <p className="text-2xl font-bold text-white">
                      Address- {nft.address} 
                    </p>
                  </div>
        <div  
    className={modalstate ? "mintmodal" : "none"}
                
                >

                <div className="modal-content">
                    <span onClick={()=>{setModalstate(false)}} className="close">&times;</span>
                    <h1 className="text-center text-5xl font-bold bg-white">Create Sale</h1>
    <div className="flex justify-center">
      <div className="w-1/2 flex flex-col pb-12">
      <p>{error && error}</p>

          <input
    placeholder="Asset Price in Eth"
    className="mt-2 border rounded p-4"
    onChange={(e) =>
     setPrice(e.target.value)
    }
  />
       {auction && auction ?
       (<input
        placeholder="_endingUnix"
        className="mt-2 border rounded p-4"
        onChange={(e) =>
          setEndingUnix(e.target.value)
        }
      />):(null)
        
    }

        <div className="radio-btn-container">
        <div
          className="radio-btn"
          onClick={() => {
            setAuction(false);
          }}
        >
          <input
            type="radio"
            value={auction}
            name="tripType"
            checked={auction == false}
          />
          Sale
        </div>
        <div
          className="radio-btn"
          onClick={() => {
            setAuction(true);
          }}
        >
          <input
            type="radio"
            value={auction}
            name="tripType"
            checked={auction == true}
          />
         Auction
        </div>
      </div>
  
        <button
          onClick={()=>create(nft.tokenId)}
          className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg"
          >
          Create Item Sale
        </button>
      </div>
    </div>
                </div>

                </div>
                </div>
              ))}
            </div>
          </div>
          <div className="px-4">
            {Boolean(sold.length) && (
              <div>
                <h2 className="text-2xl py-2">Items sold</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                  {sold.map((nft, i) => (
                    <div
                      key={i}
                      className="border shadow rounded-xl overflow-hidden"
                    >
                      <img src={nft.image} className="rounded" />
                      <div className="p-4 bg-black">
                        <p className="text-2xl font-bold text-white">
                          Price - {nft.price} Eth
                        </p>
                      </div>
 
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {collectionloadingState === "loaded" && !collections.length ? (
        <h1 className="py-10 px-20 text-3xl">No Collections created</h1>
      ) : (
        <>
          <div className="p-4">
            <h2 className="text-2xl py-2">Collections Created</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              {collections.map((itm, i) => (
                <div
                  key={i}
                  className="border shadow rounded-xl overflow-hidden"
                >
                  {/* <img src={itm.name} className="rounded" /> */}
                <Link to={`/collection-detail/${itm.address}`}>
                <div className="p-4 bg-white">
                    <p className="text-2xl font-bold text-black">
                   <p>Name : {itm.name}</p>  
                    <p>Symbol : {itm.symbol}</p> 
                    <p>Address : {itm.address}</p> 
                    </p>
                  </div>
                </Link>
          
                </div>
              ))}
            </div>
          </div>
        </>
      )}

    </div>
  );
}
