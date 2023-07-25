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

import {AptosWalletAdapterProvider, NetworkName, useWallet,} from "@aptos-labs/wallet-adapter-react";
import {Alert, Col, Menu, MenuProps, Row} from "antd";
import {Network} from "aptos";
import {createBrowserHistory} from "history";
import {Route, Routes, useNavigate, useParams} from "react-router";
import {BrowserRouter} from "react-router-dom";
import {Wallet} from "./pages/Wallet";
import {WalletSelector} from "@aptos-labs/wallet-adapter-ant-design";
import Launchpad from "./pages/Launchpad";


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
    if (input?.toLowerCase() === Network.DEVNET.toLowerCase()) {
        return Network.DEVNET;
    } else if (input?.toLowerCase() === Network.TESTNET.toLowerCase()) {
        return Network.TESTNET;
    } else if (input?.toLowerCase() === Network.MAINNET.toLowerCase()) {
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
                <Route path="/launchpad" element={<LaunchpadPage network={network}/>}/>
                <Route path="*" element={<InvalidPage network={network}/>}/>
            </Routes>
        </BrowserRouter>
    </>
}

function InvalidPage(props: {
    network: Network
}) {
    return <>
        <NavBar expectedNetwork={props.network} current={'invalid'}/>
        <Alert type="error" message="Invalid page"/>
    </>
}

// TODO: Figure out a better way to handle these
function AppPage(props: {
    network: Network
}) {
    return <>
        {props.network === Network.DEVNET &&
            <AptosWalletAdapterProvider plugins={DEVNET_WALLETS} autoConnect={true}>
                <NavBar expectedNetwork={props.network} current={MARKETPLACE}/>
                <App expectedNetwork={props.network}/>
            </AptosWalletAdapterProvider>
        }
        {
            props.network === Network.TESTNET &&
            <AptosWalletAdapterProvider plugins={TESTNET_WALLETS} autoConnect={true}>
                <NavBar expectedNetwork={props.network} current={MARKETPLACE}/>
                <App expectedNetwork={props.network}/>
            </AptosWalletAdapterProvider>
        }
        {
            props.network === Network.MAINNET &&
            <AptosWalletAdapterProvider plugins={MAINNET_WALLETS} autoConnect={true}>
                <NavBar expectedNetwork={props.network} current={MARKETPLACE}/>
                <App expectedNetwork={props.network}/>
            </AptosWalletAdapterProvider>
        }
    </>
}

export function WalletPage(props: { network: Network }) {
    // FIXME: Allow input of wallet on page, with setting url
    let {wallet_address} = useParams();
    return <>
        {props.network === Network.DEVNET &&
            <AptosWalletAdapterProvider plugins={DEVNET_WALLETS} autoConnect={true}>
                <NavBar expectedNetwork={props.network} current={WALLET}/>
                <Wallet network={props.network} wallet_address={wallet_address ?? ""}/>
            </AptosWalletAdapterProvider>
        }
        {
            props.network === Network.TESTNET &&
            <AptosWalletAdapterProvider plugins={TESTNET_WALLETS} autoConnect={true}>
                <NavBar expectedNetwork={props.network} current={WALLET}/>
                <Wallet network={props.network} wallet_address={wallet_address ?? ""}/>
            </AptosWalletAdapterProvider>
        }
        {
            props.network === Network.MAINNET &&
            <AptosWalletAdapterProvider plugins={MAINNET_WALLETS} autoConnect={true}>
                <NavBar expectedNetwork={props.network} current={WALLET}/>
                <Wallet network={props.network} wallet_address={wallet_address ?? ""}/>
            </AptosWalletAdapterProvider>
        }
    </>
}


export function LaunchpadPage(props: { network: Network }) {
    return <>
        {props.network === Network.DEVNET &&
            <AptosWalletAdapterProvider plugins={DEVNET_WALLETS} autoConnect={true}>
                <NavBar expectedNetwork={props.network} current={LAUNCHPAD}/>
                <Launchpad expectedNetwork={props.network}/>
            </AptosWalletAdapterProvider>
        }
        {
            props.network === Network.TESTNET &&
            <AptosWalletAdapterProvider plugins={TESTNET_WALLETS} autoConnect={true}>
                <NavBar expectedNetwork={props.network} current={LAUNCHPAD}/>
                <Launchpad expectedNetwork={props.network}/>
            </AptosWalletAdapterProvider>
        }
        {
            props.network === Network.MAINNET &&
            <AptosWalletAdapterProvider plugins={MAINNET_WALLETS} autoConnect={true}>
                <NavBar expectedNetwork={props.network} current={LAUNCHPAD}/>
                <Launchpad expectedNetwork={props.network}/>
            </AptosWalletAdapterProvider>
        }
    </>
}


export function NavBar(props: { expectedNetwork: string, current: string }) {
    const {account} = useWallet();
    const items: MenuProps['items'] = [
        {
            label: 'Marketplace',
            key: MARKETPLACE,
        },
        {
            label: 'Launchpad',
            key: LAUNCHPAD,
        },
        {
            label: 'Wallet',
            key: WALLET,
            disabled: !account?.address,
        },
        {
            label: 'Contract Source',
            key: CONTRACT,
        },
        {
            label: 'Website Source',
            key: SOURCE,
        },
    ];

    // TODO: load from page
    const navigate = useNavigate();
    const onClick: MenuProps['onClick'] = (e) => {
        if (e.key === WALLET) {
            navigate(`/wallet/${account?.address}`,)
        } else if (e.key === LAUNCHPAD) {
            navigate(`/launchpad`,)
        } else if (e.key === MARKETPLACE) {
            navigate(`/`,)
        } else if (e.key === CONTRACT) {
            window.location.href = "https://github.com/aptos-labs/aptos-core/tree/main/aptos-move/move-examples/marketplace"
        } else if (e.key === SOURCE) {
            window.location.href = "https://github.com/gregnazario/aptos-test-nft-mint"
        }
    };

    return <> <Row align="middle">
        <Col offset={2} span={16}>
            <h1>NFT Playground ({props.expectedNetwork})</h1>
        </Col>
    </Row>
        <Row align={"middle"}>
            <Col offset={2} span={16}>
                <Menu onClick={onClick} selectedKeys={[props.current]} mode="horizontal" items={items}/>
            </Col>
            <Col offset={2} span={2}>
                <WalletSelector/>
            </Col>
        </Row>
    </>;
}

const LAUNCHPAD = "launchpad";
const MARKETPLACE = "marketplace";
const WALLET = "wallet";
const CONTRACT = "contract";
const SOURCE = "source";

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
