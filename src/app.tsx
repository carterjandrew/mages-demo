import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import './app.css'
import Button from './components/button'

type MoveHandler = (p: Player) => void

type MoveDisabledHandler = (p: Player) => boolean

type SpellName = "Reload" | "Fireball" | "BigFireBall" | "Heal" | "Reflect"

type LiveSpell = {
		player: number,
		name: SpellName,
		hp: number
}

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
		const [liveMoves1, setLiveMoves1] = useState<Array<LiveSpell>>([])
		const [liveMoves2, setLiveMoves2] = useState<Array<LiveSpell>>([])
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
						const setPlayer = p.num == 1 ? setPlayer1 : setPlayer2
						setPlayer({
								...p,
								shieldActivated: performance.now(),
								mana: p.mana - 1
						})
				},
				"Fireball": (p) => {
						const setPlayer = p.num == 1 ? setPlayer1 : setPlayer2
						setPlayer({...p, mana: p.mana - 1})
						const setLiveMoves = p.num == 1 ? setLiveMoves1 : setLiveMoves2
						setLiveMoves(lm => {
								return [...lm, {
										hp: 1,
										name: "Fireball",
										player: p.num
								}]
						})
				},
				"BigFireBall": (p) => {
						const setPlayer = p.num == 1 ? setPlayer1 : setPlayer2
						setPlayer({...p, mana: p.mana - 2})
						const setLiveMoves = p.num == 1 ? setLiveMoves1 : setLiveMoves2
						setLiveMoves(lm => {
								return [...lm, {
										hp: 2,
										name: "BigFireBall",
										player: p.num
								}]
						})
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
						padding: "40px",
				}}>
						<div style={{display: "flex", flexDirection: "column", minWidth: "20%"}}>
								<h1> A </h1>
								<a> HP: {player1.hp} </a>
								<a> Mana: {player1.mana} </a>
								{Object.entries(p1Moves.current).map(([key, value], _) => (
										<Button
											recharged={p1Recharge[key]}
											disabled={p1Disabled[key]}
										> {key} ({value.triggerKey}) </Button>
								))}
						</div>
						<div style={{flex: 1}}>
						</div>
						<div style={{display: "flex", flexDirection: "column", minWidth: "20%"}}>
								<h1> B </h1>
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
