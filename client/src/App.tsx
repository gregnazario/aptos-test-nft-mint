import {Alert, Col, Layout, Row} from "antd";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import {Network} from "aptos";
import {useWallet} from "@aptos-labs/wallet-adapter-react";
import Marketplace from './Marketplace';

function App(props: { expectedNetwork: Network }) {
    const walletContextState = useWallet();

    const isSelectedNetwork = (): boolean => {
        return walletContextState.network?.name?.toLowerCase() === props.expectedNetwork.toLowerCase();
    }

    return (
        <>
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
                    <Row align="middle">
                        <Col offset={2} flex={"auto"}>
                            <Marketplace network={props.expectedNetwork}
                                         account={walletContextState.account}
                                         submitTransaction={walletContextState.signAndSubmitTransaction}/>
                        </Col>
                        <Col span={2}/>
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