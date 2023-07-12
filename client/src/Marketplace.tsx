import {Button, Col, Input, Row} from "antd";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import {useWallet} from "@aptos-labs/wallet-adapter-react";
import {useState} from "react";
import {Helper} from "./MarketplaceHelper"
import {Network, Provider} from "aptos";

export const DEVNET_PROVIDER = new Provider(Network.DEVNET)
export const MODULE_ADDRESS = "0x62a81c52504c07f6011f4f5928ecfceca8a63395b5ab14e6b166be25cf26d2d0";
export const DEFAULT_FEE_SCHEDULE = "0x764b2e41463c5636952a14ae62c9924a0efff04122ebe2236fe47064920567df";
export const MARKETPLACE_HELPER = new Helper(DEVNET_PROVIDER, MODULE_ADDRESS);
export const DEFAULT_COLLECTION = "Test Collection";
export const DEFAULT_TOKEN_NAME = "Test Token #1";
export const DEFAULT_PROPERTY_VERSION = 0;
export const DEFAULT_PRICE = "100000000";

// TODO: make this more accessible / be deployed by others?
function Marketplace(this: any) {
    // TODO Consolidate a lot of these
    const [collectionName, setCollectionName] = useState<string>(DEFAULT_COLLECTION);
    const [tokenName, setTokenName] = useState<string>(DEFAULT_TOKEN_NAME);

    const [creatorAddress, setCreatorAddress] = useState<string>("");
    const [tokenPropertyVersion, setTokenPropertyVersion] = useState<number>(DEFAULT_PROPERTY_VERSION);

    const [feeScheduleAddress, setFeeScheduleAddress] = useState<string>(DEFAULT_FEE_SCHEDULE);
    const [tokenAddress, setTokenAddress] = useState<string>("");
    const [listingAddress, setListingAddress] = useState<string>("");
    const [listingPrice, setListingPrice] = useState<string>(DEFAULT_PRICE);
    const [numTransaction, setNumTransaction] = useState<number>(0);
    const [auctionDuration, setAuctionDuration] = useState<number>(3600);
    // TODO: pass in wallet from outside component
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
        const num = numTransaction;
        console.log(JSON.stringify({num: num, hash: hash, type: type, data: data}))
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
                        <h3>Purchasing / Canceling Fixed Price Listing</h3>
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
                    <Row>
                        <Col>
                            <h2>Listing an NFT</h2>
                        </Col>
                    </Row>
                    <V1FixedListing/>
                    <V1AuctionListing/>
                    <V2FixedListing/>
                    <V2AuctionListing/>
                </Col>
            </Row>
        </>
    );
}

