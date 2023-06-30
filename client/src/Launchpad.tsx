import {Button, Col, Input, Row} from "antd";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import {Network, Provider} from "aptos";
import {useWallet} from "@aptos-labs/wallet-adapter-react";
import {useState} from "react";

// TODO: Load network from wallet
export const DEVNET_PROVIDER = new Provider(Network.DEVNET)

// TODO: make this more accessible / be deployed by others?
const DEFAULT_IMAGE = "https://3zglr2262zd6f45qo6nqfycybj4acwnughgzual3oxdmu7wlz36a.arweave.net/3ky4617WR-LzsHebAuBYCngBWbQxzZoBe3XGyn7Lzvw/0.png"

function Launchpad(this: any) {
    // TODO Consolidate a lot of these
    const [collectionName, setCollectionName] = useState<string>("Test Collection");
    const [tokenName, setTokenName] = useState<string>("Test Token #1");

    const [royaltyPercent, setRoyaltyPercent] = useState<number>(0);

    const [description, setDescription] = useState<string>("");
    const [tokenUri, setTokenUri] = useState<string>(DEFAULT_IMAGE);
    const [numTransaction, setNumTransaction] = useState<number>(0);
    const [transactions, setTransactions] = useState<{ num: number, hash: string, type: string, data: string }[]>([]);
    const {account, signAndSubmitTransaction} = useWallet();
    const onStringChange = async (event: React.ChangeEvent<HTMLInputElement>, setter: (value: (((prevState: string) => string) | string)) => void) => {
        const val = event.target.value;
        setter(val);
    }

    const onNumberChange = async (event: React.ChangeEvent<HTMLInputElement>, setter: (value: (((prevState: number) => number) | number)) => void) => {
        const val = event.target.value;
        setter(Number(val));
    }

    const addToTransactions = async (type: string, hash: string, data: string) => {
        const txns = transactions;
        const num = numTransaction;
        txns.push({num: num, hash: hash, type: type, data: data});
        setTransactions(txns);
        setNumTransaction(num + 1);
    }

    const createV1Collection = async () => {
        // Ensure you're logged in
        if (!account || !collectionName) return [];
        const type = "Create V1 Collection";
        const payload = {
            type: "entry_function_payload",
            function: `0x3::token::create_collection_script`,
            type_arguments: [],
            arguments: [
                collectionName,
                description,
                tokenUri,// collection URI
                0, // Unlimited collection size
                [true, true, true] // Everything allowed
            ],
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
            function: `0x3::token::create_token_script`,
            type_arguments: [],
            arguments: [
                collectionName,
                tokenName,
                description,
                1, // balance 1 (this is a NFT)
                1, // maximum (this is a singular NFT)
                tokenUri,
                account.address, // Royalty account
                100, // royalty denominator
                royaltyPercent, // royalty numerator
                [true, true, true, true, true], // everything allowed mutable
                [], // Property keys
                [], // Property values
                [], // Property types
            ],
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
                description, // Description
                10000, // Maximum supply
                collectionName,
                tokenUri,// collection URI
                true, // These are all mutable
                true,
                true,
                true,
                true,
                true,
                true,
                true,
                true,
                royaltyPercent, // Royalty numerator
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
                description,
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

    const createSoulboundV2Token = async () => {
        // Ensure you're logged in
        if (!account || !collectionName || !tokenName || !tokenUri) return [];
        const type = "Create SoulboundV2 Token";
        const payload = {
            type: "entry_function_payload",
            function: `0x4::aptos_token::mint_soul_bound`,
            type_arguments: [],
            arguments: [
                collectionName,
                description,
                tokenName,
                tokenUri,
                [],
                [],
                [],
                account.address
            ],
        };
        let txn = await runTransaction(type, payload);
        if (txn !== undefined) {
            console.log(`TXN: ${JSON.stringify(txn.events[0].data.token)}`);
            await addToTransactions(type, txn.hash, `TokenAddress: ${txn.events[0].data.token}`);
        }
    }

    const runTransaction = async (type: string, payload: any) => {
        try {
            const response = await signAndSubmitTransaction(payload);
            console.log(`${type}: ${response.hash}`);
            await DEVNET_PROVIDER.aptosClient.waitForTransaction(response.hash);
            let txn = await DEVNET_PROVIDER.aptosClient.getTransactionByHash(response.hash) as any;
            return txn;
        } catch (error: any) {
            console.log("Failed to wait for txn" + error)
        }

        return undefined;
    }

    return (
        <>
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
                    <p>URI:</p>
                </Col>
                <Col flex={"auto"}>
                    <Input
                        onChange={(event) => {
                            onStringChange(event, setTokenUri)
                        }}
                        style={{width: "calc(100% - 60px)"}}
                        placeholder="Token URI"
                        size="large"
                        defaultValue={DEFAULT_IMAGE}
                    />
                </Col>
            </Row>
            <Row align="middle">
                <Col span={4}>
                    <p>Description:</p>
                </Col>
                <Col flex={"auto"}>
                    <Input
                        onChange={(event) => {
                            onStringChange(event, setDescription)
                        }}
                        style={{width: "calc(100% - 60px)"}}
                        placeholder="Description"
                        size="large"
                        defaultValue={""}
                    />
                </Col>
            </Row>
            <Row align="middle">
                <Col span={4}>
                    <p>Royalty Percent:</p>
                </Col>
                <Col flex={"auto"}>
                    <Input
                        onChange={(event) => {
                            onNumberChange(event, setRoyaltyPercent)
                        }}
                        style={{width: "calc(100% - 60px)"}}
                        placeholder="Royalty Percent (whole percent)"
                        size="large"
                        defaultValue={1}
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
            </Row>
            <Row align="middle">
                <Col span={4} offset={4}>
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
            </Row>
            <Row align="middle">
                <Col span={4} offset={4}>
                    <Button
                        onClick={() => createV2Token()}
                        type="primary"
                        style={{height: "40px", backgroundColor: "#3f67ff"}}
                    >
                        Create V2 Token
                    </Button>
                </Col>
            </Row>
            <Row align="middle">
                <Col span={4} offset={4}>
                    <Button
                        onClick={() => createSoulboundV2Token()}
                        type="primary"
                        style={{height: "40px", backgroundColor: "#3f67ff"}}
                    >
                        Create Soulbound V2 Token
                    </Button>
                </Col>
            </Row>
        </>
    );
}

export default Launchpad;