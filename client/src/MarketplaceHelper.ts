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

type ListingsQueryResponse = {
    nft_marketplace_v2_current_nft_marketplace_listings: Array<ListingIndexer>
};
export type ListingIndexer = {
    collection_id: string,
    token_data_id: string,
    current_token_data: {
        current_collection: {
            creator_address: string,
            collection_name: string,
        },
        token_name: string,
        token_uri: string
        largest_property_version_v1: number,
    },
    price: number,
    listing_id: string,
    token_amount: number,
    seller: string,
    contract_address: string,
    fee_schedule_id: string,
    token_standard: string,
};

export type ListingsResponse = Array<Listing>
export type Listing = {
    creator_address: string,
    collection_id: string,
    collection_name: string,
    token_data_id: string,
    token_name: string,
    property_version: number,
    token_uri: string,
    price: number,
    listing_id: string,
    token_amount: number,
    seller: string,
    contract_address: string,
    fee_schedule_id: string,
    token_standard: string,
};

export const LISTINGS_ALL_QUERY =
    `query GetFixedPriceListings($contract_address:String!, $fee_schedule_id: String!) {
        nft_marketplace_v2_current_nft_marketplace_listings(where: {
          contract_address: { _eq: $contract_address }
          fee_schedule_id: { _eq: $fee_schedule_id }
          is_deleted: { _eq: false }
        }) {
          collection_id
          contract_address
          current_token_data {
            current_collection {
              creator_address
              collection_name
            }
            token_name
            token_uri
            largest_property_version_v1
          }
          price
          listing_id
          token_amount
          token_standard
          seller
          fee_schedule_id
        }
    }`

type AuctionsQueryResponse = { nft_marketplace_v2_current_nft_marketplace_auctions: AuctionsResponse };
export type AuctionsResponse = Array<{
    buy_it_now_price: number | null,
    starting_bid_price: number
    current_bid_price: number | null,
    current_bidder: string | null,
    expiration_time: string,
    listing_id: string,
    current_token_data: {
        current_collection: {
            creator_address: string,
            collection_name: string,
        },
        collection_id: string
        token_data_id: string
        token_name: string
        token_uri: string
        largest_property_version_v1: string
    },
    token_amount: number,
    seller: string,
    contract_address: string,
    fee_schedule_id: string,
}>;
export const AUCTIONS_QUERY =
    `query GetAuctions($contract_address: String!, $fee_schedule_id: String!) {
      nft_marketplace_v2_current_nft_marketplace_auctions(where: {
        contract_address: { _eq: $contract_address }
        fee_schedule_id: { _eq: $fee_schedule_id }
        is_deleted: { _eq: false }
      }) {
      buy_it_now_price
      starting_bid_price
      current_bid_price
      current_bidder
      expiration_time
      listing_id
      current_token_data {
        current_collection {
        creator_address
          collection_name
        }
        collection_id
        token_data_id
        token_name
        largest_property_version_v1
        token_uri
      }
      token_amount
      seller
      contract_address
      fee_schedule_id
    }
 }`;

type TokenOfferIndexerResponse = {
    nft_marketplace_v2_current_nft_marketplace_token_offers: Array<TokenOfferIndexer>
};
export type TokenOfferIndexer = {
    buyer: string,
    current_token_data: {
        current_collection: {
            collection_name: string
        },
        collection_id: string,
        token_data_id: string,
        token_name: string,
        token_uri: string,
    },
    expiration_time: number,
    offer_id: string,
    price: number,
    token_amount: number,
    token_standard: string,
    fee_schedule_id: string,
};

export type TokenOffer = {
    buyer: string,
    collection_name: string,
    collection_id: string,
    token_data_id: string,
    token_name: string,
    token_uri: string,
    expiration_time: number,
    offer_id: string,
    price: number,
    token_amount: number,
    token_standard: string,
    fee_schedule_id: string,
};

