import {
  Alert,
  Button,
  Col,
  Collapse,
  CollapseProps,
  Image,
  Input,
  Row,
  Select,
  Tooltip,
} from "antd";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import { useEffect, useState } from "react";
import { Network } from "aptos";
import { Link } from "react-router-dom";
import {
  Listing,
  Marketplace as Helper,
  TokenOffer,
} from "./MarketplaceHelper";
import {
  onStringChange,
  onNumberChange,
  onBigIntChange,
  runTransaction,
  TransactionContext,
  getProvider,
  ensureImageUri,
} from "./Helper";
// eslint-disable-next-line import/no-cycle
import { resolveToName } from "./pages/Wallet";
// eslint-disable-next-line import/no-cycle
import { EasyBorder } from ".";

/* eslint-disable @typescript-eslint/no-use-before-define */

export const MODULE_ADDRESS =
  "0x6de37368e31dff4580b211295198159ee6f98b42ffa93c5683bb955ca1be67e0";
export const DEVNET_FEE_SCHEDULE =
  "0x96e6143a72d9cb40872972c241112ecb43cc0ca8aca376a940a182d620ccef1c";
export const TESTNET_FEE_SCHEDULE =
  "0xc261491e35296ffbb760715c2bb83b87ced70029e82e100ff53648b2f9e1a598";
export const MAINNET_ZERO_FEE_SCHEDULE =
  "0x8bff03d355bb35d2293ae5be7b04b9648be2f3694fb3fc537267ecb563743e00";
export const DEFAULT_PRICE = "100000000";

const APT = 100000000;
export const V1 = "V1";
export const V2 = "V2";
export const FIXED_PRICE = "Fixed Price";
export const AUCTION = "Auction";
export const TOKEN_OFFERS = "Token Offers";
export const COLLECTION_OFFERS = "Collection Offers";

export const defaultFeeSchedule = (network: Network) => {
  if (network === Network.MAINNET) {
    return MAINNET_ZERO_FEE_SCHEDULE;
  }
  if (network === Network.TESTNET) {
    return TESTNET_FEE_SCHEDULE;
  }
  if (network === Network.DEVNET) {
    return DEVNET_FEE_SCHEDULE;
  }

  throw new Error("Unsupported network");
};

