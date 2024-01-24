import React, { Fragment, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Col,
  DatePicker,
  Divider,
  Image,
  Input,
  Modal,
  Pagination,
  Row,
  Select,
  Tooltip,
} from "antd";
import { Image as TokenImage } from "../components/Image";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { CheckboxChangeEvent } from "antd/es/checkbox";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import type { RangeValue } from "rc-picker/lib/interface";
import { useNavigate, useParams } from "react-router";
import {
  MoveStructId,
  Network,
  TransactionResponseType,
} from "@aptos-labs/ts-sdk";
import { Marketplace as Helper } from "../MarketplaceHelper";
// eslint-disable-next-line import/no-cycle
import { Transfer } from "../components/Transfer";
import {
  ensureImageUri,
  getProvider,
  onNumberChange,
  onStringChange,
  runTransaction,
  runViewFunction,
  TransactionContext,
} from "../Helper";
import { EasyBorder } from "../components/EasyBorder";
import { MODULE_ADDRESS, DEFAULT_PRICE, AUCTION, FIXED_PRICE, V1, V2, defaultFeeSchedule, toApt } from "../utils/constants";

;
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console */

export type Token = {
  standard: string;
  collection: string;
  collection_id: string;
  name: string;
  description: string;
  data_id: string;
  uri: string;
  type: string;
  creator_address: string;
  property_version: string;
};

export const resolveToName = async (maybe_address: string): Promise<string> => {
  // Primary first then name
  try {
    const response = await fetch(
      `https://www.aptosnames.com/api/mainnet/v1/primary_name/${maybe_address}`,
    );
    const { name } = await response.json();

    // If I can resolve the name, let's provide that
    if (name != null) {
      return `${name}.apt`;
    }
  } catch {
    /* swallow error */
  }

  // TODO: Provide useful messages if names don't resolve
  try {
    const response = await fetch(
      `https://www.aptosnames.com/api/mainnet/v1/name/${maybe_address}`,
    );
    const { name } = await response.json();

    // If I can resolve the name, let's provide that
    if (name != null) {
      return `${name}.apt`;
    }
  } catch {
    /* swallow error */
  }

  // In all other cases, show the original string
  return maybe_address;
};

// Resolves a name or address to an address
export const resolveToAddress = async (maybe_name: string): Promise<string> => {
  // TODO: Provide useful messages if names don't resolve
  try {
    const response = await fetch(
      `https://www.aptosnames.com/api/mainnet/v1/address/${maybe_name}`,
    );
    const { address } = await response.json();
    // If name resolves, return the address
    if (address != null) {
      return address;
    }
  } catch {
    /* swallow error */
  }
  // If it can't resolve, act like it's an address
  return maybe_name;
};

