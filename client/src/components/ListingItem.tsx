import React from "react";
import { NavLink } from "react-router-dom";
import { AptosLogo } from "../icons/AptosLogo";
import { Image } from "./Image";

export function ListingItem({current_token_data, marketplace, price, listing_id}) {
  const {token_name, token_uri, token_data_id} = current_token_data;

  return (
    <NavLink to={`/listing/${listing_id}`} style={{
      textDecoration: "none",
      color: "black",
    }}>
      <div className="card link">
        <div className="trending-collections-feed-card--media">
          <div className="CollectionMedia_collectionMediaStyles__NR00q">
            <div className="collection-media">
              <Image uri={token_uri} tokenId={token_data_id} />
            </div>
          </div>
        </div>
        <div className="trending-collections-feed-card--text">
          <div className="trending-collections-feed-card--text--title">
            <div className="CollectionTitle_collectionTitleStyles__LWwV6">
              <div className="collection-title-container">
                <div className="collection-title">{token_name}</div>
              </div>
            </div>
          </div>
          <div className="trending-collections-feed-card--text--details">
              <div className="trending-collections-feed-card--text--detail">
                <span className="label">Price: </span>
                <div className="price-container">
                  <AptosLogo />
                  <span className="left-space">
                    {price/1E8}
                  </span>
                </div>
              </div>
              <div className="trending-collections-feed-card--text--detail">
                <span className="label">Marketplace: </span>
                <span>{marketplace}</span>
              </div>
          </div>
        </div>
      </div>
    </NavLink>
  );
}
