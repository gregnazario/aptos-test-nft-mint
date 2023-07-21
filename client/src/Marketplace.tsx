import {Alert, Button, Col, Image, Input, Row, Select, Tooltip} from "antd";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import {useEffect, useState} from "react";
import {Marketplace as Helper, TokenOffer, V2Listing} from "./MarketplaceHelper"
import {
    onStringChange,
    onNumberChange,
    onBigIntChange,
    runTransaction,
    TransactionContext, getProvider
} from "./Helper";
import {Network} from "aptos";
import {ensureImageUri} from "./App";

export const MODULE_ADDRESS = "0x6de37368e31dff4580b211295198159ee6f98b42ffa93c5683bb955ca1be67e0";
export const DEVNET_FEE_SCHEDULE = "0x96e6143a72d9cb40872972c241112ecb43cc0ca8aca376a940a182d620ccef1c";
export const TESTNET_FEE_SCHEDULE = "0xc261491e35296ffbb760715c2bb83b87ced70029e82e100ff53648b2f9e1a598";
export const MAINNET_ZERO_FEE_SCHEDULE = "0x8bff03d355bb35d2293ae5be7b04b9648be2f3694fb3fc537267ecb563743e00";
export const DEFAULT_COLLECTION = "Test Collection";
export const DEFAULT_TOKEN_NAME = "Test Token #1";
export const DEFAULT_PROPERTY_VERSION = 0;
export const DEFAULT_PRICE = "100000000";

const APT = 100000000;
const V1 = "V1";
const V2 = "V2";
const FIXED_PRICE = "Fixed Price";
const AUCTION = "Auction";
const TOKEN_OFFERS = "Token Offers";
const COLLECTION_OFFERS = "Collection Offers";

const defaultFeeSchedule = (network: Network) => {
    if (network === Network.MAINNET) {
        return MAINNET_ZERO_FEE_SCHEDULE;
    } else if (network === Network.TESTNET) {
        return TESTNET_FEE_SCHEDULE;
    } else if (network === Network.DEVNET) {
        return DEVNET_FEE_SCHEDULE;
    } else {
        throw new Error("Unsupported network");
    }
}

