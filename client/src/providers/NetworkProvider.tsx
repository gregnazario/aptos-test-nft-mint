// Copyright © Aptos
// SPDX-License-Identifier: Apache-2.0

import React, { useMemo } from "react";
import { Network } from "@aptos-labs/ts-sdk";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import makeContext from "../hooks/makeContext";

export interface NetworkContextValue {
  network: Network
}

export const [NetworkContext, useNetworkContext] =
  makeContext<NetworkContextValue>("NetworkContext");

interface NetworkProviderProps {
  children: JSX.Element;
}
/**
 * Hook for Network Provider
 */
export default function NetworkProvider({
  children,
}: NetworkProviderProps) {
  const wallet = useWallet();
  const NetworkValue = useMemo(
    () => ({
        network: wallet.network?.name ? wallet.network?.name.toLocaleLowerCase() as Network : Network.MAINNET,
    }),
    [ wallet ],
  );

  return (
    <NetworkContext.Provider value={NetworkValue}>
      {children}
    </NetworkContext.Provider>
  );
}