function Marketplace(props: TransactionContext) {
  const MARKETPLACE_HELPER = new Helper(
    getProvider(props.network),
    MODULE_ADDRESS,
  );
  const [tokenStandard, setTokenStandard] = useState<string>(V2);
  const [type, setType] = useState<string>(FIXED_PRICE);
  const feeSchedule = defaultFeeSchedule(props.network);
  const [feeScheduleDetails, setFeeScheduleDetails] = useState<{
    name: string;
    error: string | null;
    fee_address: string;
    listing_fee: string;
    bidding_fee: string;
    commission: string;
  }>();

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    loadFeeSchedule();
  }, [props.account]);

  const loadFeeSchedule = async () => {
    // Ensure you're logged in
    if (!props.account) return;

    try {
      const feeAddress = await MARKETPLACE_HELPER.feeAddress(feeSchedule);
      const listingFee = await MARKETPLACE_HELPER.listingFee(feeSchedule);
      const biddingFee = await MARKETPLACE_HELPER.biddingFee(feeSchedule);
      const commission = await MARKETPLACE_HELPER.commission(
        feeSchedule,
        BigInt(DEFAULT_PRICE),
      );
      const name = await resolveToName(feeAddress.hex());

      setFeeScheduleDetails({
        name,
        error: null,
        fee_address: feeAddress.hex(),
        listing_fee: listingFee.toString(),
        bidding_fee: biddingFee.toString(),
        commission: commission.toString(),
      });
    } catch (error: any) {
      setFeeScheduleDetails({
        name: "",
        error: `Failed to load fee schedule ${error}`,
        fee_address: "",
        listing_fee: "",
        bidding_fee: "",
        commission: "",
      });
    }
  };

  return (
    <EasyBorder offset={1}>
      <Row align="middle">
        <Col>
          <h1>NFT Marketplace</h1>
        </Col>
        <Col offset={1}>
          <Link
            to={`https://explorer.aptoslabs.com/account/${MODULE_ADDRESS}/modules/code/coin_listing?network=${props.network}`}
          >
            Code
          </Link>
        </Col>
      </Row>
      {feeScheduleDetails && !feeScheduleDetails.error && (
        <Row align="middle">
          <Col flex={"auto"}>
            {feeScheduleDetails?.listing_fee === "0" &&
              feeScheduleDetails?.bidding_fee === "0" &&
              feeScheduleDetails?.commission === "0" && (
                <Alert
                  type="info"
                  message={"Zero fees! (Creator Royalties still apply)"}
                />
              )}
            {(feeScheduleDetails?.listing_fee !== "0" ||
              feeScheduleDetails?.bidding_fee !== "0" ||
              feeScheduleDetails?.commission !== "0") && (
              <>
                <h2>Fees associated:</h2>
                <ul>
                  <li>{`Fees are sent to ${feeScheduleDetails?.name}`}</li>
                  <li>{`List fee is ${toApt(
                    feeScheduleDetails?.listing_fee,
                  )} APT per listing`}</li>
                  <li>{`Bid fee is ${toApt(
                    feeScheduleDetails?.bidding_fee,
                  )} APT per listing`}</li>
                  <li>{`Commission per ${toApt(DEFAULT_PRICE)} APT is ${toApt(
                    feeScheduleDetails?.commission,
                  )} APT`}</li>
                  <li>Royalties are as specified by the token creator</li>
                </ul>
              </>
            )}
          </Col>
        </Row>
      )}
      {feeScheduleDetails && feeScheduleDetails.error && (
        <Row align="middle">
          <Col flex={"auto"}>
            <Alert
              type="error"
              message={`Failed to load fee schedule ${feeScheduleDetails.error}`}
            />
          </Col>
        </Row>
      )}
      <Row align="middle">
        <Col>
          <Select
            defaultValue={V2}
            onChange={setTokenStandard}
            popupMatchSelectWidth={true}
            options={[
              {
                value: V1,
                label: V1,
                disabled: type === TOKEN_OFFERS || type === COLLECTION_OFFERS,
              },
              { value: V2, label: V2 },
            ]}
          />
        </Col>
        <Col>
          <Select
            defaultValue={FIXED_PRICE}
            onChange={setType}
            style={{ width: 150 }}
            popupMatchSelectWidth={true}
            options={[
              { value: FIXED_PRICE, label: FIXED_PRICE },
              { value: AUCTION, label: AUCTION },
              {
                value: TOKEN_OFFERS,
                label: TOKEN_OFFERS,
                disabled: tokenStandard === V1,
              },
              {
                value: COLLECTION_OFFERS,
                label: COLLECTION_OFFERS,
                disabled: tokenStandard === V1,
              },
            ]}
          />
        </Col>
      </Row>
      {tokenStandard === V1 && type === TOKEN_OFFERS && (
        <Alert type="error" message="Not implemented" />
      )}
      {tokenStandard === V1 && type === COLLECTION_OFFERS && (
        <Alert type="error" message="Not implemented" />
      )}
      {tokenStandard === V2 && type === TOKEN_OFFERS && (
        <V2TokenOffers
          network={props.network}
          account={props.account}
          submitTransaction={props.submitTransaction}
        />
      )}
      {tokenStandard === V2 && type === COLLECTION_OFFERS && (
        <V2CollectionOffers
          network={props.network}
          account={props.account}
          submitTransaction={props.submitTransaction}
        />
      )}
      <Row align="middle">
        <Col>
          <h2>Interacting with Listings</h2>
        </Col>
      </Row>
      {type === AUCTION && (
        <AuctionListingManagement
          network={props.network}
          account={props.account}
          submitTransaction={props.submitTransaction}
        />
      )}
      {tokenStandard === V1 && (
        <ExtractTokenV1
          network={props.network}
          account={props.account}
          submitTransaction={props.submitTransaction}
        />
      )}
      {type === FIXED_PRICE && (
        <Listings
          ctx={{
            network: props.network,
            account: props.account,
            submitTransaction: props.submitTransaction,
          }}
          feeSchedule={feeSchedule}
        />
      )}
      {type === AUCTION && (
        <AuctionListings
          ctx={{
            network: props.network,
            account: props.account,
            submitTransaction: props.submitTransaction,
          }}
          feeSchedule={feeSchedule}
        />
      )}
      {type === TOKEN_OFFERS && (
        <TokenOffers
          network={props.network}
          account={props.account}
          submitTransaction={props.submitTransaction}
        />
      )}
      {type === COLLECTION_OFFERS && (
        <CollectionOffers
          network={props.network}
          account={props.account}
          submitTransaction={props.submitTransaction}
        />
      )}
    </EasyBorder>
  );
}

