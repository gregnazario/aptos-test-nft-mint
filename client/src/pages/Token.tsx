import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Col,
  Descriptions,
  Divider,
  Image,
  Modal,
  Row,
  Select,
} from "antd";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";
// eslint-disable-next-line import/no-cycle
import { useParams } from "react-router";
// eslint-disable-next-line import/no-cycle
import {
  Token,
  V1AuctionListing,
  V1FixedListing,
  V2AuctionListing,
  V2FixedListing,
} from "./Wallet";
import {
  ensureImageUri,
  getProvider,
  runViewFunction,
  TransactionContext,
} from "../Helper";
import { Transfer } from "../components/Transfer";
import { EasyBorder } from "../components/EasyBorder";
import { FIXED_PRICE, AUCTION, V1, V2 } from "../utils/constants";
/* eslint-disable no-console */

export function TokenDetails(props: { network: Network }) {
  const { tokenId } = useParams();
  const [openListModal, setOpenListModal] = useState(false);
  const [openTransferModal, setOpenTransferModal] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [listingType, setListingType] = useState(FIXED_PRICE);
  const [submitFixed, setSubmitFixed] = useState(false);
  const [token, setToken] = useState<Token>();
  const [ctx, setCtx] = useState<TransactionContext>();
  const walletState = useWallet();
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    fetchToken();
    setCtx({
      network: props.network,
      account: walletState.account,
      submitTransaction: walletState.signAndSubmitTransaction,
    });
  }, [props.network, tokenId, walletState]);

  const fetchToken = async () => {
    const provider = getProvider(props.network);
    const tokenData = await provider.getDigitalAssetData({
      digitalAssetAddress: tokenId || "",
    });
    try {
      const item: Token = {
        type: "NFT",
        name: tokenData.token_name,
        description: tokenData.description,
        token_properties: tokenData.token_properties,
        collection: tokenData.current_collection?.collection_name || "",
        standard: tokenData.token_standard.toUpperCase(),
        data_id: tokenData.token_data_id,
        uri: await ensureImageUri(tokenData.token_uri),
        collection_id: tokenData.current_collection?.collection_id || "",
        creator_address: tokenData.current_collection?.creator_address || "",
        property_version: tokenData.largest_property_version_v1 || 0,
      };
      setToken(item);
    } catch (error: any) {
      console.log(`Error fetching token data ${error}`);
    }
  };

  const showListModal = async () => {
    if (!ctx) {
      return;
    }
    runViewFunction(ctx, {
      function: "0x4::token::royalty",
      typeArguments: ["0x4::aptos_token::AptosToken"],
      functionArguments: [],
    });
    setOpenListModal(true);
  };
  const showTransferModal = () => {
    setOpenTransferModal(true);
  };

  const handleListOk = () => {
    setConfirmLoading(true);
    setSubmitFixed(true);
  };

  const finishedCallback = () => {
    setSubmitFixed(false);
    setConfirmLoading(false);
    setOpenListModal(false);
    setOpenTransferModal(false);
  };

  const handleCancel = () => {
    setSubmitFixed(false);
    setConfirmLoading(false);
    setOpenListModal(false);
    setOpenTransferModal(false);
  };

  // TODO: Prettyfy and add current listings
  return (
    <EasyBorder offset={1}>
        <Row align="middle">
          <Col offset={1}>
            <h2>
              {token?.collection} : {token?.name}
            </h2>
          </Col>
        </Row>
        <Divider />
        <Row align="middle">
          <Col offset={1} flex={"auto"}>
            <Image
              className="container"
              width={500}
              src={token?.uri}
              alt={token?.name}
              /* eslint-disable-next-line max-len */
              fallback="data:image/png;base64,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"
            />
          </Col>
          <Col offset={1} flex={"auto"}>
            <Descriptions
              title="Token Info"
            >
              <Descriptions.Item span={4}>
                {token?.description}
              </Descriptions.Item>
              <Descriptions.Item label="Standard">
                {token?.standard}
              </Descriptions.Item>
              <Descriptions.Item label="TokenId">
                {tokenId}
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
        <Row align={"middle"}>
          <Col offset={2} span={2} flex={"auto"}>
            <Button
              onClick={showListModal}
              type="primary"
              style={{ height: "40px", backgroundColor: "#3f67ff" }}
            >
              List
            </Button>
            <Modal
              title={`List ${token?.collection} : ${token?.name}`}
              open={openListModal}
              onOk={handleListOk}
              confirmLoading={confirmLoading}
              onCancel={handleCancel}
              width={750}
            >
              <Select
                defaultValue={listingType}
                style={{ width: 120 }}
                onChange={setListingType}
                options={[
                  { value: FIXED_PRICE, label: FIXED_PRICE },
                  { value: AUCTION, label: AUCTION },
                ]}
              />
              {ctx && token?.standard === V1 && listingType === FIXED_PRICE && (
                <V1FixedListing
                  item={token}
                  ctx={ctx}
                  submit={submitFixed}
                  submitCallback={finishedCallback}
                />
              )}
              {ctx && token?.standard === V1 && listingType === AUCTION && (
                <V1AuctionListing
                  item={token}
                  ctx={ctx}
                  submit={submitFixed}
                  submitCallback={finishedCallback}
                />
              )}
              {ctx && token?.standard === V2 && listingType === FIXED_PRICE && (
                <V2FixedListing
                  item={token}
                  ctx={ctx}
                  submit={submitFixed}
                  submitCallback={finishedCallback}
                />
              )}
              {ctx && token?.standard === V2 && listingType === AUCTION && (
                <V2AuctionListing
                  item={token}
                  ctx={ctx}
                  submit={submitFixed}
                  submitCallback={finishedCallback}
                />
              )}
            </Modal>
          </Col>
          <Col span={2} flex={"auto"}>
            <Button
              onClick={showTransferModal}
              type="primary"
              style={{ height: "40px", backgroundColor: "#3f67ff" }}
              disabled={token?.standard === V1}
            >
              Transfer
            </Button>
            <Modal
              title={`Transfer ${token?.collection} : ${token?.name}`}
              open={openTransferModal}
              onOk={handleListOk}
              confirmLoading={confirmLoading}
              onCancel={handleCancel}
            >
              {token?.standard === V1 && (
                <Alert
                  type={"warning"}
                  message={
                    "Transfer currently not supported for V1, please use your wallet to transfer"
                  }
                />
              )}
              {ctx && token?.standard === V2 && (
                <Transfer
                  ctx={ctx}
                  objectAddress={token?.data_id}
                  submit={submitFixed}
                  submitCallback={finishedCallback}
                />
              )}
            </Modal>
          </Col>
        </Row>
    </EasyBorder>
  );
}
