import {Button, Col, Input, Row} from "antd";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import {Network, Provider} from "aptos";
import {useWallet} from "@aptos-labs/wallet-adapter-react";
import {useState} from "react";
import {Helper} from "./MarketplaceHelper"

// TODO: Load network from wallet
export const DEVNET_PROVIDER = new Provider(Network.DEVNET)
export const MODULE_ADDRESS = "2b8ce856ae7536f41cddd1f7be1d9b69a46aa79a65e5b35f7f55732989751498";
export const DEFAULT_FEE_SCHEDULE = "0xc261491e35296ffbb760715c2bb83b87ced70029e82e100ff53648b2f9e1a598";
export const MARKETPLACE_HELPER = new Helper(DEVNET_PROVIDER, MODULE_ADDRESS);

// TODO: make this more accessible / be deployed by others?
function Marketplace(this: any) {
    // TODO Consolidate a lot of these
    const [collectionName, setCollectionName] = useState<string>("Test Collection");
    const [tokenName, setTokenName] = useState<string>("Test Token #1");

    const [creatorAddress, setCreatorAddress] = useState<string>("");
    const [tokenPropertyVersion, setTokenPropertyVersion] = useState<number>(0);

    const [feeScheduleAddress, setFeeScheduleAddress] = useState<string>(DEFAULT_FEE_SCHEDULE);
    const [tokenAddress, setTokenAddress] = useState<string>("");
    const [listingAddress, setListingAddress] = useState<string>("");
    const [listingPrice, setListingPrice] = useState<string>("100000000");
    const [numTransaction, setNumTransaction] = useState<number>(0);
    const [auctionDuration, setAuctionDuration] = useState<number>(3600);
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

    const createFeeSchedule = async () => {
        // Ensure you're logged in
        if (!account) return [];

        const type = "Create Fee schedule";
        const payload = await MARKETPLACE_HELPER.initFeeSchedule(account.address, BigInt(50), BigInt(125), BigInt(100), BigInt(2));

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

    const createV1Listing = async () => {
        // Ensure you're logged in
        if (!account) return [];
        const type = "Create fixed price V1 listing";
        const payload =
            await MARKETPLACE_HELPER.initFixedPriceListingForTokenv1(
                creatorAddress,
                collectionName,
                tokenName,
                BigInt(tokenPropertyVersion),
                feeScheduleAddress ,
                BigInt(Math.floor(new Date().getTime() / 1000)),
                BigInt(listingPrice)
            );

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

    const createV1AuctionListing = async () => {
        // Ensure you're logged in
        if (!account) return [];
        const type = "Create auction V1 listing";

        const now = Math.floor(new Date().getTime() / 1000);

        const payload = await MARKETPLACE_HELPER.initAuctionListingForTokenv1(
            creatorAddress,
            collectionName,
            tokenName,
            BigInt(tokenPropertyVersion),
            feeScheduleAddress,
            BigInt(now),
            BigInt(listingPrice),
            BigInt(100),
            BigInt(now + auctionDuration),
            BigInt(auctionDuration),
            // TODO: Buy now
        );

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


    const createV2Listing = async () => {
        // Ensure you're logged in
        if (!account || !tokenAddress) return [];
        const type = "Create fixed price V2 listing";
        const payload = await MARKETPLACE_HELPER.initFixedPriceListing(
            tokenAddress,
            feeScheduleAddress,
            BigInt(Math.floor(new Date().getTime() / 1000)),
            BigInt(listingPrice)
        );

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

    const createV2AuctionListing = async () => {
        // Ensure you're logged in
        if (!account || !tokenAddress) return [];
        const type = "Create auction V2 listing";

        const now = Math.floor(new Date().getTime() / 1000);

        const payload = await MARKETPLACE_HELPER.initAuctionListing(
                tokenAddress,
                feeScheduleAddress,
                BigInt(now),
                BigInt(listingPrice),
                BigInt(1000000),
                BigInt(now + auctionDuration),
                BigInt(auctionDuration)
        );

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
        const payload = await MARKETPLACE_HELPER.endFixedPriceListing(listingAddress);
        let txn = await runTransaction(type, payload);
        if (txn !== undefined) {
            await addToTransactions(type, txn.hash, "");
        }
    }
    const purchaseListing = async () => {
        // Ensure you're logged in
        if (!account || !listingAddress) return [];
        const type = "Purchase listing";
        const payload = await MARKETPLACE_HELPER.purchaseListing(listingAddress);
        let txn = await runTransaction(type, payload);
        if (txn !== undefined) {
            await addToTransactions(type, txn.hash, JSON.stringify(txn.changes));
        }
    }

    const runTransaction = async (type: string, payload: any) => {
        try {
            console.log("PAYLOAD")
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
            <Row align="middle">
                <Col flex={"auto"}>
                    <h1>"Deploy marketplace"</h1>
                </Col>
            </Row>
            <Row align="middle">
                <Col flex={"auto"}>
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
                <Col flex={"auto"}>
                    <h2>"NFT Marketplace"</h2>
                    <Row align="middle">
                        <p>This acts as a marketplace. You must know the listings, no fancy UI will
                            be
                            provided
                            to find listings</p>
                    </Row>
                    <Row align="middle">
                        <h3>Listing</h3>
                    </Row>
                    <Row align="middle">
                        <Col span={4}>
                            <p>(V1 only)Token creator address: </p>
                        </Col>
                        <Col flex={"auto"}>
                            <Input
                                onChange={(event) => {
                                    onStringChange(event, setCreatorAddress)
                                }}
                                placeholder="Creator Address"
                                size="large"
                                defaultValue={""}
                            />
                        </Col>
                    </Row>
                    <Row align="middle">
                        <Col span={4}>
                            <p>(V1 only)Collection Name: </p>
                        </Col>
                        <Col flex={"auto"}>
                            <Input
                                onChange={(event) => {
                                    onStringChange(event, setCollectionName)
                                }}
                                placeholder="Collection name"
                                size="large"
                                defaultValue={""}
                            />
                        </Col>
                    </Row>
                    <Row align="middle">
                        <Col span={4}>
                            <p>(V1 only)Token Name: </p>
                        </Col>
                        <Col flex={"auto"}>
                            <Input
                                onChange={(event) => {
                                    onStringChange(event, setTokenName)
                                }}
                                placeholder="Token name"
                                size="large"
                                defaultValue={""}
                            />
                        </Col>
                    </Row>
                    <Row align="middle">
                        <Col span={4}>
                            <p>(V1 only)Token property version: </p>
                        </Col>
                        <Col flex={"auto"}>
                            <Input
                                onChange={(event) => {
                                    onNumberChange(event, setTokenPropertyVersion)
                                }}
                                placeholder="Token property version"
                                size="large"
                                defaultValue={""}
                            />
                        </Col>
                    </Row>
                    <Row align="middle">
                        <Col span={4}>
                            <p>(V2 only)Token address: </p>
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
                                defaultValue={DEFAULT_FEE_SCHEDULE}
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
                            <p>Auction Duration(seconds): </p>
                        </Col>
                        <Col flex={"auto"}>
                            <Input
                                onChange={(event) => {
                                    onNumberChange(event, setAuctionDuration)
                                }}
                                placeholder="Auction Duration"
                                size="large"
                                defaultValue={"3600"}
                            />
                        </Col>
                    </Row>
                    <Row align="middle">
                        <Col span={4}>
                            <h3>List Fixed price</h3>
                        </Col>
                        <Col span={6}>
                            <Button
                                onClick={() => createV1Listing()}
                                type="primary"
                                style={{height: "40px", backgroundColor: "#3f67ff"}}
                            >
                                Create V1 Fixed Listing
                            </Button>
                        </Col>
                        <Col span={6}>
                            <Button
                                onClick={() => createV2Listing()}
                                type="primary"
                                style={{height: "40px", backgroundColor: "#3f67ff"}}
                            >
                                Create V2 Fixed Listing
                            </Button>
                        </Col>
                    </Row>
                    <Row align="middle">
                        <Col span={4}>
                            <h3>List auction</h3>
                        </Col>
                        <Col span={6}>
                            <Button
                                onClick={() => createV1AuctionListing()}
                                type="primary"
                                style={{height: "40px", backgroundColor: "#3f67ff"}}
                            >
                                Create V1 Auction Listing
                            </Button>
                        </Col>
                        <Col span={6}>
                            <Button
                                onClick={() => createV2AuctionListing()}
                                type="primary"
                                style={{height: "40px", backgroundColor: "#3f67ff"}}
                            >
                                Create V2 Auction Listing
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
        </>
    );
}

export default Marketplace;