function AuctionListingManagement(props: TransactionContext) {
  const MARKETPLACE_HELPER = new Helper(
    getProvider(props.network),
    MODULE_ADDRESS,
  );
  const [listingAddress, setListingAddress] = useState<string>("");
  const [bidAmount, setBidAmount] = useState<bigint>(BigInt(0));

  const completeAuction = async () => {
    // Ensure you're logged in
    if (!props.account || !listingAddress) return [];
    const payload = MARKETPLACE_HELPER.completeAuctionListing(listingAddress);
    return runTransaction(props, payload);
  };

  const bidAuction = async () => {
    // Ensure you're logged in
    if (!props.account || !listingAddress) return [];
    const payload = MARKETPLACE_HELPER.bidAuctionListing(
      listingAddress,
      bidAmount,
    );
    return runTransaction(props, payload);
  };

  const buyNowAuction = async () => {
    // Ensure you're logged in
    if (!props.account || !listingAddress) return [];
    const payload = MARKETPLACE_HELPER.purchaseListing(listingAddress);
    return runTransaction(props, payload);
  };

  return (
    <>
      <Row align="middle">
        <h3>Auction Bids and Completion</h3>
      </Row>
      <Row align="middle">
        <Col span={2}>
          <p>Listing address: </p>
        </Col>
        <Col flex={"auto"}>
          <Input
            onChange={(event) => {
              onStringChange(event, setListingAddress);
            }}
            style={{ width: "calc(100% - 60px)" }}
            placeholder="Listing Address"
            size="large"
            defaultValue={""}
          />
        </Col>
      </Row>
      <Row align="middle">
        <Col span={2}>
          <p>Bid amount: </p>
        </Col>
        <Col flex={"auto"}>
          <Input
            onChange={(event) => {
              onBigIntChange(event, setBidAmount);
            }}
            style={{ width: "calc(100% - 60px)" }}
            placeholder="Bid amount"
            size="large"
            defaultValue={0}
          />
        </Col>
      </Row>
      <Row align="middle">
        <Col span={2} offset={2}>
          <Button
            onClick={() => bidAuction()}
            type="primary"
            style={{ height: "40px", backgroundColor: "#3f67ff" }}
          >
            Buy Listing
          </Button>
        </Col>
        <Col span={2} offset={2}>
          <Button
            onClick={() => buyNowAuction()}
            type="primary"
            style={{ height: "40px", backgroundColor: "#3f67ff" }}
          >
            Buy Listing
          </Button>
        </Col>
        <Col span={2} offset={2}>
          <Button
            onClick={() => completeAuction()}
            type="primary"
            style={{ height: "40px", backgroundColor: "#3f67ff" }}
          >
            Cancel Listing
          </Button>
        </Col>
      </Row>
    </>
  );
}

function ExtractTokenV1(props: TransactionContext) {
  const MARKETPLACE_HELPER = new Helper(
    getProvider(props.network),
    MODULE_ADDRESS,
  );
  const [objectAddress, setObjectAddress] = useState<string>("");

  const extractToken = async () => {
    // Ensure you're logged in
    if (!props.account || !objectAddress) return [];
    const payload = await MARKETPLACE_HELPER.extract_tokenv1(objectAddress);
    return runTransaction(props, payload);
  };

  return (
    <>
      <Row align="middle">
        <h3>Unwrap TokenV1</h3>
      </Row>
      <Row align="middle">
        <Col span={4}>
          <p>Token V1 wrapper object address: </p>
        </Col>
        <Col flex={"auto"}>
          <Input
            onChange={(event) => {
              onStringChange(event, setObjectAddress);
            }}
            style={{ width: "calc(100% - 60px)" }}
            placeholder="Token V1 wrapper object address"
            size="large"
            defaultValue={""}
          />
        </Col>
      </Row>
      <Row align="middle">
        <Col span={2} offset={4}>
          <Button
            onClick={() => extractToken()}
            type="primary"
            style={{ height: "40px", backgroundColor: "#3f67ff" }}
          >
            Extract token v1
          </Button>
        </Col>
      </Row>
    </>
  );
}

function Listings(props: { ctx: TransactionContext; feeSchedule: string }) {
  const MARKETPLACE_HELPER = new Helper(
    getProvider(props.ctx.network),
    MODULE_ADDRESS,
  );
  const [listings, setListings] = useState<Array<Listing>>();
  const [listingsError, setListingsError] = useState<string>();

  useEffect(() => {
    loadListings();
  }, [props.ctx.account, props.feeSchedule]);

  const loadListings = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const listings = await MARKETPLACE_HELPER.getListings(
        MODULE_ADDRESS,
        props.feeSchedule,
      );
      for (const listing of listings) {
        // eslint-disable-next-line no-await-in-loop
        listing.token_uri = await ensureImageUri(listing.token_uri);
      }
      setListingsError("");
      setListings(listings);
    } catch (error: any) {
      setListingsError(`Failed to load listings ${error}`);
      setListings([]);
    }
  };

  const items: CollapseProps["items"] = [
    {
      key: "1",
      label: "Manual Fixed Listing purchase",
      children: <ListingActions ctx={props.ctx} />,
    },
    {
      key: "2",
      label: "Manual Auction Listing actions",
      children: <AuctionActions ctx={props.ctx} />,
    },
  ];

  return (
    <>
      <Row align="middle">
        <h3>Listings</h3>
      </Row>
      <Row align="middle">
        <Col span={8}>
          {!listingsError &&
            listings?.map((listing) => (
              <ListingView listing={listing} ctx={props.ctx} />
            ))}
          {listingsError && <Alert type="error" message={listingsError} />}
        </Col>
      </Row>
      <Row align="middle">
        <Col flex={"auto"}>
          <h3>Advanced Actions</h3>
          <Collapse accordion items={items} />
        </Col>
      </Row>
    </>
  );
}

