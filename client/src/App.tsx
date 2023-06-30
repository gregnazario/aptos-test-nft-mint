import {Alert, Button, Col, Input, Layout, Row} from "antd";
import {WalletSelector} from "@aptos-labs/wallet-adapter-ant-design";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import {FaucetClient, Network, Provider} from "aptos";
import {useWallet} from "@aptos-labs/wallet-adapter-react";
import {useEffect, useState} from "react";
import Launchpad from './Launchpad';

// TODO: Load network from wallet
export const DEVNET_PROVIDER = new Provider(Network.DEVNET)
export const FAUCET = new FaucetClient("https://fullnode.devnet.aptoslabs.com", "https://faucet.devnet.aptoslabs.com");

// TODO: make this more accessible / be deployed by others?
export const moduleAddress = "0xb11affd5c514bb969e988710ef57813d9556cc1e3fe6dc9aa6a82b56aee53d98";

function App(this: any) {
    // TODO Consolidate a lot of these
    const [collectionName, setCollectionName] = useState<string>("Test Collection");
    const [tokenName, setTokenName] = useState<string>("Test Token #1");

    const [creatorAddress, setCreatorAddress] = useState<string>("");
    const [tokenPropertyVersion, setTokenPropertyVersion] = useState<number>(0);

    const [feeScheduleAddress, setFeeScheduleAddress] = useState<string>("0x5640348ea9c52a2a6e173fc6c884122a1025266b664064af1a8168813899317a");
    const [tokenAddress, setTokenAddress] = useState<string>("");
    const [listingAddress, setListingAddress] = useState<string>("");
    const [listingPrice, setListingPrice] = useState<string>("100000000");
    const [objectAddress, setObjectAddress] = useState<string>("");
    const [destinationAddress, setDestinationAddress] = useState<string>("");
    const [numTransaction, setNumTransaction] = useState<number>(0);
    const [auctionDuration, setAuctionDuration] = useState<number>(3600);
    const [chainId, setChainId] = useState<number>(-1);
    const [walletLoadError, setWalletLoadError] = useState<string>("");
    const [transactions, setTransactions] = useState<{ num: number, hash: string, type: string, data: string }[]>([]);
    const [wallet, setWallet] = useState<{
        name: string,
        tokens: {
            standard: string,
            collection: string,
            name: string,
            data_id: string,
            uri: string,
            type: string,
            property_version: string,
            creator_address: string
        }[]
    }>();
    const {account, network, connected, signAndSubmitTransaction} = useWallet();
    const onStringChange = async (event: React.ChangeEvent<HTMLInputElement>, setter: (value: (((prevState: string) => string) | string)) => void) => {
        const val = event.target.value;
        setter(val);
    }

    const onNumberChange = async (event: React.ChangeEvent<HTMLInputElement>, setter: (value: (((prevState: number) => number) | number)) => void) => {
        const val = event.target.value;
        setter(Number(val));
    }

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

    const createV1Listing = async () => {
        // Ensure you're logged in
        if (!account) return [];
        const type = "Create fixed price V1 listing";
        const payload = {
            type: "entry_function_payload",
            function: `${moduleAddress}::coin_listing::init_fixed_price_for_tokenv1`,
            type_arguments: ["0x1::aptos_coin::AptosCoin"],
            // TODO: allow different start time
            arguments: [
                creatorAddress,
                collectionName,
                tokenName,
                tokenPropertyVersion,
                feeScheduleAddress,
                Math.floor(new Date().getTime() / 1000),
                listingPrice
            ],
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

    const createV1AuctionListing = async () => {
        // Ensure you're logged in
        if (!account) return [];
        const type = "Create auction V1 listing";

        const now = Math.floor(new Date().getTime() / 1000);

        const payload = {
            type: "entry_function_payload",
            function: `${moduleAddress}::coin_listing::init_auction_for_tokenv1`,
            type_arguments: ["0x1::aptos_coin::AptosCoin"],
            // TODO: allow different start time
            arguments: [
                creatorAddress,
                collectionName,
                tokenName,
                tokenPropertyVersion,
                feeScheduleAddress,
                now,
                listingPrice,
                100,
                now + auctionDuration,
                auctionDuration,
                []
            ],
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


    const createV2Listing = async () => {
        // Ensure you're logged in
        if (!account || !tokenAddress) return [];
        const type = "Create fixed price V2 listing";
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

    const createV2AuctionListing = async () => {
        // Ensure you're logged in
        if (!account || !tokenAddress) return [];
        const type = "Create auction V2 listing";

        const now = Math.floor(new Date().getTime() / 1000);

        const payload = {
            type: "entry_function_payload",
            function: `${moduleAddress}::coin_listing::init_auction`,
            type_arguments: ["0x1::aptos_coin::AptosCoin"],
            // TODO: allow different start time
            arguments: [
                tokenAddress,
                feeScheduleAddress,
                now,
                listingPrice,
                1000000,
                now + auctionDuration,
                auctionDuration,
                []
            ],
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
            let txn = await DEVNET_PROVIDER.aptosClient.getTransactionByHash(response.hash) as any;
            return txn;
        } catch (error: any) {
            console.log("Failed to wait for txn" + error)
        }

        return undefined;
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
                    let name = token_data.current_token_data?.token_name || "";
                    let data_id = token_data.current_token_data?.token_data_id || "";
                    let uri = token_data.current_token_data?.token_uri || "";
                    let property_version = token_data.current_token_data?.largest_property_version_v1 || "";
                    let type = "NFT" // TODO: Handle fungible
                    return {
                        standard: "V1",
                        collection: collection_name,
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
                <>
                    {walletLoadError && <Row>
                        <Alert
                            message={`Wallet failed to load for ${account?.address}.  Please try connecting again or funding the account ${walletLoadError}`}
                            type="warning"/>
                    </Row>}
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
                            <Launchpad></Launchpad>
                            <Row align="middle">
                                <Col flex={"auto"} offset={2}>
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
                                <Button
                                    onClick={() => loadWalletNfts()}
                                    type="primary"
                                    style={{height: "40px", backgroundColor: "#3f67ff"}}
                                >
                                    Force refresh NFTs
                                </Button>
                            </Row>
                            <Row>
                                <ol>
                                    {wallet?.tokens.map(({
                                                             standard,
                                                             collection,
                                                             name,
                                                             data_id,
                                                             uri,
                                                             type,
                                                             creator_address,
                                                             property_version
                                                         }) =>
                                        <li>{standard} | {type} | {'"' + collection + "'"} - {'"' + name + '"'} - {"CREATOR: " + creator_address} - {"VERSION: " + property_version}
                                            <img
                                                width={50}
                                                src={uri}
                                                alt={"img"}/> - {data_id}
                                        </li>)}
                                </ol>
                            </Row>
                            <Row>
                                <h2>Transaction Log</h2>
                                <p>This keeps track of all the transactions that have occurred, but there's no
                                    cookies
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