import { useState , useEffect} from "react";
import { ethers } from "ethers";
import { create as ipfsHttpClient } from "ipfs-http-client";
import { useNavigate, useParams } from 'react-router'
import { useWeb3React } from "@web3-react/core";
import Web3Modal from "web3modal";
import axios from 'axios'
import { nftaddress, nftmarketaddress } from "../config";
import Market from "./../artifacts/contracts/Market.sol/Market.json";
import NFT from "./../artifacts/contracts/NFT.sol/NFT.json";
import Collection from "./../artifacts/contracts/Collection.sol/Collection.json";

const client = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0");
function CollectionDetail() {
  const {
    library,
    account,
    chainId,

  } = useWeb3React();
    const [auction, setAuction] = useState(false);
    const [endingUnix, setEndingUnix] = useState(0);
    const [error, setError] = useState()
    const [price, setPrice] = useState()
    const [fileUrl, setFileUrl] = useState(null);
    const [formInput, updateFormInput] = useState({
      name: "",
      description: "",
    });
    const { collAdd } = useParams();
    const [collection, setCollection] = useState([]);
    const [modalstate, setModalstate] = useState(false);
    const [saleModalstate, setSaleModalstate] = useState(false);
    const [nfts, setNfts] = useState([]);
    // const [sold, setSold] = useState([]);
    const [loadingState, setLoadingState] = useState("not-loaded");
    const [collectionloadingState, setCollectionLoadingState] = useState("not-loaded");
 
    useEffect(() => {
      (async () => {
        if (library && account) {
          try {
            loadData()
            // loadNFTs()
          }
          catch (error) {
            console.log("Error ", error.message);
          }
          return () => {
  
          };
        }
      })();
    }, [library, account, chainId]);


    async function onChange(e) {
        const file = e.target.files[0];
        try {
          const added = await client.add(file, {
            progress: (prog) => console.log(`received: ${prog}`),
          });
          const url = `https://ipfs.infura.io/ipfs/${added.path}`;
          setFileUrl(url);
        } catch (error) {
          setError(`Error uploading file: ${error}`)
          console.log("Error uploading file: ", error);
        }
      }
    async function create() {
        setError("")
        const { name, description } = formInput;
        if (!name || !description || !fileUrl) return setError("Kindly provide the required fields");
 /* first, upload to IPFS */
        const data = JSON.stringify({
          name,
          description,
          image: fileUrl,
        });
        try {
          const added = await client.add(data);
          const url = `${added.path}`;
          /* after file is uploaded to IPFS, pass the URL to save it on Polygon */
          createNFT(url);
        } catch (error) {
          setError(`Error uploading file: ${error}`)
          console.log("Error uploading file: ", error);
        }
      }
    
async function createNFT(url) {
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
            let collectionAddress =  ethers.utils.getAddress(`${collAdd}`)
            const CollectionContract = new ethers.Contract(
              collectionAddress,
                  Collection.abi,
                  signer
                );
            let transaction = await CollectionContract.createToken(url);
            let tx = await transaction.wait();
            let event = tx.events[0];
            let value = event.args[2];
            let tokenId = value.toNumber();
        console.log("tkn id", tokenId)
          setModalstate(false)
    } catch (error) {
      setError(`${error.message}`)
      console.log("error", error)
    }
    
      }

    async function loadData() {
        try {
          const web3Modal = new Web3Modal();
          const connection = await web3Modal.connect();
          const provider = new ethers.providers.Web3Provider(connection);
          const signer = provider.getSigner();
          // const address = signer.provider.provider.selectedAddress;
         const CollectionContract = new ethers.Contract(
                 collAdd ,
                Collection.abi,
                provider
              );
              const name = await CollectionContract.name();
              const symbol = await CollectionContract.symbol();
              let collectionObj =  {
                name,
                symbol,
                collAdd
              };
    
          setCollection(collectionObj);
          setLoadingState("loaded")
        } catch (error) {
          console.log("erro", error);
        }
      }

      async function loadNFTS() {
        try {
          const web3Modal = new Web3Modal();
          const connection = await web3Modal.connect();
          const provider = new ethers.providers.Web3Provider(connection);
          const signer = provider.getSigner();
           const myAddress = signer.provider.provider.selectedAddress;
          const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
          let collectionAddress =  ethers.utils.getAddress(`${collAdd}`)
          const CollectionContract = new ethers.Contract(collectionAddress,Collection.abi,signer);
          let  balOfOwner = await CollectionContract.balanceOf(myAddress)
          console.log("bal of owner", balOfOwner.toNumber())
          let items =[]
  for (let index = 0; index < balOfOwner.toNumber(); index++) {
    try {
      const tokenIndex = await CollectionContract.tokenOfOwnerByIndex(myAddress, index)
      const tokenUri = await CollectionContract.tokenURI(tokenIndex.toString())
       const meta = await axios.get(tokenUri)
        let item = {
      tokenId: tokenIndex,
      image: meta.data.image,
      name: meta.data.name
    }
    items.push(item)
    } catch (error) {
      console.log("err uri", error)
    }
  }
setNfts(items)
          setLoadingState("loaded")
     
 } catch (error) {
          console.log("erro", error);
        }
      }

      async function createSale(tokenId){
        let signer;
                if(auction){
          if(!endingUnix || !price) return setError("Kindly provide the required fields");
          const web3Modal = new Web3Modal();
          const connection = await web3Modal.connect();
          const provider = new ethers.providers.Web3Provider(connection);
          signer = provider.getSigner();
          try {
            const ethprice = ethers.utils.parseUnits(price, "ether");
              let NFTMarketcontract = new ethers.Contract(nftmarketaddress, Market.abi,signer );
              let collectionAddress =  ethers.utils.getAddress(`${collAdd}`)
              let  transaction = await NFTMarketcontract.createMarketItem(collectionAddress, tokenId, ethprice,auction,endingUnix)
               await transaction.wait();
               setSaleModalstate(false)
               console.log("trans", transaction)
        
          } catch (error) {
            console.log("catch erre", error)
          }

        }else{
          if(!price) return setError("Kindly provide the required fields");
          const web3Modal = new Web3Modal();
            const connection = await web3Modal.connect();
            const provider = new ethers.providers.Web3Provider(connection);
            signer = provider.getSigner();
        try {
          const ethprice = ethers.utils.parseUnits(price, "ether");
          /* then list the item for sale on the marketplace */
          let NFTMarketcontract = new ethers.Contract(nftmarketaddress, Market.abi,signer );
          let listingPrice = await NFTMarketcontract.getListingPrice();
          listingPrice = listingPrice.toString();
          let collectionAddress =  ethers.utils.getAddress(`${collAdd}`)
         let  transaction = await NFTMarketcontract.createMarketItem(collectionAddress, tokenId, ethprice,auction,endingUnix)
          await transaction.wait();
          console.log("trans", transaction)
          setSaleModalstate(false)
      
        } catch (error) {
          console.log("catch erre", error)
        }
      }}
      if (!account) {
        //  setConnectError("Connect wallet")
        return <h1>connect wallet</h1>
      }
    return (
        <div className="flex justify-center " style={{flexDirection:"column", width:"100%"}}>
                       <p className="py-1 px-10 text-3xl">{collection.name}</p>
           <p className="py-1 px-10 text-3xl">{collection.symbol}</p>
           <p className="py-1 px-10 text-3xl">{collection.collAdd}</p>
             <button className="py-5 px-10 text-1xl bg-red-300 text-white text-center w-40"  style={{margin:"0 auto"}}   onClick={()=>{setModalstate(true)}}>Mint NFTs</button>
             <div className="flex justify-center">
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
            nfts.map((nft, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden">
                <img src={nft.image} className="rounded" />
                <div className="p-4 bg-black">
                  <p className="text-2xl font-bold text-white">
                    {nft.name}</p>
                    <button
          onClick={()=> setSaleModalstate(true)}
          className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg"
          >
          Create Sale
        </button>
        <div  
    className={saleModalstate ? "mintmodal" : "none"} >
                <div className="modal-content">
                    <span onClick={()=>{setSaleModalstate(false)}} className="close">&times;</span>
                    <h1 className="text-center text-5xl font-bold bg-white">Create NFTs</h1>
    <div className="flex justify-center">
      <div className="w-1/2 flex flex-col pb-12">
      <p>{error}</p>
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
          onClick={( )=> createSale(nft.tokenId)}
          className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg"
          >
          Create
        </button>
      </div>
    </div>
                </div>

                </div>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
           

                <div  
    className={modalstate ? "mintmodal" : "none"} >
                <div className="modal-content">
                    <span onClick={()=>{setModalstate(false)}} className="close">&times;</span>
                    <h1 className="text-center text-5xl font-bold bg-white">Create NFTs</h1>
    <div className="flex justify-center">
      <div className="w-1/2 flex flex-col pb-12">
      <p>{error}</p>
        <input
          placeholder="Asset Name"
          className="mt-8 border rounded p-4"
          onChange={(e) =>
            updateFormInput({ ...formInput, name: e.target.value })
          }
        />
        <textarea
          placeholder="Asset Description"
          className="mt-2 border rounded p-4"
          onChange={(e) =>
            updateFormInput({ ...formInput, description: e.target.value })
          }
        />
        <input type="file" name="Asset" className="my-4" onChange={onChange} />
        {fileUrl && <img className="rounded mt-4" width="350" src={fileUrl} />}  
        <button
          onClick={create}
          className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg"
          >
          Create Digital Asset
        </button>
      </div>
    </div>
                </div>

                </div>
        </div>
        
    )
}

export default CollectionDetail
