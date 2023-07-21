// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable max-len */

import {
    AptosClient,
    AptosAccount,
    HexString,
    MaybeHexString,
    OptionalTransactionArgs,
    Provider,
    TransactionBuilderRemoteABI,
} from "aptos";

type TransactionPayload = {
    type: string;
    function: string;
    type_arguments: string[];
    arguments: any[];
};

type V1ListingsQueryResponse = { nft_marketplace_v2_current_nft_marketplace_listings: V1ListingsResponse };
export type V1ListingsResponse = Array<{
    current_token_data: {
        collection_id: string
        token_data_id: string
        token_name: string
        token_uri: string
    },
    price: number,
    listing_id: string,
    is_deleted: boolean,
    token_amount: number,
    seller: string,
    marketplace: string,
    contract_address: string
}>

export const V1_LISTINGS_ALL_QUERY =
    `query GetV1Listings($contract_address:String!, $fee_schedule_id: String!) {
        nft_marketplace_v2_current_nft_marketplace_listings(where: {
          contract_address: { _eq: $contract_address }
          fee_schedule_id: { _eq: $fee_schedule_id }
          is_deleted: { _eq: false }
          token_standard: {_eq: "v1"}
        }) {
          creator_address
          collection_name
          contract_address
          token_name
          current_token_data {
          largest_property_version_v1
            token_uri
          }
          property_version
          price
          listing_id
          is_deleted
          token_amount
          seller
          marketplace: marketplace
        }
    }`;

type V2ListingsQueryResponse = {
    nft_marketplace_v2_current_nft_marketplace_listings: Array<V2ListingIndexer>
};
export type V2ListingIndexer = {
    collection_id: string,
    token_data_id: string,
    contract_address: string,
    current_token_data: {
        current_collection: {
            collection_name: string,
        },
        token_name: string,
        token_uri: string
    },
    price: number,
    listing_id: string,
    token_amount: number,
    seller: string,
    fee_schedule_id: string,
};

export type V2ListingsResponse = Array<V2Listing>
export type V2Listing = {
    collection_id: string,
    token_data_id: string,
    contract_address: string,
    collection_name: string,
    token_name: string,
    token_uri: string,
    price: number,
    listing_id: string,
    token_amount: number,
    seller: string,
    fee_schedule_id: string,
};

export const V2_LISTINGS_ALL_QUERY =
    `query GetV2Listings($contract_address:String!, $marketplace: String!) {
        nft_marketplace_v2_current_nft_marketplace_listings(where: {
          contract_address: { _eq: $contract_address }
          marketplace: { _eq: $marketplace }
          is_deleted: { _eq: $is_deleted }
          token_standard: {_eq: "v2"}
        }) {
          collection_id
          contract_address
          current_token_data {
            current_collection {
            
              collection_name
            }
            token_name
            token_uri
          }
          price
          listing_id
          token_amount
          seller
          fee_schedule_id
        }
    }`;

type V2AuctionsQueryResponse = { nft_marketplace_v2_current_nft_marketplace_auctions: V2AuctionsResponse };
export type V2AuctionsResponse = Array<{

    current_token_data: {
        collection_id: string
        token_data_id: string
        token_name: string
        token_uri: string
    },
    buy_it_now_price: number | null,
    current_bid_price: number | null,
    current_bidder: string | null,
    expiration_time: string,
    listing_id: string,
    is_deleted: boolean,
    token_amount: number,
    seller: string,
    marketplace: string,
    contract_address: string,
    starting_bid_price: number
}>;
export const V2_AUCTIONS_ALL_QUERY =
    `query GetV2Listings($contract_address:String!, $marketplace: String!, $is_deleted: Boolean!) {
    nft_marketplace_v2_current_nft_marketplace_auctions(where: {
      contract_address: { _eq: $contract_address }
      marketplace: { _eq: $marketplace }
      is_deleted: { _eq: $is_deleted }
      current_token_data: {token_standard: {_eq: "v2"}}
    }) {
    contract_address
    marketplace
      buy_it_now_price
      current_bid_price
      current_bidder
      current_token_data {
        collection_id
        token_data_id
        token_name
        token_uri
      }
      expiration_time
      is_deleted
      listing_id
      seller
      starting_bid_price
      token_amount
    }`;

