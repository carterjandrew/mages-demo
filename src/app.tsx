import { useEffect, useRef, useState } from 'preact/hooks'
import './app.css'
import Button from './components/button'
import { FaHeart } from 'react-icons/fa'
import { MdElectricBolt } from 'react-icons/md'
import Spell, { type SpellType } from './components/spell'

type MoveHandler = (p: Player) => void

type MoveDisabledHandler = (p: Player) => boolean

export type SpellName = "Reload" | "Fireball" | "BigFireBall" | "Heal" | "Reflect" | "Amplify"

const activeSpells: Array<SpellName> = [
	"Fireball", "Amplify", "Reflect"
]

const fireBallTime = 2
const bigFireBallTime = 3

export type Move = {
		cooldown: number,
		triggerKey: string,
		handler: MoveHandler,
		disabledHandler: MoveDisabledHandler,
}

export interface Player {
		num: number
		hp: number
		mana: number
		shieldActivated: number
}

const p1Keys = ["1", "q", "a", "z", "x", "s"]
const p2Keys = ["-", "p", "l", ",", "m", "k"]

const spellCooldowns: Record<SpellName, number> = {
		"Heal":					1,
		"BigFireBall": 	4,
		"Fireball": 		2,
		"Reflect": 			3,
		"Reload": 			1,
		"Amplify": 			3,
}


