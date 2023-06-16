module deploy_account::test_token {

    use aptos_token::token as token_v1;
    use std::string::String;
    use std::string;
    use std::signer;
    use aptos_token_objects::aptos_token as token_v2;

    // Dummy URIs from the Aptos Foundation logos TODO: Replace with different logos
    const COLLECTION_URI: vector<u8> = b"https://aptosfoundation.org/brandbook/logomark/PNG/Aptos_mark_WHT.png";
    const TOKEN_URI: vector<u8> = b"https://aptosfoundation.org/brandbook/logomark/PNG/Aptos_mark_BLK.png";

    /// A simple V1 collection, only need the name
    entry fun create_v1_collection(account: &signer, collection_name: String) {
        token_v1::create_collection_script(
            account,
            collection_name,
            string::utf8(b"Test v1 collection"),
            string::utf8(COLLECTION_URI),
            0, // Unlimited collection size
            vector[true, true, true]
        );
    }

    /// A simple V1 token, only need the collection name and the token name
    entry fun create_v1_nft(account: &signer, collection_name: String, token_name: String) {
        token_v1::create_token_script(
            account,
            collection_name,
            token_name,
            string::utf8(b"Test v1 token"),
            1,
            1,
            string::utf8(TOKEN_URI),
            signer::address_of(account),
            100,
            1, // 1% royalties for testing purposes
            vector[true, true, true, true, true],
            vector[],
            vector[],
            vector[]
        )
    }

    /// A simple V2 collection, only need the name
    entry fun create_v2_collection(account: &signer, collection_name: String) {
        token_v2::create_collection(
            account,
            string::utf8(b"Test v2 collection"),
            10000,
            collection_name,
            string::utf8(COLLECTION_URI),
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            true,
            1,
            100,
        );
    }

    /// A simple V2 token, only need the collection name and the token name
    entry fun create_v2_nft(account: &signer, collection_name: String, token_name: String) {
        token_v2::mint(
            account,
            collection_name,
            string::utf8(b"Test v2 token"),
            token_name,
            string::utf8(TOKEN_URI),
            vector[],
            vector[],
            vector[]
        )
    }

    /// A simple V2 soulbound token
    entry fun create_v2_soulbound_nft(
        account: &signer,
        collection_name: String,
        token_name: String,
        destination: address
    ) {
        token_v2::mint_soul_bound(
            account,
            collection_name,
            string::utf8(b"Test v2 soulbound token"),
            token_name,
            string::utf8(TOKEN_URI),
            vector[],
            vector[],
            vector[],
            destination
        )
    }
}