export function Wallet(props: { network: Network; }) {
  const { walletAddress } = useParams();
  const [totalNfts, setTotalNfts] = useState<number>(10);
  const [address, setAddress] = useState<string>(walletAddress ?? "");
  const [name, setName] = useState<string>(walletAddress ?? "");
  const [wallet, setWallet] = useState<{
    error: string | undefined;
    tokens: Token[];
  }>();
  const walletContextState = useWallet();

  useEffect(() => {
    fetchWalletFirstTime();
  }, [props.network, walletAddress]);

  const fetchWalletFirstTime = async () => {
    if (!walletAddress) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const address = await resolveToAddress(walletAddress);
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const name = await resolveToName(address);
    setAddress(address);
    setName(name);
    await getTotalNfts(address);
    await fetchWallet(address, name, 0, 10);
  };

  // eslint-disable-next-line @typescript-eslint/no-shadow
  const getTotalNfts = async (address: string) => {
    if (!address) {
      return;
    }
    try {
      const numNfts = await getProvider(props.network).getAccountTokensCount({
        accountAddress: address,
      });
      setTotalNfts(numNfts ?? 0);
    } catch (error: any) {
      console.log(`Failed to load wallet ${error}`);
      setTotalNfts(10);
    }
  };

  const fetchWallet = async (
    // eslint-disable-next-line @typescript-eslint/no-shadow
    address: string,
    // eslint-disable-next-line @typescript-eslint/no-shadow
    name: string,
    page: number,
    limit: number,
  ) => {
    if (!address) {
      return;
    }
    try {
      const tokensQuery = await getProvider(
        props.network,
      ).getAccountOwnedTokens({
        accountAddress: address,
        options: {
          offset: page * limit,
          limit,
        },
      });

      // TODO: Revisit this conversion and see if anything else needs to be cleaned up
      const tokens: Token[] = [];
      for (const tokenData of tokensQuery) {
        if (tokenData.token_standard === "v2") {
          const creatorAddress =
            tokenData.current_token_data?.current_collection?.creator_address ||
            "";
          const collectionName =
            tokenData.current_token_data?.current_collection?.collection_name ||
            "";
          const collectionId =
            tokenData.current_token_data?.current_collection?.collection_id ||
            "";
          // eslint-disable-next-line @typescript-eslint/no-shadow
          const name = tokenData.current_token_data?.token_name || "";
          const dataId = tokenData.current_token_data?.token_data_id || "";
          const uri = tokenData.current_token_data?.token_uri || "";
          let type = "NFT";
          if (tokenData.is_soulbound_v2 && tokenData.is_fungible_v2) {
            type = "Soulbound Fungible Token";
          } else if (tokenData.is_soulbound_v2) {
            type = "Soulbound NFT";
          } else if (tokenData.is_fungible_v2) {
            // Fungible will also skip for now in this demo
            type = "Fungible Token";
          }
          tokens.push({
            standard: "V2",
            collection: collectionName,
            collection_id: collectionId,
            name,
            data_id: dataId,
            uri,
            type,
            property_version: "",
            creator_address: creatorAddress,
          });
        } else {
          // Handle V1
          const collectionCreator =
            tokenData.current_token_data?.current_collection?.creator_address ||
            "";
          const collectionName =
            tokenData.current_token_data?.current_collection?.collection_name ||
            "";
          const collectionId =
            tokenData.current_token_data?.current_collection?.collection_id ||
            "";
          // eslint-disable-next-line @typescript-eslint/no-shadow
          const name = tokenData.current_token_data?.token_name || "";
          const dataId = tokenData.current_token_data?.token_data_id || "";
          let uri = tokenData.current_token_data?.token_uri || "";

          // Support URI in metadata
          // TODO: Verify all image endings
          try {
            // eslint-disable-next-line no-await-in-loop
            uri = await ensureImageUri(uri);
          } catch (error: any) {
            console.log(`Failed to query ${uri} ${error}`);
          }

          const propertyVersion =
            tokenData.current_token_data?.largest_property_version_v1 || 0;
          const type = "NFT"; // TODO: Handle fungible
          tokens.push({
            standard: "V1",
            collection: collectionName,
            collection_id: collectionId,
            name,
            data_id: dataId,
            uri,
            type,
            property_version: propertyVersion,
            creator_address: collectionCreator,
          });
        }
      }

      setWallet({ error: undefined, tokens });
    } catch (error: any) {
      console.log(`Failed to load wallet ${address} ${error}`);
      setWallet({
        error: `Failed to load wallet ${error.toString()}`,
        tokens: [],
      });
    }
  };

  // TODO: Prettyfy and add current listings
  return (
    <EasyBorder offset={0}>
        <Row align="middle">
          <Col offset={1}>
            <h2>Wallet: {name}</h2>
          </Col>
        </Row>
        <Divider />
        {!wallet?.error && (
          <Fragment key={"wallet_nfts"}>
                <Row align={"middle"}>
                  <Col span={1} />
                  {wallet?.tokens.map((item) => {
                    if (
                      !walletContextState.connected ||
                      !walletContextState.account
                    ) {
                      return (
                        <WalletItem key={item.data_id} address={address} ctx={null} item={item} />
                      );
                    }
                    return (
                      <WalletItem
                        key={item.data_id} 
                        address={address}
                        ctx={{
                          account: walletContextState.account,
                          network: props.network,
                          submitTransaction:
                            walletContextState.signAndSubmitTransaction,
                        }}
                        item={item}
                      />
                    );
                  })}
                  <Col span={1} />
                </Row>
              
              <Row align="middle">
                <Col offset={2} flex={"auto"}>
                  <Pagination
                    onChange={(page, limit) => {
                      fetchWallet(address, name, page - 1, limit);
                    }}
                    defaultCurrent={1}
                    total={totalNfts}
                  />
                </Col>
                <Col span={2} />
              </Row>
            </Fragment>
          )}
        {wallet?.error && (
          <Row align="middle">
            <Col offset={2} flex={"auto"}>
              <Alert type="error" message={wallet.error} />
            </Col>
          </Row>
        )}
    </EasyBorder>
  );
}

