import {Alert, Button, Col, Image, Layout, Row, Tooltip} from "antd";
import {WalletSelector} from "@aptos-labs/wallet-adapter-ant-design";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import {FaucetClient} from "aptos";
import {useWallet} from "@aptos-labs/wallet-adapter-react";
import {useEffect, useState} from "react";
import Launchpad from './Launchpad';
import Marketplace from './Marketplace';
import Transfer from './Transfer';
import {DEVNET_PROVIDER} from "./Marketplace";
// TODO: Load network from wallet
export const FAUCET = new FaucetClient("https://fullnode.devnet.aptoslabs.com", "https://faucet.devnet.aptoslabs.com");

function App(this: any) {
    // TODO Consolidate a lot of these
    const [chainId, setChainId] = useState<number>(-1);
    const [walletLoadError, setWalletLoadError] = useState<string>("");
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
    const {account, network, connected} = useWallet();

    useEffect(() => {
        // Load the current chain id
        loadChainId();
        // On load, pull the account's wallet and check that it exists (fund it if it doesn't)
        if (!account) return;

        ensure_account_exists();
        loadWalletNfts();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [account, network])

    const loadChainId = async () => {
        setChainId(await DEVNET_PROVIDER.getChainId());
    }

    const ensure_account_exists = async () => {
        if (!account) return;
        let address = account?.address as string;
        try {
            await DEVNET_PROVIDER.aptosClient.getAccount(address);
            setWalletLoadError("")
        } catch (e) {
            // TODO: check if it's account doesn't exist
            // Fund the account
            try {
                await FAUCET.fundAccount(address, 100000000);
                setWalletLoadError("")
            } catch (e) {
                setWalletLoadError(`Failed to load account ${e}`)
            }
        }
    }

    const loadWalletNfts = async () => {
        // Ensure you're logged in
        if (!account) {
            return {name: "Wallet not connected", nfts: []};
        }

        try {
            let tokens_query = await DEVNET_PROVIDER.indexerClient.getOwnedTokens(account.address);

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

            setWallet({name: account.address, tokens: tokens})
            return
        } catch (error: any) {
            console.log("Failed to load wallet" + error)
        }

        setWallet({name: "Unable to load wallet", tokens: []})
    }

    const isDevnet = (): boolean => {
        // TODO: Load devnet chain id on page load and compare that against the wallet
        return Number(network?.chainId) === chainId || network?.name?.toLowerCase() === 'devnet';
    }

    return (
        <>
            <Layout>
                <Row align="middle">
                    <Col span={10} offset={2}>
                        <h1>NFT Test Marketplace ({network?.name})</h1>
                    </Col>
                    <Col span={12} style={{textAlign: "right", paddingRight: "200px"}}>
                        <WalletSelector/>
                    </Col>
                </Row>
            </Layout>
            {
                !connected &&
                <Alert message={`Please connect your wallet`} type="info"/>
            }
            {
                connected && !isDevnet() &&
                <Alert message={`Wallet is connected to ${network?.name}.  Please connect to devnet`}
                       type="warning"/>
            }
            { // TODO: Add back spinner
                connected && isDevnet() &&
                <Layout>
                    {walletLoadError && <Row align="middle">
                        <Alert
                            message={`Wallet failed to load for ${account?.address}.  Please try connecting again or funding the account ${walletLoadError}`}
                            type="warning"/>
                    </Row>}
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
                            <Launchpad></Launchpad>
                        </Col>
                    </Row>
                    <Row align="middle">
                        <Col offset={2}>
                            <Marketplace></Marketplace>
                        </Col>
                    </Row>
                    <Row align="middle">
                        <Col offset={2}>
                            <Transfer/>
                        </Col>
                    </Row>
                </Layout>
            }
        </>
    );
}

export default App;