function V1FixedListing(this: any) {
    const [collectionName, setCollectionName] = useState<string>(DEFAULT_COLLECTION);
    const [tokenName, setTokenName] = useState<string>(DEFAULT_TOKEN_NAME);

    const [creatorAddress, setCreatorAddress] = useState<string>("");
    const [tokenPropertyVersion, setTokenPropertyVersion] = useState<number>(0);

    const [feeScheduleAddress, setFeeScheduleAddress] = useState<string>(DEFAULT_FEE_SCHEDULE);
    const [listingPrice, setListingPrice] = useState<string>(DEFAULT_PRICE);
    // TODO: pass in wallet from outside component
    const {account, signAndSubmitTransaction} = useWallet();
    const onStringChange = async (event: React.ChangeEvent<HTMLInputElement>, setter: (value: (((prevState: string) => string) | string)) => void) => {
        const val = event.target.value;
        setter(val);
    }

    const onNumberChange = async (event: React.ChangeEvent<HTMLInputElement>, setter: (value: (((prevState: number) => number) | number)) => void) => {
        const val = event.target.value;
        setter(Number(val));
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
        }
    }

    const runTransaction = async (type: string, payload: any) => {
        try {
            const response = await signAndSubmitTransaction(payload);
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
                    <h3>V1 Fixed Listing</h3>
                </Col>
            </Row>
            <Row align="middle">
                <Col span={4}>
                    <p>Token creator address: </p>
                </Col>
                <Col flex={"auto"}>
                    <Input
                        onChange={(event) => {
                            onStringChange(event, setCreatorAddress)
                        }}
                        placeholder="Creator Address"
                        size="large"
                        defaultValue={account?.address}
                    />
                </Col>
            </Row>
            <Row align="middle">
                <Col span={4}>
                    <p>Collection Name: </p>
                </Col>
                <Col flex={"auto"}>
                    <Input
                        onChange={(event) => {
                            onStringChange(event, setCollectionName)
                        }}
                        placeholder="Collection name"
                        size="large"
                        defaultValue={DEFAULT_COLLECTION}
                    />
                </Col>
            </Row>
            <Row align="middle">
                <Col span={4}>
                    <p>Token Name: </p>
                </Col>
                <Col flex={"auto"}>
                    <Input
                        onChange={(event) => {
                            onStringChange(event, setTokenName)
                        }}
                        placeholder="Token name"
                        size="large"
                        defaultValue={DEFAULT_TOKEN_NAME}
                    />
                </Col>
            </Row>
            <Row align="middle">
                <Col span={4}>
                    <p>Token property version: </p>
                </Col>
                <Col flex={"auto"}>
                    <Input
                        onChange={(event) => {
                            onNumberChange(event, setTokenPropertyVersion)
                        }}
                        placeholder="Token property version"
                        size="large"
                        defaultValue={DEFAULT_PROPERTY_VERSION}
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
                        defaultValue={DEFAULT_PRICE}
                    />
                </Col>
            </Row>
            <Row align="middle">
                <Col span={6} offset={4}>
                    <Button
                        onClick={() => createV1Listing()}
                        type="primary"
                        style={{height: "40px", backgroundColor: "#3f67ff"}}
                    >
                        Create V1 Fixed Listing
                    </Button>
                </Col>
            </Row>
        </>
    );
}

function V1AuctionListing(this: any) {
    const [collectionName, setCollectionName] = useState<string>(DEFAULT_COLLECTION);
    const [tokenName, setTokenName] = useState<string>(DEFAULT_TOKEN_NAME);

    const [creatorAddress, setCreatorAddress] = useState<string>("");
    const [tokenPropertyVersion, setTokenPropertyVersion] = useState<number>(0);
    const [auctionDuration, setAuctionDuration] = useState<number>(3600);

    const [feeScheduleAddress, setFeeScheduleAddress] = useState<string>(DEFAULT_FEE_SCHEDULE);
    const [listingPrice, setListingPrice] = useState<string>(DEFAULT_PRICE);
    // TODO: pass in wallet from outside component
    const {account, signAndSubmitTransaction} = useWallet();
    const onStringChange = async (event: React.ChangeEvent<HTMLInputElement>, setter: (value: (((prevState: string) => string) | string)) => void) => {
        const val = event.target.value;
        setter(val);
    }

    const onNumberChange = async (event: React.ChangeEvent<HTMLInputElement>, setter: (value: (((prevState: number) => number) | number)) => void) => {
        const val = event.target.value;
        setter(Number(val));
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
        }
    }

    const runTransaction = async (type: string, payload: any) => {
        try {
            const response = await signAndSubmitTransaction(payload);
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
                    <h3>V1 Auction Listing</h3>
                </Col>
            </Row>
            <Row align="middle">
                <Col span={4}>
                    <p>Token creator address: </p>
                </Col>
                <Col flex={"auto"}>
                    <Input
                        onChange={(event) => {
                            onStringChange(event, setCreatorAddress)
                        }}
                        placeholder="Creator Address"
                        size="large"
                        defaultValue={account?.address}
                    />
                </Col>
            </Row>
            <Row align="middle">
                <Col span={4}>
                    <p>Collection Name: </p>
                </Col>
                <Col flex={"auto"}>
                    <Input
                        onChange={(event) => {
                            onStringChange(event, setCollectionName)
                        }}
                        placeholder="Collection name"
                        size="large"
                        defaultValue={DEFAULT_COLLECTION}
                    />
                </Col>
            </Row>
            <Row align="middle">
                <Col span={4}>
                    <p>Token Name: </p>
                </Col>
                <Col flex={"auto"}>
                    <Input
                        onChange={(event) => {
                            onStringChange(event, setTokenName)
                        }}
                        placeholder="Token name"
                        size="large"
                        defaultValue={DEFAULT_TOKEN_NAME}
                    />
                </Col>
            </Row>
            <Row align="middle">
                <Col span={4}>
                    <p>Token property version: </p>
                </Col>
                <Col flex={"auto"}>
                    <Input
                        onChange={(event) => {
                            onNumberChange(event, setTokenPropertyVersion)
                        }}
                        placeholder="Token property version"
                        size="large"
                        defaultValue={DEFAULT_PROPERTY_VERSION}
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
                        defaultValue={DEFAULT_PRICE}
                    />
                </Col>
            </Row>
            <Row align="middle">
                <Col span={4}>
                    <p>Auction Duration (seconds): </p>
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
                <Col span={6} offset={4}>
                    <Button
                        onClick={() => createV1AuctionListing()}
                        type="primary"
                        style={{height: "40px", backgroundColor: "#3f67ff"}}
                    >
                        Create V1 Auction Listing
                    </Button>
                </Col>
            </Row>
        </>
    );
}


