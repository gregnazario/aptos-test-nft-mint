import React, { Fragment, useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { BloctoWallet } from "@blocto/aptos-wallet-adapter-plugin";
import { FewchaWallet } from "fewcha-plugin-wallet-adapter";
import { MartianWallet } from "@martianwallet/aptos-wallet-adapter";
import { MSafeWalletAdapter } from "@msafe/aptos-wallet-adapter";
import { ShadowWallet } from "@flipperplatform/wallet-adapter-plugin";
import { OKXWallet } from "@okwallet/aptos-wallet-adapter";
import { NightlyWallet } from "@nightlylabs/aptos-wallet-adapter-plugin";
import { OpenBlockWallet } from "@openblockhq/aptos-wallet-adapter";
import { PetraWallet } from "petra-plugin-wallet-adapter";
import { PontemWallet } from "@pontem/wallet-adapter-plugin";
import { RiseWallet } from "@rise-wallet/wallet-adapter";
import { TokenPocketWallet } from "@tp-lab/aptos-wallet-adapter";
import { TrustWallet } from "@trustwallet/aptos-wallet-adapter";
import { WelldoneWallet } from "@welldone-studio/aptos-wallet-adapter";

import {
  AptosWalletAdapterProvider,
  NetworkName,
  useWallet,
} from "@aptos-labs/wallet-adapter-react";
import { Alert, Col, Menu, MenuProps, Row } from "antd";
import { Network } from "aptos";
import { createBrowserHistory } from "history";
import { Route, Routes, useNavigate, useParams } from "react-router";
import { BrowserRouter } from "react-router-dom";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { Buffer as BufferPolyFill } from "buffer";
import { IdentityConnectWallet } from "@identity-connect/wallet-adapter-plugin";
// eslint-disable-next-line import/no-cycle
import App from "./App";
// eslint-disable-next-line import/no-cycle
import { TokenDetails } from "./pages/Token";
// eslint-disable-next-line import/no-cycle
import Launchpad from "./pages/Launchpad";
// eslint-disable-next-line import/no-cycle
import { Wallet } from "./pages/Wallet";

const icDappId = "9cfd33d8-80a9-4e0b-9c7b-195e8a241aa0";

window.Buffer = BufferPolyFill;

/* eslint-disable @typescript-eslint/no-use-before-define */

const DEVNET_WALLETS = [
  new IdentityConnectWallet(icDappId, { networkName: NetworkName.Devnet }),
  new PetraWallet(),
  new FewchaWallet(),
  new MartianWallet(),
  new MSafeWalletAdapter(),
  new NightlyWallet(),
  new OpenBlockWallet(),
  new PontemWallet(),
  new RiseWallet(),
  new ShadowWallet(),
  new TokenPocketWallet(),
  new TrustWallet(),
  new WelldoneWallet(),
];
const TESTNET_WALLETS = [
  new IdentityConnectWallet(icDappId, { networkName: NetworkName.Testnet }),
  new PetraWallet(),
  new BloctoWallet({
    network: NetworkName.Testnet,
    bloctoAppId: "6d85f56e-5f2e-46cd-b5f2-5cf9695b4d46",
  }),
  new FewchaWallet(),
  new MartianWallet(),
  new MSafeWalletAdapter(),
  new NightlyWallet(),
  new OpenBlockWallet(),
  new PontemWallet(),
  new RiseWallet(),
  new ShadowWallet(),
  new TokenPocketWallet(),
  new TrustWallet(),
  new WelldoneWallet(),
];
const MAINNET_WALLETS = [
  new IdentityConnectWallet(icDappId, { networkName: NetworkName.Mainnet }),
  new PetraWallet(),
  new BloctoWallet({
    network: NetworkName.Mainnet,
    bloctoAppId: "6d85f56e-5f2e-46cd-b5f2-5cf9695b4d46",
  }),
  new FewchaWallet(),
  new MartianWallet(),
  new MSafeWalletAdapter(),
  new NightlyWallet(),
  new OKXWallet(),
  new OpenBlockWallet(),
  new PontemWallet(),
  new RiseWallet(),
  new ShadowWallet(),
  new TokenPocketWallet(),
  new TrustWallet(),
  new WelldoneWallet(),
];
const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(
  <React.StrictMode>
    <Selector />
  </React.StrictMode>,
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
};

function Selector(this: any) {
  const browserHistory = createBrowserHistory();
  const network =
    getNetwork(new URLSearchParams(window.location.search).get("network")) ??
    Network.MAINNET;

  useEffect(() => {
    if (
      !getNetwork(new URLSearchParams(window.location.search).get("network"))
    ) {
      browserHistory.push(`?network=${Network.MAINNET}`);
    }
  });
  // <Route path="/collection/:collection_id" element={<Wallet network={network}/>}/>
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route index path="/" element={<AppPage network={network} />} />
          <Route
            path="/wallet/:wallet_address"
            element={<WalletPage network={network} />}
          />
          <Route
            path="/token/:token_id"
            element={<TokenPage network={network} />}
          />
          <Route
            path="/launchpad"
            element={<LaunchpadPage network={network} />}
          />
          <Route path="*" element={<InvalidPage network={network} />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

function InvalidPage(props: { network: Network }) {
  return (
    <>
      <NavBar expectedNetwork={props.network} current={"invalid"} />
      <EasyBorder offset={2}>
        <Alert type="error" message="Invalid page" />
      </EasyBorder>
    </>
  );
}

// TODO: Figure out a better way to handle these
function AppPage(props: { network: Network }) {
  return (
    <Fragment key={"app_page"}>
      {props.network === Network.DEVNET && (
        <AptosWalletAdapterProvider plugins={DEVNET_WALLETS} autoConnect={true}>
          <NavBar expectedNetwork={props.network} current={MARKETPLACE} />
          <App expectedNetwork={props.network} />
        </AptosWalletAdapterProvider>
      )}
      {props.network === Network.TESTNET && (
        <AptosWalletAdapterProvider
          plugins={TESTNET_WALLETS}
          autoConnect={true}
        >
          <NavBar expectedNetwork={props.network} current={MARKETPLACE} />
          <App expectedNetwork={props.network} />
        </AptosWalletAdapterProvider>
      )}
      {props.network === Network.MAINNET && (
        <AptosWalletAdapterProvider
          plugins={MAINNET_WALLETS}
          autoConnect={true}
        >
          <NavBar expectedNetwork={props.network} current={MARKETPLACE} />
          <App expectedNetwork={props.network} />
        </AptosWalletAdapterProvider>
      )}
    </Fragment>
  );
}

export function WalletPage(props: { network: Network }) {
  // FIXME: Allow input of wallet on page, with setting url
  const { wallet_address } = useParams();
  return (
    <Fragment key={"wallet_page"}>
      {props.network === Network.DEVNET && (
        <AptosWalletAdapterProvider plugins={DEVNET_WALLETS} autoConnect={true}>
          <NavBar expectedNetwork={props.network} current={WALLET} />
          <Wallet
            network={props.network}
            wallet_address={wallet_address ?? ""}
          />
        </AptosWalletAdapterProvider>
      )}
      {props.network === Network.TESTNET && (
        <AptosWalletAdapterProvider
          plugins={TESTNET_WALLETS}
          autoConnect={true}
        >
          <NavBar expectedNetwork={props.network} current={WALLET} />
          <Wallet
            network={props.network}
            wallet_address={wallet_address ?? ""}
          />
        </AptosWalletAdapterProvider>
      )}
      {props.network === Network.MAINNET && (
        <AptosWalletAdapterProvider
          plugins={MAINNET_WALLETS}
          autoConnect={true}
        >
          <NavBar expectedNetwork={props.network} current={WALLET} />
          <Wallet
            network={props.network}
            wallet_address={wallet_address ?? ""}
          />
        </AptosWalletAdapterProvider>
      )}
    </Fragment>
  );
}

export function TokenPage(props: { network: Network }) {
  let { token_id } = useParams();
  return (
    <Fragment key={"token_page"}>
      {props.network === Network.DEVNET && (
        <AptosWalletAdapterProvider plugins={DEVNET_WALLETS} autoConnect={true}>
          <NavBar expectedNetwork={props.network} current={WALLET} />
          <TokenDetails network={props.network} token_id={token_id ?? ""} />
        </AptosWalletAdapterProvider>
      )}
      {props.network === Network.TESTNET && (
        <AptosWalletAdapterProvider
          plugins={TESTNET_WALLETS}
          autoConnect={true}
        >
          <NavBar expectedNetwork={props.network} current={WALLET} />
          <TokenDetails network={props.network} token_id={token_id ?? ""} />
        </AptosWalletAdapterProvider>
      )}
      {props.network === Network.MAINNET && (
        <AptosWalletAdapterProvider
          plugins={MAINNET_WALLETS}
          autoConnect={true}
        >
          <NavBar expectedNetwork={props.network} current={WALLET} />
          <TokenDetails network={props.network} token_id={token_id ?? ""} />
        </AptosWalletAdapterProvider>
      )}
    </Fragment>
  );
}

export function LaunchpadPage(props: { network: Network }) {
  return (
    <Fragment key={"launchpad_page"}>
      {props.network === Network.DEVNET && (
        <AptosWalletAdapterProvider plugins={DEVNET_WALLETS} autoConnect={true}>
          <NavBar expectedNetwork={props.network} current={LAUNCHPAD} />
          <Launchpad expectedNetwork={props.network} />
        </AptosWalletAdapterProvider>
      )}
      {props.network === Network.TESTNET && (
        <AptosWalletAdapterProvider
          plugins={TESTNET_WALLETS}
          autoConnect={true}
        >
          <NavBar expectedNetwork={props.network} current={LAUNCHPAD} />
          <Launchpad expectedNetwork={props.network} />
        </AptosWalletAdapterProvider>
      )}
      {props.network === Network.MAINNET && (
        <AptosWalletAdapterProvider
          plugins={MAINNET_WALLETS}
          autoConnect={true}
        >
          <NavBar expectedNetwork={props.network} current={LAUNCHPAD} />
          <Launchpad expectedNetwork={props.network} />
        </AptosWalletAdapterProvider>
      )}
    </Fragment>
  );
}

export function NavBar(props: { expectedNetwork: string; current: string }) {
  const { account } = useWallet();
  const items: MenuProps["items"] = [
    {
      label: "Marketplace",
      key: MARKETPLACE,
    },
    {
      label: "Launchpad",
      key: LAUNCHPAD,
    },
    {
      label: "Wallet",
      key: WALLET,
      disabled: !account?.address,
    },
    {
      label: "Contract Source",
      key: CONTRACT,
    },
    {
      label: "Website Source",
      key: SOURCE,
    },
  ];

  // TODO: load from page
  const navigate = useNavigate();
  const onClick: MenuProps["onClick"] = (e) => {
    if (e.key === WALLET) {
      navigate(`/wallet/${account?.address}?network=${props.expectedNetwork}`);
    } else if (e.key === LAUNCHPAD) {
      navigate(`/launchpad?network=${props.expectedNetwork}`);
    } else if (e.key === MARKETPLACE) {
      navigate(`/?network=${props.expectedNetwork}`);
    } else if (e.key === CONTRACT) {
      window.location.href =
        "https://github.com/aptos-labs/aptos-core/tree/main/aptos-move/move-examples/marketplace";
    } else if (e.key === SOURCE) {
      window.location.href =
        "https://github.com/gregnazario/aptos-test-nft-mint";
    }
  };

  return (
    <EasyBorder offset={2}>
      <Row align={"middle"}>
        <Col span={6}>
          <h1>NFT Playground ({props.expectedNetwork})</h1>
        </Col>
        <Col span={10}>
          <Menu
            onClick={onClick}
            selectedKeys={[props.current]}
            mode="horizontal"
            items={items}
          />
        </Col>
        <Col flex={"auto"} />
        <Col offset={2} span={2}>
          <WalletSelector />
        </Col>
      </Row>
    </EasyBorder>
  );
}

export function EasyBorder(props: {
  offset: number;
  children?: React.ReactNode;
}) {
  return (
    <Row align={"middle"}>
      <Col offset={props.offset} flex={"auto"}>
        {props.children}
      </Col>
      <Col span={props.offset} />
    </Row>
  );
}

export function NetworkChecker(props: {
  expectedNetwork: Network;
  children?: React.ReactNode;
}) {
  const walletContextState = useWallet();
  const isSelectedNetwork = (): boolean => {
    return (
      walletContextState.network?.name?.toLowerCase() ===
      props.expectedNetwork.toLowerCase()
    );
  };

  return (
    <Fragment key={"network_checker"}>
      {!walletContextState.connected && (
        <EasyBorder offset={1}>
          <Alert message={`Please connect your wallet`} type="info" />
        </EasyBorder>
      )}
      {walletContextState.connected && !isSelectedNetwork() && (
        <EasyBorder offset={1}>
          <Alert
            message={`Wallet is connected to ${walletContextState.network?.name}.  Please connect to ${props.expectedNetwork}`}
            type="warning"
          />
        </EasyBorder>
      )}
      {walletContextState.connected && isSelectedNetwork() && (
        <EasyBorder offset={1}>{props.children}</EasyBorder>
      )}
    </Fragment>
  );
}

const LAUNCHPAD = "launchpad";
const MARKETPLACE = "marketplace";
const WALLET = "wallet";
const CONTRACT = "contract";
const SOURCE = "source";
