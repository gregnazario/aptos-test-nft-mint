import React from "react";
import { AptosLogo } from "../icons/AptosLogo";
import { ListingActions } from "./ListingActions";
import { Image } from "./Image";
import { Link } from "react-router-dom";

export function ListingHeader ({listing}) {
    const {token_uri, token_name, description, token_data_id} = listing.current_token_data;

    console.log(listing)
    if (!listing) return null;
    return (
        <div >
            <div className='header-container'>
                <Image uri={token_uri} className='large-image' tokenId={token_data_id}/>
                <div className='header-text-container'>
                  <Link to={`/collection/${listing.collection_id}`} style={{ textDecoration: "none", color: "black" }}>
                    <h4>{token_name}</h4>
                  </Link>
                    <h2>{token_name}</h2>
                    <div>Owned by <span>
                      <a href={`https://explorer.aptoslabs.com/account/${listing.seller}`} target='_blank'>{listing.seller}</a>
                    </span></div>
                    <h5>{description}</h5>
                </div>
            </div>
            <div className="trending-collections-feed-card--text--details">
              <div className="trending-collections-feed-card--text--detail">
                <span className="label">Price: </span>
                <div className="price-container">
                  <AptosLogo />
                  <span className="left-space">
                    {listing.price/1E8}
                  </span>
                </div>
              </div>
              <div className="trending-collections-feed-card--text--detail">
                <span className="label">Marketplace: </span>
                <span>{listing.marketplace}</span>
              </div>
              <ListingActions listing={listing}/>
          </div>
        </div>
    );
}