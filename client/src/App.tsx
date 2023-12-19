import { Layout } from "antd";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import { Network } from "aptos";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import Marketplace from "./Marketplace";
import { NetworkChecker } from "./index";

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
