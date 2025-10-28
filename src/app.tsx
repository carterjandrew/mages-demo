import { useEffect, useMemo, useState } from 'preact/hooks'
import './app.css'

type GameMove = "Reload" | "Attack 1" | "Attack 2" | "Heal" | "Reflect"

interface Player {
		hp: number
		mana: number
		currentMove: GameMove
		ready: boolean
}

type GameState = "P1" | "P2" | "Result" | "End"

function isAttack(move: GameMove) {
		return move == "Attack 1" || move == "Attack 2"
}

function isReflect(move: GameMove) {
		return move == "Reflect"
}

type MoveFunc = (p1: Player, p2: Player) => [Player, Player]

type MoveFunctions = Record<GameMove, MoveFunc>

const moveFunctions: MoveFunctions = {
		"Reload": (p1, p2) => {
				return [{...p1, mana: p1.mana + 1}, p2]
		},
		"Heal": (p1, p2) => {
				if(isAttack(p2.currentMove)){
						return [p1, p2]
				}
				if(p1.hp > 4) {
						return [p1, p2]
				}
				return [{...p1, hp: p1.hp + 1}, p2]
		},
		"Attack 1": (p1, p2) => {
				p1.mana -= 1
				if(isAttack(p2.currentMove) || isReflect(p2.currentMove)){
						return [p1, p2]
				}
				return [p1, {...p2, hp: p2.hp - 1}]
		},
		"Attack 2": (p1, p2) => {
				p1.mana -= 2
				if(isAttack(p2.currentMove) || isReflect(p2.currentMove)){
						return [p1, p2]
				}
				return [p1, {...p2, hp: p2.hp - 2}]
		},
		"Reflect": (p1, p2) => {
				p1.mana -= 1
				if(isAttack(p2.currentMove)){
						const amount = p2.currentMove == "Attack 1" ? 1 : 2
						return [p1, {...p2, hp: p2.hp - amount}]
				}
				return [p1, p2]
		},
}

function applyMove(p1: Player, p2: Player) {
		console.log(p1);
		console.log(p2);
		[p1, p2] = moveFunctions[p1.currentMove](p1, p2);
		[p2, p1] = moveFunctions[p2.currentMove](p2, p1);
		return [p1, p2];
}

type MovePossible = (p: Player) => Record<GameMove, boolean>

const movePossible: MovePossible = (p) => {
		return {
				"Reload": true,
				"Attack 1": p.mana >= 1,
				"Attack 2": p.mana >= 2,
				"Reflect": p.mana >= 1,
				"Heal": p.hp < 4
		}
}

export function App() {
		const [player1, setPlayer1] = useState<Player>({
				hp: 3,
				mana: 0,
				currentMove: "Reload",
				ready: false
		})
		const p1Moves = useMemo(() => movePossible(player1), [player1])
		const [player2, setPlayer2] = useState<Player>({
				hp: 3,
				mana: 0,
				currentMove: "Reload",
				ready: false
		})
		const p2Moves = useMemo(() => movePossible(player2), [player2])
		const [gameState, setGameState] = useState<GameState>("P1")

		function applyInnerMoves(){
				const [p1, p2] = applyMove(player1, player2)
				setPlayer1({
						...p1,
						ready: false
				})
				setPlayer2({
						...p2,
						ready: false
				})
				if(p1.hp <= 0 || p2.hp <= 0){
						setGameState("End")
				} else {
						setGameState("Result")
				}
		}

		useEffect(() => {
				if(player1.ready && player2.ready){
						applyInnerMoves()
				}
		}, [player1, player2])

		if(gameState == "P1") return (
				<div style={{display: "flex", flexDirection: "column"}}>
						<h1> Player 1 </h1>
						<div style={{display: "flex", flexDirection: "row"}}>
								<a>HP: {player1.hp}</a>
						</div>
						<div style={{display: "flex", flexDirection: "row"}}>
								<a>Mana: {player1.mana}</a>
						</div>
						<h2> Possible Moves: </h2>
						{
								Object.entries(p1Moves).map(([k, v]) => (
										<button
												disabled={!v}
												onClick = {() => {
														setPlayer1({
																...player1,
																currentMove: k,
																ready: true
														})
														setGameState("P2")
												}}
										>{k}</button>
								))
						}
				</div>
		)
		if(gameState == "P2") return (
				<div style={{display: "flex", flexDirection: "column"}}>
						<h1> Player 2 </h1>
						<div style={{display: "flex", flexDirection: "row"}}>
								<a>HP: {player2.hp}</a>
						</div>
						<div style={{display: "flex", flexDirection: "row"}}>
								<a>Mana: {player2.mana}</a>
						</div>
						<h2> Possible Moves: </h2>
						{
								Object.entries(p2Moves).map(([k, v]) => (
										<button
												disabled={!v}
												onClick = {() => {
														setPlayer2({
																...player2,
																currentMove: k,
																ready: true
														})
												}}
										>{k}</button>
								))
						}
				</div>
		)
		if(gameState == "Result"){
				return (
						<div style={{display: "flex", flexDirection: "column"}}>
								<h1> Player 1 </h1>
								<div style={{display: "flex", flexDirection: "row"}}>
										<a>HP: {player1.hp}</a>
								</div>
								<div style={{display: "flex", flexDirection: "row"}}>
										<a>Mana: {player1.mana}</a>
								</div>
								<div style={{display: "flex", flexDirection: "row"}}>
										<a>Move Done: {player1.currentMove}</a>
								</div>
								<h1> Player 2 </h1>
								<div style={{display: "flex", flexDirection: "row"}}>
										<a>HP: {player2.hp}</a>
								</div>
								<div style={{display: "flex", flexDirection: "row"}}>
										<a>Mana: {player2.mana}</a>
								</div>
								<div style={{display: "flex", flexDirection: "row"}}>
										<a>Move Done: {player2.currentMove}</a>
								</div>
								<button
										onClick={() => {
												setGameState("P1")
										}}
								> Continue </button>
						</div>
				)
		}
		return (
				<div style={{display: "flex", flexDirection: "column"}}>
						<h1> Player {player1.hp <= 0 ? 2:1} wins </h1>
				</div>
		)
}
