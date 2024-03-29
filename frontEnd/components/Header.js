import { ConnectButton } from "web3uikit"
import { useWeb3Contract } from "react-moralis"
import { abi, contractAddresses } from "../constants"
import { useMoralis, setMsgValue } from "react-moralis"
import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { useNotification } from "web3uikit"
import Modal from "@/components/Modal"
require("dotenv").config()

export default function Header({ updateUI, setUpdateUI }) {
    //VARIABLES
    const { isWeb3Enabled, chainId: chainIdHex, isAuthenticated, user, account } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const coinflipAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null
    const [_amountDeposit, setDepositAmount] = useState(0)
    const [_amountWithdraw, setWithdrawAmount] = useState(0)
    const [balance, getBalance] = useState("0")

    const [showModal, setShowModal] = useState(false)
    const [showModal2, setShowModal2] = useState(false)

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

    // Updates balance if updateUI changes
    useEffect(() => {
        if (updateUI === true) {
            updateBalance()
            setUpdateUI(false)
        }
    }, [updateUI])

    // Updates balance when client connects to wallet
    useEffect(() => {
        if (isWeb3Enabled) {
            updateBalance()
        }
    }, [isWeb3Enabled])

    /////////////////////////////////////
    // ETHERS CONTRACT INTERACTIONS

    // Deposit function
    const [isLoadingDeposit, setIsLoadingDeposit] = useState(false)
    const depositEthers = async () => {
        try {
            setIsLoadingDeposit(true)
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const signer = provider.getSigner()
            const contract = new ethers.Contract(coinflipAddress, abi, signer)

            // Estimate gas limit for the transaction
            const estimatedGas = await contract.estimateGas.deposit({ value: _amountDeposit })
            const gasLimit = estimatedGas
                .mul(ethers.BigNumber.from("110"))
                .div(ethers.BigNumber.from("100")) // Add a buffer

            // Get current gas price
            const gasPrice = await provider.getGasPrice()

            // Send the transaction with the estimated gas limit and current gas price
            const transaction = await contract.deposit({
                value: _amountDeposit,
                gasLimit,
                gasPrice
            })

            // Wait for the transaction to be mined
            const receipt = await transaction.wait()
            console.log("Transaction successful!")
            handleNewNotification(receipt)

            // Logic if success!
            if (receipt.status === 1) {
                updateBalance()
                setIsLoadingDeposit(false)
            }
        } catch (error) {
            console.error("Transaction failed:", error)
            setIsLoadingDeposit(false)
        }
    }

    // Withdraw function
    const [isLoadingWithdraw, setIsLoadingWithdraw] = useState(false)
    const withdrawEthers = async () => {
        try {
            setIsLoadingWithdraw(true)
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const signer = provider.getSigner()
            const contract = new ethers.Contract(coinflipAddress, abi, signer)

            // Estimate gas limit for the transaction
            const estimatedGas = await contract.estimateGas.withdraw(_amountWithdraw.toString())
            const gasLimit = estimatedGas
                .mul(ethers.BigNumber.from("110"))
                .div(ethers.BigNumber.from("100")) // Add a buffer

            // Get current gas price
            const gasPrice = await provider.getGasPrice()

            // Send the transaction with the estimated gas limit and current gas price
            const transaction = await contract.withdraw(_amountWithdraw.toString(), {
                gasLimit,
                gasPrice
            })

            // Wait for the transaction to be mined
            const receipt = await transaction.wait()
            console.log("Transaction successful!")
            handleNewNotification(receipt)

            // Logic if success!
            if (receipt.status === 1) {
                updateBalance()
                setIsLoadingWithdraw(false)
            }
        } catch (error) {
            console.error("Transaction failed:", error)
            setIsLoadingWithdraw(false)
        }
    }

    // Update balance function
    const updateBalance = async () => {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const signer = provider.getSigner()
            const contract = new ethers.Contract(coinflipAddress, abi, signer)

            // Send the transaction with the estimated gas limit and current gas price
            const transaction = await contract.balanceOf(account)

            // Logic if success!
            getBalance(transaction.toString())
        } catch (error) {
            console.error("Transaction failed:", error)
        }
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
                        className="bg-amber-400 text-white hover:bg-amber-600 font-bold text-lg rounded p-1.5 transition duration-200"
                        onClick={() => setShowModal(true)}
                    >
                        Deposit Funds
                    </button>
                    <button
                        className="bg-amber-400 text-white hover:bg-amber-600 font-bold text-lg rounded p-1.5 transition duration-200"
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
                <div className="text-2xl text-bold font-mono text-gray-800">DEPOSIT FUNDS!</div>
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
                        className="bg-amber-400 hover:bg-amber-600 text-white font-bold py-1 px-20 mt-2 text-lg rounded transition duration-200"
                        onClick={depositEthers}
                        disabled={isLoadingDeposit ? true : false}
                    >
                        {isLoadingDeposit ? (
                            <div className="animate-spin spinner-border h-7 w-7 border-b-2 rounded-full"></div>
                        ) : (
                            <p>DEPOSIT</p>
                        )}
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
                        className="bg-amber-400 hover:bg-amber-600 text-white font-bold py-1 px-20 mt-2 text-lg rounded transition duration-200"
                        onClick={withdrawEthers}
                        disabled={isLoadingWithdraw ? true : false}
                    >
                        {isLoadingWithdraw ? (
                            <div className="animate-spin spinner-border h-7 w-7 border-b-2 rounded-full"></div>
                        ) : (
                            <p>WITHDRAW</p>
                        )}
                    </button>
                </div>
            </Modal>
        </div>
    )
}
