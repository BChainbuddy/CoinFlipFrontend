import { useWeb3Contract } from "react-moralis"
import { abi, contractAddresses } from "../constants"
import abiNFT from "../constants/abiNFT.json"
import contractAddressesNFT from "../constants/contractAddressesNFT.json"
import { useMoralis } from "react-moralis"
import { useEffect, useState } from "react"
import { ethers } from "ethers"
import Modal from "@/components/Modal"
import Image from "next/image"
import Head from "next/head"
import gifHolder from "@/public/gifholder.gif"

export default function GamePlay({ player, opponent, playerSymbol, gameResults, gameOver }) {
    const { chainId: chainIdHex } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const coinflipAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null
    const gamecoinAddress =
        chainId in contractAddressesNFT ? contractAddressesNFT[chainId][0] : null

    const [waitingForGame, changeWaitingForGame] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [winner, setWinner] = useState("")
    const [playerPoints, changePlayerPoints] = useState(0)
    const [opponentPoints, changeOpponentPoints] = useState(0)
    const [coinflip, changeCoinFlip] = useState(2) // 2 -> placeholder,  0 -> heads wins, 1 -> tails wins
    const [gifUrl, setGifUrl] = useState("/ezgif.com-gif-maker(1).gif")
    const reloadGif = () => {
        // Generate a unique query parameter value
        const timestamp = Date.now()
        // Update the state with a new URL by appending the timestamp as a query parameter
        setGifUrl(`/ezgif.com-gif-maker(1).gif?t=${timestamp}`)
    }
    //IF THE PLAYER POINTS OR OPPONENT POINT ARE == 4, SHOW THE MODAL THAT SHOWS WHICH WON
    let playerPointsCalc = 0
    let opponentPointsCalc = 0

    //LOGIC THAT HAPPENS AFTER EVERY GAME COIN FLIP, TO UPDATE SCORE AND PERFORM COINFLIP
    useEffect(() => {
        //SOMETHING HAPPENS, WE DO THE FLIP FOR THE CURRENT ONE(THE ONE ADDED IN)
        const length = gameResults.length
        let counter = 0

        if (length > 3) {
            changeWaitingForGame(false)
            const myVar = setInterval(function() {
                if (counter == length) {
                    if (playerPoints == 4) {
                        setWinner(player)
                    } else {
                        setWinner(opponent)
                    }
                    setTimeout(setShowModal(true), 3000)
                    setTimeout(() => {
                        setShowModal(false)
                    }, 15000)
                    clearInterval(myVar)
                    setTimeout(gameOver, 15000)
                } else {
                    //FOR LOGGIN PURPOSES
                    console.log(gameResults[counter])
                    console.log(playerSymbol)
                    //TO DO THE GIF
                    if (gameResults[counter] == 0) {
                        changeCoinFlip(0)
                        console.log("GIF SHOULD SHOW HEADS")
                    } else {
                        changeCoinFlip(1)
                        console.log("GIF SHOULD SHOW TAILS")
                    }
                    //CHANGE THE SCORE
                    function changeTheScore() {
                        if (gameResults[counter] == playerSymbol.toString()) {
                            playerPointsCalc++
                            console.log("The Player Has SCORED, player has ", playerPointsCalc)
                            changePlayerPoints(playerPointsCalc)
                            //SOMETHING HAPPENS IF IT IS A PLAYER SYMBOl, DOES THE ANIMATION, ADDS TO PLAYER POINTS, UPDATES THE LEFT SIDE COINS
                        } else {
                            //SOMETHING HAPPENS IF IT IS A OPPONENT SYMBOL, DOES THE ANIMATION, ADDS TO OPPONENT POINT, UPDATES THE RIGHT SIDE
                            opponentPointsCalc++
                            console.log("The Opponent Has SCORED, player has ", opponentPointsCalc)
                            changeOpponentPoints(opponentPointsCalc)
                        }
                        counter++
                    }
                    //CHANGES THE SCORE AFTER THE GIF STOPS
                    setTimeout(changeTheScore, 6000)
                }
            }, 10000)
        }
    }, [gameResults])

    //WHEN THE GIF IS CALLED IT PERFORMS THE GIF ANIMATED COINFLIP
    useEffect(() => {
        if (coinflip != 2) {
            console.log("THE PLAYER POINTS OR OPPONENT POINTS CHANGED")
            reloadGif()
            const timeout = setTimeout(() => {
                changeCoinFlip(2)
                console.log("GIF IS SET TO GIF HOLDER")
            }, 5000)
        }
    }, [coinflip])

    //SHOW GAMECOIN STATS
    const [NFTwins, setNFTwins] = useState("0")
    const [NFTlosses, setNFTlosses] = useState("0")
    const [NFTamountwon, setNFTamountwon] = useState("0")

    const [OpponentNFTwins, setOpponentNFTwins] = useState("0")
    const [OpponentNFTlosses, setOpponentNFTlosses] = useState("0")
    const [OpponentNFTamountwon, setOpponentNFTamountwon] = useState("0")

    const [tokenId, changeTokenId] = useState("")
    const [NFTaccount, changeNFTaccount] = useState("")

    const { runContractFunction: getWins } = useWeb3Contract({
        abi: abiNFT,
        contractAddress: gamecoinAddress,
        functionName: "getWins",
        params: { _tokenId: tokenId }
    })

    const { runContractFunction: getLosses } = useWeb3Contract({
        abi: abiNFT,
        contractAddress: gamecoinAddress,
        functionName: "getLosses",
        params: { _tokenId: tokenId }
    })

    const { runContractFunction: getAmountWon } = useWeb3Contract({
        abi: abiNFT,
        contractAddress: gamecoinAddress,
        functionName: "getAmountWon",
        params: { _tokenId: tokenId }
    })

    const { runContractFunction: getOwnersToken } = useWeb3Contract({
        abi: abiNFT,
        contractAddress: gamecoinAddress,
        functionName: "getOwnersToken",
        params: { _ownerAddress: NFTaccount }
    })

    //FUNCTION, WHICH RUNS ALL THE VIEW FUNCTION FROM OUR NFT CONTRACT TO GET STATS OF THE PLAYER
    const getPlayerNFTstats = async () => {
        console.log("These are player", NFTaccount, "stats, with tokenId", tokenId)
        setNFTwins((await getWins()).toString())
        console.log((await getWins()).toString())
        setNFTlosses((await getLosses()).toString())
        console.log((await getLosses()).toString())
        setNFTamountwon(ethers.utils.formatEther((await getAmountWon()).toString()))
        console.log((await getAmountWon()).toString())
        changeNFTaccount(opponent.toString())
    }

    //FUNCTION, WHICH RUNS ALL THE VIEW FUNCTION FROM OUR NFT CONTRACT TO GET STATS OF THE OPPONENT
    const getOpponentNFTstats = async () => {
        console.log("These are player", NFTaccount, "stats, with tokenId", tokenId)
        setOpponentNFTwins((await getWins()).toString())
        console.log((await getWins()).toString())
        setOpponentNFTlosses((await getLosses()).toString())
        console.log((await getLosses()).toString())
        setOpponentNFTamountwon(ethers.utils.formatEther((await getAmountWon()).toString()))
        console.log((await getAmountWon()).toString())
    }

    const functionToChangeTokenId = async () => {
        changeTokenId((await getOwnersToken()).toString())
    }

    //TO INITIATE THE FUNCTION TO GET PLAYER STATS
    useEffect(() => {
        changeNFTaccount(player)
        console.log("Starting to get Player's NFT stats...")
    }, [])

    //WHEN NFTaccout CHANGES WE CHANGE THE ACCOUNT WE WANT TO GET NFT STATS FROM
    useEffect(() => {
        if (NFTaccount == player || NFTaccount == opponent) {
            functionToChangeTokenId()
            console.log("The tokenId has been changed to", tokenId)
            if (NFTaccount.toString() == opponent.toString()) {
                console.log("This is opponent's token, opponent's address ", opponent)
                console.log("This is opponent's address in LOWER CASE ", NFTaccount)
            }
            if (NFTaccount.toString() == player) {
                console.log("This is player's token, player's address ", player)
            }
        }
    }, [NFTaccount])

    //GETS PLAYER'S STATS WHEN TOKENID CHANGES AND ACCOUNT IS PLAYER'S ACCOUNT
    useEffect(() => {
        if (NFTaccount == player) {
            console.log("Getting player's stats, account:", NFTaccount)
            getPlayerNFTstats()
        }
    }, [tokenId])

    //GETS OPPONENT'S STATS WHEN TOKENID CHANGES AND ACCOUNT IS OPPONENT'S ACCOUNT
    useEffect(() => {
        if (NFTaccount.toString() == opponent.toString()) {
            console.log("Getting opponent's stats, account:", NFTaccount)
            getOpponentNFTstats()
        }
    }, [tokenId])

    return (
        <div>
            <Head>
                <title>Game</title>
                <meta name="CoinFlip minigame" content="CoinFlip minigame" />
            </Head>
            <div>
                <div className="text-center mt-8 py-2 text-3xl font-serif">COINFLIP minigame</div>
                <div className="flex flex-row justify-center items-center">
                    <div className="flex mx-auto flex-col p-10 px-8 items-center">
                        <div className="text-serif text-xl font-serif">You have chosen:</div>
                        <Image
                            src={
                                playerSymbol.toString() == "0"
                                    ? "/shibgamecoin.jpg"
                                    : "/pepegamecoin.jpg"
                            }
                            alt="Coin Transparent Image"
                            width={150}
                            height={100}
                        />
                        <div className="mt-8 flex justify-center">
                            <div>
                                <div className="text-serif">Address: {player}</div>
                                <div className="flex flex-row space-x-4 mt-2">
                                    <Image
                                        src="/gamecoinnfttransparent.png"
                                        alt="Coin Transparent Image"
                                        className={playerPoints > 0 ? "" : "brightness-50"}
                                        width={70}
                                        height={100}
                                    />
                                    <Image
                                        src="/gamecoinnfttransparent.png"
                                        alt="Coin Transparent Image"
                                        className={playerPoints > 1 ? "" : "brightness-50"}
                                        width={70}
                                        height={100}
                                    />

                                    <Image
                                        src="/gamecoinnfttransparent.png"
                                        alt="Coin Transparent Image"
                                        className={playerPoints > 2 ? "" : "brightness-50"}
                                        width={70}
                                        height={100}
                                    />
                                    <Image
                                        src="/gamecoinnfttransparent.png"
                                        alt="Coin Transparent Image"
                                        className={playerPoints > 3 ? "" : "brightness-50"}
                                        width={70}
                                        height={100}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-row items-center p-10">
                            <Image
                                src="/gamecoinnft.jpg"
                                alt="Coin Transparent Image"
                                width={200}
                                height={150}
                            />
                            <div>
                                <div>Wins: {NFTwins}</div>
                                <div>Losses: {NFTlosses}</div>
                                <div>P/L: {NFTamountwon} ETH</div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center px-8 justify-center">
                        {coinflip == 2 ? (
                            <Image
                                src={gifHolder}
                                alt="Gif place Holder"
                                width={250}
                                height={200}
                            />
                        ) : (
                            <div></div>
                        )}
                        {coinflip == 0 ? (
                            <Image src={gifUrl} alt="Gif if heads wins" width={250} height={200} />
                        ) : (
                            <div></div>
                        )}
                        {coinflip == 1 ? (
                            <Image src={gifUrl} alt="Gif if tails wins" width={250} height={200} />
                        ) : (
                            <div></div>
                        )}
                    </div>
                    <div className="mx-auto flex flex-col p-10 px-8 items-center">
                        <div className="text-serif text-xl font-serif">Opponent has chosen:</div>
                        <Image
                            src={
                                playerSymbol.toString() == "0"
                                    ? "/pepegamecoin.jpg"
                                    : "/shibgamecoin.jpg"
                            }
                            alt="Coin Transparent Image"
                            width={150}
                            height={100}
                        />
                        <div className="mt-8">
                            <div>
                                <div className="text-serif">Address: {opponent}</div>
                                <div className="flex flex-row space-x-4 mt-2">
                                    <Image
                                        src="/gamecoinnfttransparent.png"
                                        alt="Coin Transparent Image"
                                        className={opponentPoints > 0 ? "" : "brightness-50"}
                                        width={70}
                                        height={100}
                                    />
                                    <Image
                                        src="/gamecoinnfttransparent.png"
                                        alt="Coin Transparent Image"
                                        className={opponentPoints > 1 ? "" : "brightness-50"}
                                        width={70}
                                        height={100}
                                    />
                                    <Image
                                        src="/gamecoinnfttransparent.png"
                                        alt="Coin Transparent Image"
                                        className={opponentPoints > 2 ? "" : "brightness-50"}
                                        width={70}
                                        height={100}
                                    />
                                    <Image
                                        src="/gamecoinnfttransparent.png"
                                        alt="Coin Transparent Image"
                                        className={opponentPoints > 3 ? "" : "brightness-50"}
                                        width={70}
                                        height={100}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-row items-center p-10">
                            <Image
                                src="/gamecoinnft.jpg"
                                alt="Coin Transparent Image"
                                width={200}
                                height={150}
                            />
                            <div>
                                <div>Wins: {OpponentNFTwins}</div>
                                <div>Losses: {OpponentNFTlosses}</div>
                                <div>P/L: {OpponentNFTamountwon} ETH</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Modal
                isVisible={showModal}
                onClose={() => {
                    setShowModal(false)
                }}
            >
                <div className="font-bold font-sans text-xl text-gray-300 justify-center flex items-center">
                    <span
                        className={
                            winner.toString().toLocaleLowerCase() ==
                            player.toString().toLocaleLowerCase()
                                ? ""
                                : "hidden"
                        }
                    >
                        YOU won the GAME!!! CONGRATULATIONS!!! 🥳 🥳 🥳
                    </span>
                    <span
                        className={
                            winner.toString().toLocaleLowerCase() ==
                            player.toString().toLocaleLowerCase()
                                ? "hidden"
                                : ""
                        }
                    >
                        You've LOST! 😓😓😓 BETTER LUCK NEXT TIME!!! 🤗
                    </span>
                </div>
            </Modal>
            <Modal
                isVisible={waitingForGame}
                onClose={() => {
                    changeWaitingForGame(false)
                }}
            >
                <div className="justify-center flex flex-col items-center">
                    <div className="font-bold font-sans text-xl text-gray-300">
                        Waiting for the game to start...
                    </div>
                </div>
            </Modal>
        </div>
    )
}
