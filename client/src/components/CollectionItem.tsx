import React, {useEffect, useState} from "react";
import { Link } from "react-router-dom";
import { usePayloadContext } from "../providers/PayloadProvider";
import {AptosLogo} from "../icons/AptosLogo"
import { Image } from "./Image";

export function CollectionItem({collection_id, uri, num_listings, collection_name, current_supply, token_standard, price}) {

    const [listingData, setListingData] = useState([])
    const {marketplaceHelper} = usePayloadContext();
    useEffect(() => {
        const initData = async () => {
          const listingsData = await marketplaceHelper.getCollectionsFloor(collection_id);
            setListingData(listingsData.nft_marketplace_v2_current_nft_marketplace_listings);
        }
        initData();
    }, [])
  if (listingData.length < 1) return null;
  return (
    <Link to={`/collection/${collection_id}`} style={{ textDecoration: "none", color: "black" }}>
      <div className="card">
        <div className="trending-collections-feed-card--media">
          <div className="CollectionMedia_collectionMediaStyles__NR00q">
            <div className="collection-media">
              <Image uri={uri} />
            </div>
          </div>
        </div>
        <div className="trending-collections-feed-card--text">
          <div className="trending-collections-feed-card--text--title">
            <div className="CollectionTitle_collectionTitleStyles__LWwV6">
              <div className="collection-title-container">
                <div className="collection-title">{collection_name}</div>
              </div>
              {token_standard=== "v2" ?<div className="rounded-xl bg-slate-800 px-2 py-1 text-xs">Token V2</div> : null}
            </div>
          </div>
          <div className="trending-collections-feed-card--text--details">
            <div className="trending-collections-feed-card--text--detail">
              <span className="label">Supply: </span>
              {num_listings}/{current_supply}
            </div>
            <div className="trending-collections-feed-card--text--detail">
              <span className="label">Sales: </span>
              <div className="price-container">
                <AptosLogo />
                <span className="left-space">
                  {Math.round(price/1E6)/100}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