function WalletItem(props: {
  address: string;
  item: Token;
  ctx: TransactionContext | null;
}) {
  const [openListModal, setOpenListModal] = useState(false);
  const [openTransferModal, setOpenTransferModal] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [listingType, setListingType] = useState(FIXED_PRICE);
  const [submitFixed, setSubmitFixed] = useState(false);

  const showListModal = async () => {
    if (!props.ctx) {
      return;
    }
    runViewFunction(props.ctx, {
      function: "0x4::token::royalty",
      typeArguments: ["0x4::aptos_token::AptosToken"] as MoveStructId[],
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
    window.location.reload();
  };

  const handleCancel = () => {
    setSubmitFixed(false);
    setConfirmLoading(false);
    setOpenListModal(false);
    setOpenTransferModal(false);
  };
  const navigate = useNavigate();

  return (
    <div className="container">
      <Col span={2.5}>
        <Row align={"middle"}>
          {props.item.standard.toLowerCase() === "v1" && (
            <Tooltip
              placement="right"
              title={`${props.item.collection} : ${props.item.name}\n
                      ${props.item.standard} ${props.item.type}\n
                                          Data id: ${props.item.data_id}\n
                                          Creator: ${props.item.creator_address}\n
                                          Property Version: ${props.item.property_version}
                                          `}
            >
              <Image
                onClick={() => navigate(`/token/${props.item.data_id}`)}
                width={150}
                src={props.item.uri}
                alt={props.item.name}
                /* eslint-disable-next-line max-len */
                fallback="data:image/png;base64,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"
              />
            </Tooltip>
          )}
          {props.item.standard.toLowerCase() === "v2" && (
            <Tooltip
              placement="right"
              title={`${props.item.collection} : ${props.item.name}\n
                      Standard: ${props.item.standard}\n
                      Type: ${props.item.type}\n
                      Data id: ${props.item.data_id}\n
                      Creator: ${props.item.creator_address}\n
                      Property Version: ${props.item.property_version}`}
            >
              <TokenImage
                onClick={() => navigate(`/token/${props.item.data_id}`)}
                width={150}
                uri={props.item.uri}
                tokenId={props.item.data_id}
                alt={props.item.name}
                /* eslint-disable-next-line max-len */
                fallback="data:image/png;base64,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"
              />
            </Tooltip>
          )}
        </Row>
        {props.ctx?.account?.address === props.address && (
          <Row align={"middle"}>
            <Col flex={"auto"}>
              <Button
                onClick={showListModal}
                type="primary"
                style={{ height: "40px", backgroundColor: "#3f67ff" }}
              >
                List
              </Button>
              <Modal
                title={`List ${props.item.collection} : ${props.item.name}`}
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
                {props.item.standard === V1 && listingType === FIXED_PRICE && (
                  <V1FixedListing
                    item={props.item}
                    ctx={props.ctx}
                    submit={submitFixed}
                    submitCallback={finishedCallback}
                  />
                )}
                {props.item.standard === V1 && listingType === AUCTION && (
                  <V1AuctionListing
                    item={props.item}
                    ctx={props.ctx}
                    submit={submitFixed}
                    submitCallback={finishedCallback}
                  />
                )}
                {props.item.standard === V2 && listingType === FIXED_PRICE && (
                  <V2FixedListing
                    item={props.item}
                    ctx={props.ctx}
                    submit={submitFixed}
                    submitCallback={finishedCallback}
                  />
                )}
                {props.item.standard === V2 && listingType === AUCTION && (
                  <V2AuctionListing
                    item={props.item}
                    ctx={props.ctx}
                    submit={submitFixed}
                    submitCallback={finishedCallback}
                  />
                )}
              </Modal>
            </Col>
            <Col flex={"auto"}>
              <Button
                onClick={showTransferModal}
                type="primary"
                style={{ height: "40px", backgroundColor: "#3f67ff" }}
                disabled={props.item.standard === V1}
              >
                Transfer
              </Button>
              <Modal
                title={`Transfer ${props.item.collection} : ${props.item.name}`}
                open={openTransferModal}
                onOk={handleListOk}
                confirmLoading={confirmLoading}
                onCancel={handleCancel}
              >
                {props.item.standard === V1 && (
                  <Alert
                    type={"warning"}
                    message={
                      "Transfer currently not supported for V1, please use your wallet to transfer"
                    }
                  />
                )}
                {props.item.standard === V2 && (
                  <Transfer
                    ctx={props.ctx}
                    objectAddress={props.item.data_id}
                    submit={submitFixed}
                    submitCallback={finishedCallback}
                  />
                )}
              </Modal>
            </Col>
          </Row>
        )}
      </Col>
    </div>
  );
}

export function V1FixedListing(props: {
  ctx: TransactionContext;
  item: Token;
  submit: boolean;
  submitCallback: () => void;
}) {
  const MARKETPLACE_HELPER = new Helper(
    getProvider(props.ctx.network),
    MODULE_ADDRESS,
  );

  const [listingPrice, setListingPrice] = useState<string>(DEFAULT_PRICE);
  const feeScheduleAddress = defaultFeeSchedule(props.ctx.network);

  useEffect(() => {
    if (props.submit) {
      createV1Listing();
    }
  }, [props.submit]);

  const createV1Listing = async () => {
    // Ensure you're logged in
    if (!props.ctx.account) return;
    const payload = MARKETPLACE_HELPER.initFixedPriceListingForTokenv1(
      props.item.creator_address,
      props.item.collection,
      props.item.name,
      BigInt(props.item.property_version ?? 0),
      feeScheduleAddress,
      BigInt(Math.floor(new Date().getTime() / 1000)),
      BigInt(listingPrice),
    );

    try {
      const txn = await runTransaction(props.ctx, payload);
      if (txn?.type === TransactionResponseType.User) {
        let address = "unknown";
        for (const event of txn.events) {
          if (event.type === "0x1::object::TransferEvent") {
            address = event.data.to;
            break;
          }
        }
        console.log(`Listing created at ${address}`);
      }
    } catch (error: any) {
      console.log(`Failed to create listing ${error}`);
    }
    props.submitCallback();
  };

  return (
    <Fragment key={"listing"}>
      <Row align="middle">
        <Col span={6}>
          <p>Price(Octas): </p>
        </Col>
        <Col span={6}>
          <Input
            onChange={(event) => {
              onStringChange(event, setListingPrice);
            }}
            placeholder="Price"
            size="large"
            defaultValue={DEFAULT_PRICE}
          />
        </Col>
        <Col offset={2} flex={"auto"}>
          <p>{toApt(listingPrice)} APT</p>
        </Col>
      </Row>
    </Fragment>
  );
}

export function V1AuctionListing(props: {
  ctx: TransactionContext;
  item: Token;
  submit: boolean;
  submitCallback: () => void;
}) {
  const MARKETPLACE_HELPER = new Helper(
    getProvider(props.ctx.network),
    MODULE_ADDRESS,
  );

  const [startingBid, setStartingBid] = useState<string>("");
  const [bidIncrement, setBidIncrement] = useState<string>("");
  const [buyNowPrice, setBuyNowPrice] = useState<string>("");
  const [buyNowEnabled, setBuyNowEnabled] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<number>(-1);
  const [endTime, setEndTime] = useState<number>(-1);
  const [minBidTime, setMinBidTime] = useState<number>(3600);
  const feeScheduleAddress = defaultFeeSchedule(props.ctx.network);

  useEffect(() => {
    if (props.submit) {
      createV1Listing();
    }
  }, [props.submit]);

  const createV1Listing = async () => {
    // Ensure you're logged in
    if (!props.ctx.account) return;

    // Ensure that fields are set to a value
    if (
      startingBid === undefined ||
      bidIncrement === undefined ||
      buyNowPrice === undefined
    )
      return;

    let buyNow: bigint | undefined;
    if (buyNowEnabled) {
      buyNow = BigInt(buyNowPrice);
    } else {
      buyNow = undefined;
    }

    const payload = MARKETPLACE_HELPER.initAuctionListingForTokenv1(
      props.item.creator_address,
      props.item.collection,
      props.item.name,
      BigInt(props.item.property_version ?? 0),
      feeScheduleAddress,
      BigInt(startTime), // start time
      BigInt(startingBid), // starting bid
      BigInt(bidIncrement), // bid increment
      BigInt(endTime), // auction_end-time
      BigInt(minBidTime), // min bid time
      buyNow, // Buy it now price
    );

    try {
      const txn = await runTransaction(props.ctx, payload);
      if (txn?.type === TransactionResponseType.User) {
        let address = "unknown";
        for (const event of txn.events) {
          if (event.type === "0x1::object::TransferEvent") {
            address = event.data.to;
            break;
          }
        }
        console.log(`Listing created at ${address}`);
      }
    } catch (error: any) {
      console.log(`Failed to create listing ${error}`);
    }
    props.submitCallback();
  };

  const onCheckBuyNow = (e: CheckboxChangeEvent) => {
    setBuyNowEnabled(e.target.checked);
  };

  const rangePresets: {
    label: string;
    value: [Dayjs, Dayjs];
  }[] = [
    { label: "1 Day", value: [dayjs().add(1, "d"), dayjs()] },
    { label: "3 Days", value: [dayjs().add(3, "d"), dayjs()] },
    { label: "5 Days", value: [dayjs().add(5, "d"), dayjs()] },
    { label: "1 Week", value: [dayjs().add(7, "d"), dayjs()] },
  ];

  const onTimeChange = (
    time: RangeValue<Dayjs>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _dateString: [string, string],
  ) => {
    if (!time || !time[0] || !time[1]) return;

    setStartTime(time[0].unix());
    setEndTime(time[1].unix());
  };

  return (
    <>
      <Row align="middle">
        <Col span={6}>
          <p>Starting Bid(Octas): </p>
        </Col>
        <Col span={6}>
          <Input
            onChange={(event) => {
              onStringChange(event, setStartingBid);
            }}
            placeholder="Starting Bid"
            size="large"
          />
        </Col>
        <Col offset={2} flex={"auto"}>
          {startingBid !== "" && <p>{toApt(startingBid)} APT</p>}
        </Col>
      </Row>
      <Row align="middle">
        <Col span={6}>
          <p>Bid increment(Octas): </p>
        </Col>
        <Col span={6}>
          <Input
            onChange={(event) => {
              onStringChange(event, setBidIncrement);
            }}
            placeholder="Bid Increment"
            size="large"
          />
        </Col>
        <Col offset={2} flex={"auto"}>
          {bidIncrement !== "" && <p>{toApt(bidIncrement)} APT</p>}
        </Col>
      </Row>
      <Row align="middle">
        <Col span={6}>
          <p>Auction start time: </p>
        </Col>
        <Col span={12}>
          <DatePicker.RangePicker
            presets={rangePresets}
            showTime={{ format: "HH:mm" }}
            showNow
            format="YYYY-MM-DD HH:mm"
            onChange={onTimeChange}
          />
        </Col>
      </Row>
      <Row align="middle">
        <Col span={6}>
          <p>Min bid time (seconds): </p>
        </Col>
        <Col span={6}>
          <Input
            onChange={(event) => {
              onNumberChange(event, setMinBidTime);
            }}
            placeholder="Min bid time"
            size="large"
          />
        </Col>
      </Row>
      <Row align="middle">
        <Col span={5}>
          <p>Buy now price: </p>
        </Col>
        <Col span={1}>
          <Checkbox onChange={onCheckBuyNow} />
        </Col>
        <Col span={6}>
          <Input
            onChange={(event) => {
              onStringChange(event, setBuyNowPrice);
            }}
            placeholder="Buy Now Price"
            size="large"
            defaultValue={buyNowPrice}
            disabled={!buyNowEnabled}
          />
        </Col>
        <Col offset={2} flex={"auto"}>
          {buyNowEnabled && buyNowPrice !== "" && (
            <p>{toApt(buyNowPrice)} APT</p>
          )}
        </Col>
      </Row>
    </>
  );
}

export function V2AuctionListing(props: {
  ctx: TransactionContext;
  item: Token;
  submit: boolean;
  submitCallback: () => void;
}) {
  const MARKETPLACE_HELPER = new Helper(
    getProvider(props.ctx.network),
    MODULE_ADDRESS,
  );

  const [startingBid, setStartingBid] = useState<string>("");
  const [bidIncrement, setBidIncrement] = useState<string>("");
  const [buyNowPrice, setBuyNowPrice] = useState<string>("");
  const [buyNowEnabled, setBuyNowEnabled] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<number>(-1);
  const [endTime, setEndTime] = useState<number>(-1);
  const [minBidTime, setMinBidTime] = useState<number>(3600);
  const feeScheduleAddress = defaultFeeSchedule(props.ctx.network);

  useEffect(() => {
    if (props.submit) {
      createV1Listing();
    }
  }, [props.submit]);

  const createV1Listing = async () => {
    // Ensure you're logged in
    if (!props.ctx.account) return;

    // Ensure that fields are set to a value
    if (
      startingBid === undefined ||
      bidIncrement === undefined ||
      buyNowPrice === undefined
    )
      return;

    let buyNow: bigint | undefined;
    if (buyNowEnabled) {
      buyNow = BigInt(buyNowPrice);
    } else {
      buyNow = undefined;
    }

    const payload = await MARKETPLACE_HELPER.initAuctionListing(
      props.item.data_id,
      feeScheduleAddress,
      BigInt(startTime), // start time
      BigInt(startingBid), // starting bid
      BigInt(bidIncrement), // bid increment
      BigInt(endTime), // auction_end-time
      BigInt(minBidTime), // min bid time
      buyNow, // Buy it now price
    );

    try {
      const txn = await runTransaction(props.ctx, payload);
      if (txn?.type === TransactionResponseType.User) {
        let address = "unknown";
        for (const event of txn.events) {
          if (event.type === "0x1::object::TransferEvent") {
            address = event.data.to;
            break;
          }
        }
        console.log(`Listing created at ${address}`);
      }
    } catch (error: any) {
      console.log(`Failed to create listing ${error}`);
    }
    props.submitCallback();
  };

  const onCheckBuyNow = (e: CheckboxChangeEvent) => {
    setBuyNowEnabled(e.target.checked);
  };

  const rangePresets: {
    label: string;
    value: [Dayjs, Dayjs];
  }[] = [
    { label: "1 Day", value: [dayjs().add(1, "d"), dayjs()] },
    { label: "3 Days", value: [dayjs().add(3, "d"), dayjs()] },
    { label: "5 Days", value: [dayjs().add(5, "d"), dayjs()] },
    { label: "1 Week", value: [dayjs().add(7, "d"), dayjs()] },
  ];

  const onTimeChange = (
    time: RangeValue<Dayjs>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _dateString: [string, string],
  ) => {
    if (!time || !time[0] || !time[1]) return;

    setStartTime(time[0].unix());
    setEndTime(time[1].unix());
  };

  return (
    <>
      <Row align="middle">
        <Col span={6}>
          <p>Starting Bid(Octas): </p>
        </Col>
        <Col span={6}>
          <Input
            onChange={(event) => {
              onStringChange(event, setStartingBid);
            }}
            placeholder="Starting Bid"
            size="large"
          />
        </Col>
        <Col offset={2} flex={"auto"}>
          {startingBid !== "" && <p>{toApt(startingBid)} APT</p>}
        </Col>
      </Row>
      <Row align="middle">
        <Col span={6}>
          <p>Bid increment(Octas): </p>
        </Col>
        <Col span={6}>
          <Input
            onChange={(event) => {
              onStringChange(event, setBidIncrement);
            }}
            placeholder="Bid Increment"
            size="large"
          />
        </Col>
        <Col offset={2} flex={"auto"}>
          {bidIncrement !== "" && <p>{toApt(bidIncrement)} APT</p>}
        </Col>
      </Row>
      <Row align="middle">
        <Col span={6}>
          <p>Auction start time: </p>
        </Col>
        <Col span={12}>
          <DatePicker.RangePicker
            presets={rangePresets}
            showTime={{ format: "HH:mm" }}
            showNow
            format="YYYY-MM-DD HH:mm"
            onChange={onTimeChange}
          />
        </Col>
      </Row>
      <Row align="middle">
        <Col span={6}>
          <p>Min bid time (seconds): </p>
        </Col>
        <Col span={6}>
          <Input
            onChange={(event) => {
              onNumberChange(event, setMinBidTime);
            }}
            placeholder="Min bid time"
            size="large"
          />
        </Col>
      </Row>
      <Row align="middle">
        <Col span={5}>
          <p>Buy now price: </p>
        </Col>
        <Col span={1}>
          <Checkbox onChange={onCheckBuyNow} />
        </Col>
        <Col span={6}>
          <Input
            onChange={(event) => {
              onStringChange(event, setBuyNowPrice);
            }}
            placeholder="Buy Now Price"
            size="large"
            defaultValue={buyNowPrice}
            disabled={!buyNowEnabled}
          />
        </Col>
        <Col offset={2} flex={"auto"}>
          {buyNowEnabled && buyNowPrice !== "" && (
            <p>{toApt(buyNowPrice)} APT</p>
          )}
        </Col>
      </Row>
    </>
  );
}

export function V2FixedListing(props: {
  ctx: TransactionContext;
  item: Token;
  submit: boolean;
  submitCallback: () => void;
}) {
  const MARKETPLACE_HELPER = new Helper(
    getProvider(props.ctx.network),
    MODULE_ADDRESS,
  );

  const [listingPrice, setListingPrice] = useState<string>(DEFAULT_PRICE);
  const feeScheduleAddress = defaultFeeSchedule(props.ctx.network);

  useEffect(() => {
    if (props.submit) {
      createV2Listing();
    }
  }, [props.submit]);

  const createV2Listing = async () => {
    // Ensure you're logged in
    if (!props.ctx.account) return;
    const payload = MARKETPLACE_HELPER.initFixedPriceListing(
      props.item.data_id,
      feeScheduleAddress,
      BigInt(Math.floor(new Date().getTime() / 1000)),
      BigInt(listingPrice),
    );

    try {
      const txn = await runTransaction(props.ctx, payload);
      if (txn?.type === TransactionResponseType.User) {
        let address = "unknown";
        for (const event of txn.events) {
          if (event.type === "0x1::object::TransferEvent") {
            address = event.data.to;
            break;
          }
        }
        console.log(`Listing created at ${address}`);
      }
    } catch (error: any) {
      console.log(`Failed to create listing ${error}`);
    }
    props.submitCallback();
  };

  return (
    <>
      <Row align="middle">
        <Col span={6}>
          <p>Price(Octas): </p>
        </Col>
        <Col span={6}>
          <Input
            onChange={(event) => {
              onStringChange(event, setListingPrice);
            }}
            placeholder="Price"
            size="large"
            defaultValue={DEFAULT_PRICE}
          />
        </Col>
        <Col offset={2} flex={"auto"}>
          <p>{toApt(listingPrice)} APT</p>
        </Col>
      </Row>
    </>
  );
}
