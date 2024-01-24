import { Network } from "@aptos-labs/ts-sdk";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Alert } from "antd";
import { Fragment } from "react";
import { EasyBorder } from "./EasyBorder";

export const getNetwork = (input: string | null) => {
    if (input?.toLowerCase() === Network.DEVNET.toLowerCase()) {
      return Network.DEVNET;
    }
    if (input?.toLowerCase() === Network.TESTNET.toLowerCase()) {
      return Network.TESTNET;
    }
    if (input?.toLowerCase() === Network.MAINNET.toLowerCase()) {
      return Network.MAINNET;
    }
    return undefined;
  };
  
  export function NetworkChecker(props: {
    expectedNetwork: Network;
    children?: React.ReactNode;
  }) {
    const walletContextState = useWallet();
    const isSelectedNetwork = (): boolean =>
      walletContextState.network?.name?.toLowerCase() ===
      props.expectedNetwork.toLowerCase();
  
    return (
      <Fragment key={"network_checker"}>
        {!walletContextState.connected && (
          <EasyBorder offset={1}>
            <Alert message={"Please connect your wallet"} type="info" />
          </EasyBorder>
        )}
        {walletContextState.connected && !isSelectedNetwork() && (
          <EasyBorder offset={1}>
            <Alert
              message={`Wallet is connected to ${walletContextState.network?.name}.  Please connect to ${props.expectedNetwork}`}
              type="warning"
            />
          </EasyBorder>
        )}
        {walletContextState.connected && isSelectedNetwork() && (
          <EasyBorder offset={1}>{props.children}</EasyBorder>
        )}
      </Fragment>
    );
  }
  
  