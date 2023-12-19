import { Button, Col, Image, Input, Layout, Row, Select } from "antd";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import React, { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { MoveFunctionId, Network } from "@aptos-labs/ts-sdk";
import {
  ensureImageUri,
  onNumberChange,
  onStringChange,
  runTransaction,
} from "../Helper";
// eslint-disable-next-line import/no-cycle
import { EasyBorder, NetworkChecker } from "..";

const DEFAULT_IMAGE =
  "https://cloudflare-ipfs.com/ipfs/QmQ1b4JVoPETE9fLXkmGcXoheqJf2UZ4qTKKfvrmC2W4PF";

const COLLECTION = "Collection";
const TOKEN = "Token";
const V1 = "V1";
const V2 = "V2";

function CollectionModifier(props: { expectedNetwork: Network }) {
  const [collectionAddress, setCollectionAddress] = useState<string>("");
  // TODO: Load previous URI
  const [uri, setUri] = useState<string>("");
  const [imageUri, setImageUri] = useState<string>("");
  const { account, signAndSubmitTransaction } = useWallet();

  const updateUri = async () => {
    // Ensure you have a token and are connected
    if (!account && !collectionAddress) return [];
    const payload = {
      data: {
        function: "0x4::aptos_token::set_collection_uri" as MoveFunctionId,
        typeArguments: ["0x4::aptos_token::AptosCollection"],
        functionArguments: [collectionAddress, uri],
      },
    };

    return runTransaction(
      {
        network: props.expectedNetwork,
        account,
        submitTransaction: signAndSubmitTransaction,
      },
      payload,
    );
  };

  return (
    <>
      <Row align="middle">
        <Col flex={"auto"}>
          <h2>Change Collection V2 URI</h2>
        </Col>
      </Row>
      <Row align="middle">
        <Col span={2}>
          <p>Token Address</p>
        </Col>
        <Col flex={"auto"}>
          <Input
            onChange={async (event) => {
              await onStringChange(event, setCollectionAddress);
            }}
            style={{ width: "calc(100% - 60px)" }}
            placeholder="URI"
            size="large"
            defaultValue={""}
          />
        </Col>
        <Col span={2} />
      </Row>
      <Row align="middle">
        <Col span={2}>
          <p>Uri</p>
        </Col>
        <Col flex={"auto"}>
          <Input
            onChange={async (event) => {
              // eslint-disable-next-line @typescript-eslint/no-shadow
              const uri = await onStringChange(event, setUri);
              setImageUri(await ensureImageUri(uri));
            }}
            style={{ width: "calc(100% - 60px)" }}
            placeholder="URI"
            size="large"
            defaultValue={""}
          />
        </Col>
        <Col offset={1}>
          <Image
            width={100}
            src={imageUri}
            alt={imageUri}
            /* eslint-disable-next-line max-len */
            fallback="data:image/png;base64,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"
          />
        </Col>
        <Col span={2} />
      </Row>
      <Row align="middle">
        <Col offset={2} span={2}>
          <Button
            onClick={() => updateUri()}
            type="primary"
            style={{ height: "40px", backgroundColor: "#3f67ff" }}
          >
            Update Uri
          </Button>
        </Col>
      </Row>
    </>
  );
}

function TokenModifier(props: { expectedNetwork: Network }) {
  const [tokenAddress, setTokenAddress] = useState<string>("");
  // TODO: Load previous URI
  const [uri, setUri] = useState<string>("");
  const [imageUri, setImageUri] = useState<string>("");
  const { account, signAndSubmitTransaction } = useWallet();

  const updateUri = async () => {
    // Ensure you have a token and are connected
    if (!account && !tokenAddress) return [];
    const payload = {
      data: {
        function: "0x4::aptos_token::set_uri" as MoveFunctionId,
        typeArguments: ["0x4::aptos_token::AptosToken"],
        functionArguments: [tokenAddress, uri],
      },
    };

    return runTransaction(
      {
        network: props.expectedNetwork,
        account,
        submitTransaction: signAndSubmitTransaction,
      },
      payload,
    );
  };

  return (
    <>
      <Row align="middle">
        <Col flex={"auto"}>
          <h2>Change Token V2 URI</h2>
        </Col>
      </Row>
      <Row align="middle">
        <Col span={2}>
          <p>Token Address</p>
        </Col>
        <Col flex={"auto"}>
          <Input
            onChange={async (event) => {
              await onStringChange(event, setTokenAddress);
            }}
            style={{ width: "calc(100% - 60px)" }}
            placeholder="URI"
            size="large"
            defaultValue={""}
          />
        </Col>
        <Col span={2} />
      </Row>
      <Row align="middle">
        <Col span={2}>
          <p>Uri</p>
        </Col>
        <Col flex={"auto"}>
          <Input
            onChange={async (event) => {
              // eslint-disable-next-line @typescript-eslint/no-shadow
              const uri = await onStringChange(event, setUri);
              setImageUri(await ensureImageUri(uri));
            }}
            style={{ width: "calc(100% - 60px)" }}
            placeholder="URI"
            size="large"
            defaultValue={""}
          />
        </Col>
        <Col offset={1}>
          <Image
            width={100}
            src={imageUri}
            alt={imageUri}
            /* eslint-disable-next-line max-len */
            fallback="data:image/png;base64,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"
          />
        </Col>
        <Col span={2} />
      </Row>
      <Row align="middle">
        <Col offset={2} span={2}>
          <Button
            onClick={() => updateUri()}
            type="primary"
            style={{ height: "40px", backgroundColor: "#3f67ff" }}
          >
            Update Uri
          </Button>
        </Col>
      </Row>
    </>
  );
}

function Launchpad(props: { expectedNetwork: Network }) {
  const [type, setType] = useState<string>(COLLECTION);
  const [standard, setStandard] = useState<string>(V2);
  const [collectionName, setCollectionName] =
    useState<string>("Test Collection");
  const [tokenName, setTokenName] = useState<string>("Test Token #1");

  const [royaltyPercent, setRoyaltyPercent] = useState<number>(0);

  const [description, setDescription] = useState<string>("");
  const [uri, setUri] = useState<string>(DEFAULT_IMAGE);
  const [imageUri, setImageUri] = useState<string>(DEFAULT_IMAGE);
  const { network, account, signAndSubmitTransaction } = useWallet();

  const createV1Collection = async () => {
    // Ensure you're logged in
    if (!account || !collectionName || !network) return [];
    const payload = {
      data: {
        function: "0x3::token::create_collection_script" as MoveFunctionId,
        typeArguments: [],
        functionArguments: [
          collectionName,
          description,
          uri, // collection URI
          0, // Unlimited collection size
          [true, true, true], // Everything allowed
        ],
      },
    };

    return runTransaction(
      {
        network: props.expectedNetwork,
        account,
        submitTransaction: signAndSubmitTransaction,
      },
      payload,
    );
  };

  const createV1Token = async () => {
    // Ensure you're logged in
    if (!account || !collectionName || !tokenName) return [];
    const payload = {
      data: {
        function: "0x3::token::create_token_script" as MoveFunctionId,
        typeArguments: [],
        functionArguments: [
          collectionName,
          tokenName,
          description,
          1, // balance 1 (this is a NFT)
          1, // maximum (this is a singular NFT)
          uri,
          account.address, // Royalty account
          100, // royalty denominator
          royaltyPercent, // royalty numerator
          [true, true, true, true, true], // everything allowed mutable
          [], // Property keys
          [], // Property values
          [], // Property types
        ],
      },
    };
    return runTransaction(
      {
        network: props.expectedNetwork,
        account,
        submitTransaction: signAndSubmitTransaction,
      },
      payload,
    );
  };

  const createV2Collection = async () => {
    // Ensure you're logged in
    if (!account || !collectionName) return [];
    const payload = {
      data: {
        function: "0x4::aptos_token::create_collection" as MoveFunctionId,
        typeArguments: [],
        functionArguments: [
          description, // Description
          10000, // Maximum supply
          collectionName,
          uri, // collection URI
          true, // These are all mutable
          true,
          true,
          true,
          true,
          true,
          true,
          true,
          true,
          royaltyPercent, // Royalty numerator
          100, // Royalty denominator
        ],
      },
    };

    return runTransaction(
      {
        network: props.expectedNetwork,
        account,
        submitTransaction: signAndSubmitTransaction,
      },
      payload,
    );
  };

  const createV2Token = async () => {
    // Ensure you're logged in
    if (!account || !collectionName || !tokenName || !uri) return [];
    const payload = {
      data: {
        function: "0x4::aptos_token::mint" as MoveFunctionId,
        typeArguments: [],
        functionArguments: [
          collectionName,
          description,
          tokenName,
          uri,
          [],
          [],
          [],
        ],
      },
    };
    return runTransaction(
      {
        network: props.expectedNetwork,
        account,
        submitTransaction: signAndSubmitTransaction,
      },
      payload,
    );
  };

  return (
    <EasyBorder offset={1}>
      <Layout>
        <NetworkChecker expectedNetwork={props.expectedNetwork}>
          <Row align="middle">
            <Col flex={"auto"}>
              <h2>Launchpad</h2>
            </Col>
          </Row>
          <Row align="middle">
            <Col>
              <Select
                defaultValue={standard}
                onChange={setStandard}
                options={[
                  { value: V1, label: V1 },
                  { value: V2, label: V2 },
                ]}
              />
            </Col>
            <Col>
              <Select
                defaultValue={type}
                onChange={setType}
                style={{ width: 120 }}
                options={[
                  { value: COLLECTION, label: COLLECTION },
                  { value: TOKEN, label: TOKEN },
                ]}
              />
            </Col>
          </Row>
          <Row align="middle">
            <Col span={2}>
              <p>Collection name:</p>
            </Col>
            <Col flex={"auto"}>
              <Input
                onChange={(event) => {
                  onStringChange(event, setCollectionName);
                }}
                style={{ width: "calc(100% - 60px)" }}
                placeholder="Collection Name"
                size="large"
                defaultValue={"Test Collection"}
              />
            </Col>
          </Row>
          {type === TOKEN && (
            <Row align="middle">
              <Col span={2}>
                <p>Token name:</p>
              </Col>
              <Col flex={"auto"}>
                <Input
                  onChange={(event) => {
                    onStringChange(event, setTokenName);
                  }}
                  style={{ width: "calc(100% - 60px)" }}
                  placeholder="Token Name"
                  size="large"
                  defaultValue={"Test Token #1"}
                />
              </Col>
            </Row>
          )}
          <Row align="middle">
            <Col span={2}>
              <p>
                {type === TOKEN && "Token"}
                {type === COLLECTION && "Collection"} URI:
              </p>
            </Col>
            <Col flex={"auto"}>
              <Input
                onChange={async (event) => {
                  // eslint-disable-next-line @typescript-eslint/no-shadow
                  const uri = await onStringChange(event, setUri);
                  setImageUri(await ensureImageUri(uri));
                }}
                style={{ width: "calc(100% - 60px)" }}
                placeholder="URI"
                size="large"
                defaultValue={DEFAULT_IMAGE}
              />
            </Col>
            <Col offset={1}>
              <Image
                width={100}
                src={imageUri}
                alt={imageUri}
                /* eslint-disable-next-line max-len */
                fallback="data:image/png;base64,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"
              />
            </Col>
            <Col span={2} />
          </Row>
          <Row align="middle">
            <Col span={2}>
              <p>Description:</p>
            </Col>
            <Col flex={"auto"}>
              <Input
                onChange={(event) => {
                  onStringChange(event, setDescription);
                }}
                style={{ width: "calc(100% - 60px)" }}
                placeholder="Description"
                size="large"
                defaultValue={""}
              />
            </Col>
          </Row>
          <Row align="middle">
            <Col span={2}>
              <p>Royalty Percent:</p>
            </Col>
            <Col flex={"auto"}>
              <Input
                onChange={(event) => {
                  onNumberChange(event, setRoyaltyPercent);
                }}
                style={{ width: "calc(100% - 60px)" }}
                placeholder="Royalty Percent (whole percent)"
                size="large"
                defaultValue={0}
              />
            </Col>
          </Row>
          {type === COLLECTION && standard === V1 && (
            <Row align="middle">
              <Col offset={2} span={2}>
                <Button
                  onClick={() => createV1Collection()}
                  type="primary"
                  style={{ height: "40px", backgroundColor: "#3f67ff" }}
                >
                  Create V1 Collection
                </Button>
              </Col>
            </Row>
          )}
          {type === TOKEN && standard === V1 && (
            <Row align="middle">
              <Col offset={2} span={2}>
                <Button
                  onClick={() => createV1Token()}
                  type="primary"
                  style={{ height: "40px", backgroundColor: "#3f67ff" }}
                >
                  Create V1 Token
                </Button>
              </Col>
            </Row>
          )}
          {type === COLLECTION && standard === V2 && (
            <Row align="middle">
              <Col offset={2} span={2}>
                <Button
                  onClick={() => createV2Collection()}
                  type="primary"
                  style={{ height: "40px", backgroundColor: "#3f67ff" }}
                >
                  Create V2 Collection
                </Button>
              </Col>
            </Row>
          )}
          {type === TOKEN && standard === V2 && (
            <Row align="middle">
              <Col offset={2} span={2}>
                <Button
                  onClick={() => createV2Token()}
                  type="primary"
                  style={{ height: "40px", backgroundColor: "#3f67ff" }}
                >
                  Create V2 Token
                </Button>
              </Col>
            </Row>
          )}
          <CollectionModifier expectedNetwork={props.expectedNetwork} />
          <TokenModifier expectedNetwork={props.expectedNetwork} />
        </NetworkChecker>
      </Layout>
    </EasyBorder>
  );
}

export default Launchpad;