function ListingView(props: { ctx: TransactionContext; listing: Listing }) {
  const MARKETPLACE_HELPER = new Helper(
    getProvider(props.ctx.network),
    MODULE_ADDRESS,
  );
  const cancelListing = async (listingAddress: string) => {
    // Ensure you're logged in
    if (!props.ctx.account) return [];
    const payload = MARKETPLACE_HELPER.endFixedPriceListing(listingAddress);
    return runTransaction(props.ctx, payload);
  };

  const purchaseListing = async (listingAddress: string) => {
    // Ensure you're logged in
    if (!props.ctx.account) return [];
    const payload = MARKETPLACE_HELPER.purchaseListing(listingAddress);
    return runTransaction(props.ctx, payload);
  };

  return (
    <Row align="middle">
      <Col>
        <Tooltip
          placement="right"
          title={`${props.listing.collection_name} - ${props.listing.token_name} - ${props.listing.token_standard}
                | Sold
                by ${props.listing.seller}`}
        >
          <Image
            width={100}
            src={props.listing.token_uri}
            alt={props.listing.token_name}
          />
        </Tooltip>
      </Col>
      <Col>
        <Button
          onClick={() => purchaseListing(props.listing.listing_id)}
          type="primary"
          style={{ height: "40px", backgroundColor: "#3f67ff" }}
        >
          Buy now for {props.listing.price / 100000000} APT
        </Button>
      </Col>
      <Col>
        {props.listing.seller === props.ctx.account?.address && (
          <Button
            onClick={() => cancelListing(props.listing.listing_id)}
            type="primary"
            style={{ height: "40px", backgroundColor: "#3f67ff" }}
          >
            Cancel listing
          </Button>
        )}
      </Col>
    </Row>
  );
}

function ListingActions(props: { ctx: TransactionContext }) {
  const [listingId, setListingId] = useState<string>("");
  const MARKETPLACE_HELPER = new Helper(
    getProvider(props.ctx.network),
    MODULE_ADDRESS,
  );
  const cancelListing = async (listingAddress: string) => {
    // Ensure you're logged in
    if (!props.ctx.account) return [];
    const payload = MARKETPLACE_HELPER.endFixedPriceListing(listingAddress);
    return runTransaction(props.ctx, payload);
  };

  const purchaseListing = async (listingAddress: string) => {
    // Ensure you're logged in
    if (!props.ctx.account) return [];
    const payload = MARKETPLACE_HELPER.purchaseListing(listingAddress);
    return runTransaction(props.ctx, payload);
  };
  return (
    <Row align="middle">
      <Col>
        <Input
          onChange={(event) => {
            onStringChange(event, setListingId);
          }}
          style={{ width: "calc(100% - 60px)" }}
          placeholder="ListingId"
          size="large"
          defaultValue={listingId}
        />
      </Col>
      <Col>
        <Button
          onClick={() => purchaseListing(listingId)}
          type="primary"
          style={{ height: "40px", backgroundColor: "#3f67ff" }}
        >
          Buy now
        </Button>
      </Col>
      <Col>
        {
          <Button
            onClick={() => cancelListing(listingId)}
            type="primary"
            style={{ height: "40px", backgroundColor: "#3f67ff" }}
          >
            Cancel listing
          </Button>
        }
      </Col>
    </Row>
  );
}

