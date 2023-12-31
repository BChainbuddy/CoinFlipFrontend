import Head from "next/head"
import Image from "next/image"
import Header from "@/components/Header"
import CreateGame from "@/components/CreateGame"
import JoinGame from "@/components/JoinGame"
import GamePlay from "@/components/GamePlay"
import { useWeb3Contract } from "react-moralis"
import { abi, contractAddresses } from "./../constants"
import { useMoralis } from "react-moralis"
import { useEffect, useState } from "react"
import { ethers } from "ethers"
import CoinMint from "@/components/GameCoinMint"
import abiNFT from "../constants/abiNFT.json"
import contractAddressesNFT from "../constants/contractAddressesNFT.json"

export default function Home() {
    /*THE INDEX IS THE MAIN PAGE AND GAME PAGE. THE SCENES CHANGE WHEN THE START 
    GAME LISTENER RETURNS A GAME WHICH INCLUDES THE ADDRESS THAT IS CONNECTED TO
    THE DAPP. THEN THE GAME STARTS, AND WHEN OUR GAME FINISHES, THE USER IS REDIRECTED
    BACK TO OUR MAIN PAGE WITH USE OF USESTATE VARIABLE(inGame)*/

    //VARIABLE WHICH IS CALLED IN CREATE GAME AND JOIN GAME TO UPDATEUI IN HEADER(BALANCE) AFTER COMPLETED TRANSACTION
    const [newUpdateUI, needToUpdateUI] = useState(false)
    const [inGame, changeGame] = useState(false)

    //GET FROM START EVENT TO PASS TO GAME
    const [gameId, changeGameId] = useState("0")
    const [player, setPlayer] = useState("")
    const [opponent, setOpponent] = useState("")
    const [playerSymbol, setPlayerSymbol] = useState()
    const [gameResults, setGameResult] = useState([])

    //////////////////////////////////////
    const { isWeb3Enabled, chainId: chainIdHex, account } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const coinflipAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null

    //CONNECTING TO WEBSOCKET SERVER
    useEffect(() => {
        if (isWeb3Enabled) {
            const ws = new WebSocket("ws://localhost:8082") // for productions use wss://, secure form
            ws.addEventListener("open", () => {
                console.log("Connection to listener backend established!")
                ws.send(account.toString()) // Sending account information as a JSON string
                console.log(`Message sent: ${account.toString()}`)
            })

            ws.onerror = error => {
                console.error("WebSocket error:", error)
            }

            let currentGameId
            // THIS WILL PROCESS THE DATA THAT SERVER SENDS, ALL THE EVENTS
            ws.onmessage = event => {
                let data = JSON.parse(event.data)
                console.log(data)
                if (data.stage === 0) {
                    // EVENT GAMECREATED
                    console.log(data.gameId)
                    console.log(data.challenger.toString())
                    console.log(data.amount.toString())
                    console.log(data.creatorSymbol.toString())
                    console.log("GAME CREATED EVENT FIRED!")
                    changeGameId(data.gameId)
                    currentGameId = data.gameId
                    console.log(`Game was created! This is the game Id ${data.gameId}`)
                    setPlayerSymbol(data.creatorSymbol.toString())
                } else if (data.stage === 1) {
                    // EVENT GAMESTARTED
                    console.log("GAME STARTED EVENT FIRED!")
                    if (data.challenger.toLowerCase() == account) {
                        console.log("ACCOUNT IS CHALLENGER")
                        changeGameId(data.gameId)
                        currentGameId = data.gameId
                        setPlayer(data.challenger.toString())
                        setOpponent(data.joiner.toString())
                        setPlayerSymbol(data.creatorSymbol.toString())
                        console.log("Game has started in coinflip game...")
                        changeGame(true)
                    }
                    if (data.joiner.toLowerCase() == account) {
                        console.log("ACCOUNT IS JOINER")
                        changeGameId(data.gameId)
                        currentGameId = data.gameId
                        setPlayer(data.joiner.toString())
                        setOpponent(data.challenger.toString())
                        const getPlayerSymbol = data.creatorSymbol == 0 ? 1 : 0
                        setPlayerSymbol(getPlayerSymbol.toString())
                        console.log("Game has started in coinflip game...")
                        changeGame(true)
                    }
                } else if (data.stage === 2) {
                    console.log("COINFLIP RESULTS")
                    console.log(
                        `CurrentGameID ${currentGameId}, this is its type ${typeof currentGameId}`
                    )
                    console.log(`GameId ${data.gameId}, this is its type ${typeof data.gameId}`)
                    // EVENT COINFLIP RESULT
                    if (data.gameId == currentGameId) {
                        console.log("COINFLIP RESULT EVENT FIRED!")
                        console.log(
                            `THIS IS THE RESULT OF THE GAME ${data.winningSymbol.toString()}`
                        )
                        setGameResult(gameResults => [
                            ...gameResults,
                            data.winningSymbol.toString()
                        ])
                    }
                } else if (data.stage === 3) {
                    // EVENT END GAME
                    console.log("END GAME EVENT FIRED!")
                    if (data.winner.toLowerCase() == account) {
                        console.log("Game has finished, the connected account was a Winner!")
                        console.log("the account address:", account.toString())
                    } else {
                        console.log("Game has finished, the connected account was a Loser!")
                        console.log("the account address:", account.toString())
                    }
                }
            }
        }
    }, [isWeb3Enabled])

    //RESTARTING OF THE MAIN PAGE, CLEARING THE THE STATE VARIABLES, AND ACTIVATING THE EVENT KILLER AND EVENT COUNTER
    function gameOver() {
        changeGame(false)
        changeGameId("0")
        setGameResult([])
        // killEventResult()
        // listenerChecker()
    }

    //////////////////////////////////////
    //CHECK IF THE USER HAS THE NFT TO PLAY
    const [isNftOwner, changeNftOwner] = useState(false)
    const [updateNftChecker, initiateNftChecker] = useState(true)

    const gamecoinAddress =
        chainId in contractAddressesNFT ? contractAddressesNFT[chainId][0] : null

    const { runContractFunction: balanceOf } = useWeb3Contract({
        abi: abiNFT,
        contractAddress: gamecoinAddress,
        functionName: "balanceOf",
        params: { owner: account }
    })

    //CHECK IF THE ADDRESS HAS BALANCE A NFT
    async function nftChecker() {
        console.log("Checking if the address is a nft owner")
        console.log(gamecoinAddress.toString())
        console.log(account)
        const accountBalance = (await balanceOf()).toString()
        if (accountBalance == "1") {
            changeNftOwner(true)
            console.log("Is owner")
        }
        initiateNftChecker(false)
    }

    //STARTS NFTCHECKER FUNCTION, HAPPENS WHEN WE CHANGE UPDATENFTCHECKER
    useEffect(() => {
        if (isWeb3Enabled) {
            if (updateNftChecker) {
                console.log("NTF CHECKER ON")
                nftChecker()
            }
        }
    }, [updateNftChecker, isWeb3Enabled])

    //RETURNS THE MAIN PAGE
    return (
        <div>
            {!inGame ? (
                <div className="flex flex-col h-screen">
                    <Head>
                        <title>CoinFlip</title>
                        <meta name="description" content="CoinFlip minigame" />
                    </Head>
                    <Header newUpdateUI={newUpdateUI} needToUpdateUI={needToUpdateUI} />
                    <div id="background" className="border-2 h-full border-amber-400">
                        {isNftOwner ? (
                            <div className="flex flex-row justify-center items-center py-12">
                                <CreateGame
                                    needToUpdateUI={needToUpdateUI}
                                    changeGame={changeGame}
                                    changeGameId={changeGameId}
                                    gameId={gameId}
                                />
                                <Image
                                    src="/CoinFlipCoin.jpg"
                                    alt="Coin Image"
                                    width={307}
                                    height={100}
                                    className="rounded-lg border-2 border-gray-800"
                                />
                                <JoinGame needToUpdateUI={needToUpdateUI} />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center">
                                <CoinMint initiateNftChecker={initiateNftChecker} />
                            </div>
                        )}
                    </div>
                    <div className="bg-gray-800 py-4 px-10 border-t-2 border-amber-400">
                        <p className="text-white text-center">
                            This is minigame was made by Jaka Potokar a.k.a. BChainBuddy for the
                            chainlink Hackaton 2023.
                        </p>
                    </div>
                </div>
            ) : (
                <GamePlay
                    player={player}
                    opponent={opponent}
                    playerSymbol={playerSymbol}
                    gameResults={gameResults}
                    gameOver={gameOver}
                />
            )}
        </div>
    )
}
