import { useWeb3Contract } from "react-moralis"
import abiNFT from "../constants/abiNFT.json"
import contractAddressesNFT from "../constants/contractAddressesNFT.json"
import { useMoralis } from "react-moralis"
import { useEffect, useState } from "react"
import { ethers } from "ethers"
import Modal from "@/components/Modal"
import Image from "next/image"
import { useNotification } from "web3uikit"

export default function CoinMint({ initiateNftChecker }) {
    //THIS SCRIPT IS MADE FOR GAMECOIN NFT MINT FUNCTION
    const { isWeb3Enabled, chainId: chainIdHex, runContractFunction, account, web3 } = useMoralis()
    const chainId = parseInt(chainIdHex).toString()
    const gamecoinAddress =
        chainId in contractAddressesNFT ? contractAddressesNFT[chainId][0] : null

    const { runContractFunction: nftMint } = useWeb3Contract({
        abi: abiNFT,
        contractAddress: gamecoinAddress,
        functionName: "nftMint",
        msgValue: ethers.utils.parseEther("0.05")
    })

    const dispatch = useNotification()

    const handleSuccess = async function(tx) {
        await tx.wait(1)
        handleNewNotification(tx)
        initiateNftChecker(true)
    }

    const handleNewNotification = function() {
        dispatch({
            type: "info",
            message: "Transaction Complete!",
            title: "Tx Notification",
            position: "topR",
            icon: "bell"
        })
    }

    return (
        <div className="items-center justify-center">
            <button
                className="bg-amber-400 hover:bg-amber-600 text-white font-bold py-4 px-20 mt-40 text-lg rounded"
                onClick={async function() {
                    await nftMint({
                        onSuccess: handleSuccess,
                        onError: error => console.log(error)
                    })
                }}
            >
                Mint GAMECOIN To start using the dapp
            </button>
        </div>
    )
}
