import React, { useEffect, useState } from "react"
import { lookUpImage, uint8arrayToBase64 } from "../utils/checkImage";


interface ImageProps {
    uri: string;
    className?: string
    tokenId?: string // used for getting inscription data
    alt?: string
}

export const Image = ({ uri, className, tokenId, ...otherProps}: ImageProps) => {
    const [url, setUrl] = useState(uri)
    const fetchResource = async () => {
        const resourceType = "0x52f9250619e7695127b04d02d608b32d75bce6720568b766d5d54dc1961b9649::inscriptions::InscriptionData";
        const resourceUrl = `https://fullnode.testnet.aptoslabs.com/v1/accounts/${tokenId}/resource/${resourceType}`;
        const options = {method: "GET", headers: {Accept: "application/json"}};
        
        try {
            const response = await fetch(resourceUrl, options);
            const res = await response.json();
            return res.data
        } catch (error) {
            return {error};
        }
    }
    const setLookUpImage = async () => {
        if (uri === "" && tokenId) {
            const {data} = await fetchResource();
            const base64 = uint8arrayToBase64(data);
            setUrl(base64)
        } else {
            const image = await lookUpImage(uri)
            setUrl(image)
        }
    }
    useEffect(() => {
        setLookUpImage();
    }, [])
    return (
        <img src={url} className={className} {...otherProps}/>
    )
}