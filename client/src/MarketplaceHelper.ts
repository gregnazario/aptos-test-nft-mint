// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable max-len */

import { InputTransactionData } from "@aptos-labs/wallet-adapter-core";
import {
  AccountAddress,
  AccountAddressInput,
  AnyNumber,
  Aptos,
  Hex,
  MoveStructId,
} from "@aptos-labs/ts-sdk";
import { 
  AUCTIONS_QUERY,
  COLLECTION_OFFERS_QUERY,
  FETCH_COLLECTIONS_DATA_IDS,
  FETCH_COLLECTIONS_HOME_PAGE,
  FETCH_COLLECTIONS_FLOOR,
  FETCH_COLLECTION_DATA,
  FETCH_LISTING_DETAILS,
  LISTINGS_ALL_QUERY,
  TOKEN_OFFERS_QUERY,
  FETCH_COLLECTIONS_DATA_ITEM
} from "./Queries";

type ListingsQueryResponse = {
  nft_marketplace_v2_current_nft_marketplace_listings: Array<ListingIndexer>;
};
export type ListingIndexer = {
  collection_id: string;
  token_data_id: string;
  current_token_data: {
    current_collection: {
      creator_address: string;
      collection_name: string;
    };
    token_data_id: string;
    token_name: string;
    token_uri: string;
    largest_property_version_v1: number;
  };
  price: number;
  listing_id: string;
  token_amount: number;
  seller: string;
  contract_address: string;
  fee_schedule_id: string;
  token_standard: string;
};

export type ListingsResponse = Array<Listing>;
export type Listing = {
  creator_address: string;
  collection_id: string;
  collection_name: string;
  token_data_id: string;
  token_name: string;
  property_version: number;
  token_uri: string;
  price: number;
  listing_id: string;
  token_amount: number;
  seller: string;
  contract_address: string;
  fee_schedule_id: string;
  token_standard: string;
};

type AuctionsQueryResponse = {
  nft_marketplace_v2_current_nft_marketplace_auctions: AuctionsResponse;
};
export type AuctionsResponse = Array<{
  buy_it_now_price: number | null;
  starting_bid_price: number;
  current_bid_price: number | null;
  current_bidder: string | null;
  expiration_time: string;
  listing_id: string;
  current_token_data: {
    current_collection: {
      creator_address: string;
      collection_name: string;
    };
    collection_id: string;
    token_data_id: string;
    token_name: string;
    token_uri: string;
    largest_property_version_v1: string;
  };
  token_amount: number;
  seller: string;
  contract_address: string;
  fee_schedule_id: string;
}>;

type TokenOfferIndexerResponse = {
  nft_marketplace_v2_current_nft_marketplace_token_offers: Array<TokenOfferIndexer>;
};
export type TokenOfferIndexer = {
  buyer: string;
  current_token_data: {
    current_collection: {
      collection_name: string;
    };
    collection_id: string;
    token_data_id: string;
    token_name: string;
    token_uri: string;
  };
  expiration_time: number;
  offer_id: string;
  price: number;
  token_amount: number;
  token_standard: string;
  fee_schedule_id: string;
};

