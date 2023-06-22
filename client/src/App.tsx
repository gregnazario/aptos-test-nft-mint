import {Alert, Button, Col, Input, Layout, Row} from "antd";
import {WalletSelector} from "@aptos-labs/wallet-adapter-ant-design";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import {Network, Provider} from "aptos";
import {useWallet} from "@aptos-labs/wallet-adapter-react";
import {useState} from "react";

// TODO: Load network from wallet
export const DEVNET_PROVIDER = new Provider(Network.DEVNET)

// TODO: make this more accessible / be deployed by others?
export const moduleAddress = "0xb11affd5c514bb969e988710ef57813d9556cc1e3fe6dc9aa6a82b56aee53d98";

function App(this: any) {
    // TODO Consolidate a lot of these
    const [collectionName, setCollectionName] = useState<string>("Test Collection");
    const [tokenName, setTokenName] = useState<string>("Test Token #1");
    const [tokenUri, setTokenUri] = useState<string>("https://aptosfoundation.org/brandbook/logomark/PNG/Aptos_mark_BLK.png");
    const [feeScheduleAddress, setFeeScheduleAddress] = useState<string>("0x5640348ea9c52a2a6e173fc6c884122a1025266b664064af1a8168813899317a");
    const [tokenAddress, setTokenAddress] = useState<string>("");
    const [listingAddress, setListingAddress] = useState<string>("");
    const [listingPrice, setListingPrice] = useState<string>("100000000");
    const [objectAddress, setObjectAddress] = useState<string>("");
    const [destinationAddress, setDestinationAddress] = useState<string>("");
    const [numTransaction, setNumTransaction] = useState<number>(0);
    const [transactions, setTransactions] = useState<{ num: number, hash: string, type: string, data: string }[]>([]);
    const [wallet, setWallet] = useState<{
        name: string,
        tokens: { collection: string, name: string, data_id: string, uri: string, type: string }[]
    }>();
    const {account, network, connected, signAndSubmitTransaction} = useWallet();
    const onStringChange = async (event: React.ChangeEvent<HTMLInputElement>, setter: (value: (((prevState: string) => string) | string)) => void) => {
        const val = event.target.value;
        setter(val);
    }
    const addToTransactions = async (type: string, hash: string, data: string) => {
        const txns = transactions;
        const num = numTransaction;
        txns.push({num: num, hash: hash, type: type, data: data});
        setTransactions(txns);
        setNumTransaction(num + 1);
    }

    const createFeeSchedule = async () => {
        // Ensure you're logged in
        if (!account) return [];
        const type = "Create Fee schedule";
        const payload = {
            type: "entry_function_payload",
            function: `${moduleAddress}::fee_schedule::init`,
            type_arguments: [],
            arguments: [
                account.address, // Fee address
                50, // Bid fee
                125, // Listing fee
                100, // Commission denominator
                2, // Commission numerator
            ],
        };

        let txn = await runTransaction(type, payload);
        if (txn !== undefined) {
            let address = "unknown";
            for (let change of txn.changes) {
                if (change.data.type === "0x1::object::ObjectCore") {
                    address = change.address;
                    break;
                }
            }
            await addToTransactions(type, txn.hash, `Fee schedule address: ${address}`);
        }
    }

    const createV1Collection = async () => {
        // Ensure you're logged in
        if (!account || !collectionName) return [];
        const type = "Create V1 Collection";
        const payload = {
            type: "entry_function_payload",
            function: `${moduleAddress}::test_token::create_v1_collection`,
            type_arguments: [],
            arguments: [collectionName],
        };

        let txn = await runTransaction(type, payload);
        if (txn !== undefined) {
            await addToTransactions(type, txn.hash, "");
        }
    }

    const createV1Token = async () => {
        // Ensure you're logged in
        if (!account || !collectionName || !tokenName) return [];
        const type = "Create V1 Token";
        const payload = {
            type: "entry_function_payload",
            function: `${moduleAddress}::test_token::create_v1_nft`,
            type_arguments: [],
            arguments: [collectionName, tokenName],
        };
        let txn = await runTransaction(type, payload);
        if (txn !== undefined) {
            await addToTransactions(type, txn.hash, "");
        }
    }
    const createV2Collection = async () => {
        // Ensure you're logged in
        if (!account || !collectionName) return [];
        const type = "Create V2 Collection";
        const payload = {
            type: "entry_function_payload",
            function: `0x4::aptos_token::create_collection`,
            type_arguments: [],
            arguments: [
                "Test v2 collection", // Description
                10000, // Maximum supply
                collectionName,
                "https://aptosfoundation.org/brandbook/logomark/PNG/Aptos_mark_WHT.png",// collection URI
                true, // These are all mutable
                true,
                true,
                true,
                true,
                true,
                true,
                true,
                true,
                1, // Royalty numerator
                100, // Royalty denominator
            ],
        };

        let txn = await runTransaction(type, payload);
        if (txn !== undefined) {
            let address = "unknown";
            // Find the ObjectCore address in changes
            for (let change of txn.changes) {
                if (change.data.type === "0x1::object::ObjectCore") {
                    address = change.address;
                    break;
                }
            }

            await addToTransactions(type, txn.hash, `Collection Address: ${address}`);
        }
    }

    const createV2Token = async () => {
        // Ensure you're logged in
        if (!account || !collectionName || !tokenName || !tokenUri) return [];
        const type = "Create V2 Token";
        const payload = {
            type: "entry_function_payload",
            function: `0x4::aptos_token::mint`,
            type_arguments: [],
            arguments: [
                collectionName,
                "Test v2 token", // Description
                tokenName,
                tokenUri,
                [],
                [],
                []
            ],
        };
        let txn = await runTransaction(type, payload);
        if (txn !== undefined) {
            console.log(`TXN: ${JSON.stringify(txn.events[0].data.token)}`);
            await addToTransactions(type, txn.hash, `TokenAddress: ${txn.events[0].data.token}`);
        }
    }

    const createV2Listing = async () => {
        // Ensure you're logged in
        if (!account || !tokenAddress) return [];
        const type = "Create listing";
        const payload = {
            type: "entry_function_payload",
            function: `${moduleAddress}::coin_listing::init_fixed_price`,
            type_arguments: ["0x1::aptos_coin::AptosCoin"],
            // TODO: allow different start time
            arguments: [tokenAddress, feeScheduleAddress, Math.floor(new Date().getTime() / 1000), listingPrice],
        };

        let txn = await runTransaction(type, payload);
        if (txn !== undefined) {
            let address = "unknown";
            for (let event of txn.events) {
                if (event.type === "0x1::object::TransferEvent") {
                    address = event.data.to;
                    break
                }
            }

            await addToTransactions(type, txn.hash, `Listing address: ${address}`);
        }
    }

    const cancelListing = async () => {
        // Ensure you're logged in
        if (!account || !listingAddress) return [];
        const type = "Cancel fixed price listing";
        const payload = {
            type: "entry_function_payload",
            function: `${moduleAddress}::coin_listing::end_fixed_price`,
            type_arguments: ["0x1::aptos_coin::AptosCoin"],
            arguments: [listingAddress],
        };
        let txn = await runTransaction(type, payload);
        if (txn !== undefined) {
            await addToTransactions(type, txn.hash, "");
        }
    }
    const purchaseListing = async () => {
        // Ensure you're logged in
        if (!account || !listingAddress) return [];
        const type = "Purchase listing";
        const payload = {
            type: "entry_function_payload",
            function: `${moduleAddress}::coin_listing::purchase`,
            type_arguments: ["0x1::aptos_coin::AptosCoin"],
            arguments: [listingAddress],
        };
        let txn = await runTransaction(type, payload);
        if (txn !== undefined) {
            await addToTransactions(type, txn.hash, JSON.stringify(txn.changes));
        }
    }

    const transferObject = async () => {
        // Ensure you're logged in
        if (!account || !objectAddress) return [];
        const type = "Transfer Object";
        const payload = {
            type: "entry_function_payload",
            function: `0x1::object::transfer`,
            type_arguments: ["0x1::object::ObjectCore"],
            arguments: [objectAddress, destinationAddress],
        };
        let txn = await runTransaction(type, payload);
        if (txn !== undefined) {
            await addToTransactions(type, txn.hash, "");
        }
    }

    const runTransaction = async (type: string, payload: any) => {
        try {
            const response = await signAndSubmitTransaction(payload);
            console.log(`${type}: ${response.hash}`);
            await DEVNET_PROVIDER.aptosClient.waitForTransaction(response.hash);
            return await DEVNET_PROVIDER.aptosClient.getTransactionByHash(response.hash) as any;
        } catch (error: any) {
            console.log("Failed to wait for txn" + error)
        }

        return undefined;
    }

    const showWallet = async () => {
        // Ensure you're logged in
        if (!account) {
            return {name: "Wallet not connected", nfts: []};
        }

        try {
            /*
            let accountName = await ANS_CLIENT.getPrimaryNameByAddress(account.address);
            if (!accountName) {
                accountName = account.address;
            }*/
            let tokens_query = await DEVNET_PROVIDER.indexerClient.getOwnedTokens(account.address);

            let tokens = tokens_query.current_token_ownerships_v2.map(token_data => {
                if (token_data.token_standard === "v2") {
                    let collection_name = token_data.current_token_data?.current_collection?.collection_name || "";
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
                    return {collection: collection_name, name: name, data_id: data_id, uri: uri, type: type}
                } else {
                    // Handle V1
                    let collection_name = token_data.current_token_data?.current_collection?.collection_name || "";
                    let name = token_data.current_token_data?.token_name || "";
                    let data_id = token_data.current_token_data?.token_data_id || "";
                    let uri = token_data.current_token_data?.token_uri || "";
                    let type = "NFT" // TODO: Handle fungible
                    return {collection: collection_name, name: name, data_id: data_id, uri: uri, type: type}
                }
            })

            setWallet({name: account.address, tokens: tokens})
            return
        } catch (error: any) {
            console.log("Failed to load wallet" + error)
        }

        setWallet({name: "Unable to load wallet", tokens: []})
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
                connected && network?.name as string !== 'Devnet' &&
                <Alert message={`Wallet is connected to ${network?.name}.  Please connect to devnet`} type="warning"/>
            }
            { // TODO: Add back spinner
                connected && network?.name as string === "Devnet" &&
                <>
                    <Row>
                        <Col span={12}>
                            <Row align="middle">
                                <Col flex={"auto"} offset={2}>
                                    <h1>"Deploy marketplace"</h1>
                                </Col>
                            </Row>
                            <Row align="middle">
                                <Col flex={"auto"} offset={2}>
                                    <Button
                                        onClick={() => createFeeSchedule()}
                                        type="primary"
                                        style={{height: "40px", backgroundColor: "#3f67ff"}}
                                    >
                                        Create Fee schedule for marketplace (at your address)
                                    </Button>
                                </Col>
                            </Row>
                            <Row align="middle">
                                <Col flex={"auto"} offset={2}>
                                    <h2>"Launchpad"</h2>
                                    <Row align="middle">
                                        <p>You can create dummy collections and tokens right here on this page for
                                            testing
                                            purposes. Collection needs Collection Name. Token needs both.</p>
                                    </Row>
                                    <Row align="middle">
                                        <Col span={4}>
                                            <p>Collection name:</p>
                                        </Col>
                                        <Col flex={"auto"}>
                                            <Input
                                                onChange={(event) => {
                                                    onStringChange(event, setCollectionName)
                                                }}
                                                style={{width: "calc(100% - 60px)"}}
                                                placeholder="Collection Name"
                                                size="large"
                                                defaultValue={"Test Collection"}
                                            />
                                        </Col>
                                    </Row>
                                    <Row align="middle">
                                        <Col span={4}>
                                            <p>Token name:</p>
                                        </Col>
                                        <Col flex={"auto"}>
                                            <Input
                                                onChange={(event) => {
                                                    onStringChange(event, setTokenName)
                                                }}
                                                style={{width: "calc(100% - 60px)"}}
                                                placeholder="Token Name"
                                                size="large"
                                                defaultValue={"Test Token #1"}
                                            />
                                        </Col>
                                    </Row>
                                    <Row align="middle">
                                        <Col span={4}>
                                            <p>Token name:</p>
                                        </Col>
                                        <Col flex={"auto"}>
                                            <Input
                                                onChange={(event) => {
                                                    onStringChange(event, setTokenUri)
                                                }}
                                                style={{width: "calc(100% - 60px)"}}
                                                placeholder="Token URI"
                                                size="large"
                                                defaultValue={"https://aptosfoundation.org/brandbook/logomark/PNG/Aptos_mark_BLK.png"}
                                            />
                                        </Col>
                                    </Row>
                                    <Row align="middle">
                                        <Col span={4}>
                                            <h3>Token V1</h3>
                                        </Col>
                                        <Col span={4}>
                                            <Button
                                                onClick={() => createV1Collection()}
                                                type="primary"
                                                style={{height: "40px", backgroundColor: "#3f67ff"}}
                                            >
                                                Create V1 Collection
                                            </Button>
                                        </Col>
                                        <Col span={4} offset={2}>
                                            <Button
                                                onClick={() => createV1Token()}
                                                type="primary"
                                                style={{height: "40px", backgroundColor: "#3f67ff"}}
                                            >
                                                Create V1 Token
                                            </Button>
                                        </Col>
                                    </Row>
                                    <Row align="middle">
                                        <Col span={4}>
                                            <h3>Token V2</h3>
                                        </Col>
                                        <Col span={4}>
                                            <Button
                                                onClick={() => createV2Collection()}
                                                type="primary"
                                                style={{height: "40px", backgroundColor: "#3f67ff"}}
                                            >
                                                Create V2 Collection
                                            </Button>
                                        </Col>
                                        <Col span={4} offset={2}>
                                            <Button
                                                onClick={() => createV2Token()}
                                                type="primary"
                                                style={{height: "40px", backgroundColor: "#3f67ff"}}
                                            >
                                                Create V2 Token
                                            </Button>
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                            <Row align="middle">
                                <Col flex={"auto"} offset={2}>
                                    <h2>"NFT Marketplace"</h2>
                                    <Row align="middle">
                                        <p>This acts as a marketplace. You must know the listings, no fancy UI will be
                                            provided
                                            to find listings</p>
                                    </Row>
                                    <Row align="middle">
                                        <h3>V2 Listing</h3>
                                    </Row>
                                    <Row align="middle">
                                        <Col span={4}>
                                            <p>Token address: </p>
                                        </Col>
                                        <Col flex={"auto"}>
                                            <Input
                                                onChange={(event) => {
                                                    onStringChange(event, setTokenAddress)
                                                }}
                                                placeholder="Token Address"
                                                size="large"
                                                defaultValue={""}
                                            />
                                        </Col>
                                    </Row>
                                    <Row align="middle">
                                        <Col span={4}>
                                            <p>Fee schedule address: </p>
                                        </Col>
                                        <Col flex={"auto"}>
                                            <Input
                                                onChange={(event) => {
                                                    onStringChange(event, setFeeScheduleAddress)
                                                }}
                                                placeholder="Fee Schedule Address"
                                                size="large"
                                                defaultValue={"0x5640348ea9c52a2a6e173fc6c884122a1025266b664064af1a8168813899317a"}
                                            />
                                        </Col>
                                    </Row>
                                    <Row align="middle">
                                        <Col span={4}>
                                            <p>Price(Octas): </p>
                                        </Col>
                                        <Col flex={"auto"}>
                                            <Input
                                                onChange={(event) => {
                                                    onStringChange(event, setListingPrice)
                                                }}
                                                placeholder="Price"
                                                size="large"
                                                defaultValue={"100000000"}
                                            />
                                        </Col>
                                    </Row>
                                    <Row align="middle">
                                        <Col span={4}>
                                            <h3>List V2</h3>
                                        </Col>
                                        <Col span={4}>
                                            <Button
                                                onClick={() => createV2Listing()}
                                                type="primary"
                                                style={{height: "40px", backgroundColor: "#3f67ff"}}
                                            >
                                                Create Fixed Listing
                                            </Button>
                                        </Col>
                                    </Row>
                                    <Row align="middle">
                                        <h3>Purchasing</h3>
                                    </Row>
                                    <Row align="middle">
                                        <Col span={4}>
                                            <p>Listing address: </p>
                                        </Col>
                                        <Col flex={"auto"}>
                                            <Input
                                                onChange={(event) => {
                                                    onStringChange(event, setListingAddress)
                                                }}
                                                style={{width: "calc(100% - 60px)"}}
                                                placeholder="Listing Address"
                                                size="large"
                                                defaultValue={""}
                                            />
                                        </Col>
                                    </Row>
                                    <Row align="middle">
                                        <Col span={2} offset={4}>
                                            <Button
                                                onClick={() => purchaseListing()}
                                                type="primary"
                                                style={{height: "40px", backgroundColor: "#3f67ff"}}
                                            >
                                                Buy Listing
                                            </Button>
                                        </Col>
                                        <Col span={2} offset={2}>
                                            <Button
                                                onClick={() => cancelListing()}
                                                type="primary"
                                                style={{height: "40px", backgroundColor: "#3f67ff"}}
                                            >
                                                Cancel Listing
                                            </Button>
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                            <Row align="middle">
                                <Col flex={"auto"} offset={2}>
                                    <Row align={"middle"}>
                                        <Col span={4}>
                                            <h3>Transfer Object</h3>
                                        </Col>
                                    </Row>
                                    <Row align="middle">
                                        <Col span={4}>
                                            <p>Object address: </p>
                                        </Col>
                                        <Col flex={"auto"}>
                                            <Input
                                                onChange={(event) => {
                                                    onStringChange(event, setObjectAddress)
                                                }}
                                                style={{width: "calc(100% - 60px)"}}
                                                placeholder="Object Address"
                                                size="large"
                                                defaultValue={""}
                                            />
                                        </Col>
                                    </Row>
                                    <Row align="middle">
                                        <Col span={4}>
                                            <p>Destination address: </p>
                                        </Col>
                                        <Col flex={"auto"}>
                                            <Input
                                                onChange={(event) => {
                                                    onStringChange(event, setDestinationAddress)
                                                }}
                                                style={{width: "calc(100% - 60px)"}}
                                                placeholder="Destination Address"
                                                size="large"
                                                defaultValue={""}
                                            />
                                        </Col>
                                    </Row>
                                    <Row align="middle">
                                        <Col span={2} offset={4}>
                                            <Button
                                                onClick={() => transferObject()}
                                                type="primary"
                                                style={{height: "40px", backgroundColor: "#3f67ff"}}
                                            >
                                                Transfer Object
                                            </Button>
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                        </Col>
                        <Col span={12}>
                            <Row>
                                <h2>Wallet {wallet?.name}</h2>
                            </Row>
                            <Row>
                                <p>TODO load automatically</p>
                                <Button
                                    onClick={() => showWallet()}
                                    type="primary"
                                    style={{height: "40px", backgroundColor: "#3f67ff"}}
                                >
                                    Load wallet
                                </Button>
                            </Row>
                            <Row>
                                <ol>
                                    {wallet?.tokens.map(({collection, name, data_id, uri, type}) =>
                                        <li>{type} | {'"' + collection + "'"} - {'"' + name + '"'} <img width={50}
                                                                                                        src={uri}
                                                                                                        alt={"img"}/> - {data_id}
                                        </li>)}
                                </ol>
                            </Row>
                            <Row>
                                <h2>Transaction Log</h2>
                                <p>This keeps track of all the transactions that have occurred, but there's no cookies
                                    or
                                    lookup, so page refreshes will make it disappear
                                    TODO: Load recent transactions from API
                                </p>
                                <ol>
                                    {transactions.map(({hash, type, data}) => <li>{type} - <a
                                        href={`https://explorer.aptoslabs.com/txn/${hash}?network=devnet`}>{hash}</a> - {data}
                                    </li>)}
                                </ol>
                            </Row>
                        </Col>
                    </Row>
                </>
            }
        </>
    );
}

export default App;