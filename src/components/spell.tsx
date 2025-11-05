import type { CSSProperties } from "preact"
import { useEffect, useMemo, useRef, useState } from "preact/hooks"
import type { SpellName } from "../app"

export type SpellType = {
		name: SpellName,
		hp: number,
		playerOne: boolean,
		timeCast: number
		airTime: number
		id: number
}
type SpellProps = React.HTMLProps<HTMLDivElement> & {
		spell: SpellType
}

const Spell: React.FC<SpellProps> = ({spell, ...props}) => {
		const [deltaTime, setDeltaTime] = useState(0)
		const complete = useMemo(() => Math.floor(deltaTime / (10 * spell.airTime) ), [deltaTime])
		const requestRef = useRef<number>()
		function getColor(){
				switch(spell.hp) {
						case 1:
								return "orange"
						case 2:
								return "red"
						default:
								return "orange"
				}
		}
		const color = getColor()
		function getSize(){
				if(spell.hp == 2) return 150
				if(spell.hp == 1) return 90
				return 60
		}
		const size = getSize()

		const animate = time => {
				const dt = time - spell.timeCast
				setDeltaTime(dt)
				requestRef.current = requestAnimationFrame(animate)
		}


		useEffect(() => {
				function cancelAnimation(){
						if(requestRef.current){
								cancelAnimationFrame(requestRef.current)
						}
				}
				requestRef.current = requestAnimationFrame(animate)
				return cancelAnimation
		}, [])
		const side: string = spell.playerOne ? "left": "right"
		const divStyle: CSSProperties = {
			position: "absolute",
			display: spell.hp == 0 ? 'none': 'block',
			[side]: `${complete}%`,
			zIndex: 10,
			height: `${size}px`,
			width: `${size}px`,
			borderRadius: `${size/2}px`,
			boxShadow: `0px 0px ${size/4}px ${size/4}px ${color} inset`
		}
		return (
				<div
						style={ divStyle }
						{...props}
				/>
		)
}

export default Spell
