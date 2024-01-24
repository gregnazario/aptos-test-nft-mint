// Copyright © Aptos
// SPDX-License-Identifier: Apache-2.0

import React, { useMemo } from "react";
import { InputTransactionData } from "@aptos-labs/wallet-adapter-core";
import { AccountAddressInput, AnyNumber, APTOS_COIN, AccountAddress } from "@aptos-labs/ts-sdk";
import makeContext from "../hooks/makeContext";
import {
    Marketplace as MarketplaceHelper,
  } from "../MarketplaceHelper";
import { getProvider } from "../Helper";
import { useNetworkContext } from "./NetworkProvider";
import { COIN_LISTING, MODULE_ADDRESS, INSCRIPTON_MODULE_ADDRESS } from "../utils/constants";

export interface PayloadContextValue {
  marketplaceHelper: MarketplaceHelper;
  buildTransactionPayload: (
    module: string,
    func: string,
    types: string[],
    args: any[]
  ) => InputTransactionData;
  buildPurchaseListingPayload: (...args: any[]) => InputTransactionData;
  buildEndFixedPriceListingPayload: (...args: any[]) => InputTransactionData;
}

export const [PayloadContext, usePayloadContext] =
  makeContext<PayloadContextValue>("PayloadContext");

interface PayloadProviderProps {
  children: JSX.Element;
}
/**
 * Hook for Payload Provider
 */
export default function PayloadProvider({
  children,
}: PayloadProviderProps) {
  const { network } = useNetworkContext();
  function buildTransactionPayload(
    module: string,
    func: string,
    types: string[],
    args: any[],
    moduleAddress: string = MODULE_ADDRESS
  ): InputTransactionData {
    return {
      data: {
        function: `${moduleAddress}::${module}::${func}`,
        typeArguments: types,
        functionArguments: args,
      },
    };
  }

  // Coin listing operations
  function buildInitPurchaseListingPayload(
    object: AccountAddressInput,
    feeSchedule: AccountAddressInput,
    startTime: AnyNumber,
    price: AnyNumber,
    coin: string = APTOS_COIN,
  ): InputTransactionData {
    return buildTransactionPayload(
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

  function initAuctionListing(
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
    return buildTransactionPayload(
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
  function buildPurchaseListingPayload(
    listing: AccountAddressInput,
    coin: string = APTOS_COIN,
  ): InputTransactionData {
    return buildTransactionPayload(
      COIN_LISTING,
      "purchase",
      [coin],
      [AccountAddress.from(listing).toString()],
    );
  }

  function buildEndFixedPriceListingPayload(
    listing: AccountAddressInput,
    coin: string = APTOS_COIN,
  ): InputTransactionData {
    return buildTransactionPayload(
      COIN_LISTING,
      "end_fixed_price",
      [coin],
      [AccountAddress.from(listing).toString()],
    );
  }
  
  function buildCreateV2withInscriptionPayload(
    collectionName: string,
    bytes: Uint8Array,
    description: string,
    tokenName: string,
  ): InputTransactionData {
    return buildTransactionPayload(
      "immutable_collection",
      "mint_token",
      [],
      [
        collectionName,
        bytes,
        description,
        tokenName,
        ""
      ],
      INSCRIPTON_MODULE_ADDRESS,
    );
  }

  const PayloadValue = useMemo(
    () => ({
        marketplaceHelper: new MarketplaceHelper(
          getProvider(network),
          MODULE_ADDRESS,
        ),
        buildTransactionPayload,
        buildInitPurchaseListingPayload,
        buildPurchaseListingPayload,
        initAuctionListing,
        buildEndFixedPriceListingPayload,
        buildCreateV2withInscriptionPayload,

    }),
    [ network ],
  );

  return (
    <PayloadContext.Provider value={PayloadValue}>
      {children}
    </PayloadContext.Provider>
  );
}
