import { useMemo } from "react";
import { Route } from "react-router";
import { BrowserRouter, Routes } from "react-router-dom";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";
import { CollectionFloor } from "./pages/CollectionFloor";
// eslint-disable-next-line import/no-cycle
import { Listing } from "./pages/Listing";
import { Wallet } from "./pages/Wallet";
import { NavBar } from "./components/Navbar";
import { TokenDetails } from "./pages/Token";
import Launchpad from "./pages/Launchpad";
import Marketplace from "./pages/Marketplace";

export function AppRoutes() {
    const wallet = useWallet()
    const network = useMemo(() => {
        if (wallet.connected) {
            return wallet.network?.name.toLowerCase() as Network ?? Network.MAINNET
        }
        return Network.MAINNET;
    }, [wallet])

    return (
    <BrowserRouter>
        <NavBar expectedNetwork={network} />
        <Routes>
            <Route index path="/" element={<Marketplace network={network} />} />
            <Route
                path="/wallet/:walletAddress"
                element={<Wallet network={network} />}
            />
            <Route
                path="/collection/:collectionId"
                element={<CollectionFloor />}
            />
            <Route
                path="/listing/:listingId"
                element={<Listing />}
            />
            <Route
                path="/token/:tokenId"
                element={<TokenDetails network={network} />}
            />
            <Route
                path="/launchpad"
                element={<Launchpad expectedNetwork={network} />}
            />
        </Routes>
    </BrowserRouter>
    )
}