const APTOS_COIN: string = "0x1::aptos_coin::AptosCoin";
const COIN_LISTING: string = "coin_listing";
const COLLECTION_OFFER: string = "collection_offer";
const TOKEN_OFFER: string = "token_offer";
const FEE_SCHEDULE: string = "fee_schedule";
const LISTING: string = "listing";

/**
 * Class for managing the example marketplace.  It builds payloads to be used with the wallet adapter, but can
 * also submit payloads directly with an AptosAccount.
 */
export class Marketplace {
    readonly provider: Provider;
    readonly code_location: HexString;

    constructor(provider: Provider, code_location: MaybeHexString) {
        this.provider = provider;
        this.code_location = HexString.ensure(code_location);
    }

    // Coin listing operations
    initFixedPriceListing(
        object: MaybeHexString,
        feeSchedule: MaybeHexString,
        startTime: bigint,
        price: bigint,
        coin: string = APTOS_COIN,
    ): TransactionPayload {
        return this.buildTransactionPayload(
            COIN_LISTING,
            "init_fixed_price",
            [coin],
            [HexString.ensure(object).hex(), HexString.ensure(feeSchedule).hex(), startTime.toString(10), price.toString(10)],
        );
    }

    initAuctionListing(
        object: MaybeHexString,
        feeSchedule: MaybeHexString,
        startTime: bigint,
        startingBid: bigint,
        bidIncrement: bigint,
        auctionEndTime: bigint,
        minimumBidTimeBeforeEnd: bigint,
        buyItNowPrice?: bigint,
        coin: string = APTOS_COIN,
    ): TransactionPayload {
        return this.buildTransactionPayload(
            COIN_LISTING,
            "init_auction",
            [coin],
            [
                HexString.ensure(object).hex(),
                HexString.ensure(feeSchedule).hex(),
                startTime.toString(10),
                startingBid.toString(10),
                bidIncrement.toString(10),
                auctionEndTime.toString(10),
                minimumBidTimeBeforeEnd.toString(10),
                buyItNowPrice?.toString(10),
            ],
        );
    }

    initFixedPriceListingForTokenv1(
        tokenCreator: MaybeHexString,
        tokenCollection: string,
        tokenName: string,
        tokenPropertyVersion: bigint,
        feeSchedule: MaybeHexString,
        startTime: bigint,
        price: bigint,
        coin: string = APTOS_COIN,
    ): TransactionPayload {
        return this.buildTransactionPayload(
            COIN_LISTING,
            "init_fixed_price_for_tokenv1",
            [coin],
            [
                HexString.ensure(tokenCreator).hex(),
                tokenCollection,
                tokenName,
                tokenPropertyVersion.toString(10),
                HexString.ensure(feeSchedule).hex(),
                startTime.toString(10),
                price.toString(10),
            ],
        );
    }

    initAuctionListingForTokenv1(
        tokenCreator: MaybeHexString,
        tokenCollection: string,
        tokenName: string,
        tokenPropertyVersion: bigint,
        feeSchedule: MaybeHexString,
        startTime: bigint,
        startingBid: bigint,
        bidIncrement: bigint,
        auctionEndTime: bigint,
        minimumBidTimeBeforeEnd: bigint,
        buyItNowPrice?: bigint,
        coin: string = APTOS_COIN,
    ): TransactionPayload {
        return this.buildTransactionPayload(
            COIN_LISTING,
            "init_auction_for_tokenv1",
            [coin],
            [
                HexString.ensure(tokenCreator).hex(),
                tokenCollection,
                tokenName,
                tokenPropertyVersion.toString(10),
                HexString.ensure(feeSchedule).hex(),
                startTime.toString(10),
                startingBid.toString(10),
                bidIncrement.toString(10),
                auctionEndTime.toString(10),
                minimumBidTimeBeforeEnd.toString(10),
                buyItNowPrice?.toString(10),
            ],
        );
    }

