import { useWeb3Contract } from "react-moralis"
import { abi, contractAddresses } from "../constants"
import { useMoralis } from "react-moralis"
import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { useNotification } from "web3uikit"
import { useRef } from "react"
require("dotenv").config()

//JOIN GAME PART
export default function JoinGame({ needToUpdateUI }) {
    //VARIABLES
    const { isWeb3Enabled, chainId: chainIdHex } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const coinflipAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null
    const [_amount, changeAmount] = useState(0)
    const [availableGames, checkAvailableGames] = useState(0)
    const inputRef = useRef(null)

    //FUNCTION TO UPDATES UI(BALANCE) in Header
    const JoinGameNeedToUpdateUI = () => {
        needToUpdateUI(true)
    }

    const dispatch = useNotification()

    useEffect(() => {
        if (isWeb3Enabled) {
        }
    }, [isWeb3Enabled])

    const handleSuccess = async function(tx) {
        await tx.wait(1)
        handleNewNotification(tx)
        JoinGameNeedToUpdateUI()
    }

    //FUNCTION THAT RETREIVES DATA FROM INPUT
    const setBetAmount = () => {
        if (inputRef.current.value > 0) {
            const amount = ethers.utils.parseEther(inputRef.current.value)
            changeAmount(parseInt(amount))
        }
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

    //GET ALL AVAILABLE GAMES
    async function updateGames() {
        allGamesBasedOnAmountEthers()
    }

    //SMART CONTRACT FUNCTIONS TO INTERACT WITH
    const { runContractFunction: allAvailableGames } = useWeb3Contract({
        abi: abi,
        contractAddress: coinflipAddress,
        functionName: "allAvailableGames",
        params: {}
    })

    const { runContractFunction: allGamesBasedOnAmount } = useWeb3Contract({
        abi: abi,
        contractAddress: coinflipAddress,
        functionName: "allGamesBasedOnAmount",
        params: { _amount: _amount.toString() }
    })

    const { runContractFunction: joinGame, isLoading, isFetching } = useWeb3Contract({
        abi: abi,
        contractAddress: coinflipAddress,
        functionName: "joinGame",
        params: { _amount: _amount.toString() }
    })

    // ETHERS CONTRACT INTERACTIONS

    const allGamesBasedOnAmountEthers = async () => {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const signer = provider.getSigner()
            const contract = new ethers.Contract(coinflipAddress, abi, signer)

            // Estimate gas limit for the transaction
            const estimatedGas = await contract.estimateGas.allGamesBasedOnAmount(
                _amount.toString()
            )
            const gasLimit = estimatedGas
                .mul(ethers.BigNumber.from("110"))
                .div(ethers.BigNumber.from("100")) // Add a buffer

            // Get current gas price
            const gasPrice = await provider.getGasPrice()

            // Send the transaction with the estimated gas limit and current gas price
            const transaction = await contract.allGamesBasedOnAmount(_amount.toString())

            // Logic if success!
            checkAvailableGames(transaction.toString())
        } catch (error) {
            console.error("Transaction failed:", error)
        }
    }

    const joinGameEthers = async () => {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const signer = provider.getSigner()
            const contract = new ethers.Contract(coinflipAddress, abi, signer)

            // Estimate gas limit for the transaction
            const estimatedGas = await contract.estimateGas.joinGame(_amount.toString())
            const gasLimit = estimatedGas
                .mul(ethers.BigNumber.from("110"))
                .div(ethers.BigNumber.from("100")) // Add a buffer

            // Get current gas price
            const gasPrice = await provider.getGasPrice()

            // Send the transaction with the estimated gas limit and current gas price
            const transaction = await contract.joinGame(_amount.toString(), {
                gasLimit,
                gasPrice
            })

            // Wait for the transaction to be mined
            const receipt = await transaction.wait()
            console.log("Transaction successful!")

            // Logic if success!
            if (receipt.status === 1) {
                JoinGameNeedToUpdateUI()
            }
        } catch (error) {
            console.error("Transaction failed:", error)
        }
    }

    return (
        <div className=" mt-8  mr-8 px-15 p-10 ml-6 border-2 border-gray-800 bg-amber-100 rounded-md">
            <div className="text-bold text-2xl  text-gray-800 font-mono text-center">
                JOIN AVAILABLE GAME!
            </div>
            {coinflipAddress ? (
                <div className="mt-5">
                    <div>
                        <label htmlFor="Amount" className="ml-1">
                            Choose AMOUNT:
                        </label>
                        <input
                            ref={inputRef}
                            type="number"
                            id="Amount"
                            name="Amount"
                            step="0.1"
                            min="0.1"
                            placeholder="0.1"
                            className="md:w-32 ml-2"
                        />
                        <button
                            className="bg-amber-400 hover:bg-amber-600 text-white font-bold py-1 px-2 text-lg rounded ml-2"
                            onClick={setBetAmount}
                        >
                            BET
                        </button>
                    </div>
                    <div className="mt-4 text-center">
                        <button
                            className="bg-amber-400 hover:bg-amber-600 text-white font-bold py-1 px-2 text-lg rounded mx-2"
                            onClick={updateGames}
                        >
                            Available Games
                        </button>
                        {availableGames}
                    </div>
                    <div className="mt-4 text-center">Symbol already given!</div>
                    <div className="text-center">
                        Amount to bet: {ethers.utils.formatEther(_amount.toString())}
                    </div>
                    <div className="mt-4 text-center">
                        <button
                            className="bg-amber-400 hover:bg-amber-600 text-white font-bold py-5 px-8 text-2xl rounded"
                            onClick={joinGameEthers}
                            disabled={isLoading || isFetching}
                        >
                            {isLoading || isFetching ? (
                                <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                            ) : (
                                <div>Join a Game</div>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div>No CoinFlip Address Detected</div>
            )}
        </div>
    )
}
