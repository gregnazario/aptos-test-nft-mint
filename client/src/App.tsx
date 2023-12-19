import { Layout } from "antd";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import { Network } from "@aptos-labs/ts-sdk";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
// eslint-disable-next-line import/no-cycle
import Marketplace from "./Marketplace";
import { NetworkChecker } from ".";

function App(props: { expectedNetwork: Network }) {
  const { account, signAndSubmitTransaction } = useWallet();

  return (
    <NetworkChecker expectedNetwork={props.expectedNetwork}>
      <Layout>
        <Marketplace
          network={props.expectedNetwork}
          account={account}
          submitTransaction={signAndSubmitTransaction}
        />
      </Layout>
    </NetworkChecker>
  );
}

export default App;