export type TokenOffer = {
  buyer: string;
  collection_name: string;
  collection_id: string;
  token_data_id: string;
  token_name: string;
  token_uri: string;
  expiration_time: number;
  offer_id: string;
  price: number;
  token_amount: number;
  token_standard: string;
  fee_schedule_id: string;
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
  readonly provider: Aptos;

  readonly codeLocation: Hex;

  constructor(provider: Aptos, codeLocation: string) {
    this.provider = provider;
    this.codeLocation = Hex.fromHexInput(codeLocation);
  }

  // Coin listing operations
  initFixedPriceListing(
    object: AccountAddressInput,
    feeSchedule: AccountAddressInput,
    startTime: AnyNumber,
    price: AnyNumber,
    coin: string = APTOS_COIN,
  ): InputTransactionData {
    return this.buildTransactionPayload(
      COIN_LISTING,
      "init_fixed_price",
      [coin],
      [
        AccountAddress.from(object).toString(),
        AccountAddress.from(feeSchedule).toString(),
        startTime.toString(),
        price.toString(),
      ],
    );
  }

  initAuctionListing(
    object: AccountAddressInput,
    feeSchedule: AccountAddressInput,
    startTime: AnyNumber,
    startingBid: AnyNumber,
    bidIncrement: AnyNumber,
    auctionEndTime: AnyNumber,
    minimumBidTimeBeforeEnd: AnyNumber,
    buyItNowPrice?: AnyNumber,
    coin: string = APTOS_COIN,
  ): InputTransactionData {
    return this.buildTransactionPayload(
      COIN_LISTING,
      "init_auction",
      [coin],
      [
        AccountAddress.from(object),
        AccountAddress.from(feeSchedule),
        startTime,
        startingBid,
        bidIncrement,
        auctionEndTime,
        minimumBidTimeBeforeEnd,
        buyItNowPrice,
      ],
    );
  }

  initFixedPriceListingForTokenv1(
    tokenCreator: AccountAddressInput,
    tokenCollection: string,
    tokenName: string,
    tokenPropertyVersion: AnyNumber,
    feeSchedule: AccountAddressInput,
    startTime: AnyNumber,
    price: AnyNumber,
    coin: string = APTOS_COIN,
  ): InputTransactionData {
    return this.buildTransactionPayload(
      COIN_LISTING,
      "init_fixed_price_for_tokenv1",
      [coin],
      [
        AccountAddress.from(tokenCreator).toString(),
        tokenCollection,
        tokenName,
        tokenPropertyVersion.toString(),
        AccountAddress.from(feeSchedule).toString(),
        startTime.toString(),
        price.toString(),
      ],
    );
  }

  initAuctionListingForTokenv1(
    tokenCreator: AccountAddressInput,
    tokenCollection: string,
    tokenName: string,
    tokenPropertyVersion: AnyNumber,
    feeSchedule: AccountAddressInput,
    startTime: AnyNumber,
    startingBid: AnyNumber,
    bidIncrement: AnyNumber,
    auctionEndTime: AnyNumber,
    minimumBidTimeBeforeEnd: AnyNumber,
    buyItNowPrice?: AnyNumber,
    coin: string = APTOS_COIN,
  ): InputTransactionData {
    return this.buildTransactionPayload(
      COIN_LISTING,
      "init_auction_for_tokenv1",
      [coin],
      [
        AccountAddress.from(tokenCreator).toString(),
        tokenCollection,
        tokenName,
        tokenPropertyVersion.toString(),
        AccountAddress.from(feeSchedule).toString(),
        startTime.toString(),
        startingBid.toString(),
        bidIncrement.toString(),
        auctionEndTime.toString(),
        minimumBidTimeBeforeEnd.toString(),
        buyItNowPrice?.toString(),
      ],
    );
  }

  purchaseListing(
    listing: AccountAddressInput,
    coin: string = APTOS_COIN,
  ): InputTransactionData {
    return this.buildTransactionPayload(
      COIN_LISTING,
      "purchase",
      [coin],
      [AccountAddress.from(listing).toString()],
    );
  }

  endFixedPriceListing(
    listing: AccountAddressInput,
    coin: string = APTOS_COIN,
  ): InputTransactionData {
    return this.buildTransactionPayload(
      COIN_LISTING,
      "end_fixed_price",
      [coin],
      [AccountAddress.from(listing).toString()],
    );
  }

  bidAuctionListing(
    listing: AccountAddressInput,
    bid_amount: AnyNumber,
    coin: string = APTOS_COIN,
  ): InputTransactionData {
    return this.buildTransactionPayload(
      COIN_LISTING,
      "bid",
      [coin],
      [AccountAddress.from(listing).toString(), bid_amount.toString()],
    );
  }

  buyNowAuctionListing(
    listing: AccountAddressInput,
    bid_amount: AnyNumber,
    coin: string = APTOS_COIN,
  ): InputTransactionData {
    return this.buildTransactionPayload(
      COIN_LISTING,
      "bid",
      [coin],
      [AccountAddress.from(listing).toString(), bid_amount.toString()],
    );
  }

  completeAuctionListing(
    listing: AccountAddressInput,
    coin: string = APTOS_COIN,
  ): InputTransactionData {
    return this.buildTransactionPayload(
      COIN_LISTING,
      "complete_auction",
      [coin],
      [AccountAddress.from(listing).toString()],
    );
  }

  // Listing operations
  extract_tokenv1(object: AccountAddressInput): InputTransactionData {
    return this.buildTransactionPayload(
      LISTING,
      "extract_tokenv1",
      [],
      [AccountAddress.from(object).toString()],
    );
  }

  // Collection offer operations

  initCollectionOfferForTokenv1(
    tokenCreator: AccountAddressInput,
    tokenCollection: string,
    feeSchedule: AccountAddressInput,
    price: AnyNumber,
    amount: AnyNumber,
    expiration_time: AnyNumber,
    coin: string = APTOS_COIN,
  ): InputTransactionData {
    return this.buildTransactionPayload(
      COLLECTION_OFFER,
      "init_for_tokenv1_entry",
      [coin],
      [
        AccountAddress.from(tokenCreator).toString(),
        tokenCollection,
        AccountAddress.from(feeSchedule).toString(),
        price.toString(),
        amount.toString(),
        expiration_time.toString(),
      ],
    );
  }

  initCollectionOfferForTokenv2(
    collection: AccountAddressInput,
    feeSchedule: AccountAddressInput,
    price: AnyNumber,
    amount: AnyNumber,
    expiration_time: AnyNumber,
    coin: string = APTOS_COIN,
  ): InputTransactionData {
    return this.buildTransactionPayload(
      COLLECTION_OFFER,
      "init_for_tokenv2_entry",
      [coin],
      [
        AccountAddress.from(collection).toString(),
        AccountAddress.from(feeSchedule).toString(),
        price.toString(),
        amount.toString(),
        expiration_time.toString(),
      ],
    );
  }

  cancelCollectionOffer(
    collectionOffer: AccountAddressInput,
    coin: string = APTOS_COIN,
  ): InputTransactionData {
    return this.buildTransactionPayload(
      COLLECTION_OFFER,
      "cancel",
      [coin],
      [AccountAddress.from(collectionOffer).toString()],
    );
  }

  fillCollectionOfferForTokenv1(
    collectionOffer: AccountAddressInput,
    tokenName: string,
    propertyVersion: AnyNumber,
    coin: string = APTOS_COIN,
  ): InputTransactionData {
    return this.buildTransactionPayload(
      COLLECTION_OFFER,
      "sell_tokenv1_entry",
      [coin],
      [
        AccountAddress.from(collectionOffer).toString(),
        tokenName,
        propertyVersion.toString(),
      ],
    );
  }

  fillCollectionOfferForTokenv2(
    collectionOffer: AccountAddressInput,
    token: AccountAddressInput,
    coin: string = APTOS_COIN,
  ): InputTransactionData {
    return this.buildTransactionPayload(
      COLLECTION_OFFER,
      "sell_tokenv2",
      [coin],
      [
        AccountAddress.from(collectionOffer).toString(),
        AccountAddress.from(token).toString(),
      ],
    );
  }

  initTokenOfferForTokenv1(
    tokenCreator: AccountAddressInput,
    token: string,
    feeSchedule: AccountAddressInput,
    price: AnyNumber,
    expiration_time: AnyNumber,
    coin: string = APTOS_COIN,
  ): InputTransactionData {
    return this.buildTransactionPayload(
      TOKEN_OFFER,
      "init_for_tokenv1_entry",
      [coin],
      [
        AccountAddress.from(tokenCreator).toString(),
        token,
        AccountAddress.from(feeSchedule).toString(),
        price.toString(),
        expiration_time.toString(),
      ],
    );
  }

  initTokenOfferForTokenv2(
    token: AccountAddressInput,
    feeSchedule: AccountAddressInput,
    price: AnyNumber,
    expiration_time: AnyNumber,
    coin: string = APTOS_COIN,
  ): InputTransactionData {
    return this.buildTransactionPayload(
      TOKEN_OFFER,
      "init_for_tokenv2_entry",
      [coin],
      [
        AccountAddress.from(token).toString(),
        AccountAddress.from(feeSchedule).toString(),
        price.toString(),
        expiration_time.toString(),
      ],
    );
  }

  cancelTokenOffer(
    tokenOffer: AccountAddressInput,
    coin: string = APTOS_COIN,
  ): InputTransactionData {
    return this.buildTransactionPayload(
      TOKEN_OFFER,
      "cancel",
      [coin],
      [AccountAddress.from(tokenOffer).toString()],
    );
  }

  fillTokenOfferForTokenv1(
    tokenOffer: AccountAddressInput,
    tokenName: string,
    propertyVersion: AnyNumber,
    coin: string = APTOS_COIN,
  ): InputTransactionData {
    return this.buildTransactionPayload(
      TOKEN_OFFER,
      "sell_tokenv1_entry",
      [coin],
      [
        AccountAddress.from(tokenOffer).toString(),
        tokenName,
        propertyVersion.toString(),
      ],
    );
  }

  fillTokenOfferForTokenv2(
    tokenOffer: AccountAddressInput,
    token: AccountAddressInput,
    coin: string = APTOS_COIN,
  ): InputTransactionData {
    return this.buildTransactionPayload(
      TOKEN_OFFER,
      "sell_tokenv2",
      [coin],
      [
        AccountAddress.from(tokenOffer).toString(),
        AccountAddress.from(token).toString(),
      ],
    );
  }

  // Fee schedule operations

  initFeeSchedule(
    feeAddress: AccountAddressInput,
    biddingFee: AnyNumber,
    listingFee: AnyNumber,
    commissionDenominator: AnyNumber,
    commissionNumerator: AnyNumber,
  ): InputTransactionData {
    return this.buildTransactionPayload(
      FEE_SCHEDULE,
      "init_entry",
      [],
      [
        AccountAddress.from(feeAddress).toString(),
        biddingFee.toString(),
        listingFee.toString(),
        commissionDenominator.toString(),
        commissionNumerator.toString(),
      ],
    );
  }

  initEmptyFeeSchedule(feeAddress: AccountAddressInput): InputTransactionData {
    return this.buildTransactionPayload(
      FEE_SCHEDULE,
      "empty",
      [],
      [AccountAddress.from(feeAddress).toString()],
    );
  }

  setFeeAddress(
    feeSchedule: AccountAddressInput,
    feeAddress: AccountAddressInput,
  ): InputTransactionData {
    return this.buildTransactionPayload(
      FEE_SCHEDULE,
      "set_fee_address",
      [],
      [
        AccountAddress.from(feeSchedule).toString(),
        AccountAddress.from(feeAddress).toString(),
      ],
    );
  }

  setFixedRateListingFee(
    feeSchedule: AccountAddressInput,
    fee: AnyNumber,
  ): InputTransactionData {
    return this.buildTransactionPayload(
      FEE_SCHEDULE,
      "set_fixed_rate_listing_fee",
      [],
      [AccountAddress.from(feeSchedule).toString(), fee.toString()],
    );
  }

  setFixedRateBiddingFee(
    feeSchedule: AccountAddressInput,
    fee: AnyNumber,
  ): InputTransactionData {
    return this.buildTransactionPayload(
      FEE_SCHEDULE,
      "set_fixed_rate_bidding_fee",
      [],
      [AccountAddress.from(feeSchedule).toString(), fee.toString()],
    );
  }

  setFixedRateCommission(
    feeSchedule: AccountAddressInput,
    commission: AnyNumber,
  ): InputTransactionData {
    return this.buildTransactionPayload(
      FEE_SCHEDULE,
      "set_fixed_rate_commission",
      [],
      [AccountAddress.from(feeSchedule).toString(), commission.toString()],
    );
  }

  setPercentageRateCommission(
    feeSchedule: AccountAddressInput,
    commissionDenominator: AnyNumber,
    commissionNumerator: AnyNumber,
  ): InputTransactionData {
    return this.buildTransactionPayload(
      FEE_SCHEDULE,
      "set_percentage_rate_commission",
      [],
      [
        AccountAddress.from(feeSchedule).toString(),
        commissionDenominator.toString(),
        commissionNumerator.toString(),
      ],
    );
  }

  // View functions
  // TODO: Collection offer view functions
  // TODO: Coin listing view functions
  // TODO: Listing view functions

  async feeAddress(
    feeSchedule: AccountAddressInput,
    ledgerVersion?: bigint,
  ): Promise<AccountAddress> {
    const outputs = await this.view(
      FEE_SCHEDULE,
      "fee_address",
      [],
      [AccountAddress.from(feeSchedule).toStringLong()],
      ledgerVersion,
    );

    return AccountAddress.from(outputs[0]!.toString());
  }

  async listingFee(
    feeSchedule: AccountAddressInput,
    ledgerVersion?: bigint,
  ): Promise<bigint> {
    const outputs = await this.view(
      FEE_SCHEDULE,
      "listing_fee",
      [],
      [AccountAddress.from(feeSchedule).toStringLong(), "0"],
      ledgerVersion,
    );

    return BigInt(outputs[0]!.toString());
  }

  async biddingFee(
    feeSchedule: AccountAddressInput,
    ledgerVersion?: bigint,
  ): Promise<bigint> {
    const outputs = await this.view(
      FEE_SCHEDULE,
      "bidding_fee",
      [],
      [AccountAddress.from(feeSchedule).toStringLong(), "0"],
      ledgerVersion,
    );

    return BigInt(outputs[0]!.toString());
  }

  async commission(
    feeSchedule: AccountAddressInput,
    price: bigint,
    ledgerVersion?: bigint,
  ): Promise<bigint> {
    const outputs = await this.view(
      FEE_SCHEDULE,
      "commission",
      [],
      [AccountAddress.from(feeSchedule).toStringLong(), price.toString(10)],
      ledgerVersion,
    );

    return BigInt(outputs[0]!.toString());
  }

  // Indexer queries
  /**
   * Gets all listings of Token V1 & Token V2
   * @param contractAddress
   * @param feeScheduleId
   */
  async getListings(
    contractAddress: AccountAddressInput,
    feeScheduleId: String,
  ): Promise<ListingsResponse> {
    const variables = {
      contract_address: AccountAddress.from(contractAddress).toStringLong(),
      fee_schedule_id: feeScheduleId,
    };
    const indexerResponse = await this.queryIndexer<ListingsQueryResponse>(
      LISTINGS_ALL_QUERY,
      variables,
    );

    const listings: Array<Listing> = [];
    for (const listing of indexerResponse.nft_marketplace_v2_current_nft_marketplace_listings) {
      listings.push({
        creator_address:
          listing.current_token_data.current_collection.creator_address,
        collection_id: listing.collection_id,
        collection_name:
          listing.current_token_data.current_collection.collection_name,
        token_data_id: listing.current_token_data.token_data_id,
        token_name: listing.current_token_data.token_name,
        property_version:
          listing.current_token_data.largest_property_version_v1 || 0,
        token_uri: listing.current_token_data.token_uri,
        price: listing.price,
        listing_id: listing.listing_id,
        token_amount: listing.token_amount,
        seller: listing.seller,
        contract_address: listing.contract_address,
        fee_schedule_id: listing.fee_schedule_id,
        token_standard: listing.token_standard,
      });
    }

    return listings;
  }

  async getTopCollections(): Promise<any> {
    // const variables = {
    //   offset: 0,
    //   limit: 25,
    // };
    const result = await this.queryIndexer<AuctionsQueryResponse>(
      FETCH_COLLECTIONS_DATA_IDS,
      // variables,
    );
    const collectionIds = result.nft_marketplace_v2_current_nft_marketplace_listings;
    const collections = await Promise.all(collectionIds.map((collectionId: string) => this.queryIndexer(
      FETCH_COLLECTIONS_DATA_ITEM,
      collectionId,
    )))
    const formattedCollections = collections.map((collection: any) => ({
      ...collection.current_collections_v2_by_pk,
      num_listings: collection.nft_marketplace_v2_current_nft_marketplace_listings_aggregate.aggregate.count,
      price: collection.nft_marketplace_v2_current_nft_marketplace_listings_aggregate.aggregate.sum.price
    })).sort((collectionA, collectionB) => collectionB.price - collectionA.price);
    return formattedCollections;
  }

  async getCollectionData(collection_id: string): Promise<any> {
    const variables = {
      collection_id: AccountAddress.from(collection_id).toStringLong(),
    };
    const result = await this.queryIndexer<ListingsQueryResponse>(
      FETCH_COLLECTION_DATA,
      variables,
    );
    return result.current_collections_v2[0];
  }

  async getCollectionsFloor(collection_id: string): Promise<any> {
    const variables = {
      collection_id: AccountAddress.from(collection_id).toStringLong(),
    };
    const result = await this.queryIndexer<ListingsQueryResponse>(
      FETCH_COLLECTIONS_FLOOR,
      variables,
    );
    return result;
  }

  async getListingData(listing_id: string): Promise<any> {
    const variables = {
      listing_id: AccountAddress.from(listing_id).toStringLong(),
    };
    const result = await this.queryIndexer<ListingsQueryResponse>(
      FETCH_LISTING_DETAILS,
      variables,
    );
    return result.nft_marketplace_v2_current_nft_marketplace_listings[0];
  }

  async getListingActivity(listing_id: string): Promise<any> {
    const variables = {
      collection_id: AccountAddress.from(listing_id).toStringLong(),
    };
    const result = await this.queryIndexer<ListingsQueryResponse>(
      FETCH_COLLECTIONS_FLOOR,
      variables,
    );
    return result;
  }
  

  async getAuctions(
    contractAddress: AccountAddressInput,
    feeScheduleId: String,
  ): Promise<AuctionsResponse> {
    // TODO: Fix query
    const variables = {
      contract_address: AccountAddress.from(contractAddress).toStringLong(),
      fee_schedule_id: feeScheduleId,
    };
    const result = await this.queryIndexer<AuctionsQueryResponse>(
      AUCTIONS_QUERY,
      variables,
    );
    return result.nft_marketplace_v2_current_nft_marketplace_auctions;
  }

  async getTokenOffers(
    contractAddress: AccountAddressInput,
    marketplace: String,
    tokenAddress: AccountAddressInput,
  ): Promise<Array<TokenOffer>> {
    const variables = {
      contract_address: AccountAddress.from(contractAddress).toStringLong(),
      marketplace,
      token_id: AccountAddress.from(tokenAddress).toStringLong(),
    };

    const response: TokenOfferIndexerResponse = await this.queryIndexer(
      TOKEN_OFFERS_QUERY,
      variables,
    );
    const offers = [];
    for (const offer of response.nft_marketplace_v2_current_nft_marketplace_token_offers) {
      offers.push({
        buyer: offer.buyer,
        collection_id: offer.current_token_data.collection_id,
        collection_name:
          offer.current_token_data.current_collection.collection_name,
        token_data_id: offer.current_token_data.token_data_id,
        token_name: offer.current_token_data.token_name,
        token_uri: offer.current_token_data.token_uri,
        expiration_time: offer.expiration_time,
        offer_id: offer.offer_id,
        price: offer.price,
        token_amount: offer.token_amount,
        token_standard: offer.token_standard,
        fee_schedule_id: offer.fee_schedule_id,
      });
    }
    return offers;
  }

  async getCollectionOffers(
    contractAddress: AccountAddressInput,
    marketplace: String,
    collectionAddress: AccountAddressInput,
    isDeleted: boolean,
  ): Promise<
    {
      buyer: string;
      collection_id: string;
      collection_offer_id: string;
      expiration_time: number;
      current_collection: { collection_name: string; uri: string };
      item_price: number;
      remaining_token_amount: number;
      is_deleted: boolean;
    }[]
  > {
    const variables = {
      contract_address: AccountAddress.from(contractAddress).toStringLong(),
      marketplace,
      collection_id: AccountAddress.from(collectionAddress).toStringLong(),
      is_deleted: isDeleted,
    };

    return (
      await this.queryIndexer<{
        nft_marketplace_v2_current_nft_marketplace_collection_offers: {
          buyer: string;
          collection_id: string;
          collection_offer_id: string;
          expiration_time: number;
          current_collection: { collection_name: string; uri: string };
          item_price: number;
          remaining_token_amount: number;
          is_deleted: boolean;
        }[];
      }>(COLLECTION_OFFERS_QUERY, variables)
    ).nft_marketplace_v2_current_nft_marketplace_collection_offers;
  }

  // Helpers

  async queryIndexer<T extends {}>(query: string, variables?: {}): Promise<T> {
    const graphqlQuery = {
      query,
      variables,
    };
    return this.provider.queryIndexer<T>({
      query: graphqlQuery,
    });
  }

  async view(
    module: string,
    func: string,
    typeArguments: string[],
    args: any[],
    ledgerVersion?: bigint,
  ) {
    return this.provider.view({
      payload: {
        function: `${this.codeLocation}::${module}::${func}`,
        typeArguments: typeArguments as MoveStructId[],
        functionArguments: args,
      },
      options: {
        ledgerVersion,
      },
    });
  }

  buildTransactionPayload(
    module: string,
    func: string,
    types: string[],
    args: any[],
  ): InputTransactionData {
    return {
      data: {
        function: `${this.codeLocation}::${module}::${func}`,
        typeArguments: types,
        functionArguments: args,
      },
    };
  }
}