    purchaseListing(listing: MaybeHexString, coin: string = APTOS_COIN): TransactionPayload {
        return this.buildTransactionPayload(COIN_LISTING, "purchase", [coin], [HexString.ensure(listing).hex()]);
    }

    endFixedPriceListing(listing: MaybeHexString, coin: string = APTOS_COIN): TransactionPayload {
        return this.buildTransactionPayload(COIN_LISTING, "end_fixed_price", [coin], [HexString.ensure(listing).hex()]);
    }

    bidAuctionListing(
        bidder: MaybeHexString,
        listing: MaybeHexString,
        bid_amount: bigint,
        coin: string = APTOS_COIN,
    ): TransactionPayload {
        return this.buildTransactionPayload(
            COIN_LISTING,
            "bid",
            [coin],
            [HexString.ensure(listing).hex(), bid_amount.toString(10)],
        );
    }

    completeAuctionListing(listing: MaybeHexString, coin: string = APTOS_COIN): TransactionPayload {
        return this.buildTransactionPayload(COIN_LISTING, "complete_auction", [coin], [HexString.ensure(listing).hex()]);
    }

    // Listing operations
    extract_tokenv1(object: MaybeHexString): TransactionPayload {
        return this.buildTransactionPayload(LISTING, "extract_tokenv1", [], [HexString.ensure(object).hex()]);
    }

    // Collection offer operations

    initCollectionOfferForTokenv1(
        tokenCreator: MaybeHexString,
        tokenCollection: string,
        feeSchedule: MaybeHexString,
        price: bigint,
        amount: bigint,
        expiration_time: bigint,
        coin: string = APTOS_COIN,
    ): TransactionPayload {
        return this.buildTransactionPayload(
            COLLECTION_OFFER,
            "init_for_tokenv1_entry",
            [coin],
            [
                HexString.ensure(tokenCreator).hex(),
                tokenCollection,
                HexString.ensure(feeSchedule).hex(),
                price.toString(),
                amount.toString(),
                expiration_time.toString(),
            ],
        );
    }

    initCollectionOfferForTokenv2(
        collection: MaybeHexString,
        feeSchedule: MaybeHexString,
        price: bigint,
        amount: bigint,
        expiration_time: bigint,
        coin: string = APTOS_COIN,
    ): TransactionPayload {
        return this.buildTransactionPayload(
            COLLECTION_OFFER,
            "init_for_tokenv2_entry",
            [coin],
            [HexString.ensure(collection).hex(), HexString.ensure(feeSchedule).hex(), price.toString(), amount.toString(), expiration_time.toString()],
        );
    }

    cancelCollectionOffer(collectionOffer: MaybeHexString, coin: string = APTOS_COIN): TransactionPayload {
        return this.buildTransactionPayload(COLLECTION_OFFER, "cancel", [coin], [HexString.ensure(collectionOffer).hex()]);
    }

    fillCollectionOfferForTokenv1(
        collectionOffer: MaybeHexString,
        tokenName: string,
        propertyVersion: bigint,
        coin: string = APTOS_COIN,
    ): TransactionPayload {
        return this.buildTransactionPayload(
            COLLECTION_OFFER,
            "sell_tokenv1_entry",
            [coin],
            [HexString.ensure(collectionOffer).hex(), tokenName, propertyVersion.toString(10)],
        );
    }

    fillCollectionOfferForTokenv2(
        collectionOffer: MaybeHexString,
        token: MaybeHexString,
        coin: string = APTOS_COIN,
    ): TransactionPayload {
        return this.buildTransactionPayload(
            COLLECTION_OFFER,
            "sell_tokenv2",
            [coin],
            [HexString.ensure(collectionOffer).hex(), HexString.ensure(token).hex()],
        );
    }


