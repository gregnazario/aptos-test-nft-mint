import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { usePayloadContext } from "../providers/PayloadProvider";
import { ListingHeader } from "../components/ListingHeader";
// import { ListingActivity } from "../components/ListingActivity";

export function Listing() {
    const params = useParams();
    const {marketplaceHelper} = usePayloadContext();
    const [listing, setListing] = useState(null)
    useEffect(() => {
        if (marketplaceHelper) {
            const initListing = async () => {
                const listingsData = await marketplaceHelper.getListingData(params.listingId as string);
                console.log({listingsData})
                setListing(listingsData)
            }
            if (params.listingId) {
                initListing();
            }
        }
    }, [marketplaceHelper])

    if (!listing) return null;
    return (
        <div>
            <ListingHeader listing={listing}/>
            {/* <ListingActivity listingId={listing.listing_id}/> */}
        </div>
    );
}