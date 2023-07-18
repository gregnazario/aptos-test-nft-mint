import {Button, Col, Input, Row} from "antd";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import {useState} from "react";
import {onNumberChange, onStringChange, runTransaction, TransactionContext} from "./Helper";

const DEFAULT_IMAGE = "https://cloudflare-ipfs.com/ipfs/QmQ1b4JVoPETE9fLXkmGcXoheqJf2UZ4qTKKfvrmC2W4PF"

function Launchpad(props: TransactionContext) {
    const [collectionName, setCollectionName] = useState<string>("Test Collection");
    const [tokenName, setTokenName] = useState<string>("Test Token #1");

    const [royaltyPercent, setRoyaltyPercent] = useState<number>(0);

    const [description, setDescription] = useState<string>("");
    const [tokenUri, setTokenUri] = useState<string>(DEFAULT_IMAGE);

    const createV1Collection = async () => {
        // Ensure you're logged in
        if (!props.account || !collectionName) return [];
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

        await runTransaction(props.submitTransaction, payload);
    }

    const createV1Token = async () => {
        // Ensure you're logged in
        if (!props.account || !collectionName || !tokenName) return [];
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
                props.account.address, // Royalty account
                100, // royalty denominator
                royaltyPercent, // royalty numerator
                [true, true, true, true, true], // everything allowed mutable
                [], // Property keys
                [], // Property values
                [], // Property types
            ],
        };
        await runTransaction(props.submitTransaction, payload);
    }

    const createV2Collection = async () => {
        // Ensure you're logged in
        if (!props.account || !collectionName) return [];
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

        await runTransaction(props.submitTransaction, payload);
    }

    const createV2Token = async () => {
        // Ensure you're logged in
        if (!props.account || !collectionName || !tokenName || !tokenUri) return [];
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
        await runTransaction(props.submitTransaction, payload);
    }

    const createSoulboundV2Token = async () => {
        // Ensure you're logged in
        if (!props.account || !collectionName || !tokenName || !tokenUri) return [];
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
                props.account.address
            ],
        };
        await runTransaction(props.submitTransaction, payload);
    }

    return (
        <>
            <h2>Launchpad</h2>
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