import { useEffect, useRef, useState } from 'preact/hooks'
import './app.css'
import Button from './components/button'
import { FaHeart } from 'react-icons/fa'
import type { FC } from 'preact/compat'
import { MdElectricBolt } from 'react-icons/md'
import Spell, { type SpellType } from './components/spell'

type MoveHandler = (p: Player) => void

type MoveDisabledHandler = (p: Player) => boolean

type SpellName = "Reload" | "Fireball" | "BigFireBall" | "Heal" | "Reflect"

const fireBallTime = 2
const bigFireBallTime = 3

type Move = {
		cooldown: number,
		triggerKey: string,
		handler: MoveHandler,
		disabledHandler: MoveDisabledHandler,
		lastTriggered: number
}

export interface Player {
		num: number
		hp: number
		mana: number
		shieldActivated: number
}

const p1Keys = ["1", "q", "a", "z", "x"]
const p2Keys = ["-", "p", "l", ",", "m"]

export function App() {
		const [player1, setPlayer1] = useState<Player>({
				hp: 3,
				mana: 0,
				shieldActivated: -10000,
				num: 1
		})
		const [player2, setPlayer2] = useState<Player>({
				hp: 3,
				mana: 0,
				shieldActivated: -10000,
				num: 2
		})
		const shieldTimeout = 1000
		const [p1ShieldActive, setP1ShieldActive] = useState(false)
		function activateP1Shield(){
			setP1ShieldActive(true)
			async function disableShield(){
				await new Promise(r => setTimeout(r, shieldTimeout))
				setP1ShieldActive(false)
			}
			disableShield()
		}
		const [p2ShieldActive, setP2ShieldActive] = useState(false)
		function activateP2Shield(){
			setP2ShieldActive(true)
			async function disableShield(){
				await new Promise(r => setTimeout(r, shieldTimeout))
				setP2ShieldActive(false)
			}
			disableShield()
		}
		const [liveMoves1, setLiveMoves1] = useState<Array<SpellType>>([])
		const [liveMoves2, setLiveMoves2] = useState<Array<SpellType>>([])

		async function onFireballLand(spell: SpellType){
			await new Promise(r => setTimeout(r, spell.airTime * 1000))
			const setLiveMoves = spell.playerOne ? setLiveMoves1 : setLiveMoves2
			setLiveMoves(a => a.slice(1))
		}

		const moveHanders: Record<SpellName, MoveHandler> = {
				"Heal": (p) => {
						const setPlayer = p.num == 1 ? setPlayer1 : setPlayer2
						setPlayer({...p, hp: p.hp + 1})
				},
				"Reload": (p) => {
						const setPlayer = p.num == 1 ? setPlayer1 : setPlayer2
						setPlayer({...p, mana: p.mana + 1})
				},
				"Reflect": (p) => {
						const activateShield = p.num == 1 ? activateP1Shield: activateP2Shield
						activateShield()
						const setPlayer = p.num == 1 ? setPlayer1 : setPlayer2
						setPlayer({...p, mana: p.mana - 1})
				},
				"Fireball": (p) => {
						const setPlayer = p.num == 1 ? setPlayer1 : setPlayer2
						setPlayer({...p, mana: p.mana - 1})
						const setLiveMoves = p.num == 1 ? setLiveMoves1 : setLiveMoves2
						const fireball: SpellType = {
								hp: 1,
								playerOne: p.num == 1,
								airTime: fireBallTime,
								timeCast: performance.now()
						}
						setLiveMoves(lm => {
								return [...lm, fireball]
						})
						onFireballLand(fireball)
				},
				"BigFireBall": (p) => {
						const setPlayer = p.num == 1 ? setPlayer1 : setPlayer2
						setPlayer({...p, mana: p.mana - 2})
						const setLiveMoves = p.num == 1 ? setLiveMoves1 : setLiveMoves2
						const fireball: SpellType = {
								hp: 2,
								playerOne: p.num == 1,
								airTime: bigFireBallTime,
								timeCast: performance.now()
						}
						setLiveMoves(lm => {
								return [...lm, fireball]
						})
						onFireballLand(fireball)
				}
		}

		const moveDisabledHandlers: Record<SpellName, MoveDisabledHandler> = {
				"Heal": (p) => {
						return true
				},
				"Reload": (p) => {
						return true
				},
				"Reflect": (p) => {
						return p.mana > 0
				},
				"Fireball": (p) => {
						return p.mana > 0
				},
				"BigFireBall": (p) => {
						return p.mana > 1
				},
		}

		const spellCooldowns: Record<SpellName, number> = {
				"Heal": 			10,
				"BigFireBall": 		40,
				"Fireball": 		20,
				"Reflect": 			30,
				"Reload": 			10,
		}

		const p1Moves = useRef<Record<SpellName, Move> | null>(null)
		if (!p1Moves.current) {
		  p1Moves.current = {} as Record<SpellName, Move>
		  ;(Object.keys(moveDisabledHandlers) as SpellName[]).forEach((key, index) => {
		    p1Moves.current![key] = {
		      triggerKey: p1Keys[index],
		      cooldown: spellCooldowns[key],
		      disabledHandler: moveDisabledHandlers[key],
		      handler: moveHanders[key],
		      lastTriggered: 0,
		    }
		  })
		}
		const keyToSpell1: Record<string, SpellName> = {}
		Object.entries(p1Moves.current).forEach(([key, value], _) => {
				keyToSpell1[value.triggerKey] = key as SpellName
		})

		const [p1Recharge, setP1Recharge] = useState<Record<SpellName, number>>({
				"Reload": 0,
				"Heal": 0,
				"Reflect": 0,
				"Fireball": 0,
				"BigFireBall": 0,
		})
		
		const [p1Disabled, setP1Disabled] = useState<Record<SpellName, boolean>>({
				"Reload": true,
				"Heal": true,
				"Reflect": true,
				"Fireball": true,
				"BigFireBall": true,
		})


		const p2Moves = useRef<Record<SpellName, Move> | null>(null)
		if (!p2Moves.current) {
		  p2Moves.current = {} as Record<SpellName, Move>
		  ;(Object.keys(moveDisabledHandlers) as SpellName[]).forEach((key, index) => {
		    p2Moves.current![key] = {
		      triggerKey: p2Keys[index],
		      cooldown: spellCooldowns[key],
		      disabledHandler: moveDisabledHandlers[key],
		      handler: moveHanders[key],
		      lastTriggered: 0,
		    }
		  })
		}

		const keyToSpell2: Record<string, SpellName> = {}
		Object.entries(p2Moves.current).forEach(([key, value], _) => {
				keyToSpell2[value.triggerKey] = key as SpellName
		})

		const [p2Recharge, setP2Recharge] = useState<Record<SpellName, number>>({
				"Reload": 0,
				"Heal": 0,
				"Reflect": 0,
				"Fireball": 0,
				"BigFireBall": 0,
		})
		
		const [p2Disabled, setP2Disabled] = useState<Record<SpellName, boolean>>({
				"Reload": true,
				"Heal": true,
				"Reflect": true,
				"Fireball": true,
				"BigFireBall": true,
		})

		function objectMap(object, mapFn) {
		  return Object.keys(object).reduce(function(result, key) {
			result[key] = mapFn(key, object[key])
			return result
		  }, {})
		}

		const requestRef = useRef<number>()

		const player1Ref = useRef(player1)
		const player2Ref = useRef(player2)

		useEffect(() => { player1Ref.current = player1 }, [player1])
		useEffect(() => { player2Ref.current = player2 }, [player2])

		const animate = time => {
				setP1Recharge(
						objectMap(p1Recharge, (k, v) => {
								const move = p1Moves.current[k as SpellName]
								return (time - move.lastTriggered) / move.cooldown
						})
				)
				setP2Recharge(
						objectMap(p2Recharge, (k, v) => {
								const move = p2Moves.current[k as SpellName]
								return (time - move.lastTriggered) / move.cooldown
						})
				)
				setP1Disabled(
						objectMap(p1Disabled, (k, v) => {
								const move = p1Moves.current[k as SpellName]
								const recharge = (time - move.lastTriggered) / move.cooldown
								return recharge < 97 || !move.disabledHandler(player1Ref.current)
						})
				)
				setP2Disabled(
						objectMap(p2Disabled, (k, v) => {
								const move = p2Moves.current[k as SpellName]
								const recharge = (time - move.lastTriggered) / move.cooldown
								return recharge < 97 || !move.disabledHandler(player2Ref.current)
						})
				)
				requestRef.current = requestAnimationFrame(animate)
		}

		useEffect(() => {
				requestRef.current = requestAnimationFrame(animate)
				return () => cancelAnimationFrame(requestRef.current!)
		}, [])

		useEffect(() => {
				const handleKeyUp = (event: KeyboardEvent) => {
						const p1Key = keyToSpell1[event.key]
						const p2Key = keyToSpell2[event.key]
						if(p1Key){
								if(p1Disabled[p1Key]) return;
								p1Moves.current[p1Key].handler(player1)
								p1Moves.current[p1Key].lastTriggered = performance.now()
						}
						if(p2Key){
								if(p2Disabled[p2Key]) return;
								p2Moves.current[p2Key].handler(player2)
								p2Moves.current[p2Key].lastTriggered = performance.now()
						}
				}
				window.addEventListener("keyup", handleKeyUp)
				return () => {
						window.removeEventListener("keyup", handleKeyUp)
				}
		}, [p1Disabled, p2Disabled])

		return (
				<div style={{
						display: "flex",
						flexDirection: "row",
						width: "100vw",
						height: "100vh",
						padding: "40px",
				}}>
						<div style={{display: "flex", flexDirection: "column", minWidth: "20%", height: '100%'}}>
							<div style={{display: "flex", flexDirection: "row", gap: "5px"}} >
							{Array.from({length: player1.mana}).map(() => (
								<MdElectricBolt style={{
									color: "blue",
								}} />
							))}
							</div>
							<div style={{display: "flex", flexDirection: "row", gap: "5px"}} >
							{Array.from({length: player1.hp}).map(() => (
								<FaHeart style={{
									color: "red",
								}} />
							))}
							</div>
								<div style={{
									flex: 1,
									display: "flex",
									justifyContent: "center",
									alignItems: "center",
									position: "relative"
								}}>
									<div style={{
										display: p1ShieldActive ? "block": "none",
										position: "absolute",
										width: "35vh",
										height: "35vh",
										borderRadius: "18vh",
										zIndex: -1,
										boxShadow: `0px 0px 3vh 1vh lightblue inset`
									}} />
									<h1
										style={{
											fontFamily: "Times New Roman",
											fontSize: "30vh",
										}}
									> A </h1>
								</div>
								<a> HP: {player1.hp} </a>
								<a> Mana: {player1.mana} </a>
								{Object.entries(p1Moves.current).map(([key, value], _) => (
										<Button
											recharged={p1Recharge[key]}
											disabled={p1Disabled[key]}
										> {key} ({value.triggerKey}) </Button>
								))}
						</div>
						<div style={{flex: 1, position: "relative", display: "flex", alignItems: "center"}}>
							<div style={{
								width: "100%",
								height: "10px",
								position: "absolute",
								display: "flex",
								alignItems: "center"
								}}
							>
							{liveMoves1.map(move => (
								<Spell
									spell={move}
								/>
							))}
							</div>
						</div>
						<div style={{display: "flex", flexDirection: "column", minWidth: "20%"}}>
							<div style={{display: "flex", flexDirection: "row", gap: "5px", justifyContent: "end"}} >
							{Array.from({length: player2.mana}).map(() => (
								<MdElectricBolt style={{
									color: "blue",
								}} />
							))}
							</div>
							<div style={{display: "flex", flexDirection: "row", gap: "5px", justifyContent: "end"}} >
							{Array.from({length: player2.hp}).map(() => (
								<FaHeart style={{
									color: "red",
								}} />
							))}
							</div>
								<div style={{
									flex: 1,
									display: "flex",
									justifyContent: "center",
									alignItems: "center",
									position: "relative"
								}}>
									<div style={{
										display: p2ShieldActive ? "block": "none",
										position: "absolute",
										width: "35vh",
										height: "35vh",
										borderRadius: "18vh",
										zIndex: -1,
										boxShadow: `0px 0px 3vh 1vh lightblue inset`
									}} />
									<h1
										style={{
											fontFamily: "Times New Roman",
											fontSize: "30vh",
										}}
									> B </h1>
								</div>
								<a> HP: {player2.hp} </a>
								<a> Mana: {player2.mana} </a>
								{Object.entries(p2Moves.current).map(([key, value], _) => (
										<Button
											recharged={p2Recharge[key]}
											disabled={p2Disabled[key]}
										> {key} ({value.triggerKey}) </Button>
								))}
						</div>
				</div>
		)
}
