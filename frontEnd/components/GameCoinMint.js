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

    // NOTIFICATIONS
    const dispatch = useNotification()

    const handleNewNotification = function() {
        dispatch({
            type: "info",
            message: "Transaction Complete!",
            title: "Tx Notification",
            position: "topR",
            icon: "bell"
        })
    }

    /////////////////////////////////////
    // ETHERS CONTRACT INTERACTIONS

    // Deposit function
    const nftMint = async () => {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const signer = provider.getSigner()
            const contract = new ethers.Contract(gamecoinAddress, abiNFT, signer)

            // Estimate gas limit for the transaction
            const estimatedGas = await contract.estimateGas.nftMint({
                value: ethers.utils.parseEther("0.05")
            })
            const gasLimit = estimatedGas
                .mul(ethers.BigNumber.from("110"))
                .div(ethers.BigNumber.from("100")) // Add a buffer

            // Get current gas price
            const gasPrice = await provider.getGasPrice()

            // Send the transaction with the estimated gas limit and current gas price
            const transaction = await contract.nftMint({
                value: ethers.utils.parseEther("0.05"),
                gasLimit,
                gasPrice
            })

            // Wait for the transaction to be mined
            const receipt = await transaction.wait()
            console.log("Transaction successful!")
            handleNewNotification(receipt)

            // Logic if success!
            if (receipt.status === 1) {
                initiateNftChecker(true)
            }
        } catch (error) {
            console.error("Transaction failed:", error)
        }
    }

    return (
        <div className="items-center justify-center">
            <button
                className="bg-amber-400 hover:bg-amber-600 text-white font-bold py-4 px-20 mt-40 text-lg rounded transition duration-200"
                onClick={nftMint}
            >
                Mint GAMECOIN To start using the dapp
            </button>
        </div>
    )
}