function AuctionListings(props: {
  ctx: TransactionContext;
  feeSchedule: string;
}) {
  const MARKETPLACE_HELPER = new Helper(
    getProvider(props.ctx.network),
    MODULE_ADDRESS,
  );
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [listings, setListings] = useState<
    {
      buy_it_now_price: number | null;
      starting_bid_price: number;
      current_bid_price: number | null;
      current_bidder: string | null;
      expiration_time: string;
      listing_id: string;
      creator_address: string;
      collection_name: string;
      collection_id: string;
      token_data_id: string;
      token_name: string;
      token_uri: string;
      token_amount: number;
      seller: string;
      contract_address: string;
      fee_schedule_id: string;
    }[]
  >();
  const [listingsError, setListingsError] = useState<string>();

  useEffect(() => {
    loadListings();
  }, [props.ctx.account, props.feeSchedule]);

  const loadListings = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const listings = await MARKETPLACE_HELPER.getAuctions(
        MODULE_ADDRESS,
        props.feeSchedule,
      );
      const parsed = [];
      for (const listing of listings) {
        parsed.push({
          buy_it_now_price: listing.buy_it_now_price,
          starting_bid_price: listing.starting_bid_price,
          current_bid_price: listing.current_bid_price,
          current_bidder: listing.current_bidder,
          expiration_time: listing.expiration_time,
          listing_id: listing.listing_id,
          creator_address:
            listing.current_token_data.current_collection.creator_address,
          collection_name:
            listing.current_token_data.current_collection.collection_name,
          collection_id: listing.current_token_data.collection_id,
          token_data_id: listing.current_token_data.token_data_id,
          token_name: listing.current_token_data.token_name,
          // eslint-disable-next-line no-await-in-loop
          token_uri: await ensureImageUri(
            listing.current_token_data?.token_uri,
          ),
          token_amount: listing.token_amount,
          seller: listing.seller,
          contract_address: listing.contract_address,
          fee_schedule_id: listing.fee_schedule_id,
        });
      }
      setListingsError("");
      setListings(parsed);
    } catch (error: any) {
      setListingsError(`Failed to load listings ${listings}`);
      setListings([]);
    }
  };

  const cancelListing = async (listingAddress: string) => {
    // Ensure you're logged in
    if (!props.ctx.account) return [];
    const payload = MARKETPLACE_HELPER.endFixedPriceListing(listingAddress);
    return runTransaction(props.ctx, payload);
  };

  const purchaseListing = async (listingAddress: string) => {
    // Ensure you're logged in
    if (!props.ctx.account) return [];
    const payload = MARKETPLACE_HELPER.purchaseListing(listingAddress);
    return runTransaction(props.ctx, payload);
  };
  const bidListing = async (listingAddress: string) => {
    // Ensure you're logged in
    if (!props.ctx.account) return [];
    const payload = MARKETPLACE_HELPER.bidAuctionListing(
      listingAddress,
      BigInt(bidAmount),
    );
    return runTransaction(props.ctx, payload);
  };

  return (
    <>
      <Row align="middle">
        <h3>Auctions</h3>
      </Row>
      <Row align="middle">
        <Col span={2} offset={4}>
          <Button
            onClick={() => loadListings()}
            type="primary"
            style={{ height: "40px", backgroundColor: "#3f67ff" }}
          >
            Load Listings
          </Button>
        </Col>
      </Row>
      <Row align="middle">
        <Col span={8}>
          {!listingsError && (
            <ol>
              {listings?.map(
                ({
                  starting_bid_price,
                  current_bid_price,
                  listing_id,
                  token_name,
                  token_uri,
                  seller,
                }) => (
                  <li>
                    <Row align="middle">
                      <Col>
                        <Tooltip placement="right" title={""}>
                          <b>Listing {listing_id}</b> - {token_name} -{" "}
                          {toApt(current_bid_price ?? starting_bid_price)} APT |
                          Sold by {seller}
                          <Image width={50} src={token_uri} alt={"img"} />
                        </Tooltip>
                      </Col>
                      <Col>
                        <Input
                          onChange={(event) => {
                            onNumberChange(event, setBidAmount);
                          }}
                          style={{ width: "calc(100% - 60px)" }}
                          placeholder="BidAmount"
                          size="large"
                          defaultValue={bidAmount}
                        />
                        <Button
                          onClick={() => bidListing(listing_id)}
                          type="primary"
                          style={{ height: "40px", backgroundColor: "#3f67ff" }}
                        >
                          Buy now
                        </Button>
                      </Col>
                      <Col>
                        <Button
                          onClick={() => purchaseListing(listing_id)}
                          type="primary"
                          style={{ height: "40px", backgroundColor: "#3f67ff" }}
                        >
                          Buy now
                        </Button>
                      </Col>
                      <Col>
                        {seller === props.ctx.account?.address && (
                          <Button
                            onClick={() => cancelListing(listing_id)}
                            type="primary"
                            style={{
                              height: "40px",
                              backgroundColor: "#3f67ff",
                            }}
                          >
                            Cancel listing
                          </Button>
                        )}
                      </Col>
                    </Row>
                  </li>
                ),
              )}
            </ol>
          )}
          {listingsError && <Alert type="error" message={listingsError} />}
        </Col>
      </Row>
    </>
  );
}

