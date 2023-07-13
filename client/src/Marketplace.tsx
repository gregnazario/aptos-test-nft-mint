import {Alert, Button, Col, Input, Row} from "antd";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import {useWallet} from "@aptos-labs/wallet-adapter-react";
import {useState} from "react";
import {Marketplace as Helper} from "./MarketplaceHelper"
import {HexString, Provider} from "aptos";

export const DEVNET_PROVIDER = new Provider({
    fullnodeUrl: "https://fullnode.devnet.aptoslabs.com",
    indexerUrl: "https://ideal-cricket-94.hasura.app/v1/graphql"
})
export const MODULE_ADDRESS = "0xeb36546237930294a8a9fec1e5d42d9633e9e9355eec3fa80f2610a29d95e152";
export const DEFAULT_FEE_SCHEDULE = "0x96e6143a72d9cb40872972c241112ecb43cc0ca8aca376a940a182d620ccef1c";
export const MARKETPLACE_HELPER = new Helper(DEVNET_PROVIDER, MODULE_ADDRESS);
export const DEFAULT_COLLECTION = "Test Collection";
export const DEFAULT_TOKEN_NAME = "Test Token #1";
export const DEFAULT_PROPERTY_VERSION = 0;
export const DEFAULT_PRICE = "100000000";

// TODO: make this more accessible / be deployed by others?
function Marketplace(this: any) {
    const [feeSchedule, setFeeSchedule] = useState<string>(DEFAULT_FEE_SCHEDULE);
    const [feeScheduleDetails, setFeeScheduleDetails] = useState<{
        fee_address: HexString,
        listing_fee: string,
        bidding_fee: string,
        commission: string
    }>();
    // TODO: pass in wallet from outside component
    const {account, signAndSubmitTransaction} = useWallet();

    const loadFeeSchedule = async () => {
        // Ensure you're logged in
        if (!account) return [];

        let fee_address = await MARKETPLACE_HELPER.feeAddress(feeSchedule);
        let listing_fee = await MARKETPLACE_HELPER.listingFee(feeSchedule);
        let bidding_fee = await MARKETPLACE_HELPER.biddingFee(feeSchedule);
        let commission = await MARKETPLACE_HELPER.commission(feeSchedule, BigInt(DEFAULT_PRICE));

        setFeeScheduleDetails({
            fee_address: fee_address,
            listing_fee: listing_fee.toString(),
            bidding_fee: bidding_fee.toString(),
            commission: commission.toString()
        })
    }

    const onStringChange = async (event: React.ChangeEvent<HTMLInputElement>, setter: (value: (((prevState: string) => string) | string)) => void) => {
        const val = event.target.value;
        setter(val);
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
            // TODO: Show in UI
            console.log(`New fee schedule ${address}`);
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
                    <h1>Deploy marketplace fee schedule</h1>
                </Col>
            </Row>
            <Row align="middle">
                <Col flex={"auto"}>
                    <p>Fee schedule address: </p>
                </Col>
                <Col flex={"auto"}>
                    <Input
                        onChange={(event) => {
                            onStringChange(event, setFeeSchedule)
                        }}
                        placeholder="Fee schedule address"
                        size="large"
                        defaultValue={account?.address}
                    />
                    <Button
                        onClick={() => loadFeeSchedule()}
                        type="primary"
                        style={{height: "40px", backgroundColor: "#3f67ff"}}
                    >
                        Lookup an existing fee schedule
                    </Button>
                </Col>
            </Row>
            {feeScheduleDetails && <Row align="middle">
                <Col flex={"auto"}>
                    <p>Fee schedule details:</p>
                    <ol>
                        <li>{`Fees are sent to ${feeScheduleDetails?.fee_address}`}</li>
                        <li>{`List fee is ${feeScheduleDetails?.listing_fee}`}</li>
                        <li>{`Bid fee is ${feeScheduleDetails?.bidding_fee}`}</li>
                        <li>{`Commission on ${DEFAULT_PRICE} is ${feeScheduleDetails?.commission}`}</li>
                    </ol>
                </Col>
            </Row>}
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
                    <h1>NFT Marketplace</h1>
                    <Row align="middle">
                        <p>This acts as a marketplace. You must know the listings, no fancy UI will
                            be
                            provided
                            to find listings</p>
                    </Row>
                    <Row align="middle">
                        <Col>
                            <h2>Listing NFTs</h2>
                        </Col>
                    </Row>
                    <V1FixedListing/>
                    <V1AuctionListing/>
                    <V2FixedListing/>
                    <V2AuctionListing/>
                    <Row align="middle">
                        <Col>
                            <h2>Interacting with Listings</h2>
                        </Col>
                    </Row>
                    <FixedPriceListingManagement/>
                    <AuctionListingManagement/>
                    <ExtractTokenV1/>
                    <Listings/>
                    <TokenOffers/>
                    <CollectionOffers/>
                </Col>
            </Row>
        </>
    );
}

