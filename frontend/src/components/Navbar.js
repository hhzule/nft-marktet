import React,{ useState, useEffect} from "react";
import { ethers } from 'ethers'
import usericon from "../assets/user.png";
import { useWeb3React } from "@web3-react/core"
import Web3Modal from "web3modal"
import { Link, NavLink } from "react-router-dom";
import { injectedConnector } from "../utils/connectors";

let rpcEndpoint = "https://polygon-mumbai.infura.io/v3/89aa0cf029e948ee883b0bf906f2f3df"

const Navbar = (props) => {
const [active, setActive] = useState()
const [auth, setAuth] = useState()
    const {activate} = useWeb3React();
 useEffect(()=>{
  (async ()=>{
            const isAuthorized = await injectedConnector.isAuthorized();
          setAuth(isAuthorized)
            if(isAuthorized) {
                await activate(injectedConnector, async (error) => {
                    console.log({ error });
                    // setErrorMessageFun(error.message);
                });
            }
        })();
    },[activate])
console.log("auth", auth)
const connectWallet=async ()=>{
  try {
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
    setActive(true)
  } catch (error) {
    console.log("err", error)
  }

}

  return (
    <div className="navbar">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", width: "50%" }} className="linkbar">
          <NavLink
            className={({ isActive }) => (isActive ? "active" : "inactive")}
            to="/"
          >
            <a>MarketPlace</a>
          </NavLink>

          <NavLink
            className={({ isActive }) => (isActive ? "active" : "inactive")}
            to="/my-assets"
          >
            <a>My Assets</a>
          </NavLink>

          <div class="dropdown">
            <span>Create</span>
            <div class="dropdown-content">
              <NavLink
                className={({ isActive }) => (isActive ? "active" : "inactive")}
                to="/create-item"
              >
                NFTs
              </NavLink>
              <NavLink
                className={({ isActive }) => (isActive ? "active" : "inactive")}
                to="/create-collection"
              >
                Collections
              </NavLink>
            </div>
          </div>

          <NavLink to="/creator-dashboard">
            <a>Created Assets</a>
          </NavLink>
          <NavLink
            className={({ isActive }) => (isActive ? "active" : "inactive")}
            to="/auctions"
          >
            <a>Auctions</a>
          </NavLink>
        </div>
        <div style={{ width: "5%" }}>
          <img style={{ width: "45%" }} src={usericon} alt="" />
        </div>
      </div>

      <div style={{ display:"flex", flexGrow:"6", justifyContent:"flex-end", paddingRight:"10px" }}   >
            {
                auth? <div style={{display:"inline-block", backgroundColor:"white", borderRadius:"40px", 
                                padding:"8px", border:"1px dashed black", marginLeft:"10px",marginTop:"10px"}}
                                >Connected</div>
                    :
                    <div style={{display:"inline-block", backgroundColor:"white", borderRadius:"40px", 
                                    padding:"8px", border:"1px dashed black", marginLeft:"10px",marginTop:"10px", cursor: "pointer"}}
                                    onClick={()=>{
                                        connectWallet();
                                    }}
                                    >Connect Wallet</div>
            }
        </div>
        
    </div>
  );
};

export default Navbar;





  