function AuctionActions(props: { ctx: TransactionContext }) {
  const [listingId, setListingId] = useState<string>("");
  const [bidAmount, setBidAmount] = useState<bigint>(BigInt(0));
  const MARKETPLACE_HELPER = new Helper(
    getProvider(props.ctx.network),
    MODULE_ADDRESS,
  );

  // eslint-disable-next-line @typescript-eslint/no-shadow
  const bidListing = async (listingAddress: string, bidAmount: bigint) => {
    // Ensure you're logged in
    if (!props.ctx.account) return [];
    const payload = MARKETPLACE_HELPER.bidAuctionListing(
      listingAddress,
      bidAmount,
    );
    return runTransaction(props.ctx, payload);
  };

  const buyNowListing = async (listingAddress: string) => {
    // Ensure you're logged in
    if (!props.ctx.account) return [];
    const payload = MARKETPLACE_HELPER.purchaseListing(listingAddress);
    return runTransaction(props.ctx, payload);
  };
  const completeListing = async (listingAddress: string) => {
    // Ensure you're logged in
    if (!props.ctx.account) return [];
    const payload = MARKETPLACE_HELPER.completeAuctionListing(listingAddress);
    return runTransaction(props.ctx, payload);
  };
  return (
    <>
      <Row align="middle">
        <Col>
          <Input
            onChange={(event) => {
              onStringChange(event, setListingId);
            }}
            style={{ width: "calc(100% - 60px)" }}
            placeholder="ListingId"
            size="large"
            defaultValue={listingId}
          />
        </Col>
        <Row align="middle">
          <Col span={6}>
            <p>Bid amount: </p>
          </Col>
          <Col flex={"auto"}>
            <Input
              onChange={(event) => {
                onBigIntChange(event, setBidAmount);
              }}
              style={{ width: "calc(100% - 60px)" }}
              placeholder="Bid amount"
              size="large"
              defaultValue={0}
            />
          </Col>
        </Row>
        <Col>
          <Button
            onClick={() => bidListing(listingId, bidAmount)}
            type="primary"
            style={{ height: "40px", backgroundColor: "#3f67ff" }}
          >
            Bid
          </Button>
        </Col>
        <Col>
          <Button
            onClick={() => buyNowListing(listingId)}
            type="primary"
            style={{ height: "40px", backgroundColor: "#3f67ff" }}
          >
            Buy now
          </Button>
        </Col>
        <Col>
          {
            <Button
              onClick={() => completeListing(listingId)}
              type="primary"
              style={{ height: "40px", backgroundColor: "#3f67ff" }}
            >
              Complete Auction
            </Button>
          }
        </Col>
      </Row>
    </>
  );
}

function V2TokenOffers(props: TransactionContext) {
  const MARKETPLACE_HELPER = new Helper(
    getProvider(props.network),
    MODULE_ADDRESS,
  );
  const [tokenAddress, setTokenAddress] = useState<string>("");
  const [price, setPrice] = useState<bigint>(BigInt(DEFAULT_PRICE));
  const [expirationSecs, setExpirationSecs] = useState<bigint>(BigInt(3600));
  const feeSchedule = defaultFeeSchedule(props.network);

  const createTokenOffer = async () => {
    // Ensure you're logged in
    if (!props.account || !tokenAddress) return [];
    const expirationTime =
      BigInt(Math.floor(new Date().getTime() / 1000)) + expirationSecs;
    const payload = MARKETPLACE_HELPER.initTokenOfferForTokenv2(
      tokenAddress,
      feeSchedule,
      price,
      expirationTime,
    );
    return runTransaction(props, payload);
  };

  return (
    <>
      <Row align="middle">
        <h3>Token Offers</h3>
      </Row>
      <Row align="middle">
        <Col span={4}>
          <p>Token Address: </p>
        </Col>
        <Col flex={"auto"}>
          <Input
            onChange={(event) => {
              onStringChange(event, setTokenAddress);
            }}
            style={{ width: "calc(100% - 60px)" }}
            placeholder="TokenAddress"
            size="large"
            defaultValue={""}
          />
        </Col>
      </Row>
      <Row align="middle">
        <Col span={4}>
          <p>Price: </p>
        </Col>
        <Col flex={"auto"}>
          <Input
            onChange={(event) => {
              onBigIntChange(event, setPrice);
            }}
            style={{ width: "calc(100% - 60px)" }}
            placeholder="Price"
            size="large"
            defaultValue={DEFAULT_PRICE}
          />
        </Col>
      </Row>
      <Row align="middle">
        <Col span={4}>
          <p>Expiration secs: </p>
        </Col>
        <Col flex={"auto"}>
          <Input
            onChange={(event) => {
              onBigIntChange(event, setExpirationSecs);
            }}
            style={{ width: "calc(100% - 60px)" }}
            placeholder="Expiration secs"
            size="large"
            defaultValue={3600}
          />
        </Col>
      </Row>
      <Row align="middle">
        <Col span={2} offset={4}>
          <Button
            onClick={() => createTokenOffer()}
            type="primary"
            style={{ height: "40px", backgroundColor: "#3f67ff" }}
          >
            Create Token offer
          </Button>
        </Col>
      </Row>
    </>
  );
}

