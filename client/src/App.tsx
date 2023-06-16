import {Alert, Button, Col, Input, Layout, Row} from "antd";
import {WalletSelector} from "@aptos-labs/wallet-adapter-ant-design";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import {AptosClient} from "aptos";
import {useWallet} from "@aptos-labs/wallet-adapter-react";
import {useState} from "react";

// TODO: Load URL from wallet
export const NODE_URL = "https://fullnode.devnet.aptoslabs.com";
export const client = new AptosClient(NODE_URL);


// TODO: make this more accessible / be deployed by others?
export const moduleAddress = "0xb11affd5c514bb969e988710ef57813d9556cc1e3fe6dc9aa6a82b56aee53d98";

function App(this: any) {
    // TODO Consolidate a lot of these
    const [collectionName, setCollectionName] = useState<string>("Test Collection");
    const [tokenName, setTokenName] = useState<string>("Test Token #1");
    const [feeScheduleAddress, setFeeScheduleAddress] = useState<string>("0x62667005ef3a71fe5603a006d68805b55fb141b9a381237b0bca6996a22760da");
    const [tokenAddress, setTokenAddress] = useState<string>("");
    const [listingAddress, setListingAddress] = useState<string>("");
    const [listingPrice, setListingPrice] = useState<string>("100000000");
    const [transactions, setTransactions] = useState<{ hash: string, type: string, data: string | undefined }[]>([]);
    const {account, network, connected, signAndSubmitTransaction} = useWallet();
    const onStringChange = async (event: React.ChangeEvent<HTMLInputElement>, setter: (value: (((prevState: string) => string) | string)) => void) => {
        const val = event.target.value;
        setter(val);
    }
    const addToTransactions = async (type: string, hash: string, data: string) => {
        const txns = transactions;
        txns.push({hash: hash, type: type, data: data});
        setTransactions(txns);
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
            function: `${moduleAddress}::test_token::create_v2_collection`,
            type_arguments: [],
            arguments: [collectionName],
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
        if (!account || !collectionName || !tokenName) return [];
        const type = "Create V2 Token";
        const payload = {
            type: "entry_function_payload",
            function: `${moduleAddress}::test_token::create_v2_nft`,
            type_arguments: [],
            arguments: [collectionName, tokenName],
        };
        let txn = await runTransaction(type, payload);
        if (txn !== undefined) {
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

            await addToTransactions(type, txn.hash, address);
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
            await addToTransactions(type, txn.hash, JSON.stringify(txn.changes));
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

    const runTransaction = async (type: string, payload: any) => {
        try {
            const response = await signAndSubmitTransaction(payload);
            console.log(`${type}: ${response.hash}`);
            await client.waitForTransaction(response.hash);
            return await client.getTransactionByHash(response.hash) as any;
        } catch (error: any) {
            console.log("Failed to wait for txn" + error)
        }

        return undefined;
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
                    <Row align="middle">
                        <Col span={10} offset={2}>
                            <h1>"Deploy marketplace"</h1>
                        </Col>
                    </Row>
                    <Row align="middle">
                        <Col span={10} offset={2}>
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
                        <Col span={10} offset={2}>
                            <h2>"Launchpad"</h2>
                            <Row align="middle">
                                <p>You can create dummy collections and tokens right here on this page for testing
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
                        <Col span={10} offset={2}>
                            <h2>"NFT Marketplace"</h2>
                            <Row align="middle">
                                <p>This acts as a marketplace. You must know the listings, no fancy UI will be provided
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
                                        defaultValue={"0x62667005ef3a71fe5603a006d68805b55fb141b9a381237b0bca6996a22760da"}
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
                        <Col span={10} offset={2}>
                            <h2>Transaction Log</h2>
                            <p>This keeps track of all the transactions that have occurred, but there's no cookies or
                                lookup, so page refreshes will make it disappear
                                TODO: Load recent transactions from API
                            </p>
                            <ol>
                                {transactions.map(({hash, type, data}) => <li>{type} - <a
                                    href={`https://explorer.aptoslabs.com/txn/${hash}?network=devnet`}>{hash}</a> - {data}
                                </li>)}
                            </ol>
                        </Col>
                    </Row>
                </>
            }
        </>
    );
}

export default App;