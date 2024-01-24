import React, { useEffect, useState } from "react";
import { usePayloadContext } from "../providers/PayloadProvider";
import { CollectionItem } from "./CollectionItem";
import { useNetworkContext } from "../providers/NetworkProvider";

export function CollectionList() {
    const {network} = useNetworkContext()
    const {marketplaceHelper} = usePayloadContext();
    const [collections, setCollections] = useState([])
    useEffect(() => {
        const initCollections = async () => {
            const collectionData = await marketplaceHelper.getTopCollections();
            setCollections(collectionData);
        }
        initCollections();
    }, [network])

    return (
        collections.map(collection => (
            <CollectionItem {...collection} key={collection.collection_id}/>
        ))
    );
}