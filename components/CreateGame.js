import { useWeb3Contract } from "react-moralis"
import { abi, contractAddresses } from "../constants"
import { useMoralis } from "react-moralis"
import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { useNotification } from "web3uikit"
import { useRef } from "react"
import Modal from "@/components/Modal"

//CREATE GAME PART
export default function CreateGame({ needToUpdateUI }) {
    //VARIABLES
    const { isWeb3Enabled, chainId: chainIdHex, runContractFunction, account, web3 } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const coinflipAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null
    const [_symbol, setSymbol] = useState(0)
    const [symbolName, setSymbolName] = useState("No symbol chosen")
    const [_amount, changeAmount] = useState(0)
    const inputRef = useRef(null)
    const [showModal, setShowModal] = useState(false)
    const [gameId, changeGameId] = useState("0")
    const [eventListener, isEventListener] = useState(false)

    const dispatch = useNotification()

    //FUNCTION THAT UPDATES UI(BALANCE) in Header
    const CreateGameNeedToUpdateUI = () => {
        needToUpdateUI(true)
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
        const amount = ethers.utils.parseEther(inputRef.current.value.toString())
        changeAmount(parseInt(amount))
    }

    //CANCEL GAME - DIDN'T HAVE ENOUGH TIME TO FINISH
    async function exitGame() {
        await cancelGame({ onSuccess: handleSuccess, onError: error => console.log(error) })
        setShowModal(false)
    }

    //EVENT LISTENER - DIDN'T HAVE ENOUGH TIME TO FINISH
    const listenToEvent = async () => {
        const signers = web3.getSigner()
        const contract = new ethers.Contract(coinflipAddress, abi, signers)
        contract.once("gameCreated", () => {
            contract.on("gameCreated", (_gameId, _challenger, _amount, event) => {
                let data = {
                    _gameId: _gameId.toString(),
                    _challenger,
                    _amount: _amount.toString(),
                    event
                }
                changeGameId(_gameId.toString())
                console.log(data)
            })
        })
    }

    useEffect(() => {
        if (isWeb3Enabled) {
            listenToEvent()
        }
    }, [isWeb3Enabled])

    const handleSuccess = async function(tx) {
        await tx.wait(1)
        handleNewNotification(tx)
        CreateGameNeedToUpdateUI()
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

    //SMART CONTRACT UNCTION TO INTERACT WITH
    const { runContractFunction: startGame, isLoading, isFetching } = useWeb3Contract({
        abi: abi,
        contractAddress: coinflipAddress,
        functionName: "startGame",
        params: { _amount: _amount.toString(), _symbol: _symbol }
    })

    const { runContractFunction: cancelGame } = useWeb3Contract({
        abi: abi,
        contractAddress: coinflipAddress,
        functionName: "cancelGame",
        params: { _gameId: gameId.toString() }
    })

    return (
        <div className=" mt-8 ml-8 px-15 p-10 border-2 bg-amber-100 rounded">
            <div className="text-bold text-2xl  text-amber-400 text-center">GAME CREATION!</div>
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
                            className="bg-amber-400 hover:bg-amber-600 text-white font-bold py-1 px-2 text-lg rounded ml-2"
                            onClick={setBetAmount}
                        >
                            BET
                        </button>
                    </div>
                    <div className="mt-4 text-center">
                        <button
                            className="bg-amber-400 hover:bg-amber-600 text-white font-bold py-1 px-2 text-lg rounded mx-2"
                            onClick={setToHeads}
                        >
                            Choose Heads
                        </button>
                        <button
                            className="bg-amber-400 hover:bg-amber-600 text-white font-bold py-1 px-4 text-lg rounded mx-2"
                            onClick={setToTails}
                        >
                            Choose Tails
                        </button>
                    </div>
                    <div className="mt-4 text-center">Chosen Symbol: {symbolName}</div>
                    <div className="text-center">
                        Amount to bet: {ethers.utils.formatUnits(_amount.toString(), "ether")}
                    </div>
                    <div className="mt-4 text-center">
                        <button
                            className="bg-amber-400 hover:bg-amber-600 text-white font-bold py-5 px-8 text-2xl rounded"
                            onClick={async function() {
                                await startGame({
                                    onSuccess: handleSuccess,
                                    onError: error => console.log(error)
                                })
                                setShowModal(true)
                            }}
                            disabled={isLoading || isFetching}
                        >
                            {isLoading || isFetching ? (
                                <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                            ) : (
                                <div>Create a Game</div>
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
                        <button className="bg-amber-400 hover:bg-amber-600 text-white font-bold py-1 px-20 mt-2 text-lg rounded">
                            Cancel game
                        </button>
                    </Modal>
                </div>
            ) : (
                <div>No CoinFlip Address Detected</div>
            )}
        </div>
    )
}