function V2FixedListing(this: any) {
    const [tokenAddress, setTokenAddress] = useState<string>("");

    const [feeScheduleAddress, setFeeScheduleAddress] = useState<string>(DEFAULT_FEE_SCHEDULE);
    const [listingPrice, setListingPrice] = useState<string>(DEFAULT_PRICE);
    // TODO: pass in wallet from outside component
    const {account, signAndSubmitTransaction} = useWallet();
    const onStringChange = async (event: React.ChangeEvent<HTMLInputElement>, setter: (value: (((prevState: string) => string) | string)) => void) => {
        const val = event.target.value;
        setter(val);
    }

    const onNumberChange = async (event: React.ChangeEvent<HTMLInputElement>, setter: (value: (((prevState: number) => number) | number)) => void) => {
        const val = event.target.value;
        setter(Number(val));
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
        }
    }

    const runTransaction = async (type: string, payload: any) => {
        try {
            const response = await signAndSubmitTransaction(payload);
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
                    <h3>V2 Fixed Listing</h3>
                </Col>
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
                        defaultValue={DEFAULT_PRICE}
                    />
                </Col>
            </Row>
            <Row align="middle">
                <Col span={6} offset={4}>
                    <Button
                        onClick={() => createV2Listing()}
                        type="primary"
                        style={{height: "40px", backgroundColor: "#3f67ff"}}
                    >
                        Create V2 Fixed Listing
                    </Button>
                </Col>
            </Row>
        </>
    );
}

function V2AuctionListing(this: any) {
    const [tokenAddress, setTokenAddress] = useState<string>("");
    const [auctionDuration, setAuctionDuration] = useState<number>(3600);

    const [feeScheduleAddress, setFeeScheduleAddress] = useState<string>(DEFAULT_FEE_SCHEDULE);
    const [listingPrice, setListingPrice] = useState<string>(DEFAULT_PRICE);
    // TODO: pass in wallet from outside component
    const {account, signAndSubmitTransaction} = useWallet();
    const onStringChange = async (event: React.ChangeEvent<HTMLInputElement>, setter: (value: (((prevState: string) => string) | string)) => void) => {
        const val = event.target.value;
        setter(val);
    }

    const onNumberChange = async (event: React.ChangeEvent<HTMLInputElement>, setter: (value: (((prevState: number) => number) | number)) => void) => {
        const val = event.target.value;
        setter(Number(val));
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
        }
    }

    const runTransaction = async (type: string, payload: any) => {
        try {
            const response = await signAndSubmitTransaction(payload);
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
                    <h3>V2 Auction Listing</h3>
                </Col>
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
                        defaultValue={DEFAULT_PRICE}
                    />
                </Col>
            </Row>
            <Row align="middle">
                <Col span={4}>
                    <p>Auction Duration (seconds): </p>
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
                <Col span={6} offset={4}>
                    <Button
                        onClick={() => createV2AuctionListing()}
                        type="primary"
                        style={{height: "40px", backgroundColor: "#3f67ff"}}
                    >
                        Create V2 Auction Listing
                    </Button>
                </Col>
            </Row>
        </>
    );
}

export default Marketplace;