function V1FixedListing(this: any) {
    const [message, setMessage] = useState<String>("");
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
            setMessage(`Listing created at ${address}`)
        } else {
            setMessage("")
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
            {
                message &&
                <Row align="middle">
                    <Col span={6} offset={4}>
                        <Alert type={"info"} message={message}/>
                    </Col>
                </Row>
            }
        </>
    );
}

function V1AuctionListing(this: any) {
    const [message, setMessage] = useState<String>("");
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
            setMessage(`Listing created at ${address}`)
        } else {
            setMessage("")
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
            {
                message &&
                <Row align="middle">
                    <Col span={6} offset={4}>
                        <Alert type={"info"} message={message}/>
                    </Col>
                </Row>
            }
        </>
    );
}


function V2FixedListing(this: any) {
    const [message, setMessage] = useState<String>("");
    const [tokenAddress, setTokenAddress] = useState<string>("");

    const [feeScheduleAddress, setFeeScheduleAddress] = useState<string>(DEFAULT_FEE_SCHEDULE);
    const [listingPrice, setListingPrice] = useState<string>(DEFAULT_PRICE);
    // TODO: pass in wallet from outside component
    const {account, signAndSubmitTransaction} = useWallet();
    const onStringChange = async (event: React.ChangeEvent<HTMLInputElement>, setter: (value: (((prevState: string) => string) | string)) => void) => {
        const val = event.target.value;
        setter(val);
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
            setMessage(`Listing created at ${address}`)
        } else {
            setMessage("")
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
            {
                message &&
                <Row align="middle">
                    <Col span={6} offset={4}>
                        <Alert type={"info"} message={message}/>
                    </Col>
                </Row>
            }
        </>
    );
}

function V2AuctionListing(this: any) {
    const [message, setMessage] = useState<String>("");
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
            setMessage(`Listing created at ${address}`)
        } else {
            setMessage("")
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
            {
                message &&
                <Row align="middle">
                    <Col span={6} offset={4}>
                        <Alert type={"info"} message={message}/>
                    </Col>
                </Row>
            }
        </>
    );
}

function FixedPriceListingManagement(this: any) {
    const [listingAddress, setListingAddress] = useState<string>("");

    // TODO: pass in wallet from outside component
    const {account, signAndSubmitTransaction} = useWallet();
    const onStringChange = async (event: React.ChangeEvent<HTMLInputElement>, setter: (value: (((prevState: string) => string) | string)) => void) => {
        const val = event.target.value;
        setter(val);
    }

    const cancelListing = async () => {
        // Ensure you're logged in
        if (!account || !listingAddress) return [];
        const type = "Cancel fixed price listing";
        const payload = await MARKETPLACE_HELPER.endFixedPriceListing(listingAddress);
        await runTransaction(type, payload);
    }

    const purchaseListing = async () => {
        // Ensure you're logged in
        if (!account || !listingAddress) return [];
        const type = "Purchase listing";
        const payload = await MARKETPLACE_HELPER.purchaseListing(listingAddress);
        await runTransaction(type, payload);
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
        </>
    );
}

