import React, {useEffect} from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {BloctoWallet} from "@blocto/aptos-wallet-adapter-plugin";
import {FewchaWallet} from "fewcha-plugin-wallet-adapter";
import {MartianWallet} from "@martianwallet/aptos-wallet-adapter";
import {NightlyWallet} from "@nightlylabs/aptos-wallet-adapter-plugin";
import {OpenBlockWallet} from "@openblockhq/aptos-wallet-adapter";
import {PetraWallet} from "petra-plugin-wallet-adapter";
import {PontemWallet} from "@pontem/wallet-adapter-plugin";
import {RiseWallet} from "@rise-wallet/wallet-adapter";
import {TokenPocketWallet} from "@tp-lab/aptos-wallet-adapter";
import {TrustWallet} from "@trustwallet/aptos-wallet-adapter";
import {MSafeWalletAdapter} from "msafe-plugin-wallet-adapter";
import {WelldoneWallet} from "@welldone-studio/aptos-wallet-adapter";

import {AptosWalletAdapterProvider, NetworkName,} from "@aptos-labs/wallet-adapter-react";
import {Alert} from "antd";
import {Network} from "aptos";
import {createBrowserHistory} from "history";
import {Route, Routes, useParams} from "react-router";
import {BrowserRouter} from "react-router-dom";
import {Wallet} from "./pages/Wallet";


const DEVNET_WALLETS = [
    new FewchaWallet(),
    new MartianWallet(),
    new MSafeWalletAdapter(),
    new NightlyWallet(),
    new OpenBlockWallet(),
    new PetraWallet(),
    new PontemWallet(),
    new RiseWallet(),
    new TokenPocketWallet(),
    new TrustWallet(),
    new WelldoneWallet()];
const TESTNET_WALLETS = [
    new BloctoWallet({
        network: NetworkName.Testnet,
        bloctoAppId: "6d85f56e-5f2e-46cd-b5f2-5cf9695b4d46",
    }),
    new FewchaWallet(),
    new MartianWallet(),
    new MSafeWalletAdapter(),
    new NightlyWallet(),
    new OpenBlockWallet(),
    new PetraWallet(),
    new PontemWallet(),
    new RiseWallet(),
    new TokenPocketWallet(),
    new TrustWallet(),
    new WelldoneWallet()];
const MAINNET_WALLETS = [
    new BloctoWallet({
        network: NetworkName.Mainnet,
        bloctoAppId: "6d85f56e-5f2e-46cd-b5f2-5cf9695b4d46",
    }),
    new FewchaWallet(),
    new MartianWallet(),
    new MSafeWalletAdapter(),
    new NightlyWallet(),
    new OpenBlockWallet(),
    new PetraWallet(),
    new PontemWallet(),
    new RiseWallet(),
    new TokenPocketWallet(),
    new TrustWallet(),
    new WelldoneWallet()];
const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);
root.render(
    <React.StrictMode>
        <Selector/>
    </React.StrictMode>
);

const getNetwork = (input: string | null) => {
    if (input?.toLowerCase() === "devnet") {
        return Network.DEVNET;
    } else if (input?.toLowerCase() === "testnet") {
        return Network.TESTNET;
    } else if (input?.toLowerCase() === "mainnet") {
        return Network.MAINNET;
    } else {
        return undefined;
    }
}

function Selector(this: any) {
    const browserHistory = createBrowserHistory();
    const network = getNetwork(new URLSearchParams(window.location.search).get("network")) ?? Network.MAINNET;

    useEffect(() => {
        if (!getNetwork(new URLSearchParams(window.location.search).get("network"))) {
            browserHistory.push(`?network=${Network.MAINNET}`);
        }
    });
    //<Route path="/collection/:collection_id" element={<Wallet network={network}/>}/>
    return <>
        <BrowserRouter>
            <Routes>
                <Route index path="/" element={<AppPage network={network}/>}/>
                <Route path="/wallet/:wallet_address" element={<WalletPage network={network}/>}/>
                <Route path="*" element={<Alert type="error" message="Invalid page"/>}/>
            </Routes>
        </BrowserRouter>
    </>
}

// TODO: Figure out a better way to handle these
function AppPage(props: {
    network: Network
}) {
    return <>{props.network === Network.DEVNET &&
        <AptosWalletAdapterProvider plugins={DEVNET_WALLETS} autoConnect={true}>
            <App expectedNetwork={props.network}/>
        </AptosWalletAdapterProvider>
    }
        {
            props.network === Network.TESTNET &&
            <AptosWalletAdapterProvider plugins={TESTNET_WALLETS} autoConnect={true}>
                <App expectedNetwork={props.network}/>
            </AptosWalletAdapterProvider>
        }
        {
            props.network === Network.MAINNET &&
            <AptosWalletAdapterProvider plugins={MAINNET_WALLETS} autoConnect={true}>
                <App expectedNetwork={props.network}/>
            </AptosWalletAdapterProvider>
        }
    </>
}

export function WalletPage(props: { network: Network }) {
    let {wallet_address} = useParams();
    return <>{props.network === Network.DEVNET &&
        <AptosWalletAdapterProvider plugins={DEVNET_WALLETS} autoConnect={true}>
            <Wallet network={props.network} wallet_address={wallet_address ?? ""}/>
        </AptosWalletAdapterProvider>
    }
        {
            props.network === Network.TESTNET &&
            <AptosWalletAdapterProvider plugins={TESTNET_WALLETS} autoConnect={true}>
                <Wallet network={props.network} wallet_address={wallet_address ?? ""}/>
            </AptosWalletAdapterProvider>
        }
        {
            props.network === Network.MAINNET &&
            <AptosWalletAdapterProvider plugins={MAINNET_WALLETS} autoConnect={true}>
                <Wallet network={props.network} wallet_address={wallet_address ?? ""}/>
            </AptosWalletAdapterProvider>
        }
    </>
}


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
