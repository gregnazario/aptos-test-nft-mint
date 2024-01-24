// Copyright © Aptos
// SPDX-License-Identifier: Apache-2.0

import React, { useMemo } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import makeContext from "../hooks/makeContext";
import { getProvider } from "../Helper";
import { useNetworkContext } from "./NetworkProvider";

export interface IndexerContextValue {
    queryIndexer: (query: string, variables?: {}) => Promise<any>
}

export const [IndexerContext, useIndexerContext] =
  makeContext<IndexerContextValue>("IndexerContext");

interface IndexerProviderProps {
  children: JSX.Element;
}
/**
 * Hook for Indexer Provider
 */
export default function IndexerProvider({
  children,
}: IndexerProviderProps) {
  const wallet = useWallet();
  const {network} = useNetworkContext()
  
  async function queryIndexer<T extends {}>(query: string, variables?: {}): Promise<T> {
    const graphqlQuery = {
      query,
      variables,
    };
    return getProvider(network).queryIndexer<T>({
      query: graphqlQuery,
    });
  }
  const IndexerValue = useMemo(
    () => ({
        queryIndexer,
    }),
    [ wallet ],
  );

  return (
    <IndexerContext.Provider value={IndexerValue}>
      {children}
    </IndexerContext.Provider>
  );
}
