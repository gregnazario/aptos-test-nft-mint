import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { usePayloadContext } from "../providers/PayloadProvider";
import { ListingItem } from "../components/ListingItem";
import { CollectionHeader } from "../components/CollectionHeader";

export function CollectionFloor() {
    const params = useParams();
    const {marketplaceHelper} = usePayloadContext();
    const [listings, setListings] = useState(null)
    useEffect(() => {
        if (marketplaceHelper) {
            const initCollections = async () => {
                const listingsData = await marketplaceHelper.getCollectionsFloor(params.collectionId as string);
                setListings(listingsData)
            }
            if (params.collectionId) {
                initCollections();
            }
        }
    }, [marketplaceHelper])

    return (
        <div>
            <CollectionHeader collectionId={params.collectionId}/>
            {listings?.nft_marketplace_v2_current_nft_marketplace_listings?.slice(0,5).map(listing => (
                <ListingItem {...listing} key={listing.listing_id}/>
            ))}
        </div>
    );
}