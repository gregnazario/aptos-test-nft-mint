import {Alert, Col, Image, Layout, Pagination, Row, Tooltip} from "antd";
import {WalletSelector} from "@aptos-labs/wallet-adapter-ant-design";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import {Network} from "aptos";
import {useWallet} from "@aptos-labs/wallet-adapter-react";
import {useEffect, useState} from "react";
import Launchpad from './Launchpad';
import Marketplace from './Marketplace';
import Transfer from './Transfer';
import {getProvider} from "./Helper";

type Item = {
    standard: string,
    collection: string,
    collection_id: string,
    name: string,
    data_id: string,
    uri: string,
    type: string,
    creator_address: string,
    property_version: string
};

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
                    <Wallet network={props.expectedNetwork}/>
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

function Wallet(props: { network: Network }) {
    const [totalNfts, setTotalNfts] = useState<number>(10);
    const [wallet, setWallet] = useState<{
        name: string,
        tokens: {
            standard: string,
            collection: string,
            collection_id: string,
            name: string,
            data_id: string,
            uri: string,
            type: string,
            property_version: string,
            creator_address: string
        }[]
    }>();
    const walletContextState = useWallet();
    useEffect(() => {
        // On load, pull the account's wallet and check that it exists (fund it if it doesn't)
        if (!walletContextState.account) return;

        getTotalNfts();
        loadWalletNfts(0, 10);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [walletContextState])


    const getTotalNfts = async () => {
        if (!walletContextState.account) {
            return {name: "Wallet not connected", nfts: []};
        }

        try {
            // TODO: make a query to get total Nfts

            setTotalNfts(100);
        } catch (error: any) {
            console.log("Failed to load wallet" + error)
            setTotalNfts(10);
        }
    }

    const loadWalletNfts = async (page: number, limit: number) => {
        // Ensure you're logged in
        if (!walletContextState.account) {
            return {name: "Wallet not connected", nfts: []};
        }

        try {
            let tokens_query = await getProvider(props.network).indexerClient.getOwnedTokens(walletContextState.account.address, {
                options: {
                    offset: page * limit,
                    limit: limit
                }
            });

            let tokens: Array<{
                standard: string,
                collection: string,
                collection_id: string,
                name: string,
                data_id: string,
                uri: string,
                type: string,
                property_version: string,
                creator_address: string
            }> = [];
            for (const token_data of tokens_query.current_token_ownerships_v2) {
                if (token_data.token_standard === "v2") {
                    let creator_address = token_data.current_token_data?.current_collection?.creator_address || "";
                    let collection_name = token_data.current_token_data?.current_collection?.collection_name || "";
                    let collection_id = token_data.current_token_data?.current_collection?.collection_id || "";
                    let name = token_data.current_token_data?.token_name || "";
                    let data_id = token_data.current_token_data?.token_data_id || "";
                    let uri = token_data.current_token_data?.token_uri || "";
                    let type = "NFT"
                    if (token_data.is_soulbound_v2 && token_data.is_fungible_v2) {
                        type = "Soulbound Fungible Token";
                    } else if (token_data.is_soulbound_v2) {
                        type = "Soulbound NFT";
                    } else if (token_data.is_fungible_v2) {
                        // Fungible will also skip for now in this demo
                        type = "Fungible Token";
                    }
                    tokens.push({
                        standard: "V2",
                        collection: collection_name,
                        collection_id,
                        name: name,
                        data_id: data_id,
                        uri: uri,
                        type: type,
                        property_version: "",
                        creator_address: creator_address
                    });
                } else {
                    // Handle V1
                    let collection_creator = token_data.current_token_data?.current_collection?.creator_address || "";
                    let collection_name = token_data.current_token_data?.current_collection?.collection_name || "";
                    let collection_id = token_data.current_token_data?.current_collection?.collection_id || "";
                    let name = token_data.current_token_data?.token_name || "";
                    let data_id = token_data.current_token_data?.token_data_id || "";
                    let uri = token_data.current_token_data?.token_uri || "";

                    // Support URI in metadata
                    // TODO: Verify all image endings
                    try {
                        uri = await ensureImageUri(uri);
                    } catch(error: any) {
                        console.log(`Failed to query ${uri} ${error}`)
                    }

                    let property_version = token_data.current_token_data?.largest_property_version_v1 || 0;
                    let type = "NFT" // TODO: Handle fungible
                    tokens.push({
                        standard: "V1",
                        collection: collection_name,
                        collection_id,
                        name: name,
                        data_id: data_id,
                        uri: uri,
                        type: type,
                        property_version: property_version,
                        creator_address: collection_creator
                    });
                }
            }

            setWallet({name: walletContextState.account.address, tokens: tokens})
            return
        } catch (error: any) {
            console.log("Failed to load wallet" + error)
        }

        setWallet({name: "Unable to load wallet", tokens: []})
    }

    return <><Row align="middle">
        <Col offset={2}>
            <h2>Wallet {wallet?.name}</h2>
        </Col>
    </Row>
        <Row>
            <Col offset={2}>
                {wallet?.tokens.map((item) =>
                    <WalletItem item={item}/>
                )}
            </Col>
        </Row>
        <Row>
            <Col offset={2}>
                <Pagination onChange={(page, limit) => {
                    loadWalletNfts(page - 1, limit)
                }} defaultCurrent={1} total={totalNfts}/>
            </Col>
        </Row>
    </>;
}

function WalletItem(props: {
    item: Item
}) {
    // TODO: Add listing directly
    return <Row align="middle">
        <Col>
            <Tooltip placement="right"
                     title={`${props.item.standard} ${props.item.type}\n
                                        Data id: ${props.item.data_id}
                                        `}>

                <Image
                    width={100}
                    src={props.item.uri}
                    alt={props.item.name}
                />
            </Tooltip>
            <b>{props.item.collection} : {props.item.name}</b>
            {props.item.standard.toLowerCase() === "v1" &&
                <p>Creator: {props.item.creator_address} Property Version: {props.item.property_version}</p>}
            {props.item.standard.toLowerCase() === "v2" &&
                <p>Collection Address: {props.item.collection_id} Token Address: {props.item.data_id}</p>}
        </Col>
    </Row>;
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