import React, { useEffect, useState } from 'react';
import { usePayloadContext } from '../providers/PayloadProvider';
import { Image } from './Image';

export function CollectionHeader ({collectionId}) {
    const {marketplaceHelper} = usePayloadContext();
    const [collection, setCollection] = useState(null)
    useEffect(() => {
        if (marketplaceHelper) {
            const initCollections = async () => {
                const collectionData = await marketplaceHelper.getCollectionData(collectionId);
                console.log({collectionData})
                setCollection(collectionData)
            }
            initCollections();
        }
        
    }, [marketplaceHelper])
    if (!collection) return null;
    return (
        <div className='header-container'>
            <div >
                <Image uri={collection.uri} className='large-image'/>
            </div>
            <div className='header-text-container'>
                <h2>{collection.collection_name}</h2>
                <div>Created by <span><a href={`https://explorer.aptoslabs.com/account/${collection.creator_address}`} target='_blank'>{collection.creator_address}</a></span></div>
                <h5>{collection.description}</h5>
            </div>
        </div>
    );
}