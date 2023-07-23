import {Network} from "aptos";
import React, {useEffect, useState} from "react";
import {getProvider} from "../Helper";
import {Alert, Col, Divider, Image, Layout, Pagination, Row, Tooltip} from "antd";
import {ensureImageUri} from "../App";

type Token = {
    standard: string,
    collection: string,
    collection_id: string,
    name: string,
    data_id: string,
    uri: string,
    type: string,
    creator_address: string,
    property_version: string
};

export const resolveToName = async (maybe_address: string): Promise<string> => {
    // Primary first then name
    try {
        const response = await fetch(`https://www.aptosnames.com/api/mainnet/v1/primary_name/${maybe_address}`);
        const {name} = await response.json();

        // If I can resolve the name, let's provide that
        if (name != null) {
            return `${name}.apt`
        }
    } catch {
    }

    // TODO: Provide useful messages if names don't resolve
    try {
        const response = await fetch(`https://www.aptosnames.com/api/mainnet/v1/name/${maybe_address}`);
        const {name} = await response.json();

        // If I can resolve the name, let's provide that
        if (name != null) {
            return `${name}.apt`
        }
    } catch {
    }

    // In all other cases, show the original string
    return maybe_address
}

// Resolves a name or address to an address
export const resolveToAddress = async (maybe_name: string): Promise<string> => {
    // TODO: Provide useful messages if names don't resolve
    try {
        const response = await fetch(`https://www.aptosnames.com/api/mainnet/v1/address/${maybe_name}`);
        const {address} = await response.json();
        // If name resolves, return the address
        if (address != null) {
            return address
        }
    } catch {
    }
    // If it can't resolve, act like it's an address
    return maybe_name
}

export function Wallet(props: { network: Network, wallet_address: string }) {

    const [totalNfts, setTotalNfts] = useState<number>(10);
    const [address, setAddress] = useState<string>(props.wallet_address ?? "");
    const [name, setName] = useState<string>(props.wallet_address ?? "");
    const [wallet, setWallet] = useState<{
        error: string | undefined,
        tokens: Token[]
    }>();
    useEffect(() => {
        fetchWalletFirstTime();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.network, props.wallet_address])

    const fetchWalletFirstTime = async () => {
        if (!props.wallet_address) {
            return
        }
        let address = await resolveToAddress(props.wallet_address);
        let name = await resolveToName(address);
        setAddress(address);
        setName(name);
        await getTotalNfts(address);
        await fetchWallet(address, name, 0, 10);
    }

    const getTotalNfts = async (address: string) => {
        if (!address) {
            return
        }
        try {
            let numNfts = await getProvider(props.network).indexerClient.getAccountTokensCount(address)
            setTotalNfts(numNfts.current_token_ownerships_aggregate.aggregate?.count ?? 0);
        } catch (error: any) {
            console.log("Failed to load wallet" + error)
            setTotalNfts(10);
        }
    }

    const fetchWallet = async (address: string, name: string, page: number, limit: number) => {
        if (!address) {
            return;
        }
        try {
            let tokens_query = await getProvider(props.network).indexerClient.getOwnedTokens(address, {
                options: {
                    offset: page * limit,
                    limit: limit
                }
            });

            // TODO: Revisit this conversion and see if anything else needs to be cleaned up
            let tokens: Token[] = [];
            for (const token_data of tokens_query.current_token_ownerships_v2) {
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
                    tokens.push({
                        standard: "V2",
                        collection: collection_name,
                        collection_id,
                        name: name,
                        data_id: data_id,
                        uri: uri,
                        type: type,
                        property_version: "",
                        creator_address: creator_address
                    });
                } else {
                    // Handle V1
                    let collection_creator = token_data.current_token_data?.current_collection?.creator_address || "";
                    let collection_name = token_data.current_token_data?.current_collection?.collection_name || "";
                    let collection_id = token_data.current_token_data?.current_collection?.collection_id || "";
                    let name = token_data.current_token_data?.token_name || "";
                    let data_id = token_data.current_token_data?.token_data_id || "";
                    let uri = token_data.current_token_data?.token_uri || "";

                    // Support URI in metadata
                    // TODO: Verify all image endings
                    try {
                        uri = await ensureImageUri(uri);
                    } catch (error: any) {
                        console.log(`Failed to query ${uri} ${error}`)
                    }

                    let property_version = token_data.current_token_data?.largest_property_version_v1 || 0;
                    let type = "NFT" // TODO: Handle fungible
                    tokens.push({
                        standard: "V1",
                        collection: collection_name,
                        collection_id,
                        name: name,
                        data_id: data_id,
                        uri: uri,
                        type: type,
                        property_version: property_version,
                        creator_address: collection_creator
                    });
                }
            }

            setWallet({error: undefined, tokens: tokens})
            return
        } catch (error: any) {
            console.log(`Failed to load wallet ${address}` + error)
            setWallet({error: `Failed to load wallet ${error.toString()}`, tokens: []})
        }
    }

    return <Layout>
        <Row align="middle">
            <Col offset={2}>
                <h2>{name}</h2>
            </Col>
        </Row>
        <Divider/>
        {!wallet?.error &&
            <>
                <Row align="middle">
                    <Col offset={2}>
                        {wallet?.tokens.map((item) =>
                            <WalletItem item={item}/>
                        )}
                    </Col>
                </Row>
                <Row align="middle">
                    <Col offset={2}>
                        <Pagination onChange={(page, limit) => {
                            fetchWallet(address, name, page - 1, limit)
                        }} defaultCurrent={1} total={totalNfts}/>
                    </Col>
                </Row>
            </>
        }
        {wallet?.error &&
            <Row align="middle">
                <Col offset={2}>
                    <Alert type="error" message={wallet.error}/>
                </Col>
            </Row>}
    </Layout>;
}

function WalletItem(props: {
    item: Token
}) {
    // TODO: Add listing directly
    return <>
        {props.item.standard.toLowerCase() === "v1" &&
            <Tooltip placement="right"
                     title={`${props.item.collection} : ${props.item.name}\n
                     ${props.item.standard} ${props.item.type}\n
                                        Data id: ${props.item.data_id}\n
                                        Creator: ${props.item.creator_address}\n
                                        Property Version: ${props.item.property_version}
                                        `}>
                <Image
                    width={100}
                    src={props.item.uri}
                    alt={props.item.name}
                    fallback="data:image/png;base64,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"
                />
            </Tooltip>}
        {props.item.standard.toLowerCase() === "v2" &&
            <Tooltip placement="right"
                     title={`${props.item.collection} : ${props.item.name}\n
                     Standard: ${props.item.standard}\n
                     Type: ${props.item.type}\n
                     Data id: ${props.item.data_id}\n
                     Creator: ${props.item.creator_address}\n
                     Property Version: ${props.item.property_version}`}>
                <Image
                    width={100}
                    src={props.item.uri}
                    alt={props.item.name}
                    fallback="data:image/png;base64,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"
                />
            </Tooltip>}
    </>;
}
