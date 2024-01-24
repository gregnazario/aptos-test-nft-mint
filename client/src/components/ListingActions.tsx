import React from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useNavigate } from "react-router";
import { usePayloadContext } from "../providers/PayloadProvider"
import { AptosLogo } from "../icons/AptosLogo";
import { useTransactionContext } from "../providers/TransactionProvider";

export function ListingActions({ listing }) {
    const { account } = useWallet();
    const navigate = useNavigate();
    const {buildEndFixedPriceListingPayload, buildPurchaseListingPayload} = usePayloadContext();
    const {runTransaction} = useTransactionContext()
    useWallet();
    const cancelListing = async () => {
        // Ensure you're logged in
        if (!account) return;
        const payload = buildEndFixedPriceListingPayload(listing.listing_id);
        const result = await runTransaction(payload);
        if (!result.error) {
            navigate(`/wallet/${account?.address}`);
        }
    };
    
    const purchaseListing = async () => {
    // Ensure you're logged in
    if (!account) return;
        const payload = buildPurchaseListingPayload(listing.listing_id);
        const result = await runTransaction(payload);
        if (!result.error) {
            navigate(`/wallet/${account?.address}`);
        }
    };
    return (
        <div className='action-container'>
            <div>
                <div className="trending-collections-feed-card--text--detail">
                    <h4 className="label">Current Price: </h4>
                    <div className="price-container">
                        <AptosLogo />
                        <span className="left-space">
                            {listing.price/1E8}
                        </span>
                    </div>
                </div>
                <div className='action-button' onClick={purchaseListing}>
                    <p>
                        Buy
                    </p>
                </div>
                {listing.seller === account?.address && <div className='action-button' onClick={cancelListing}>
                    <p>
                        Cancel Listing
                    </p>
                </div>}
            </div>
        </div>
    )
}