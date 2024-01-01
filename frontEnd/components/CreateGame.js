import { useWeb3Contract } from "react-moralis"
import { abi, contractAddresses } from "../constants"
import { useMoralis } from "react-moralis"
import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { useNotification } from "web3uikit"
import { useRef } from "react"
import Modal from "@/components/Modal"
require("dotenv").config()

//CREATE GAME PART
export default function CreateGame({ needToUpdateUI, changeGameId, gameId }) {
    //VARIABLES
    const { isWeb3Enabled, chainId: chainIdHex, runContractFunction, account, web3 } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const coinflipAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null
    const [_symbol, setSymbol] = useState(0)
    const [symbolName, setSymbolName] = useState("No symbol chosen")
    const [_amount, changeAmount] = useState(0)
    const inputRef = useRef(null)
    const [showModal, setShowModal] = useState(false)
    const [isGameCreated, setGameCreated] = useState(false)

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

    //THIS TWO FUNCTIONS SET THE ENUM OF USER
    const setToHeads = () => {
        setSymbol(0)
        setSymbolName("Heads")
    }

    const setToTails = () => {
        setSymbol(1)
        setSymbolName("Tails")
    }

    //FUNCTION THAT RETREIVES DATA FROM INPUT
    const setBetAmount = () => {
        if (inputRef.current.value > 0) {
            const amount = ethers.utils.parseEther(inputRef.current.value.toString())
            changeAmount(parseInt(amount))
        }
    }

    /////////////////////////////////////
    // ETHERS CONTRACT INTERACTIONS

    // Start game function
    const [isLoadingStartGame, setIsLoadingStartGame] = useState(false)
    const startGameEthers = async () => {
        try {
            setIsLoadingStartGame(true)
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const signer = provider.getSigner()
            const contract = new ethers.Contract(coinflipAddress, abi, signer)

            // Estimate gas limit for the transaction
            const estimatedGas = await contract.estimateGas.startGame(_amount.toString(), _symbol)
            const gasLimit = estimatedGas
                .mul(ethers.BigNumber.from("110"))
                .div(ethers.BigNumber.from("100")) // Add a buffer

            // Get current gas price
            const gasPrice = await provider.getGasPrice()

            // Send the transaction with the estimated gas limit and current gas price
            const transaction = await contract.startGame(_amount.toString(), _symbol, {
                gasLimit,
                gasPrice
            })

            // Wait for the transaction to be mined
            const receipt = await transaction.wait()
            console.log("Transaction successful!")
            handleNewNotification(receipt)

            // Logic if success!
            if (receipt.status === 1) {
                setShowModal(true)
                setIsLoadingStartGame(false)
            }
        } catch (error) {
            console.error("Transaction failed:", error)
            setIsLoadingStartGame(false)
        }
    }

    // Cancel game function
    const cancelGameEthers = async () => {
        if (gameId !== "0") {
            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum)
                const signer = provider.getSigner()
                const contract = new ethers.Contract(coinflipAddress, abi, signer)

                // Estimate gas limit for the transaction
                const estimatedGas = await contract.estimateGas.cancelGame(gameId.toString())
                const gasLimit = estimatedGas
                    .mul(ethers.BigNumber.from("110"))
                    .div(ethers.BigNumber.from("100")) // Add a buffer

                // Get current gas price
                const gasPrice = await provider.getGasPrice()

                // Send the transaction with the estimated gas limit and current gas price
                const transaction = await contract.cancelGame(gameId.toString(), {
                    gasLimit,
                    gasPrice
                })

                // Wait for the transaction to be mined
                const receipt = await transaction.wait()
                console.log("Transaction successful!")
                handleNewNotification(receipt)

                // Logic if success!
                if (receipt.status === 1) {
                    setGameCreated(false)
                    setShowModal(false)
                    changeGameId("0")
                }
            } catch (error) {
                console.error("Transaction failed:", error)
            }
        }
    }

    return (
        <div className="mt-8 ml-8 px-15 p-10 mr-6 border-2 border-gray-800 rounded-md bg-amber-100">
            <div className="text-bold text-2xl  text-gray-800 font-mono text-center">
                GAME CREATION!
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
                            placeholder="0.1"
                            min="0.1"
                            className="md:w-32 ml-2"
                        />
                        <button
                            className="bg-amber-400 hover:bg-amber-600 text-white font-bold py-1 px-2 text-lg rounded ml-2 transition duration-200"
                            onClick={setBetAmount}
                        >
                            BET
                        </button>
                    </div>
                    <div className="mt-4 text-center">
                        <button
                            className="bg-amber-400 hover:bg-amber-600 text-white font-bold py-1 px-2 text-lg rounded mx-2 transition duration-200"
                            onClick={setToHeads}
                        >
                            Choose Heads
                        </button>
                        <button
                            className="bg-amber-400 hover:bg-amber-600 text-white font-bold py-1 px-4 text-lg rounded mx-2 transition duration-200"
                            onClick={setToTails}
                        >
                            Choose Tails
                        </button>
                    </div>
                    <div className="mt-4 text-center">Chosen Symbol: {symbolName}</div>
                    <div className="text-center">
                        Amount to bet: {ethers.utils.formatEther(_amount.toString())}
                    </div>
                    <div className="mt-4 text-center">
                        <button
                            className="bg-amber-400 hover:bg-amber-600 text-white font-bold py-5 px-8 text-2xl rounded transition duration-200"
                            onClick={startGameEthers}
                            disabled={isLoadingStartGame ? true : false}
                        >
                            {isLoadingStartGame ? (
                                <div className="animate-spin spinner-border h-7 w-7 border-b-2 rounded-full"></div>
                            ) : (
                                <p>Create a Game</p>
                            )}
                        </button>
                    </div>
                    <Modal
                        isVisible={showModal}
                        onClose={() => {
                            setShowModal(false)
                        }}
                    >
                        <div className="justify-center flex flex-col items-center">
                            <div>Waiting for a game to START!!!</div>
                        </div>
                        <button
                            className="bg-amber-400 hover:bg-amber-600 text-white font-bold py-1 px-20 mt-2 text-lg rounded transition duration-200"
                            onClick={cancelGameEthers}
                        >
                            {gameId != 0 ? (
                                <div>CancelGame</div>
                            ) : (
                                <div className="animate-spin spinner-border h-7 w-7 border-b-2 rounded-full"></div>
                            )}
                        </button>
                    </Modal>
                </div>
            ) : (
                <div>No CoinFlip Address Detected</div>
            )}
        </div>
    )
}
