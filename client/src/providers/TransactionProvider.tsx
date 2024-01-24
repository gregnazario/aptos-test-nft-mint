// Copyright © Aptos
// SPDX-License-Identifier: Apache-2.0

import React, { useMemo } from "react";
import { InputTransactionData, useWallet } from "@aptos-labs/wallet-adapter-react";
import { TransactionResponse, ViewRequest } from "@aptos-labs/ts-sdk";
import makeContext from "../hooks/makeContext";
import { getProvider } from "../Helper";
import { useNetworkContext } from "./NetworkProvider";

export interface TransactionContextValue {
    runTransaction: (payload: InputTransactionData) => Promise<TransactionResponse |undefined>
}

export const [TransactionContext, useTransactionContext] =
  makeContext<TransactionContextValue>("TransactionContext");

interface TransactionProviderProps {
  children: JSX.Element;
}
/**
 * Hook for Transaction Provider
 */
export default function TransactionProvider({
  children,
}: TransactionProviderProps) {
  const { account, signAndSubmitTransaction } = useWallet();
  const {network} = useNetworkContext();
  const provider = getProvider(network);
  const runTransaction = async (
    payload: InputTransactionData,
  ) => {
    try {
      const response = await signAndSubmitTransaction(payload);
      try {
        await provider.waitForTransaction({ transactionHash: response.hash });
        return await provider.getTransactionByHash({
          transactionHash: response.hash,
        });
      } catch (error: any) {
        return {error: "Failed to wait for Transaction"}
      }
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.log(`Failed to wait for txn ${error}`);
    }
    return undefined;
  };

  const runViewFunction = async (
    payload: ViewRequest,
  ) => {
    try {
      return await provider.view({ payload });
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.log(`Failed to wait for txn ${error}`);
    }
  
    return undefined;
  };
  const TransactionValue = useMemo(
    () => ({
        runTransaction,
        runViewFunction
    }),
    [ account, network ],
  );

  return (
    <TransactionContext.Provider value={TransactionValue}>
      {children}
    </TransactionContext.Provider>
  );
}