    initTokenOfferForTokenv1(
        tokenCreator: MaybeHexString,
        token: string,
        feeSchedule: MaybeHexString,
        price: bigint,
        expiration_time: bigint,
        coin: string = APTOS_COIN,
    ): TransactionPayload {
        return this.buildTransactionPayload(
            TOKEN_OFFER,
            "init_for_tokenv1_entry",
            [coin],
            [
                HexString.ensure(tokenCreator).hex(),
                token,
                HexString.ensure(feeSchedule).hex(),
                price.toString(),
                expiration_time.toString(),
            ],
        );
    }

    initTokenOfferForTokenv2(
        token: MaybeHexString,
        feeSchedule: MaybeHexString,
        price: bigint,
        expiration_time: bigint,
        coin: string = APTOS_COIN,
    ): TransactionPayload {
        return this.buildTransactionPayload(
            TOKEN_OFFER,
            "init_for_tokenv2_entry",
            [coin],
            [HexString.ensure(token).hex(), HexString.ensure(feeSchedule).hex(), price.toString(), expiration_time.toString()],
        );
    }

    cancelTokenOffer(tokenOffer: MaybeHexString, coin: string = APTOS_COIN): TransactionPayload {
        return this.buildTransactionPayload(TOKEN_OFFER, "cancel", [coin], [HexString.ensure(tokenOffer).hex()]);
    }

    fillTokenOfferForTokenv1(
        tokenOffer: MaybeHexString,
        tokenName: string,
        propertyVersion: bigint,
        coin: string = APTOS_COIN,
    ): TransactionPayload {
        return this.buildTransactionPayload(
            TOKEN_OFFER,
            "sell_tokenv1_entry",
            [coin],
            [HexString.ensure(tokenOffer).hex(), tokenName, propertyVersion.toString(10)],
        );
    }

    fillTokenOfferForTokenv2(
        tokenOffer: MaybeHexString,
        token: MaybeHexString,
        coin: string = APTOS_COIN,
    ): TransactionPayload {
        return this.buildTransactionPayload(
            TOKEN_OFFER,
            "sell_tokenv2",
            [coin],
            [HexString.ensure(tokenOffer).hex(), HexString.ensure(token).hex()],
        );
    }

    // Fee schedule operations

    initFeeSchedule(
        feeAddress: MaybeHexString,
        biddingFee: bigint,
        listingFee: bigint,
        commissionDenominator: bigint,
        commissionNumerator: bigint,
    ): TransactionPayload {
        return this.buildTransactionPayload(
            FEE_SCHEDULE,
            "init_entry",
            [],
            [
                HexString.ensure(feeAddress).hex(),
                biddingFee.toString(10),
                listingFee.toString(10),
                commissionDenominator.toString(10),
                commissionNumerator.toString(10),
            ],
        );
    }

    initEmptyFeeSchedule(feeAddress: MaybeHexString): TransactionPayload {
        return this.buildTransactionPayload(FEE_SCHEDULE, "empty", [], [HexString.ensure(feeAddress).hex()]);
    }

    setFeeAddress(feeSchedule: MaybeHexString, feeAddress: MaybeHexString): TransactionPayload {
        return this.buildTransactionPayload(
            FEE_SCHEDULE,
            "set_fee_address",
            [],
            [HexString.ensure(feeSchedule).hex(), HexString.ensure(feeAddress).hex()],
        );
    }

    setFixedRateListingFee(feeSchedule: MaybeHexString, fee: bigint): TransactionPayload {
        return this.buildTransactionPayload(
            FEE_SCHEDULE,
            "set_fixed_rate_listing_fee",
            [],
            [HexString.ensure(feeSchedule).hex(), fee.toString(10)],
        );
    }

    setFixedRateBiddingFee(feeSchedule: MaybeHexString, fee: bigint): TransactionPayload {
        return this.buildTransactionPayload(
            FEE_SCHEDULE,
            "set_fixed_rate_bidding_fee",
            [],
            [HexString.ensure(feeSchedule).hex(), fee.toString(10)],
        );
    }

