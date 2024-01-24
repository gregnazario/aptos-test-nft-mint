import {
  Col,
  Row,
} from "antd";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import { EasyBorder } from "../components/EasyBorder";
import { CollectionList } from "../components/CollectionList";

function Marketplace() {
  return (
    <EasyBorder offset={1}>
      <Row align="middle">
        <Col>
          <h1>NFT Market Palace</h1>
        </Col>
      </Row>
      <CollectionList />
    </EasyBorder>
  );
}

export default Marketplace;
