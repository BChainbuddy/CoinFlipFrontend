import Head from "next/head"
import Image from "next/image"
import Header from "../components/Header"
import CreateGame from "@/components/CreateGame"
import JoinGame from "@/components/JoinGame"
import GamePlay from "@/components/GamePlay"
import { useWeb3Contract } from "react-moralis"
import { abi, contractAddresses } from "../constants"
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
    const [rawgameid, changerawgameid] = useState()
    const [player, setPlayer] = useState("")
    const [opponent, setOpponent] = useState("")
    const [playerSymbol, setPlayerSymbol] = useState()
    const [gameResults, setGameResult] = useState([])

    //////////////////////////////////////
    //EVENT LISTENERS
    const { isWeb3Enabled, chainId: chainIdHex, runContractFunction, account, web3 } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const coinflipAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null

    //LISTENER FOR EVENT GAMECREATED, LISTENS FOR GAMEID, TO ENABLE CANCELGAME FUNCTION
    const listenToEventGameCreated = () => {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signers = web3.getSigner()
        console.log("Listening to an game Created event...")
        const contract = new ethers.Contract(coinflipAddress, abi, signers)
        const resultFilter = contract.filters.gameCreated(null, account)
        provider.once("block", () => {
            contract.once(resultFilter, (_gameId, _challenger, _amount, _creatorSymbol) => {
                changeGameId(_gameId.toString())
                changerawgameid(_gameId)
                console.log("Game was created!")
                console.log(_gameId.toString())
                setPlayerSymbol(_creatorSymbol)
            })
        })

        //ETHERS V6
        // contract.on("gameStarted", (_gameId, _challenger, _amount, _creatorSymbol) => {
        //     if (_challenger.toLowerCase() == account) {
        //         changeGameId(_gameId.toString())
        //         console.log("Game was created!!!!")
        //         console.log("This is the gameId of the game", _gameId.toString())
        //         setPlayerSymbol(_creatorSymbol)
        //     }
        // })
    }

    //LISTENER FOR EVENT GAME STARTED, CHANGES TO A GAME IF THE GAME STARTS
    const listenToEventGameStarted = () => {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signers = web3.getSigner()
        console.log("Listening to game Started event in coinflip game...")
        const contract = new ethers.Contract(coinflipAddress, abi, signers)
        const gameStartedFilter = contract.filters.gameStarted(null, account)
        const gameStartedFilter2 = contract.filters.gameStarted(null, null, account)
        provider.once("block", () => {
            contract.once(
                gameStartedFilter || gameStartedFilter2,
                (_gameId, _challenger, _joiner, _amount, _creatorSymbol, event) => {
                    if (_challenger.toLowerCase() == account) {
                        changeGameId(_gameId.toString())
                        changerawgameid(_gameId)
                        setPlayer(_challenger.toString())
                        setOpponent(_joiner.toString())
                        setPlayerSymbol(_creatorSymbol.toString())
                        console.log("Game has started in coinflip game...")
                        changeGame(true)
                    }
                    if (_joiner.toLowerCase() == account) {
                        changeGameId(_gameId.toString())
                        changerawgameid(_gameId)
                        setPlayer(_joiner.toString())
                        setOpponent(_challenger.toString())
                        const getPlayerSymbol = _creatorSymbol == 0 ? 1 : 0
                        setPlayerSymbol(getPlayerSymbol.toString())
                        console.log("Game has started in coinflip game...")
                        changeGame(true)
                    }
                }
            )
        })

        //ETHERS V6
        // contract.on(
        //     "gameStarted",
        //     (_gameId, _challenger, _joiner, _amount, _creatorSymbol, event) => {
        //         console.log("GAME HAS STARTED EVENT HAS BEEN TRIGGERED")
        //         if (_challenger.toLowerCase() == account) {
        //             changeGameId(_gameId.toString())
        //             changerawgameid(_gameId)
        //             setPlayer(_challenger.toString())
        //             setOpponent(_joiner.toString())
        //             setPlayerSymbol(_creatorSymbol.toString())
        //             console.log("Game has started in coinflip game...")
        //             changeGame(true)
        //         }
        //         if (_joiner.toLowerCase() == account) {
        //             changeGameId(_gameId.toString())
        //             changerawgameid(_gameId)
        //             setPlayer(_joiner.toString())
        //             setOpponent(_challenger.toString())
        //             const getPlayerSymbol = _creatorSymbol == 0 ? 1 : 0
        //             setPlayerSymbol(getPlayerSymbol.toString())
        //             console.log("Game has started in coinflip game...")
        //             changeGame(true)
        //         }
        //     }
        // )
    }

    //LISTENER FOR EVENT GAMERESULTS, TO GET THE RESULTS OF EACH GAME AND STORE IT IN gameResults
    const listenToEventResult = () => {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signers = web3.getSigner()
        console.log("Listening to an game result event in coinflip game...")
        const contract = new ethers.Contract(coinflipAddress, abi, signers)
        const resultFilter = contract.filters.coinFlipResult(rawgameid)
        provider.once("block", () => {
            contract.on(resultFilter, (_gameId, _winningSymbol) => {
                console.log(
                    "The result of game",
                    _gameId.toString(),
                    "was",
                    JSON.stringify(_winningSymbol)
                )

                setGameResult(gameResults => [...gameResults, _winningSymbol])
            })
        })

        //ETHERS V6
        // contract.on("coinFlipResult", (_gameId, _winningSymbol) => {
        //     if (rawgameid == _gameId) {
        //         console.log("THE RESULT OF THE GAME IS IN")
        //         console.log("The result of game", _gameId, "was", _winningSymbol)
        //         setGameResult(gameResults => [...gameResults, _winningSymbol])
        //     }
        //     console.log("RETURNED GAMEID", _gameId.toString())
        //     console.log("RAWGAMEID", rawgameid)
        //     console.log("GAMEID", gameId)
        // })
    }

    //FUNCTION TO TURN OFF LAST EVENT LISTENER FOR GAMERESULTS
    const killEventResult = () => {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signers = web3.getSigner()
        console.log("Killing the game result event in coinflip game...")
        const contract = new ethers.Contract(coinflipAddress, abi, signers)
        const resultFilter = contract.filters.coinFlipResult(gameId)
        contract.off(resultFilter)
    }

    //FUNCTION TO CHECK IF THE EVENT REMOVER IS WORKING
    const listenerChecker = () => {
        const signers = web3.getSigner()
        const contract = new ethers.Contract(coinflipAddress, abi, signers)
        const resultFilter = contract.filters.coinFlipResult(gameId)
        if (contract.listenerCount(resultFilter) == 0) {
            console.log("CoinFlipResult event has been removed successfuly!")
        } else {
            console.log(
                "Number of event results listener is: ",
                contract.listenerCount(resultFilter)
            )
        }
    }

    //LISTENER FOR EVENT GAMEFINISHED TO GET THE WINNER AND LOSER OF THE GAME
    const listenToEventGameFinished = () => {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signers = web3.getSigner()
        console.log("Listening to a game finished event in coinflip minigame...")
        const contract = new ethers.Contract(coinflipAddress, abi, signers)
        const resultFilter1 = contract.filters.gameFinished(null, account)
        const resultFilter2 = contract.filters.gameFinished(null, null, account)
        provider.once("block", () => {
            contract.once(resultFilter1 || resultFilter2, (_gameId, _winner, _loser, _amount) => {
                console.log("loser", _loser.toString().toLowerCase())
                console.log("winner", _winner.toString().toLowerCase())
                if (_winner.toLowerCase() == account) {
                    console.log("Game has finished, the connected account was a Winner!")
                    console.log("the account address:", account.toString())
                } else {
                    console.log("Game has finished, the connected account was a Loser!")
                    console.log("the account address:", account.toString())
                }
            })
        })

        //ETHERS V6
        // contract.on("gameFinished", (_gameId, _winner, _loser, _amount) => {
        //     console.log("loser", _loser.toString().toLowerCase())
        //     console.log("winner", _winner.toString().toLowerCase())
        //     if (_winner.toLowerCase() == account) {
        //         console.log("Game has finished, the connected account was a Winner!")
        //         console.log("the account address:", account.toString())
        //     }
        //     if (_loser.toLowerCase() == account) {
        //         console.log("Game has finished, the connected account was a Loser!")
        //         console.log("the account address:", account.toString())
        //     }
        // })
    }

    //SETTING UP LISTENERS WHEN WE ARE NOT IN GAME AND WHEN WEB3 IS ENABLED
    useEffect(() => {
        if (!inGame) {
            if (isWeb3Enabled) {
                listenToEventGameCreated()
                listenToEventGameStarted()
                listenToEventGameFinished()
            }
        }
    }, [inGame, isWeb3Enabled])

    //SETTING UP LISTENER WHEN THE GAME STARTS AND WE GET GAMEID
    useEffect(() => {
        if (isWeb3Enabled && gameId != "0") {
            listenToEventResult()
        }
    }, [gameId])

    //RESTARTING OF THE MAIN PAGE, CLEARING THE THE STATE VARIABLES, AND ACTIVATING THE EVENT KILLER AND EVENT COUNTER
    function gameOver() {
        changeGame(false)
        changeGameId("0")
        setGameResult([])
        killEventResult()
        listenerChecker()
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
        <div className="">
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
                                    rawgameid={rawgameid}
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
                    gameId={gameId}
                    playerSymbol={playerSymbol}
                    gameResults={gameResults}
                    gameOver={gameOver}
                />
            )}
        </div>
    )
}
