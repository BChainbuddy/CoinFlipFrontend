import { ConnectButton } from "web3uikit"
import { useWeb3Contract } from "react-moralis"
import { abi, contractAddresses } from "../constants"
import { useMoralis, setMsgValue } from "react-moralis"
import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { useNotification } from "web3uikit"
import Modal from "@/components/Modal"

export default function Header({ newUpdateUI, needToUpdateUI }) {
    //VARIABLES
    const { isWeb3Enabled, chainId: chainIdHex, isAuthenticated, user, account } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const coinflipAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null
    const [_amountDeposit, setDepositAmount] = useState(0)
    const [_amountWithdraw, setWithdrawAmount] = useState(0)
    const [balance, getBalance] = useState("0")

    const [showModal, setShowModal] = useState(false)
    const [showModal2, setShowModal2] = useState(false)

    useEffect(() => {
        if (isWeb3Enabled) {
            updateUI()
        }
    }, [isWeb3Enabled])

    const handleSuccess = async function(tx) {
        await tx.wait(1)
        handleNewNotification(tx)
        updateUI()
    }

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

    //SMART CONTRACT FUNCTIONS TO INTERACT WITH
    const { runContractFunction: deposit } = useWeb3Contract({
        abi: abi,
        contractAddress: coinflipAddress,
        functionName: "deposit",
        msgValue: _amountDeposit
    })

    const { runContractFunction: withdraw } = useWeb3Contract({
        abi: abi,
        contractAddress: coinflipAddress,
        functionName: "withdraw",
        params: { _amount: _amountWithdraw }
    })

    const { runContractFunction: balanceOf } = useWeb3Contract({
        abi: abi,
        contractAddress: coinflipAddress,
        functionName: "balanceOf",
        params: { _address: account }
    })

    //UPDATEUI(BALANCE OF THE USER)
    async function updateUI() {
        const userbalance = (await balanceOf()).toString()
        console.log("User Balance:", userbalance)
        getBalance(userbalance)
    }

    useEffect(() => {
        if (newUpdateUI) {
            updateUI()
            needToUpdateUI(false)
        }
    })

    //DEPOSIT FUNCTION
    const setDeposit = async () => {
        console.log("First we change", _amountDeposit.toString())
        await deposit({
            msgValue: _amountDeposit,
            onSuccess: handleSuccess,
            onError: error => console.log(error)
        })
    }

    //WITHDRAW FUNCTION
    const setWithdraw = async () => {
        console.log("We want to withdraw this much", _amountWithdraw.toString())
        await withdraw({
            onSuccess: handleSuccess,
            onError: error => console.log(error)
        })
    }

    return (
        <div className="border-b-2 flex flex-row bg-gray-800 border-b-amber-400 py-1 px-3">
            <h1 className="py-12 px-20 font-serif custom-gradient-right text-transparent bg-clip-text text-5xl">
                CoinFlip minigame
            </h1>
            <div className="ml-auto">
                <div className="py-2 px-4">
                    <ConnectButton moralisAuth={false} />
                </div>
                <div className="bg-amber-400 text-white font-bold text-lg rounded ml-8 p-1 w-80">
                    CoinFlip Balance: {ethers.utils.formatEther(balance)}
                </div>
                <div className="flex space-x-8 ml-8 mt-2">
                    <button
                        className="bg-amber-400 text-white hover:bg-amber-600 font-bold text-lg rounded p-1.5"
                        onClick={() => setShowModal(true)}
                    >
                        Deposit Funds
                    </button>
                    <button
                        className="bg-amber-400 text-white hover:bg-amber-600 font-bold text-lg rounded p-1.5"
                        onClick={() => setShowModal2(true)}
                    >
                        Withdraw Funds
                    </button>
                </div>
            </div>
            <Modal
                isVisible={showModal}
                onClose={() => {
                    setShowModal(false)
                }}
            >
                <div className="text-2xl text-bold">DEPOSIT FUNDS!</div>
                <div className="flex flex-col justify-center items-center">
                    <label htmlFor="Amount" className="mt-1">
                        Choose AMOUNT to deposit:
                    </label>
                    <input
                        type="number"
                        id="Amount"
                        name="Amount"
                        step=".01"
                        min="0"
                        placeholder="0.00"
                        className="md:w-32 text-center mt-2"
                        onChange={event =>
                            event.target.value > 0
                                ? setDepositAmount(ethers.utils.parseEther(event.target.value))
                                : setDepositAmount(0)
                        }
                    />
                    <button
                        className="bg-amber-400 hover:bg-amber-600 text-white font-bold py-1 px-20 mt-2 text-lg rounded"
                        onClick={setDeposit}
                    >
                        DEPOSIT
                    </button>
                </div>
            </Modal>
            <Modal
                isVisible={showModal2}
                onClose={() => {
                    setShowModal2(false)
                }}
            >
                <div className="text-2xl text-bold">WITHDRAW FUNDS!</div>
                <div className="flex flex-col justify-center items-center">
                    <label htmlFor="Amount" className="mt-1">
                        Choose AMOUNT to withdraw:
                    </label>
                    <input
                        type="number"
                        id="Amount"
                        name="Amount"
                        step=".01"
                        min="0.01"
                        placeholder="0.00"
                        className="md:w-32 text-center mt-2"
                        onChange={event =>
                            event.target.value > 0
                                ? setWithdrawAmount(ethers.utils.parseEther(event.target.value))
                                : setWithdrawAmount(0)
                        }
                    />
                    <button
                        className="bg-amber-400 hover:bg-amber-600 text-white font-bold py-1 px-20 mt-2 text-lg rounded"
                        onClick={setWithdraw}
                    >
                        WITHDRAW
                    </button>
                </div>
            </Modal>
        </div>
    )
}