function Marketplace(props: TransactionContext) {
    const MARKETPLACE_HELPER = new Helper(getProvider(props.network), MODULE_ADDRESS);
    const [tokenStandard, setTokenStandard] = useState<string>(V2);
    const [type, setType] = useState<string>(FIXED_PRICE);
    const [feeSchedule, setFeeSchedule] = useState<string>(defaultFeeSchedule(props.network));
    const [feeScheduleDetails, setFeeScheduleDetails] = useState<{
        error: string | null,
        fee_address: string,
        listing_fee: string,
        bidding_fee: string,
        commission: string,
    }>();

    useEffect(() => {
        loadFeeSchedule()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.account])

    const loadFeeSchedule = async () => {
        // Ensure you're logged in
        if (!props.account) return [];

        try {
            let fee_address = await MARKETPLACE_HELPER.feeAddress(feeSchedule);
            let listing_fee = await MARKETPLACE_HELPER.listingFee(feeSchedule);
            let bidding_fee = await MARKETPLACE_HELPER.biddingFee(feeSchedule);
            let commission = await MARKETPLACE_HELPER.commission(feeSchedule, BigInt(DEFAULT_PRICE));

            setFeeScheduleDetails({
                error: null,
                fee_address: fee_address.hex(),
                listing_fee: listing_fee.toString(),
                bidding_fee: bidding_fee.toString(),
                commission: commission.toString()
            })
        } catch (error: any) {
            setFeeScheduleDetails({
                error: `Failed to load fee schedule ${error}`,
                fee_address: "",
                listing_fee: "",
                bidding_fee: "",
                commission: ""
            })
        }

    }

    const createFeeSchedule = async () => {
        // Ensure you're logged in
        if (!props.account) return [];

        const payload = await MARKETPLACE_HELPER.initFeeSchedule(props.account.address, BigInt(0), BigInt(0), BigInt(100), BigInt(0));

        let txn = await runTransaction(props, payload);
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

    const toApt = (num: string): number => {
        return Number(num) / APT
    }

    return (
        <>
            <Row align="middle">
                <Col flex={"auto"}>
                    <h1>Marketplace contract address {MODULE_ADDRESS}</h1>
                </Col>
            </Row>
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
                        defaultValue={defaultFeeSchedule(props.network)}
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
            {feeScheduleDetails && !feeScheduleDetails.error && <Row align="middle">
                <Col flex={"auto"}>
                    <p>Fee schedule details:</p>
                    <ol>
                        <li>{`Fees are sent to ${feeScheduleDetails?.fee_address}`}</li>
                        <li>{`List fee is ${toApt(feeScheduleDetails?.listing_fee)} APT`}</li>
                        <li>{`Bid fee is ${toApt(feeScheduleDetails?.bidding_fee)} APT`}</li>
                        <li>{`Commission on ${toApt(DEFAULT_PRICE)} APT is ${toApt(feeScheduleDetails?.commission)} APT`}</li>
                    </ol>
                </Col>
            </Row>}
            {feeScheduleDetails && feeScheduleDetails.error && <Row align="middle">
                <Col flex={"auto"}>
                    <Alert type="error" message={`Failed to load fee schedule ${feeScheduleDetails.error}`}/>
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
                    <Row align="middle">
                        <h1>NFT Marketplace</h1>
                    </Row>
                    <Row>
                        <Col>
                            <Select
                                defaultValue={V2}
                                style={{width: 120}}
                                onChange={setTokenStandard}
                                options={[
                                    {value: V1, label: V1},
                                    {value: V2, label: V2},
                                ]}
                            />
                        </Col>
                        <Col>
                            <Select
                                defaultValue={FIXED_PRICE}
                                onChange={setType}
                                options={[
                                    {value: FIXED_PRICE, label: FIXED_PRICE},
                                    {value: AUCTION, label: AUCTION},
                                    {value: TOKEN_OFFERS, label: TOKEN_OFFERS},
                                    {value: COLLECTION_OFFERS, label: COLLECTION_OFFERS},
                                ]}
                            />
                        </Col>
                    </Row>

                    <Row align="middle">
                        <Col>
                            <h2>Listing NFTs</h2>
                        </Col>
                    </Row>
                    {tokenStandard === V1 && type === FIXED_PRICE &&
                        <V1FixedListing network={props.network} account={props.account}
                                        submitTransaction={props.submitTransaction}/>}
                    {tokenStandard === V1 && type === AUCTION &&
                        <V1AuctionListing network={props.network} account={props.account}
                                          submitTransaction={props.submitTransaction}/>}
                    {tokenStandard === V1 && type === TOKEN_OFFERS && <Alert type="error" message="Not implemented"/>}
                    {tokenStandard === V1 && type === COLLECTION_OFFERS &&
                        <Alert type="error" message="Not implemented"/>}
                    {tokenStandard === V2 && type === FIXED_PRICE &&
                        <V2FixedListing network={props.network} account={props.account}
                                        submitTransaction={props.submitTransaction}/>}
                    {tokenStandard === V2 && type === AUCTION &&
                        <V2AuctionListing network={props.network} account={props.account}
                                          submitTransaction={props.submitTransaction}/>}
                    {tokenStandard === V2 && type === TOKEN_OFFERS &&
                        <V2TokenOffers network={props.network} account={props.account}
                                       submitTransaction={props.submitTransaction}/>}
                    {tokenStandard === V2 && type === COLLECTION_OFFERS &&
                        <V2CollectionOffers network={props.network} account={props.account}
                                            submitTransaction={props.submitTransaction}/>}
                    <Row align="middle">
                        <Col>
                            <h2>Interacting with Listings</h2>
                        </Col>
                    </Row>
                    {type === FIXED_PRICE &&
                        <FixedPriceListingManagement network={props.network} account={props.account}
                                                     submitTransaction={props.submitTransaction}/>}
                    {type === AUCTION &&
                        <AuctionListingManagement network={props.network} account={props.account}
                                                  submitTransaction={props.submitTransaction}/>}
                    {tokenStandard === V1 &&
                        <ExtractTokenV1 network={props.network} account={props.account}
                                        submitTransaction={props.submitTransaction}/>}
                    {(type === FIXED_PRICE) &&
                        <Listings ctx={{
                            network: props.network, account: props.account,
                            submitTransaction: props.submitTransaction
                        }} tokenStandard={tokenStandard}/>}
                    {(type === AUCTION) &&
                        <AuctionListings network={props.network} account={props.account}
                                         submitTransaction={props.submitTransaction}/>}
                    {type === TOKEN_OFFERS &&
                        <TokenOffers network={props.network} account={props.account}
                                     submitTransaction={props.submitTransaction}/>}
                    {type === COLLECTION_OFFERS &&
                        <CollectionOffers network={props.network} account={props.account}
                                          submitTransaction={props.submitTransaction}/>}
                </Col>
            </Row>
        </>
    );
}

function V1FixedListing(props: TransactionContext) {
    const MARKETPLACE_HELPER = new Helper(getProvider(props.network), MODULE_ADDRESS);
    const [message, setMessage] = useState<String>("");
    const [collectionName, setCollectionName] = useState<string>(DEFAULT_COLLECTION);
    const [tokenName, setTokenName] = useState<string>(DEFAULT_TOKEN_NAME);

    const [creatorAddress, setCreatorAddress] = useState<string>("");
    const [tokenPropertyVersion, setTokenPropertyVersion] = useState<number>(0);

    const [feeScheduleAddress, setFeeScheduleAddress] = useState<string>(defaultFeeSchedule(props.network));
    const [listingPrice, setListingPrice] = useState<string>(DEFAULT_PRICE);

    const createV1Listing = async () => {
        // Ensure you're logged in
        if (!props.account) return [];
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

        let txn = await runTransaction(props, payload);
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
                        defaultValue={props.account?.address}
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
                        defaultValue={defaultFeeSchedule(props.network)}
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

function V1AuctionListing(props: TransactionContext) {
    const MARKETPLACE_HELPER = new Helper(getProvider(props.network), MODULE_ADDRESS);
    const [message, setMessage] = useState<String>("");
    const [collectionName, setCollectionName] = useState<string>(DEFAULT_COLLECTION);
    const [tokenName, setTokenName] = useState<string>(DEFAULT_TOKEN_NAME);

    const [creatorAddress, setCreatorAddress] = useState<string>("");
    const [tokenPropertyVersion, setTokenPropertyVersion] = useState<number>(0);
    const [auctionDuration, setAuctionDuration] = useState<number>(3600);

    const [feeScheduleAddress, setFeeScheduleAddress] = useState<string>(defaultFeeSchedule(props.network));
    const [listingPrice, setListingPrice] = useState<string>(DEFAULT_PRICE);

    const createV1AuctionListing = async () => {
        // Ensure you're logged in
        if (!props.account) return [];

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
            BigInt(DEFAULT_PRICE)
        );

        let txn = await runTransaction(props, payload);
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
                        defaultValue={props.account?.address}
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
                        defaultValue={defaultFeeSchedule(props.network)}
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


function V2FixedListing(props: TransactionContext) {
    const MARKETPLACE_HELPER = new Helper(getProvider(props.network), MODULE_ADDRESS);
    const [message, setMessage] = useState<String>("");
    const [tokenAddress, setTokenAddress] = useState<string>("");

    const [feeScheduleAddress, setFeeScheduleAddress] = useState<string>(defaultFeeSchedule(props.network));
    const [listingPrice, setListingPrice] = useState<string>(DEFAULT_PRICE);

    const createV2Listing = async () => {
        // Ensure you're logged in
        if (!props.account || !tokenAddress) return [];
        const payload = await MARKETPLACE_HELPER.initFixedPriceListing(
            tokenAddress,
            feeScheduleAddress,
            BigInt(Math.floor(new Date().getTime() / 1000)),
            BigInt(listingPrice)
        );

        let txn = await runTransaction(props, payload);
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
                        defaultValue={defaultFeeSchedule(props.network)}
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

function V2AuctionListing(props: TransactionContext) {
    const MARKETPLACE_HELPER = new Helper(getProvider(props.network), MODULE_ADDRESS);
    const [message, setMessage] = useState<String>("");
    const [tokenAddress, setTokenAddress] = useState<string>("");
    const [auctionDuration, setAuctionDuration] = useState<number>(3600);

    const [feeScheduleAddress, setFeeScheduleAddress] = useState<string>(defaultFeeSchedule(props.network));
    const [listingPrice, setListingPrice] = useState<string>(DEFAULT_PRICE);

    const createV2AuctionListing = async () => {
        // Ensure you're logged in
        if (!props.account || !tokenAddress) return [];

        const now = Math.floor(new Date().getTime() / 1000);

        const payload = await MARKETPLACE_HELPER.initAuctionListing(
            tokenAddress,
            feeScheduleAddress,
            BigInt(now),
            BigInt(listingPrice),
            BigInt(1000000),
            BigInt(now + auctionDuration),
            BigInt(auctionDuration),
            BigInt(DEFAULT_PRICE)
        );

        let txn = await runTransaction(props, payload);
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
                        defaultValue={defaultFeeSchedule(props.network)}
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

function FixedPriceListingManagement(props: TransactionContext) {
    const MARKETPLACE_HELPER = new Helper(getProvider(props.network), MODULE_ADDRESS);
    const [listingAddress, setListingAddress] = useState<string>("");

    const cancelListing = async () => {
        // Ensure you're logged in
        if (!props.account || !listingAddress) return [];
        const payload = await MARKETPLACE_HELPER.endFixedPriceListing(listingAddress);
        await runTransaction(props, payload);
    }

    const purchaseListing = async () => {
        // Ensure you're logged in
        if (!props.account || !listingAddress) return [];
        const payload = await MARKETPLACE_HELPER.purchaseListing(listingAddress);
        await runTransaction(props, payload);
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

function AuctionListingManagement(props: TransactionContext) {
    const MARKETPLACE_HELPER = new Helper(getProvider(props.network), MODULE_ADDRESS);
    const [listingAddress, setListingAddress] = useState<string>("");
    const [bidAmount, setBidAmount] = useState<bigint>(BigInt(0));

    const completeAuction = async () => {
        // Ensure you're logged in
        if (!props.account || !listingAddress) return [];
        const payload = await MARKETPLACE_HELPER.completeAuctionListing(listingAddress);
        await runTransaction(props, payload);
    }

    const bidAuction = async () => {
        // Ensure you're logged in
        if (!props.account || !listingAddress) return [];
        const payload = await MARKETPLACE_HELPER.bidAuctionListing(props.account.address, listingAddress, bidAmount);
        await runTransaction(props, payload);
    }

    const buyNowAuction = async () => {
        // Ensure you're logged in
        if (!props.account || !listingAddress) return [];
        const payload = await MARKETPLACE_HELPER.purchaseListing(listingAddress);
        await runTransaction(props, payload);
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
                <Col span={2} offset={4}>
                    <Button
                        onClick={() => buyNowAuction()}
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


function ExtractTokenV1(props: TransactionContext) {
    const MARKETPLACE_HELPER = new Helper(getProvider(props.network), MODULE_ADDRESS);
    const [objectAddress, setObjectAddress] = useState<string>("");


    const extractToken = async () => {
        // Ensure you're logged in
        if (!props.account || !objectAddress) return [];
        const payload = await MARKETPLACE_HELPER.extract_tokenv1(objectAddress);
        await runTransaction(props, payload);
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

function Listings(props: { ctx: TransactionContext, tokenStandard: string }) {
    const MARKETPLACE_HELPER = new Helper(getProvider(props.ctx.network), MODULE_ADDRESS);
    const [listings, setListings] = useState<Array<V2Listing>>();
    const [listingsError, setListingsError] = useState<string>();

    useEffect(() => {
        loadListings()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.ctx.account, props.tokenStandard])

    const loadListings = async () => {
        try {
            let listings;
            if (props.tokenStandard === V1) {
                listings = (await MARKETPLACE_HELPER.getV1Listings(MODULE_ADDRESS, "example_v2_marketplace"));
                for (let listing of listings) {
                    listing.token_uri = await ensureImageUri(listing.token_uri);
                }
            } else {
                listings = (await MARKETPLACE_HELPER.getV2Listings(MODULE_ADDRESS, "example_v2_marketplace"));
                for (let listing of listings) {
                    listing.token_uri = await ensureImageUri(listing.token_uri);
                }
            }
            // TODO: load based on fee schedule
            setListingsError("");
            setListings(listings);
        } catch (error: any) {
            setListingsError(`Failed to load listings ${listings}`);
            setListings([]);
        }
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
                <Col span={8}>
                    {!listingsError && listings?.map((listing) => {
                        return <Listing listing={listing} ctx={props.ctx}/>;
                    })
                    }
                    {listingsError && <Alert type="error" message={listingsError}/>}
                </Col>
            </Row>
        </>
    );
}

function Listing(props: {
    ctx: TransactionContext,
    listing: V2Listing
}) {
    const MARKETPLACE_HELPER = new Helper(getProvider(props.ctx.network), MODULE_ADDRESS);
    const cancelListing = async (listingAddress: string) => {
        // Ensure you're logged in
        if (!props.ctx.account) return [];
        const payload = await MARKETPLACE_HELPER.endFixedPriceListing(listingAddress);
        await runTransaction(props.ctx, payload);
    }

    const purchaseListing = async (listingAddress: string) => {
        // Ensure you're logged in
        if (!props.ctx.account) return [];
        const payload = await MARKETPLACE_HELPER.purchaseListing(listingAddress);
        await runTransaction(props.ctx, payload);
    }

    return <Row align="middle">
        <Col>
            <Tooltip placement="right"
                     title={`${props.listing.collection_name} - ${props.listing.token_name}
                | Sold
                by ${props.listing.seller}`}>
                <Image
                    width={100}
                    src={props.listing.token_uri}
                    alt={props.listing.token_name}
                />
            </Tooltip>
        </Col>
        <Col>
            <Button
                onClick={() => purchaseListing(props.listing.listing_id)}
                type="primary"
                style={{height: "40px", backgroundColor: "#3f67ff"}}
            >
                Buy now for {props.listing.price / 100000000} APT
            </Button>
        </Col>
        <Col>
            {props.listing.seller === props.ctx.account?.address && <Button
                onClick={() => cancelListing(props.listing.listing_id)}
                type="primary"
                style={{height: "40px", backgroundColor: "#3f67ff"}}
            >
                Cancel listing
            </Button>}
        </Col>
    </Row>;
}


function AuctionListings(props: TransactionContext) {
    const MARKETPLACE_HELPER = new Helper(getProvider(props.network), MODULE_ADDRESS);
    const [listings, setListings] = useState<{
        collection_id: string,
        token_data_id: string,
        token_name: string,
        token_uri: string,
        price: number,
        listing_id: string,
        is_deleted: boolean,
        token_amount: number,
        seller: string,
        marketplace: string,
        contract_address: string
    }[]>();
    const [listingsError, setListingsError] = useState<string>();

    useEffect(() => {
        loadListings()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.account])

    const loadListings = async () => {
        try {
            let listings = (await MARKETPLACE_HELPER.getV2Auctions(MODULE_ADDRESS, "example_v2_marketplace", false));
            let parsed = [];
            for (const listing of listings) {
                parsed.push(
                    {
                        collection_id: listing.current_token_data.collection_id,
                        token_data_id: listing.current_token_data.token_data_id,
                        token_name: listing.current_token_data.token_name,
                        token_uri: await ensureImageUri(listing.current_token_data?.token_uri),
                        price: listing.starting_bid_price,
                        listing_id: listing.listing_id,
                        is_deleted: listing.is_deleted,
                        token_amount: listing.token_amount,
                        seller: listing.seller,
                        marketplace: listing.marketplace,
                        contract_address: listing.contract_address
                    }
                )
            }
            setListingsError("");
            setListings(parsed);
        } catch (error: any) {
            setListingsError(`Failed to load listings ${listings}`);
            setListings([]);
        }
    }

    const cancelListing = async (listingAddress: string) => {
        // Ensure you're logged in
        if (!props.account) return [];
        const payload = await MARKETPLACE_HELPER.endFixedPriceListing(listingAddress);
        await runTransaction(props, payload);
    }

    const purchaseListing = async (listingAddress: string) => {
        // Ensure you're logged in
        if (!props.account) return [];
        const payload = await MARKETPLACE_HELPER.purchaseListing(listingAddress);
        await runTransaction(props, payload);
    }

    return (
        <>
            <Row align="middle">
                <h3>Auctions</h3>
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
                <Col span={8}>
                    {!listingsError && <ol>
                        {listings?.map(({
                                            token_name,
                                            token_uri,
                                            price,
                                            listing_id,
                                            seller,
                                        }) =>
                            <li>
                                <Row align="middle">
                                    <Col>
                                        <Tooltip placement="right" title={``}>
                                            <b>Listing {listing_id}</b> - {token_name} - {price / 100000000} APT | Sold
                                            by {seller}
                                            <Image
                                                width={50}
                                                src={token_uri}
                                                alt={"img"}
                                            />
                                        </Tooltip>
                                    </Col>
                                    <Col>
                                        <Button
                                            onClick={() => purchaseListing(listing_id)}
                                            type="primary"
                                            style={{height: "40px", backgroundColor: "#3f67ff"}}
                                        >
                                            Buy now
                                        </Button>
                                    </Col>
                                    <Col>
                                        {seller === props.account?.address && <Button
                                            onClick={() => cancelListing(listing_id)}
                                            type="primary"
                                            style={{height: "40px", backgroundColor: "#3f67ff"}}
                                        >
                                            Cancel listing
                                        </Button>}
                                    </Col>
                                </Row>
                            </li>)}
                    </ol>}
                    {listingsError && <Alert type="error" message={listingsError}/>}
                </Col>
            </Row>
        </>
    );
}

function V2TokenOffers(props: TransactionContext) {
    const MARKETPLACE_HELPER = new Helper(getProvider(props.network), MODULE_ADDRESS);
    const [tokenAddress, setTokenAddress] = useState<string>("");
    const [feeSchedule, setFeeSchedule] = useState<string>(defaultFeeSchedule(props.network));
    const [price, setPrice] = useState<bigint>(BigInt(DEFAULT_PRICE));
    const [expirationSecs, setExpirationSecs] = useState<bigint>(BigInt(3600));

    const createTokenOffer = async () => {
        // Ensure you're logged in
        if (!props.account || !tokenAddress) return [];
        const expiration_time = BigInt(Math.floor(new Date().getTime() / 1000)) + expirationSecs;
        const payload = await MARKETPLACE_HELPER.initTokenOfferForTokenv2(tokenAddress, feeSchedule, price, expiration_time);
        await runTransaction(props, payload);
    }

    return (
        <>
            <Row align="middle">
                <h3>Token Offers</h3>
            </Row>
            <Row align="middle">
                <Col span={4}>
                    <p>Fee Schedule: </p>
                </Col>
                <Col flex={"auto"}>
                    <Input
                        onChange={(event) => {
                            onStringChange(event, setFeeSchedule)
                        }}
                        style={{width: "calc(100% - 60px)"}}
                        placeholder="FeeSchedule"
                        size="large"
                        defaultValue={defaultFeeSchedule(props.network)}
                    />
                </Col>
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
                <Col span={4}>
                    <p>Price: </p>
                </Col>
                <Col flex={"auto"}>
                    <Input
                        onChange={(event) => {
                            onBigIntChange(event, setPrice)
                        }}
                        style={{width: "calc(100% - 60px)"}}
                        placeholder="Price"
                        size="large"
                        defaultValue={DEFAULT_PRICE}
                    />
                </Col>
            </Row>
            <Row align="middle">
                <Col span={4}>
                    <p>Expiration secs: </p>
                </Col>
                <Col flex={"auto"}>
                    <Input
                        onChange={(event) => {
                            onBigIntChange(event, setExpirationSecs)
                        }}
                        style={{width: "calc(100% - 60px)"}}
                        placeholder="Expiration secs"
                        size="large"
                        defaultValue={3600}
                    />
                </Col>
            </Row>
            <Row align="middle">
                <Col span={2} offset={4}>
                    <Button
                        onClick={() => createTokenOffer()}
                        type="primary"
                        style={{height: "40px", backgroundColor: "#3f67ff"}}
                    >
                        Create Token offer
                    </Button>
                </Col>
            </Row>
        </>
    );
}

function V2CollectionOffers(props: TransactionContext) {
    const MARKETPLACE_HELPER = new Helper(getProvider(props.network), MODULE_ADDRESS);
    const [collectionAddress, setCollectionAddress] = useState<string>("");
    const [feeSchedule, setFeeSchedule] = useState<string>(defaultFeeSchedule(props.network));
    const [price, setPrice] = useState<bigint>(BigInt(DEFAULT_PRICE));
    const [amount, setAmount] = useState<bigint>(BigInt(1));
    const [expirationSecs, setExpirationSecs] = useState<bigint>(BigInt(3600));

    const createCollectionOffer = async () => {
        // Ensure you're logged in
        if (!props.account || !collectionAddress) return [];
        const expiration_time = BigInt(Math.floor(new Date().getTime() / 1000)) + expirationSecs;
        const payload = await MARKETPLACE_HELPER.initCollectionOfferForTokenv2(collectionAddress, feeSchedule, price, amount, expiration_time);
        await runTransaction(props, payload);
    }

    return (
        <>
            <Row align="middle">
                <h3>Collection Offers</h3>
            </Row>
            <Row align="middle">
                <Col span={4}>
                    <p>Fee Schedule: </p>
                </Col>
                <Col flex={"auto"}>
                    <Input
                        onChange={(event) => {
                            onStringChange(event, setFeeSchedule)
                        }}
                        style={{width: "calc(100% - 60px)"}}
                        placeholder="FeeSchedule"
                        size="large"
                        defaultValue={defaultFeeSchedule(props.network)}
                    />
                </Col>
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
                <Col span={4}>
                    <p>Price: </p>
                </Col>
                <Col flex={"auto"}>
                    <Input
                        onChange={(event) => {
                            onBigIntChange(event, setPrice)
                        }}
                        style={{width: "calc(100% - 60px)"}}
                        placeholder="Price"
                        size="large"
                        defaultValue={DEFAULT_PRICE}
                    />
                </Col>
            </Row>
            <Row align="middle">
                <Col span={4}>
                    <p>Expiration secs: </p>
                </Col>
                <Col flex={"auto"}>
                    <Input
                        onChange={(event) => {
                            onBigIntChange(event, setExpirationSecs)
                        }}
                        style={{width: "calc(100% - 60px)"}}
                        placeholder="Expiration secs"
                        size="large"
                        defaultValue={3600}
                    />
                </Col>
            </Row>
            <Row align="middle">
                <Col span={4}>
                    <p>Amount: </p>
                </Col>
                <Col flex={"auto"}>
                    <Input
                        onChange={(event) => {
                            onBigIntChange(event, setAmount)
                        }}
                        style={{width: "calc(100% - 60px)"}}
                        placeholder="amount"
                        size="large"
                        defaultValue={1}
                    />
                </Col>
            </Row>
            <Row align="middle">
                <Col span={2} offset={4}>
                    <Button
                        onClick={() => createCollectionOffer()}
                        type="primary"
                        style={{height: "40px", backgroundColor: "#3f67ff"}}
                    >
                        Create Collection offer
                    </Button>
                </Col>
            </Row>
        </>
    );
}

function TokenOffers(props: TransactionContext) {
    const MARKETPLACE_HELPER = new Helper(getProvider(props.network), MODULE_ADDRESS);
    const [tokenOffers, setTokenOffers] = useState<Array<TokenOffer>>();
    const [tokenAddress, setTokenAddress] = useState<string>("");

    const loadTokenOffers = async () => {
        let tokenOffers = await MARKETPLACE_HELPER.getTokenOffers(MODULE_ADDRESS, "example_v2_marketplace", tokenAddress);
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
                    {tokenOffers?.map((offer) => {
                        return <TokenOfferV2 offer={offer}/>;
                    })}
                </Col>
            </Row>
        </>
    );
}

function TokenOfferV2(props: { offer: TokenOffer }) {
    // TODO" Use collection name
    // TODO: Add accept button
    // TODO: Add cancel button
    return <Row align="middle">
        <Col>
            <Tooltip placement="right"
                     title={`${props.offer.collection_name} - ${props.offer.token_name}
                | Offered
                by ${props.offer.buyer}`}>
                <Image
                    width={100}
                    src={props.offer.token_uri}
                    alt={props.offer.token_name}
                />
            </Tooltip>
        </Col>
    </Row>;
}

function CollectionOffers(props: TransactionContext) {
    const MARKETPLACE_HELPER = new Helper(getProvider(props.network), MODULE_ADDRESS);
    const [collectionOffers, setCollectionOffers] = useState<{
        buyer: string,
        collection_id: string,
        collection_offer_id: string,
        expiration_time: number,
        current_collection_data: { collection_name: string },
        item_price: number,
        remaining_token_amount: number,
    }[]>();
    const [collectionAddress, setCollectionAddress] = useState<string>("");
    const [tokenAddress, setTokenAddress] = useState<string>("");

    const loadCollectionOffers = async () => {
        let collectionOffers = await MARKETPLACE_HELPER.getCollectionOffers(MODULE_ADDRESS, "example_v2_marketplace", collectionAddress, false);
        setCollectionOffers(collectionOffers);
    }

    const fillCollectionOffer = async (offerAddress: string) => {
        // Ensure you're logged in
        if (!props.account || !offerAddress) return [];
        const payload = await MARKETPLACE_HELPER.fillCollectionOfferForTokenv2(offerAddress, tokenAddress);
        await runTransaction(props, payload);
    }

    const cancelCollectionOffer = async (offerAddress: string) => {
        // Ensure you're logged in
        if (!props.account || !offerAddress) return [];
        const payload = await MARKETPLACE_HELPER.cancelCollectionOffer(offerAddress);
        await runTransaction(props, payload);
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
                <Col span={4}>
                    <p>Token Address to sell: </p>
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
                        onClick={() => loadCollectionOffers()}
                        type="primary"
                        style={{height: "40px", backgroundColor: "#3f67ff"}}
                    >
                        Load Collection Offers
                    </Button>
                </Col>
            </Row>
            <Row align="middle">
                <Col span={8}>
                    <ol>
                        {collectionOffers?.map((
                            {
                                buyer,
                                current_collection_data,
                                collection_offer_id,
                                expiration_time,
                                item_price,
                                remaining_token_amount

                            }) =>
                            <li>
                                <Row align="middle">
                                    <Col>
                                        <Tooltip placement="right" title={``}>
                                            <b>Offer {collection_offer_id}</b> - {current_collection_data.collection_name} - {item_price / 100000000} APT
                                            | Requested
                                            by {buyer}, expires at {expiration_time}, {remaining_token_amount} offers
                                            remaining
                                        </Tooltip>
                                    </Col>
                                    <Col>
                                        <Button
                                            onClick={() => fillCollectionOffer(collection_offer_id)}
                                            type="primary"
                                            style={{height: "40px", backgroundColor: "#3f67ff"}}
                                        >
                                            Sell now
                                        </Button>
                                    </Col>
                                    <Col>
                                        {buyer === props.account?.address && <Button
                                            onClick={() => cancelCollectionOffer(collection_offer_id)}
                                            type="primary"
                                            style={{height: "40px", backgroundColor: "#3f67ff"}}
                                        >
                                            Cancel listing
                                        </Button>}
                                    </Col>
                                </Row>
                            </li>)}
                    </ol>
                    {JSON.stringify(collectionOffers)}
                </Col>
            </Row>
        </>
    );
}


export default Marketplace;