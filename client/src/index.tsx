import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {FewchaWallet} from "fewcha-plugin-wallet-adapter";
import {MartianWallet} from "@martianwallet/aptos-wallet-adapter";
import {PetraWallet} from "petra-plugin-wallet-adapter";
import {PontemWallet} from "@pontem/wallet-adapter-plugin";
import {RiseWallet} from "@rise-wallet/wallet-adapter";
import {MSafeWalletAdapter} from "msafe-plugin-wallet-adapter";
import {
    AptosWalletAdapterProvider,
    NetworkName,
} from "@aptos-labs/wallet-adapter-react";


const wallets = [
    // Blocto supports Testnet/Mainnet for now.
    new FewchaWallet(),
    new MartianWallet(),
    new MSafeWalletAdapter(),
    new PetraWallet(),
    new PontemWallet(),
    new RiseWallet(),
];
const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);
root.render(
    <React.StrictMode>
        <AptosWalletAdapterProvider plugins={wallets} autoConnect={true}>
            <App/>
        </AptosWalletAdapterProvider>
    </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