function AuctionListingManagement(this: any) {
    const [listingAddress, setListingAddress] = useState<string>("");
    const [bidAmount, setBidAmount] = useState<bigint>(BigInt(0));

    // TODO: pass in wallet from outside component
    const {account, signAndSubmitTransaction} = useWallet();
    const onStringChange = async (event: React.ChangeEvent<HTMLInputElement>, setter: (value: (((prevState: string) => string) | string)) => void) => {
        const val = event.target.value;
        setter(val);
    }

    const onBigIntChange = async (event: React.ChangeEvent<HTMLInputElement>, setter: (value: (((prevState: bigint) => bigint) | bigint)) => void) => {
        const val = event.target.value;
        setter(BigInt(val));
    }

    const completeAuction = async () => {
        // Ensure you're logged in
        if (!account || !listingAddress) return [];
        const type = "Complete auction";
        const payload = await MARKETPLACE_HELPER.completeAuctionListing(listingAddress);
        await runTransaction(type, payload);
    }

    const bidAuction = async () => {
        // Ensure you're logged in
        if (!account || !listingAddress) return [];
        const type = "Bid";
        const payload = await MARKETPLACE_HELPER.bidAuctionListing(account.address, listingAddress, bidAmount);
        await runTransaction(type, payload);
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
                <h3>Auction Bids and Completion</h3>
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
                <Col span={4}>
                    <p>Bid amount: </p>
                </Col>
                <Col flex={"auto"}>
                    <Input
                        onChange={(event) => {
                            onBigIntChange(event, setBidAmount)
                        }}
                        style={{width: "calc(100% - 60px)"}}
                        placeholder="Bid amount"
                        size="large"
                        defaultValue={0}
                    />
                </Col>
            </Row>
            <Row align="middle">
                <Col span={2} offset={4}>
                    <Button
                        onClick={() => bidAuction()}
                        type="primary"
                        style={{height: "40px", backgroundColor: "#3f67ff"}}
                    >
                        Buy Listing
                    </Button>
                </Col>
                <Col span={2} offset={2}>
                    <Button
                        onClick={() => completeAuction()}
                        type="primary"
                        style={{height: "40px", backgroundColor: "#3f67ff"}}
                    >
                        Cancel Listing
                    </Button>
                </Col>
            </Row>
        </>
    );
}


function ExtractTokenV1(this: any) {
    const [objectAddress, setObjectAddress] = useState<string>("");

    // TODO: pass in wallet from outside component
    const {account, signAndSubmitTransaction} = useWallet();
    const onStringChange = async (event: React.ChangeEvent<HTMLInputElement>, setter: (value: (((prevState: string) => string) | string)) => void) => {
        const val = event.target.value;
        setter(val);
    }

    const extractToken = async () => {
        // Ensure you're logged in
        if (!account || !objectAddress) return [];
        const type = "Extract token";
        const payload = await MARKETPLACE_HELPER.extract_tokenv1(objectAddress);
        await runTransaction(type, payload);
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
                <h3>Unwrap TokenV1</h3>
            </Row>
            <Row align="middle">
                <Col span={4}>
                    <p>Token V1 wrapper object address: </p>
                </Col>
                <Col flex={"auto"}>
                    <Input
                        onChange={(event) => {
                            onStringChange(event, setObjectAddress)
                        }}
                        style={{width: "calc(100% - 60px)"}}
                        placeholder="Token V1 wrapper object address"
                        size="large"
                        defaultValue={""}
                    />
                </Col>
            </Row>
            <Row align="middle">
                <Col span={2} offset={4}>
                    <Button
                        onClick={() => extractToken()}
                        type="primary"
                        style={{height: "40px", backgroundColor: "#3f67ff"}}
                    >
                        Extract token v1
                    </Button>
                </Col>
            </Row>
        </>
    );
}