export function App() {
		function initTriggered(){
			const t = {} as Record<SpellName, number>
			activeSpells.forEach(n => {
				t[n] = 0
			})
			return t
		}
		const [p1Triggered, setP1Triggered] = useState(initTriggered)
		const [p2Triggered, setP2Triggered] = useState(initTriggered)
		const numSpellsCast = useRef<number>(0)
		const [player1, setPlayer1] = useState<Player>({
				hp: 5,
				mana: 2,
				shieldActivated: -10000,
				num: 1
		})
		const [player2, setPlayer2] = useState<Player>({
				hp: 5,
				mana: 2,
				shieldActivated: -10000,
				num: 2
		})
		const manaRecoverTime = 4000
		async function manaRecover(){
			while(true){
				await new Promise(r => setTimeout(r, manaRecoverTime))
				setPlayer1(p => ({
					...p,
					mana: p.mana + 1
				}))
				setPlayer2(p => ({
					...p,
					mana: p.mana + 1
				}))
			}
		}
		useEffect(() => {
			manaRecover()
		}, [])
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
		const p1ShieldActiveRef = useRef(p1ShieldActive)
		useEffect(() => {
			p1ShieldActiveRef.current = p1ShieldActive
		}, [p1ShieldActive])
		const [p2ShieldActive, setP2ShieldActive] = useState(false)
		function activateP2Shield(){
			setP2ShieldActive(true)
			async function disableShield(){
				await new Promise(r => setTimeout(r, shieldTimeout))
				setP2ShieldActive(false)
			}
			disableShield()
		}
		const p2ShieldActiveRef = useRef(p2ShieldActive)
		useEffect(() => {
			p2ShieldActiveRef.current = p2ShieldActive
		}, [p2ShieldActive])
		const [liveMoves1, setLiveMoves1] = useState<Array<SpellType>>([])
		const [liveMoves2, setLiveMoves2] = useState<Array<SpellType>>([])

		const liveMovesRef1 = useRef(liveMoves1)
		const liveMovesRef2 = useRef(liveMoves2)

		useEffect(() => {liveMovesRef1.current = liveMoves1}, [liveMoves1])
		useEffect(() => {liveMovesRef2.current = liveMoves2}, [liveMoves2])

		async function onAmplifyLand(spell: SpellType){
			await new Promise(r => setTimeout(r, spell.airTime * 1000))
			const setLiveMoves = spell.playerOne ? setLiveMoves1 : setLiveMoves2
			setLiveMoves(lm => lm.filter(m => m.id != spell.id))
		}
		async function onFireballLand(spell: SpellType){
			await new Promise(r => setTimeout(r, spell.airTime * 1000))
			const setLiveMoves = spell.playerOne ? setLiveMoves1 : setLiveMoves2
			const time = performance.now()
			setLiveMoves(a => {
				const retVal = a.filter(m => m.id != spell.id)
				const currMove = a.find(m => m.id === spell.id)!
				if(currMove.hp === 0) return retVal;
				const shieldActive = (currMove.playerOne ? p2ShieldActiveRef : p1ShieldActiveRef).current
				if(shieldActive){
					const setHitMoves = spell.playerOne ? setLiveMoves2 : setLiveMoves1
					const newSpell: SpellType = {
						name: spell.name,
						hp: currMove.hp,
						playerOne: !currMove.playerOne,
						id: numSpellsCast.current++,
						airTime: spell.airTime,
						timeCast: time,
					}
					setHitMoves(a => [
						...a, newSpell
					])
					onFireballLand(newSpell)
				} else {
					const setPlayer = currMove.playerOne ? setPlayer2 : setPlayer1
					setPlayer(p => {
						return {
							...p,
							hp: p.hp - currMove.hp
						}
					})
				}
				return retVal
			})
		}

		const moveHanders: Record<SpellName, MoveHandler> = {
				"Heal": (p) => {
						const setPlayer = p.num == 1 ? setPlayer1 : setPlayer2
						setPlayer(p => ({...p, hp: p.hp + 1}))
				},
				"Reload": (p) => {
						const setPlayer = p.num == 1 ? setPlayer1 : setPlayer2
						setPlayer(p => ({...p, mana: p.mana + 1}))
				},
				"Reflect": (p) => {
						const activateShield = p.num == 1 ? activateP1Shield: activateP2Shield
						activateShield()
						const setPlayer = p.num == 1 ? setPlayer1 : setPlayer2
						setPlayer(p => ({...p, mana: p.mana - 1}))
				},
				"Fireball": (p) => {
						const setPlayer = p.num == 1 ? setPlayer1 : setPlayer2
						setPlayer(p => ({...p, mana: p.mana - 1}))
						const setLiveMoves = p.num == 1 ? setLiveMoves1 : setLiveMoves2
						const fireball: SpellType = {
								name: "BigFireBall",
								hp: 1,
								playerOne: p.num == 1,
								airTime: fireBallTime,
								timeCast: performance.now(),
								id: numSpellsCast.current++
						}
						setLiveMoves(lm => {
								return [...lm, fireball]
						})
						onFireballLand(fireball)
				},
				"BigFireBall": (p) => {
						const setPlayer = p.num == 1 ? setPlayer1 : setPlayer2
						setPlayer(p => ({...p, mana: p.mana - 2}))
						const setLiveMoves = p.num == 1 ? setLiveMoves1 : setLiveMoves2
						const fireball: SpellType = {
								name: "BigFireBall",
								hp: 2,
								playerOne: p.num == 1,
								airTime: bigFireBallTime,
								timeCast: performance.now(),
								id: numSpellsCast.current++
						}
						setLiveMoves(lm => {
								return [...lm, fireball]
						})
						onFireballLand(fireball)
				},
				"Amplify": (p) => {
						const setPlayer = p.num == 1 ? setPlayer1 : setPlayer2
						setPlayer({...p, mana: p.mana - 1})
						const setLiveMoves = p.num == 1 ? setLiveMoves1 : setLiveMoves2
						const spell: SpellType = {
								name: "Amplify",
								hp: 1,
								playerOne: p.num == 1,
								airTime: bigFireBallTime,
								timeCast: performance.now(),
								id: numSpellsCast.current++
						}
						setLiveMoves(lm => {
								return [...lm, spell]
						})
						onAmplifyLand(spell)
				}
		}

		const moveDisabledHandlers: Record<SpellName, MoveDisabledHandler> = {
				"Heal": () => {
						return false
				},
				"Reload": () => {
						return false
				},
				"Reflect": (p) => {
						return p.mana < 1
				},
				"Fireball": (p) => {
						return p.mana < 1
				},
				"BigFireBall": (p) => {
						return p.mana < 2
				},
				"Amplify": (p) => {
					return p.mana < 1
				}
		}

		function initMoveSet(isP1: boolean): Record<SpellName, Move> {
			const moveSet = {} as Record<SpellName, Move>
			const triggerKeys = isP1 ? p1Keys : p2Keys
			for(const index in activeSpells){
				const spellName = activeSpells[index]
				moveSet[spellName] = {
					triggerKey: triggerKeys[index],
					cooldown: spellCooldowns[spellName],
					disabledHandler: moveDisabledHandlers[spellName],
					handler: moveHanders[spellName],
				}
			}
			return moveSet
		}

		const p1Moves = useRef(initMoveSet(true))
		const p2Moves = useRef(initMoveSet(false))

		const keyToSpell1: Record<string, SpellName> = {}
		Object.entries(p1Moves.current).forEach(([key, value], _) => {
				keyToSpell1[value.triggerKey] = key as SpellName
		})

		function initDisabled(): Record<SpellName, boolean> {
			const d = {} as Record<SpellName, boolean>
			activeSpells.forEach(n => {
				d[n] = true 
			})
			return d
		}

		const [p1Disabled, setP1Disabled] = useState(initDisabled())


		const keyToSpell2: Record<string, SpellName> = {}
		Object.entries(p2Moves.current).forEach(([key, value], _) => {
				keyToSpell2[value.triggerKey] = key as SpellName
		})

		const [p2Disabled, setP2Disabled] = useState(initDisabled())

		// const player1Ref = useRef(player1)
		// const player2Ref = useRef(player2)

		// useEffect(() => { player1Ref.current = player1 }, [player1])
		// useEffect(() => { player2Ref.current = player2 }, [player2])

		const spellCollisions = useRef<Record<number, Array<number>>>({})

		function getProgress(time: number, spell: SpellType): number {
			return (time - spell.timeCast) / (1000 * spell.airTime)
		}

		function handleSpellCollisions(){
			const time = performance.now()
			liveMovesRef1.current.forEach((s1, i1) => {
				liveMovesRef2.current.forEach((s2, i2) => {
					if(s1.hp == 0 || s2.hp == 0) return;
					const collisions = spellCollisions.current[s1.id]
					if(collisions && collisions.find(id => id === s2.id)) return;
					const p1 = getProgress(time, s1)
					const p2 = 1 - getProgress(time, s2)
					if(Math.abs(p1 - p2) > 0.1) return;
					const newCollisions = collisions ? [s2.id, ...collisions] : [s2.id]
					spellCollisions.current[s1.id] = newCollisions
					let hpChange1 = -1
					let hpChange2 = -1
					if(s1.name === "Amplify") hpChange2 = s1.hp;
					if(s2.name === "Amplify") hpChange1 = s2.hp;
					s1.hp += hpChange1;
					s2.hp += hpChange2;
					setLiveMoves1(lm => (
						lm.map((m, i) => (i === i1 ? {...s1} : m))
					))
					setLiveMoves2(lm => (
						lm.map((m, i) => (i === i2 ? {...s2} : m))
					))
				})
			})
		}

		const requestRef = useRef<number>(null)

		function animate(){
			handleSpellCollisions()
			requestRef.current = requestAnimationFrame(animate)
		}

		useEffect(() => {
			function cancel(){
				if(requestRef.current) cancelAnimationFrame(requestRef.current);
			}
			cancel()
			requestRef.current = requestAnimationFrame(animate)
			return cancel
		}, [])

		async function cooldownSpell(isP1: boolean, name: SpellName){
			const setCooldown = isP1 ? setP1Cooldown : setP2Cooldown
			setCooldown(c => ({
				...c,
				[name]: true
			}))
			const cooldown = spellCooldowns[name]
			await new Promise(r => setTimeout(r, cooldown * 1000))
			setCooldown(c => ({
				...c,
				[name]: false
			}))
		}
	function initCooldown(): Record<SpellName, boolean>{
		const cd = {} as Record<SpellName, boolean>
		activeSpells.forEach(n => {
			cd[n] = true
		})
		return cd
	}
	const [p1Cooldown, setP1Cooldown] = useState<Record<SpellName, boolean>>(initCooldown())
	const [p2Cooldown, setP2Cooldown] = useState<Record<SpellName, boolean>>(initCooldown())

	useEffect(() => {
		Object.keys(p1Cooldown).forEach((n) => {
			cooldownSpell(true, n as SpellName)
		})
		Object.keys(p2Cooldown).forEach((n) => {
			cooldownSpell(false, n as SpellName)
		})
	}, [])

		useEffect(() => {
			setP1Disabled(p1D => {
				for(const key of Object.keys(p1D)){
					const k = key as SpellName
					p1D[k] = p1Moves.current![k].disabledHandler(player1)
				}
				return p1D
			})
		}, [player1])

		useEffect(() => {
			setP2Disabled(p2D => {
				for(const key of Object.keys(p2D)){
					const k = key as SpellName
					p2D[k] = p2Moves.current![k].disabledHandler(player2)
				}
				return p2D
			})
		}, [player2])

		useEffect(() => {
				const handleKeyUp = (event: KeyboardEvent) => {
						const p1Key = keyToSpell1[event.key]
						const p2Key = keyToSpell2[event.key]
						if(p1Key){
								if(p1Disabled[p1Key] || p1Cooldown[p1Key]) return;
								const move = p1Moves.current[p1Key]
								move.handler(player1)
								setP1Triggered(t => ({
									...t,
									[p1Key]: performance.now()
								}))
								cooldownSpell(true, p1Key)
						}
						if(p2Key){
								if(p2Disabled[p2Key] || p2Cooldown[p2Key]) return;
								p2Moves.current[p2Key].handler(player2)
								setP2Triggered(t => ({
									...t,
									[p2Key]: performance.now()
								}))
								cooldownSpell(false, p2Key)
						}
				}
				window.addEventListener("keyup", handleKeyUp)
				return () => {
						window.removeEventListener("keyup", handleKeyUp)
				}
		}, [p1Disabled, p2Disabled, p1Cooldown, p2Cooldown])

		if(player1.hp < 1) return (
			<div style={{
				width: '100vw',
				height: '100vh',
				display: "flex",
				flexDirection: "column",
				justifyContent: 'center',
				alignItems: 'center'
			}}
			>
				<h1> Player 2 wins!! </h1>
				<p> Reload the page to play again </p>
			</div>
		)

		if(player2.hp < 1) return (
			<div style={{
				width: '100vw',
				height: '100vh',
				display: "flex",
				flexDirection: "column",
				justifyContent: 'center',
				alignItems: 'center'
			}}
			>
				<h1> Player 1 wins!! </h1>
				<p> Reload the page to play again </p>
			</div>
		)
		

		return (
				<div style={{
						display: "flex",
						flexDirection: "row",
						width: "100vw",
						height: "100vh",
						padding: "40px",
				}}>
						<div style={{display: "flex", flexDirection: "column", minWidth: "20%", height: '100%'}}>
							<div style={{display: "flex", flexDirection: "row", gap: "5px", maxWidth: "100%", overflowX: "clip", alignItems: 'center'}} >
							{Array.from({length: player1.hp}).map(() => (
								<FaHeart style={{
									color: "red",
									fontSize: '3vw'
								}} />
							))}
							</div>
								<a
									style={{
										fontSize: "3vw",
										textAlign: "left",
										color: player1.mana < 3 ? "red": "blue"
									}}
								> <MdElectricBolt />: {player1.mana} </a>
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
								{Object.entries(p1Moves.current).map(([key, value], _) => {
									const k = key as SpellName
									return (
										<Button
											disabled={p1Disabled[k] || p1Cooldown[k]}
											lastTriggered={p1Triggered[k]}
											cooldown={spellCooldowns[k]}
										> {key} ({value.triggerKey}) </Button>
								)
								})}
						</div>
						<div style={{flex: 1, position: "relative", display: "flex", alignItems: "center", minWidth: "20vw"}}>
							<div style={{
								width: "100%",
								height: "10px",
								position: "relative",
								display: "flex",
								alignItems: "center",
								}}
							>
							{liveMoves1.map(move => (
								<Spell
									key={move.id}
									spell={move}
								/>
							))}
							{liveMoves2.map(move => (
								<Spell
									key={move.id}
									spell={move}
								/>
							))}
							</div>
						</div>
						<div style={{display: "flex", flexDirection: "column", minWidth: "20%"}}>
							<div style={{display: "flex", flexDirection: "row", gap: "5px", maxWidth: "100%", overflowX: "clip", justifyContent: "end"}} >
							{Array.from({length: player2.hp}).map(() => (
								<FaHeart style={{
									color: "red",
									fontSize: '3vw'
								}} />
							))}
							</div>
								<p
									style={{
										fontSize: "3vw",
										textAlign: "right",
										color: player2.mana < 3 ? "red": "blue"
									}}
								> <MdElectricBolt />: {player2.mana} </p>
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
								{Object.entries(p2Moves.current).map(([key, value], _) => {
									const k = key as SpellName
									return (
										<Button
											disabled={p2Disabled[k] || p2Cooldown[k]}
											lastTriggered={p2Triggered[k]}
											cooldown={spellCooldowns[k]}
										> {key} ({value.triggerKey}) </Button>
								)
								})}
						</div>
				</div>
		)
}
