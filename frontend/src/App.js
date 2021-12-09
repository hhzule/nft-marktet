import { useState } from 'react';
import "./App.css";
import Navbar from "./components/Navbar";
import { Routes, Route} from "react-router-dom";
import CreateItem from "./components/CreateItem"
import CreatorDashboard from "./components/CreatorDashboard"
import Home from "./components/Main"
import MyAssets from "./components/MyAssets"
import Collections from "./components/Collections";
import Auctions from "./components/Auctions";
import CollectionDetail from "./components/CollectionDetail";
import { useEagerConnect, useInactiveListener } from './hooks/useEagerConnect';

const App = () => {
  const [errorMessage, setErrorMessage] = useState();
  useEagerConnect(setErrorMessage);
  useInactiveListener();
  return (
    <div className="App">
      {
        errorMessage ? <div style={{ color: "red" }}>{errorMessage}</div> : null
      }
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create-item" element={<CreateItem />} />
        <Route path="/creator-dashboard" element={<CreatorDashboard />} />
        <Route path="/my-assets" element={<MyAssets />} />
        <Route path="/create-collection" element={<Collections />} />
        <Route path="/collection-detail/:id" element={<CollectionDetail />} />
        <Route path="/auctions" element={<Auctions />} />
      </Routes>

    </div>
  );
};


export default App;