export const TOKEN_OFFERS_QUERY =
    `query GetTokenV2Offers($contract_address:String!, $marketplace: String!, $token_id: String!) {
            nft_marketplace_v2_current_nft_marketplace_token_offers(where: {
                contract_address: { _eq: $contract_address }
                marketplace: { _eq: $marketplace }
                is_deleted: { _eq: false}
                token_data_id: { _eq: $token_id }
                token_standard: { _eq: "v2" }
            }) {
                buyer
                current_token_data {
                    current_collection {
                      collection_name
                    }
                    collection_id
                    token_data_id
                    token_name
                }
                expiration_time
                offer_id
                price
                token_amount
                token_standard
                fee_schedule_id
            }
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

    buyNowAuctionListing(
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
    /**
     * Gets all listings of Token V1 & Token V2
     * @param contractAddress
     * @param feeScheduleId
     */
    async getListings(contractAddress: MaybeHexString, feeScheduleId: String): Promise<ListingsResponse> {
        const variables = {
            contract_address: HexString.ensure(contractAddress).hex(),
            fee_schedule_id: feeScheduleId,
        };
        let indexerResponse = await this.queryIndexer<ListingsQueryResponse>(LISTINGS_ALL_QUERY, variables);

        let listings: Array<Listing> = [];
        for (const listing of indexerResponse.nft_marketplace_v2_current_nft_marketplace_listings) {
            listings.push(
                {
                    creator_address: listing.current_token_data.current_collection.creator_address,
                    collection_id: listing.collection_id,
                    collection_name: listing.current_token_data.current_collection.collection_name,
                    token_data_id: listing.token_data_id,
                    token_name: listing.current_token_data.token_name,
                    property_version: listing.current_token_data.largest_property_version_v1 || 0,
                    token_uri: listing.current_token_data.token_uri,
                    price: listing.price,
                    listing_id: listing.listing_id,
                    token_amount: listing.token_amount,
                    seller: listing.seller,
                    contract_address: listing.contract_address,
                    fee_schedule_id: listing.fee_schedule_id,
                    token_standard: listing.token_standard,
                }
            )
        }

        return listings
    }

    async getAuctions(contractAddress: MaybeHexString, feeScheduleId: String): Promise<AuctionsResponse> {
        // TODO: Fix query
        const variables = {
            contract_address: HexString.ensure(contractAddress).hex(),
            fee_schedule_id: feeScheduleId,
        };
        let result = await this.queryIndexer<AuctionsQueryResponse>(AUCTIONS_QUERY, variables);
        return result.nft_marketplace_v2_current_nft_marketplace_auctions;
    }

    async getTokenOffers(contractAddress: MaybeHexString, marketplace: String, tokenAddress: MaybeHexString): Promise<Array<TokenOffer>> {
        const variables = {
            contract_address: HexString.ensure(contractAddress).hex(),
            marketplace: marketplace,
            token_id: HexString.ensure(tokenAddress).hex(),
        };

        let response: TokenOfferIndexerResponse = await this.queryIndexer(TOKEN_OFFERS_QUERY, variables);
        let offers = [];
        for (const offer of response.nft_marketplace_v2_current_nft_marketplace_token_offers) {
            offers.push(
                {
                    buyer: offer.buyer,
                    collection_id: offer.current_token_data.collection_id,
                    collection_name: offer.current_token_data.current_collection.collection_name,
                    token_data_id: offer.current_token_data.token_data_id,
                    token_name: offer.current_token_data.token_name,
                    token_uri: offer.current_token_data.token_uri,
                    expiration_time: offer.expiration_time,
                    offer_id: offer.offer_id,
                    price: offer.price,
                    token_amount: offer.token_amount,
                    token_standard: offer.token_standard,
                    fee_schedule_id: offer.fee_schedule_id,
                }
            )
        }
        return offers;
    }

    async getCollectionOffers(contractAddress: MaybeHexString, marketplace: String, collectionAddress: MaybeHexString, isDeleted: boolean): Promise<{
        buyer: string,
        collection_id: string,
        collection_offer_id: string,
        expiration_time: number,
        current_collection: { collection_name: string, uri: string },
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
                current_collection {
                  collection_name
                  uri
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
                current_collection: { collection_name: string, uri: string },
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