function V2CollectionOffers(props: TransactionContext) {
  const MARKETPLACE_HELPER = new Helper(
    getProvider(props.network),
    MODULE_ADDRESS,
  );
  const [collectionAddress, setCollectionAddress] = useState<string>("");
  const feeSchedule = defaultFeeSchedule(props.network);
  const [price, setPrice] = useState<bigint>(BigInt(DEFAULT_PRICE));
  const [amount, setAmount] = useState<bigint>(BigInt(1));
  const [expirationSecs, setExpirationSecs] = useState<bigint>(BigInt(3600));

  const createCollectionOffer = async () => {
    // Ensure you're logged in
    if (!props.account || !collectionAddress) return [];
    const expirationTime =
      BigInt(Math.floor(new Date().getTime() / 1000)) + expirationSecs;
    const payload = MARKETPLACE_HELPER.initCollectionOfferForTokenv2(
      collectionAddress,
      feeSchedule,
      price,
      amount,
      expirationTime,
    );
    return runTransaction(props, payload);
  };

  return (
    <>
      <Row align="middle">
        <h3>Collection Offers</h3>
      </Row>
      <Row align="middle">
        <Col span={4}>
          <p>Collection Address: </p>
        </Col>
        <Col flex={"auto"}>
          <Input
            onChange={(event) => {
              onStringChange(event, setCollectionAddress);
            }}
            style={{ width: "calc(100% - 60px)" }}
            placeholder="CollectionAddress"
            size="large"
            defaultValue={""}
          />
        </Col>
      </Row>
      <Row align="middle">
        <Col span={4}>
          <p>Price: </p>
        </Col>
        <Col flex={"auto"}>
          <Input
            onChange={(event) => {
              onBigIntChange(event, setPrice);
            }}
            style={{ width: "calc(100% - 60px)" }}
            placeholder="Price"
            size="large"
            defaultValue={DEFAULT_PRICE}
          />
        </Col>
      </Row>
      <Row align="middle">
        <Col span={4}>
          <p>Expiration secs: </p>
        </Col>
        <Col flex={"auto"}>
          <Input
            onChange={(event) => {
              onBigIntChange(event, setExpirationSecs);
            }}
            style={{ width: "calc(100% - 60px)" }}
            placeholder="Expiration secs"
            size="large"
            defaultValue={3600}
          />
        </Col>
      </Row>
      <Row align="middle">
        <Col span={4}>
          <p>Amount: </p>
        </Col>
        <Col flex={"auto"}>
          <Input
            onChange={(event) => {
              onBigIntChange(event, setAmount);
            }}
            style={{ width: "calc(100% - 60px)" }}
            placeholder="amount"
            size="large"
            defaultValue={1}
          />
        </Col>
      </Row>
      <Row align="middle">
        <Col span={2} offset={4}>
          <Button
            onClick={() => createCollectionOffer()}
            type="primary"
            style={{ height: "40px", backgroundColor: "#3f67ff" }}
          >
            Create Collection offer
          </Button>
        </Col>
      </Row>
    </>
  );
}

function TokenOffers(props: TransactionContext) {
  const MARKETPLACE_HELPER = new Helper(
    getProvider(props.network),
    MODULE_ADDRESS,
  );
  const [tokenOffers, setTokenOffers] = useState<Array<TokenOffer>>();
  const [tokenAddress, setTokenAddress] = useState<string>("");

  const loadTokenOffers = async () => {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const tokenOffers = await MARKETPLACE_HELPER.getTokenOffers(
      MODULE_ADDRESS,
      "example_v2_marketplace",
      tokenAddress,
    );
    setTokenOffers(tokenOffers);
  };

  return (
    <>
      <Row align="middle">
        <h3>Token Offers</h3>
      </Row>
      <Row align="middle">
        <Col span={4}>
          <p>Token Address: </p>
        </Col>
        <Col flex={"auto"}>
          <Input
            onChange={(event) => {
              onStringChange(event, setTokenAddress);
            }}
            style={{ width: "calc(100% - 60px)" }}
            placeholder="TokenAddress"
            size="large"
            defaultValue={""}
          />
        </Col>
      </Row>
      <Row align="middle">
        <Col span={2} offset={4}>
          <Button
            onClick={() => loadTokenOffers()}
            type="primary"
            style={{ height: "40px", backgroundColor: "#3f67ff" }}
          >
            Load Token offers
          </Button>
        </Col>
      </Row>
      <Row align="middle">
        <Col>{tokenOffers?.map((offer) => <TokenOfferV2 offer={offer} />)}</Col>
      </Row>
    </>
  );
}

