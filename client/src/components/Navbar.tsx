import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { MenuProps, Row, Col, Menu } from "antd";
import { useLocation, useNavigate } from "react-router";
import { EasyBorder } from "./EasyBorder";
import { MARKETPLACE, LAUNCHPAD, WALLET, CONTRACT, SOURCE} from "../utils/constants";

function getNavbarKey() {
  const { pathname } = useLocation();
  if (pathname === "/") {
    return MARKETPLACE;
  } if (pathname === "/launchpad") {
    return LAUNCHPAD;
  } if (pathname.slice(0, 7) === "/wallet") {
    return WALLET;
  } 
  return MARKETPLACE; 
}

export function NavBar(props: { expectedNetwork: string; }) {
    const { account } = useWallet();
    const items: MenuProps["items"] = [
      {
        label: "Marketplace",
        key: MARKETPLACE,
      },
      {
        label: "Launchpad",
        key: LAUNCHPAD,
      },
      {
        label: "Wallet",
        key: WALLET,
        disabled: !account?.address,
      }
    ];
  
    // TODO: load from page
    const navigate = useNavigate();
    const onClick: MenuProps["onClick"] = (e) => {
      if (e.key === WALLET) {
        navigate(`/wallet/${account?.address}`);
      } else if (e.key === LAUNCHPAD) {
        navigate("/launchpad");
      } else if (e.key === MARKETPLACE) {
        navigate("/");
      } else if (e.key === CONTRACT) {
        window.location.href =
          "https://github.com/aptos-labs/aptos-core/tree/main/aptos-move/move-examples/marketplace";
      } else if (e.key === SOURCE) {
        window.location.href =
          "https://github.com/gregnazario/aptos-test-nft-mint";
      }
    };
  
    return (
      <EasyBorder offset={2}>
        <Row align={"middle"}>
          <Col span={6}>
            <h1>Creator Studio ({props.expectedNetwork})</h1>
          </Col>
          <Col flex={"auto"} />
          <Col span={10}>
            <Menu
              onClick={onClick}
              selectedKeys={[getNavbarKey()]}
              mode="horizontal"
              items={items}
            />
          </Col>
          <Col offset={2} span={2}>
            <WalletSelector />
          </Col>
        </Row>
      </EasyBorder>
    );
  }
  
  
  