import {Alert, Col, Layout, Row} from "antd";
import {WalletSelector} from "@aptos-labs/wallet-adapter-ant-design";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import {Network} from "aptos";
import {useWallet} from "@aptos-labs/wallet-adapter-react";
import Launchpad from './Launchpad';
import Marketplace from './Marketplace';
import Transfer from './Transfer';
import {Wallet} from "./pages/Wallet";

function App(props: { expectedNetwork: Network }) {
    const walletContextState = useWallet();

    const isSelectedNetwork = (): boolean => {
        return walletContextState.network?.name?.toLowerCase() === props.expectedNetwork.toLowerCase();
    }

    return (
        <>
            <Layout>
                <Row align="middle">
                    <Col span={10} offset={2}>
                        <h1>NFT Test Marketplace ({props.expectedNetwork})</h1>
                    </Col>
                    <Col span={12} style={{textAlign: "right", paddingRight: "200px"}}>
                        <WalletSelector/>
                    </Col>
                </Row>
            </Layout>
            {
                !walletContextState.connected &&
                <Alert message={`Please connect your wallet`} type="info"/>
            }
            {
                walletContextState.connected && !isSelectedNetwork() &&
                <Alert
                    message={`Wallet is connected to ${walletContextState.network?.name}.  Please connect to ${props.expectedNetwork}`}
                    type="warning"/>
            }
            {
                walletContextState.connected && isSelectedNetwork() &&
                <Layout>
                    <Wallet network={props.expectedNetwork} wallet_address={walletContextState.account?.address ?? ""}/>
                    <Row align="middle">
                        <Col offset={2}>
                            <Launchpad network={props.expectedNetwork}
                                       account={walletContextState.account}
                                       submitTransaction={walletContextState.signAndSubmitTransaction}/>
                        </Col>
                    </Row>
                    <Row align="middle">
                        <Col offset={2}>
                            <Marketplace network={props.expectedNetwork}
                                         account={walletContextState.account}
                                         submitTransaction={walletContextState.signAndSubmitTransaction}/>
                        </Col>
                    </Row>
                    <Row align="middle">
                        <Col offset={2}>
                            <Transfer network={props.expectedNetwork}
                                      account={walletContextState.account}
                                      submitTransaction={walletContextState.signAndSubmitTransaction}/>
                        </Col>
                    </Row>
                </Layout>
            }
        </>
    );
}

export const ensureImageUri = async (uri: string) => {
    // Empty means something's wrong anyways
    if (!uri) {
        return uri
    }
    try {
        if (!uri.endsWith(".jpg") && !uri.endsWith(".jpeg") && !uri.endsWith(".png") && !uri.endsWith(".svg")) {
            uri = ensureHttps(uri);
            let response = await fetch(uri);
            const data = await response.json()
            if (data.image) {
                uri = ensureHttps(data.image);
            }
        }
    } catch (error: any) {
        // Let the URI stay as the old one for now
    }
    return uri
}

export const ensureHttps = (uri: string): string => {
    if (uri.startsWith("ipfs://")) {
        uri = uri.replace("ipfs://", "https://cloudflare-ipfs.com/ipfs/")
    }
    return uri
}

export default App;