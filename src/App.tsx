import { useEffect, useState } from "react";
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, IProvider } from "@web3auth/base";
import RPC from "./solanaRPC";
import "./App.css";

import * as apt from "@aptos-labs/ts-sdk";
//Aptos Link npm
import {AptosLink} from "@aptoslink/api"

//Aptos

// Plugins
import { SolanaWalletConnectorPlugin } from "@web3auth/solana-wallet-connector-plugin";

// Adapters
import { SolflareAdapter } from "@web3auth/solflare-adapter";
import { SlopeAdapter } from "@web3auth/slope-adapter";
import { off } from "process";

const clientId = "BCAAiDZXdCWOyncD7Dgtazac1_0C6jQZFxiSKxA-wSv3FW6iFpGi68PW7L5XyE1hRoeeRS3hSh_-rZOg_Ou4eSk"; 

var userAptosAddress="";
var aptlink : AptosLink;

function App() {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [aptosWalletConnected, setAptosWalletConnected] = useState(false);
  // const aptos = useWallet();

  useEffect(() => {
    const init = async () => {
      try {
        const web3auth = new Web3Auth({
          clientId,
          chainConfig: {
            chainNamespace: CHAIN_NAMESPACES.SOLANA,
            chainId: "0x3", // Please use 0x1 for Mainnet, 0x2 for Testnet, 0x3 for Devnet
            rpcTarget: "https://summer-frosty-friday.solana-devnet.quiknode.pro/5430f85cfb9a90ac2763131b24d8a746f2d18825/", // This is the public RPC we have added, please pass on your own endpoint while creating an app
          },
          // uiConfig refers to the whitelabeling options, which is available only on Growth Plan and above
          // Please remove this parameter if you're on the Base Plan
          uiConfig: {
            appName: "Aptos test",
            mode: "light",
            // loginMethodsOrder: ["apple", "google", "twitter"],
            logoLight: "https://web3auth.io/images/web3auth-logo.svg",
            logoDark: "https://web3auth.io/images/web3auth-logo---Dark.svg",
            defaultLanguage: "en", // en, de, ja, ko, zh, es, fr, pt, nl
            loginGridCol: 3,
            primaryButton: "externalLogin", // "externalLogin" | "socialLogin" | "emailLogin"
          },
          web3AuthNetwork: "sapphire_devnet",
        });

        // adding solana wallet connector plugin

        const torusPlugin = new SolanaWalletConnectorPlugin({
          torusWalletOpts: {},
          walletInitOptions: {
            whiteLabel: {
              name: "Whitelabel Demo",
              theme: { isDark: true, colors: { torusBrand1: "#00a8ff" } },
              logoDark: "https://web3auth.io/images/web3auth-logo.svg",
              logoLight: "https://web3auth.io/images/web3auth-logo---Dark.svg",
              topupHide: true,
              defaultLanguage: "en",
            },
            enableLogging: true,
          },
        });
        await web3auth.addPlugin(torusPlugin);

        const solflareAdapter = new SolflareAdapter({
          clientId,
        });
        web3auth.configureAdapter(solflareAdapter);

        const slopeAdapter = new SlopeAdapter({
          clientId,
        });
        web3auth.configureAdapter(slopeAdapter);

        setWeb3auth(web3auth);

        await web3auth.initModal();
        setProvider(web3auth.provider);

        if (web3auth.connected) {
          setLoggedIn(true);
        }
      } catch (error) {
        console.error(error);
      }
    };

    init();
    pageInit()
    //Init check

  }, []);

  const pageInit = async()=>
  {
    // console.log("🔥 Init")
    if(window.location.pathname=="/")
    {
      //Empy , generate a new link and redirect
      const newlink = await AptosLink.create("",window.location.href,"Hello World",true,"");
      console.log(newlink.url.href)
      window.location.replace(newlink.url.href)
    }else{
      //Show what this link means about :
      aptlink = await AptosLink.fromLink(window.location.href)
      console.log("🔥 Found a wallet : ")
      console.log(aptlink)
      console.log(aptlink.keypair.accountAddress.toString())
    }
  }

  const login = async () => {
    if (!web3auth) {
      // uiConsole("web3auth not initialized yet");
      return;
    }
    const web3authProvider = await web3auth.connect();

    if (web3auth.connected) {
      setLoggedIn(true);
      setAptosWalletConnected(true);
      if (!provider) {
        return;
      }
      const rpc = new RPC(provider);
      const privateKey = await rpc.getPrivateKey();
      console.log("🔥 Connected : ",privateKey)
      var acc = solanaPrivateKeyToAptosAccount(privateKey);
      console.log(acc)
      console.log("🔥Aptos address : ",acc.accountAddress.toString())
      userAddressUpdate(acc.accountAddress.toString())
      userAptosAddress = acc.accountAddress.toString();
    }
    setProvider(web3authProvider);
  };

  const logout = async () => {
    if (!web3auth) {
      // uiConsole("web3auth not initialized yet");
      return;
    }
    await web3auth.logout();
    setProvider(null);
    setLoggedIn(false);
    setAptosWalletConnected(false)
  };

  const solanaPrivateKeyToAptosAccount=(sk : string) => 
  {
    var _sk = Uint8Array.from(sk.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)))
    const privateKey = new apt.Ed25519PrivateKey(_sk.slice(0, 32));
    return apt.Account.fromPrivateKey({privateKey})
  };

  //Aptos functions
  const aptosConnect = async ( ) =>{
    // await aptos.connect('martian' as WalletName)
    console.log(window.location.host)
    console.log(window.location.pathname=="/")
    var newlink =await AptosLink.create("","https://"+window.location.host+"/","Hello World",true,"");
    console.log(newlink.url)
  }

  function uiConsole(...args: any[]): void {
    const el = document.querySelector("#console>p");
    if (el) {
      el.innerHTML = JSON.stringify(args || {}, null, 2);
    }
  }

  function userAddressUpdate(data:string): void {
    console.log(data)
    const el = document.querySelector("#aptosWalletAddress");
    el.innerHTML = data
  }
  
  const loggedInView = (
    <>
      <div className="flex-container">
        <div>
          <button onClick={logout} className="card">
            Disconnect Wallet
          </button>
        </div>
      </div>
      {/* <div id="console" style={{ whiteSpace: "pre-line" }}>
        <p style={{ whiteSpace: "pre-line" }}>Logged in Successfully!</p>
      </div> */}
    </>
  );

  const unloggedInView = (
    <button onClick={login} className="card">
      Connect Wallet
    </button>
  );

  const aptosWalletConnectedView = (
    <>
      <div className="flex-container">
      <h2>
        Wallet Connected : <div id ='aptosWalletAddress'></div>
      </h2>
      </div>
    </>
  );

  return (
    <div className="container">
      <h1 className="title">
        <a target="_blank" href="https://github.com/Evmlink/Aptoslink-npm" rel="noreferrer">
          Aptoslink{" "}
        </a>
        Demo site
      </h1>

      <div className="grid">{loggedIn ? loggedInView : unloggedInView}</div>
    
    <div>
    <button onClick={aptosConnect} className="card">
      Debug Button
    </button>
    </div>

    <div className="grid">{aptosWalletConnected ? aptosWalletConnectedView : ""}</div>


      <footer className="footer">
        <a
          href="https://github.com/Evmlink/Aptoslink-npm"
          target="_blank"
          rel="noopener noreferrer"
        >
          Github
        </a>
      </footer>
    </div>
  );
}

export default App;
