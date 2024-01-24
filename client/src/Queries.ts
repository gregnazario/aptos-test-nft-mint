export const COLLECTION_OFFERS_QUERY = `query GetCollectionOffers(
  $contract_address:String!,
  $marketplace: String!,
  $collection_id: String!,
  $is_deleted: Boolean!
) {
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
  }`;

export const AUCTIONS_QUERY = `query GetAuctions($contract_address: String!, $fee_schedule_id: String!) {
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

export const LISTINGS_ALL_QUERY = `query GetFixedPriceListings($contract_address:String!, $fee_schedule_id: String!) {
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
        token_data_id
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
}`;

export const TOKEN_OFFERS_QUERY = `query GetTokenV2Offers($contract_address:String!, $marketplace: String!, $token_id: String!) {
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

// --------------------- Get Collections --------------------- //

export const FETCH_COLLECTIONS_DATA = `query MyQuery {
  nft_marketplace_v2_current_nft_marketplace_collections(
    order_by: {sum_listings_price: desc}
  ) {
    collection_id
    num_listings
    sum_listings_price
    collection {
      collection_name
      creator_address
      collection_id
      current_supply
      description
      max_supply
      mutable_description
      mutable_uri
      table_handle_v1
      uri
      total_minted_v2
      token_standard
      last_transaction_version
      last_transaction_timestamp
    }
  }
}`


export const FETCH_COLLECTIONS_HOME_PAGE = `query fetchCollectionsData {
  nft_marketplace_v2_current_nft_marketplace_listings(
    distinct_on: collection_id
    where: {is_deleted: {_eq: false}, price: {_gt: "0"}}
  ) {
    collection_id
    current_token_data {
      current_collection {
        collection_id
        collection_name
        creator_address
        current_supply
        description
        uri
      }
    }
  }
}`

export const FETCH_COLLECTIONS_DATA_IDS = `query CollectionIds {
  nft_marketplace_v2_current_nft_marketplace_listings(
    distinct_on: collection_id
    where: {is_deleted: {_eq: false}, price: {_gt: "0"}}
  ) {
    collection_id
  }
}`

export const FETCH_COLLECTIONS_DATA_ITEM = `query CollectionInformation($collection_id: String = "0x1388207b49af329c30d27b98725f8a57ae89126b606085d4f02f5408823a52d0") {
  nft_marketplace_v2_current_nft_marketplace_listings_aggregate(
    where: {collection_id: {_eq: $collection_id}, is_deleted: {_eq: false}, price: {_gt: "0"}}
  ) {
    aggregate {
      sum {
        price
      }
      count
    }
  }
  current_collections_v2_by_pk(collection_id: $collection_id) {
    collection_id
    collection_name
    creator_address
    current_supply
    description
    max_supply
    uri
    token_standard
  }
}
`

  export const FETCH_COLLECTION_DATA = `query getCollectionData($collection_id: String!) {
    current_collections_v2(
      where: {collection_id: {_eq: $collection_id}}
    ) {
      collection_id
      collection_name
      creator_address
      current_supply
      description
      max_supply
      table_handle_v1
      token_standard
      total_minted_v2
      uri
    }
  }`


  export const FETCH_COLLECTIONS_FLOOR = `query getCollectionFloor($collection_id: String!) {
    nft_marketplace_v2_current_nft_marketplace_listings(
      where: {
        is_deleted: {_eq: false},
        collection_id: {_eq: $collection_id },
      }
    ) {
      collection_id
      contract_address
      is_deleted
      listing_id
      marketplace
      price
      seller
      token_amount
      token_data_id
      token_standard
      current_token_data {
        token_name
        token_uri
        token_data_id
      }
    }
  }`

  export const FETCH_LISTING_DETAILS = `query getListingDetail($listing_id: String!) {
    nft_marketplace_v2_current_nft_marketplace_listings(
      where: {listing_id: {_eq: $listing_id}, is_deleted: {_eq: false}}
    ) {
      marketplace
      price
      seller
      token_amount
      token_data_id
      token_standard
      listing_id
      is_deleted
      coin_type
      collection_id
      contract_address
      entry_function_id_str
      fee_schedule_id
      last_transaction_timestamp
      last_transaction_version
      current_token_data {
        token_uri
        token_standard
        token_name
        token_properties
        token_data_id
        supply
        maximum
        is_fungible_v2
        description
        largest_property_version_v1
        last_transaction_timestamp
        last_transaction_version
      }
    }
  }`
  