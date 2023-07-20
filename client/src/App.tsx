import {Alert, Button, Col, Image, Layout, Row, Tooltip} from "antd";
import {WalletSelector} from "@aptos-labs/wallet-adapter-ant-design";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import {Network} from "aptos";
import {useWallet} from "@aptos-labs/wallet-adapter-react";
import {useEffect, useState} from "react";
import Launchpad from './Launchpad';
import Marketplace from './Marketplace';
import Transfer from './Transfer';
import {getProvider} from "./Helper";

function App(props: { expectedNetwork: Network }) {
    // TODO Consolidate a lot of these
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

        loadWalletNfts();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [walletContextState])

    const loadWalletNfts = async () => {
        // Ensure you're logged in
        if (!walletContextState.account) {
            return {name: "Wallet not connected", nfts: []};
        }

        try {
            // TODO: Add pagination
            let tokens_query = await getProvider(props.expectedNetwork).indexerClient.getOwnedTokens(walletContextState.account.address, {
                options: {
                    offset: 0,
                    limit: 10
                }
            });

            let tokens = tokens_query.current_token_ownerships_v2.map(token_data => {
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
                    return {
                        standard: "V2",
                        collection: collection_name,
                        collection_id,
                        name: name,
                        data_id: data_id,
                        uri: uri,
                        type: type,
                        property_version: "",
                        creator_address: creator_address
                    }
                } else {
                    // Handle V1
                    let collection_creator = token_data.current_token_data?.current_collection?.creator_address || "";
                    let collection_name = token_data.current_token_data?.current_collection?.collection_name || "";
                    let collection_id = token_data.current_token_data?.current_collection?.collection_id || "";
                    let name = token_data.current_token_data?.token_name || "";
                    let data_id = token_data.current_token_data?.token_data_id || "";
                    let uri = token_data.current_token_data?.token_uri || "";
                    let property_version = token_data.current_token_data?.largest_property_version_v1 || "";
                    let type = "NFT" // TODO: Handle fungible
                    return {
                        standard: "V1",
                        collection: collection_name,
                        collection_id,
                        name: name,
                        data_id: data_id,
                        uri: uri,
                        type: type,
                        property_version: property_version,
                        creator_address: collection_creator
                    }
                }
            })

            setWallet({name: walletContextState.account.address, tokens: tokens})
            return
        } catch (error: any) {
            console.log("Failed to load wallet" + error)
        }

        setWallet({name: "Unable to load wallet", tokens: []})
    }

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
                    <Row align="middle">
                        <Col offset={2}>
                            <h2>Wallet {wallet?.name}</h2>
                        </Col>
                    </Row>
                    <Row align="middle">
                        <Col offset={2}>
                            <Button
                                onClick={() => loadWalletNfts()}
                                type="primary"
                                style={{height: "40px", backgroundColor: "#3f67ff"}}
                            >
                                Force refresh NFTs
                            </Button>
                        </Col>
                    </Row>
                    <Row>
                        <Col offset={2}>
                            <ol>
                                {wallet?.tokens.map(({
                                                         standard,
                                                         collection,
                                                         collection_id,
                                                         name,
                                                         data_id,
                                                         uri,
                                                         type,
                                                         creator_address,
                                                         property_version
                                                     }) =>
                                    <li>
                                        <Tooltip placement="right" title={`${standard} ${type}\n
                                        Creator: ${creator_address}\n
                                        Collection: ${collection}\n
                                        Collection id: ${collection_id}\n
                                        Property version: ${property_version}
                                        `}>
                                            <Image
                                                width={50}
                                                src={uri}
                                                alt={"img"}
                                            />
                                            Name: {name} | Id: <b>{data_id}</b>
                                        </Tooltip>
                                    </li>)}
                            </ol>
                        </Col>
                    </Row>
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

export default App;