function Listings(this: any) {
    const [listings, setListings] = useState<any>("");

    const loadListings = async () => {
        let listings = await MARKETPLACE_HELPER.getListings(MODULE_ADDRESS, "example_v2_marketplace", false);
        setListings(listings);
    }

    return (
        <>
            <Row align="middle">
                <h3>Listings</h3>
            </Row>
            <Row align="middle">
                <Col span={2} offset={4}>
                    <Button
                        onClick={() => loadListings()}
                        type="primary"
                        style={{height: "40px", backgroundColor: "#3f67ff"}}
                    >
                        Load Listings
                    </Button>
                </Col>
            </Row>
            <Row align="middle">
                <Col>
                    <p>Listings: {JSON.stringify(listings)}</p>
                </Col>
            </Row>
        </>
    );
}


function TokenOffers(this: any) {
    const [tokenOffers, setTokenOffers] = useState<any>("");
    const [tokenAddress, setTokenAddress] = useState<string>("");

    const onStringChange = async (event: React.ChangeEvent<HTMLInputElement>, setter: (value: (((prevState: string) => string) | string)) => void) => {
        const val = event.target.value;
        setter(val);
    }

    const loadTokenOffers = async () => {
        let tokenOffers = await MARKETPLACE_HELPER.getTokenOffers(MODULE_ADDRESS, "example_v2_marketplace", tokenAddress, false);
        setTokenOffers(tokenOffers);
    }

    return (
        <>
            <Row align="middle">
                <h3>Token Offers</h3>
            </Row>
            <Row align="middle">
                <Col span={4}>
                    <p>Token Address: </p>
                </Col>
                <Col flex={"auto"}>
                    <Input
                        onChange={(event) => {
                            onStringChange(event, setTokenAddress)
                        }}
                        style={{width: "calc(100% - 60px)"}}
                        placeholder="TokenAddress"
                        size="large"
                        defaultValue={""}
                    />
                </Col>
            </Row>
            <Row align="middle">
                <Col span={2} offset={4}>
                    <Button
                        onClick={() => loadTokenOffers()}
                        type="primary"
                        style={{height: "40px", backgroundColor: "#3f67ff"}}
                    >
                        Load Token offers
                    </Button>
                </Col>
            </Row>
            <Row align="middle">
                <Col>
                    <p>Token Offers: {JSON.stringify(tokenOffers)}</p>
                </Col>
            </Row>
        </>
    );
}

function CollectionOffers(this: any) {
    const [collectionOffers, setCollectionOffers] = useState<any>("");
    const [collectionAddress, setCollectionAddress] = useState<string>("");

    const onStringChange = async (event: React.ChangeEvent<HTMLInputElement>, setter: (value: (((prevState: string) => string) | string)) => void) => {
        const val = event.target.value;
        setter(val);
    }

    const loadCollectionOffers = async () => {
        let collectionOffers = await MARKETPLACE_HELPER.getCollectionOffers(MODULE_ADDRESS, "example_v2_marketplace", collectionAddress, false);
        setCollectionOffers(collectionOffers);
    }

    return (
        <>
            <Row align="middle">
                <h3>Collection Offers</h3>
            </Row>
            <Row align="middle">
                <Col span={4}>
                    <p>Collection Address: </p>
                </Col>
                <Col flex={"auto"}>
                    <Input
                        onChange={(event) => {
                            onStringChange(event, setCollectionAddress)
                        }}
                        style={{width: "calc(100% - 60px)"}}
                        placeholder="CollectionAddress"
                        size="large"
                        defaultValue={""}
                    />
                </Col>
            </Row>
            <Row align="middle">
                <Col span={2} offset={4}>
                    <Button
                        onClick={() => loadCollectionOffers()}
                        type="primary"
                        style={{height: "40px", backgroundColor: "#3f67ff"}}
                    >
                        Load Collection Offers
                    </Button>
                </Col>
            </Row>
            <Row align="middle">
                <Col>
                    <p>Collection Offers: {JSON.stringify(collectionOffers)}</p>
                </Col>
            </Row>
        </>
    );
}


export default Marketplace;