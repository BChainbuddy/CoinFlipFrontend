import Head from "next/head"
import Image from "next/image"
import styles from "@/styles/Home.module.css"
import Header from "../components/Header"
import CreateGame from "@/components/CreateGame"
import JoinGame from "@/components/JoinGame"
import { useEffect, useState } from "react"

export default function Home() {

    //VARIABLE WHICH IS CALLED IN CREATE GAME AND JOIN GAME TO UPDATEUI IN HEADER(BALANCE) AFTER COMPLETED TRANSACTION
    const [newUpdateUI, needToUpdateUI] = useState(false)
    
    //RETURNS THE MAIN PAGE
    return (
        <div>
            <Head>
                <title>CoinFlip</title>
                <meta name="description" content="CoinFlip minigame" />
            </Head>
            <Header newUpdateUI={newUpdateUI} needToUpdateUI={needToUpdateUI}/>
            <div className="flex">
                <CreateGame needToUpdateUI={needToUpdateUI} />
                <div style={{ maxHeight: "150px" }}><Image src="/CoinFlipCoin.jpg" alt="Coin Image" width={307} height={150}/></div>
                <JoinGame needToUpdateUI={needToUpdateUI} />
            </div>
        </div>
    )
}