    setFixedRateCommission(feeSchedule: MaybeHexString, commission: bigint): TransactionPayload {
        return this.buildTransactionPayload(
            FEE_SCHEDULE,
            "set_fixed_rate_commission",
            [],
            [HexString.ensure(feeSchedule).hex(), commission.toString(10)],
        );
    }

    setPercentageRateCommission(
        feeSchedule: MaybeHexString,
        commissionDenominator: bigint,
        commissionNumerator: bigint,
    ): TransactionPayload {
        return this.buildTransactionPayload(
            FEE_SCHEDULE,
            "set_percentage_rate_commission",
            [],
            [HexString.ensure(feeSchedule).hex(), commissionDenominator.toString(10), commissionNumerator.toString(10)],
        );
    }

    // View functions
    // TODO: Collection offer view functions
    // TODO: Coin listing view functions
    // TODO: Listing view functions

    async feeAddress(feeSchedule: MaybeHexString, ledgerVersion?: bigint): Promise<HexString> {
        let outputs = await this.view(FEE_SCHEDULE, "fee_address", [], [HexString.ensure(feeSchedule).hex()], ledgerVersion);

        return HexString.ensure(outputs[0].toString());
    }

    async listingFee(feeSchedule: MaybeHexString, ledgerVersion?: bigint): Promise<bigint> {
        let outputs = await this.view(FEE_SCHEDULE, "listing_fee", [], [HexString.ensure(feeSchedule).hex(), "0"], ledgerVersion);

        return BigInt(outputs[0].toString());
    }

    async biddingFee(feeSchedule: MaybeHexString, ledgerVersion?: bigint): Promise<bigint> {
        let outputs = await this.view(FEE_SCHEDULE, "bidding_fee", [], [HexString.ensure(feeSchedule).hex(), "0"], ledgerVersion);

        return BigInt(outputs[0].toString());
    }

    async commission(feeSchedule: MaybeHexString, price: bigint, ledgerVersion?: bigint): Promise<bigint> {
        let outputs = await this.view(FEE_SCHEDULE, "commission", [], [HexString.ensure(feeSchedule).hex(), price.toString(10).toString()], ledgerVersion);

        return BigInt(outputs[0].toString());
    }

    // Indexer queries

    async getV2Listings(contractAddress: MaybeHexString, marketplace: String): Promise<V2ListingsResponse> {
        const variables = {
            contract_address: HexString.ensure(contractAddress).hex(),
            marketplace: marketplace,
        };
        let indexerResponse = await this.queryIndexer<V2ListingsQueryResponse>(V2_LISTINGS_ALL_QUERY, variables);

        let listings: Array<V2Listing> = [];
        for (const listing of indexerResponse.nft_marketplace_v2_current_nft_marketplace_listings) {
            listings.push(
                {
                    collection_id: listing.collection_id,
                    token_data_id: listing.token_data_id,
                    contract_address: listing.contract_address,
                    collection_name: listing.current_token_data.current_collection.collection_name,
                    token_uri: listing.current_token_data.token_uri,
                    token_name: listing.current_token_data.token_name,
                    price: listing.price,
                    listing_id: listing.listing_id,
                    token_amount: listing.token_amount,
                    seller: listing.seller,
                    fee_schedule_id: listing.fee_schedule_id,
                }
            )
        }

        return listings
    }

    async getV2Auctions(contractAddress: MaybeHexString, marketplace: String, isDeleted: boolean): Promise<V2AuctionsResponse> {
        // TODO: Fix query
        const variables = {
            contract_address: HexString.ensure(contractAddress).hex(),
            marketplace: marketplace,
            is_deleted: isDeleted,
        };
        let result = await this.queryIndexer<V2AuctionsQueryResponse>(V2_AUCTIONS_ALL_QUERY, variables);
        return result.nft_marketplace_v2_current_nft_marketplace_auctions;
    }

