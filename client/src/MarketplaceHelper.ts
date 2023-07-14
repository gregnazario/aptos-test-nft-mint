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
        expiration_time: bigint, // TODO: convert to time?
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
                price,
                amount,
                expiration_time,
            ],
        );
    }

    initCollectionOfferForTokenv2(
        collection: MaybeHexString,
        feeSchedule: MaybeHexString,
        price: bigint,
        amount: bigint,
        expiration_time: bigint, // TODO: convert to time?
        coin: string = APTOS_COIN,
    ): TransactionPayload {
        return this.buildTransactionPayload(
            COLLECTION_OFFER,
            "init_for_tokenv2_entry",
            [coin],
            [HexString.ensure(collection).hex(), HexString.ensure(feeSchedule).hex(), price, amount, expiration_time],
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
            "sell_tokenv1",
            [coin],
            [HexString.ensure(collectionOffer).hex(), HexString.ensure(token).hex()],
        );
    }


    initTokenOfferForTokenv1(
        tokenCreator: MaybeHexString,
        token: string,
        feeSchedule: MaybeHexString,
        price: bigint,
        amount: bigint,
        expiration_time: bigint, // TODO: convert to time?
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
                price,
                amount,
                expiration_time,
            ],
        );
    }

    initTokenOfferForTokenv2(
        token: MaybeHexString,
        feeSchedule: MaybeHexString,
        price: bigint,
        amount: bigint,
        expiration_time: bigint, // TODO: convert to time?
        coin: string = APTOS_COIN,
    ): TransactionPayload {
        return this.buildTransactionPayload(
            TOKEN_OFFER,
            "init_for_tokenv2_entry",
            [coin],
            [HexString.ensure(token).hex(), HexString.ensure(feeSchedule).hex(), price, amount, expiration_time],
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
            "sell_tokenv1",
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

    async getListings(contractAddress: MaybeHexString, marketplace: String, isDeleted: boolean): Promise<any> {
        // FIXME: Support pagination
        // FIXME type the output
        // FIXME add fee schedule
        const query =
            `query GetListings($contract_address:String!, $marketplace: String!, $is_deleted: Boolean!) {
                nft_marketplace_v2_current_nft_marketplace_listings(where: {
                  contract_address: { _eq: $contract_address }
                  marketplace: { _eq: $marketplace }
                  is_deleted: { _eq: $is_deleted }
                }) {
                  current_token_data {
                    collection_id
                    token_data_id
                    token_name
                  }
                  price
                  listing_id
                  is_deleted
                  token_amount
                  seller
                  marketplace: marketplace
                  contract_address
                }
            }`
        const variables = {
            contract_address: HexString.ensure(contractAddress).hex(),
            marketplace: marketplace,
            is_deleted: isDeleted,
        };

        return await this.query_indexer(query, variables);
    }

    async getTokenAuctions(contractAddress: MaybeHexString, marketplace: String, tokenAddress: MaybeHexString, isDeleted: boolean): Promise<any> {
        const query =
            `query GetTokenAuctions($contract_address:String!, $marketplace: String!, $token_id: String!, $is_deleted: Boolean!) {
            nft_marketplace_v2_current_nft_marketplace_auctions(where: {
                contract_address: { _eq: $contract_address }
                marketplace: { _eq: $marketplace }
                is_deleted: { _eq: $is_deleted }
                token_data_id: { _eq: $token_id }
            }) {
            buy_it_now_price
            current_bid_price
            current_bidder
            current_token_data {
              collection_id
              token_data_id
              token_name
            }
            expiration_time
            is_deleted
            listing_id
            seller
            starting_bid_price
            token_amount
          }
        }`;
        const variables = {
            contract_address: HexString.ensure(contractAddress).hex(),
            marketplace: marketplace,
            token_id: HexString.ensure(tokenAddress).hex(),
            is_deleted: isDeleted,
        };

        return await this.query_indexer(query, variables);
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

        return await this.query_indexer(query, variables);
    }

    async getCollectionOffers(contractAddress: MaybeHexString, marketplace: String, collectionAddress: MaybeHexString, isDeleted: boolean): Promise<any> {
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

        return await this.query_indexer(query, variables);
    }

    // Helpers

    async query_indexer(query: string, variables?: {}) {
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
