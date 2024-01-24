import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import { Network } from "@aptos-labs/ts-sdk";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
// eslint-disable-next-line import/no-cycle
import { createBrowserHistory } from "history";
import { useEffect } from "react";
import { ConfigProvider } from "antd";
import PayloadProvider from "./providers/PayloadProvider";
import { AppRoutes } from "./routes";
import { getWallets } from "./utils/getWallets";
import { getNetwork } from "./components/NetworkChecker";
import NetworkProvider from "./providers/NetworkProvider";
import TransactionProvider from "./providers/TransactionProvider";


function App(this: any) {
  const browserHistory = createBrowserHistory();
  const network =
    getNetwork(new URLSearchParams(window.location.search).get("network")) ??
    Network.MAINNET;

  useEffect(() => {
    if (
      !getNetwork(new URLSearchParams(window.location.search).get("network"))
    ) {
      browserHistory.push(`?network=${Network.MAINNET}`);
    }
  });
  return (
    <AptosWalletAdapterProvider plugins={getWallets(network)} autoConnect={true}>
      <NetworkProvider>
        <PayloadProvider>
          <TransactionProvider>
            <ConfigProvider
              theme={{
                components: {
                  Menu: {
                    itemBg: "transparent",
                  },
                },
              }}>
              <AppRoutes />
            </ConfigProvider>
          </TransactionProvider>
        </PayloadProvider>
      </NetworkProvider>
    </AptosWalletAdapterProvider>
  );
}

export default App;