    async getTokenOffers(contractAddress: MaybeHexString, marketplace: String, tokenAddress: MaybeHexString, isDeleted: boolean): Promise<any> {
        const query =
            `query GetTokenOffers($contract_address:String!, $marketplace: String!, $token_id: String!, $is_deleted: Boolean!) {
            nft_marketplace_v2_current_nft_marketplace_token_offers(where: {
                contract_address: { _eq: $contract_address }
                marketplace: { _eq: $marketplace }
                is_deleted: { _eq: $is_deleted }
                token_data_id: { _eq: $token_id }
            }) {
                buyer
                current_token_data {
                    collection_id
                    token_data_id
                    token_name
                }
                expiration_time
                is_deleted
                offer_id
                price
                token_amount
                token_standard
            }
        }`;
        const variables = {
            contract_address: HexString.ensure(contractAddress).hex(),
            marketplace: marketplace,
            token_id: HexString.ensure(tokenAddress).hex(),
            is_deleted: isDeleted,
        };

        return await this.queryIndexer(query, variables);
    }

    async getCollectionOffers(contractAddress: MaybeHexString, marketplace: String, collectionAddress: MaybeHexString, isDeleted: boolean): Promise<{
        buyer: string,
        collection_id: string,
        collection_offer_id: string,
        expiration_time: number,
        current_collection_data: { collection_name: string },
        item_price: number,
        remaining_token_amount: number,
        is_deleted: boolean
    }[]> {
        const query =
            `query GetCollectionOffers($contract_address:String!, $marketplace: String!, $collection_id: String!, $is_deleted: Boolean!) {
              nft_marketplace_v2_current_nft_marketplace_collection_offers(where: {
                  contract_address: { _eq: $contract_address }
                  marketplace: { _eq: $marketplace }
                  is_deleted: { _eq: $is_deleted }
                  collection_id: { _eq: $collection_id }
              }) {
                buyer
                collection_id
                collection_offer_id
                current_collection_data {
                  collection_name
                }
                expiration_time
                is_deleted
                item_price
                remaining_token_amount
              }
            }`
        const variables = {
            contract_address: HexString.ensure(contractAddress).hex(),
            marketplace: marketplace,
            collection_id: HexString.ensure(collectionAddress).hex(),
            is_deleted: isDeleted,
        };

        return (await this.queryIndexer<{
            nft_marketplace_v2_current_nft_marketplace_collection_offers: {
                buyer: string,
                collection_id: string,
                collection_offer_id: string,
                expiration_time: number,
                current_collection_data: { collection_name: string },
                item_price: number,
                remaining_token_amount: number,
                is_deleted: boolean
            }[]
        }>(query, variables)).nft_marketplace_v2_current_nft_marketplace_collection_offers;
    }

    // Helpers

    async queryIndexer<T>(query: string, variables?: {}): Promise<T> {
        const graphqlQuery = {
            query,
            variables: variables
        };
        return this.provider.queryIndexer(graphqlQuery)
    }

    async view(module: string, func: string, typeArguments: string[], args: any[], ledgerVersion?: bigint) {
        return await this.provider.view(
            {
                function: `${this.code_location}::${module}::${func}`,
                type_arguments: typeArguments,
                arguments: args,
            },
            ledgerVersion?.toString(10),
        );
    }

    buildTransactionPayload(module: string, func: string, type: string[], args: any[]): TransactionPayload {
        return {
            type: "entry_function_payload",
            function: `${this.code_location}::${module}::${func}`,
            type_arguments: type,
            arguments: args,
        };
    }

    /**
     * Submits a transaction generated from one of the above functions
     *
     * @param sender
     * @param payload
     * @param extraArgs
     */
    async submitTransaction(
        sender: AptosAccount,
        payload: TransactionPayload,
        extraArgs?: OptionalTransactionArgs,
    ): Promise<string> {
        const builder = new TransactionBuilderRemoteABI(this.provider, {
            sender: sender.address(),
            ...extraArgs,
        });
        const rawTxn = await builder.build(payload.function, payload.type_arguments, payload.arguments);

        const bcsTxn = AptosClient.generateBCSTransaction(sender, rawTxn);
        const pendingTransaction = await this.provider.submitSignedBCSTransaction(bcsTxn);
        return pendingTransaction.hash;
    }
}