function TokenOfferV2(props: { offer: TokenOffer }) {
  // TODO" Use collection name
  // TODO: Add accept button
  // TODO: Add cancel button
  return (
    <Row align="middle">
      <Col>
        <Tooltip
          placement="right"
          title={`${props.offer.collection_name} - ${props.offer.token_name}
                | Offered ${props.offer.price} by ${props.offer.buyer}`}
        >
          <Image
            width={100}
            src={props.offer.token_uri}
            alt={props.offer.token_name}
          />
        </Tooltip>
      </Col>
    </Row>
  );
}

function CollectionOffers(props: TransactionContext) {
  const MARKETPLACE_HELPER = new Helper(
    getProvider(props.network),
    MODULE_ADDRESS,
  );
  const [collectionOffers, setCollectionOffers] = useState<
    {
      buyer: string;
      collection_id: string;
      collection_offer_id: string;
      expiration_time: number;
      current_collection: { collection_name: string; uri: string };
      item_price: number;
      remaining_token_amount: number;
    }[]
  >();
  const [collectionAddress, setCollectionAddress] = useState<string>("");
  const [tokenAddress, setTokenAddress] = useState<string>("");

  const loadCollectionOffers = async () => {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const collectionOffers = await MARKETPLACE_HELPER.getCollectionOffers(
      MODULE_ADDRESS,
      "example_v2_marketplace",
      collectionAddress,
      false,
    );
    return setCollectionOffers(collectionOffers);
  };

  const fillCollectionOffer = async (offerAddress: string) => {
    // Ensure you're logged in
    if (!props.account || !offerAddress) return [];
    const payload = MARKETPLACE_HELPER.fillCollectionOfferForTokenv2(
      offerAddress,
      tokenAddress,
    );
    return runTransaction(props, payload);
  };

  const cancelCollectionOffer = async (offerAddress: string) => {
    // Ensure you're logged in
    if (!props.account || !offerAddress) return [];
    const payload = MARKETPLACE_HELPER.cancelCollectionOffer(offerAddress);
    return runTransaction(props, payload);
  };

  return (
    <>
      <Row align="middle">
        <h3>Collection Offers</h3>
      </Row>
      <Row align="middle">
        <Col span={4}>
          <p>Collection Address: </p>
        </Col>
        <Col flex={"auto"}>
          <Input
            onChange={(event) => {
              onStringChange(event, setCollectionAddress);
            }}
            style={{ width: "calc(100% - 60px)" }}
            placeholder="CollectionAddress"
            size="large"
            defaultValue={""}
          />
        </Col>
      </Row>
      <Row align="middle">
        <Col span={4}>
          <p>Token Address to sell: </p>
        </Col>
        <Col flex={"auto"}>
          <Input
            onChange={(event) => {
              onStringChange(event, setTokenAddress);
            }}
            style={{ width: "calc(100% - 60px)" }}
            placeholder="TokenAddress"
            size="large"
            defaultValue={""}
          />
        </Col>
      </Row>
      <Row align="middle">
        <Col span={2} offset={4}>
          <Button
            onClick={() => loadCollectionOffers()}
            type="primary"
            style={{ height: "40px", backgroundColor: "#3f67ff" }}
          >
            Load Collection Offers
          </Button>
        </Col>
      </Row>
      <Row align="middle">
        <Col span={8}>
          <ol>
            {collectionOffers?.map(
              ({
                buyer,
                current_collection,
                collection_offer_id,
                expiration_time,
                item_price,
                remaining_token_amount,
              }) => (
                <li>
                  <Row align="middle">
                    <Col>
                      <Tooltip placement="right" title={""}>
                        <Image
                          width={100}
                          src={current_collection.uri}
                          alt={current_collection.collection_name}
                        ></Image>
                        <b>Offer {collection_offer_id}</b> -{" "}
                        {current_collection.collection_name} -{" "}
                        {item_price / 100000000} APT | Requested by {buyer},
                        expires at {expiration_time}, {remaining_token_amount}{" "}
                        offers remaining
                      </Tooltip>
                    </Col>
                    <Col>
                      <Button
                        onClick={() => fillCollectionOffer(collection_offer_id)}
                        type="primary"
                        style={{ height: "40px", backgroundColor: "#3f67ff" }}
                      >
                        Sell now
                      </Button>
                    </Col>
                    <Col>
                      {buyer === props.account?.address && (
                        <Button
                          onClick={() =>
                            cancelCollectionOffer(collection_offer_id)
                          }
                          type="primary"
                          style={{ height: "40px", backgroundColor: "#3f67ff" }}
                        >
                          Cancel listing
                        </Button>
                      )}
                    </Col>
                  </Row>
                </li>
              ),
            )}
          </ol>
          {JSON.stringify(collectionOffers)}
        </Col>
      </Row>
    </>
  );
}

export const toApt = (num: string | number): number => Number(num) / APT;

export default Marketplace;
