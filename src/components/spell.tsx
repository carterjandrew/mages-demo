import { useEffect, useMemo, useRef, useState } from "preact/hooks"


export type SpellType = {
		hp: number,
		playerOne: boolean,
		timeCast: number
		airTime: number
}
type SpellProps = React.HTMLProps<HTMLDivElement> & {
		spell: SpellType
}

const Spell: React.FC<SpellProps> = ({spell, ...props}) => {
		const [deltaTime, setDeltaTime] = useState(0)
		const complete = useMemo(() => Math.floor(1000 * deltaTime / (spell.airTime * 1000) )/10, [deltaTime])
		const requestRef = useRef<number>()
		const color = useMemo(() => {
				switch(spell.hp) {
						case 1:
								return "orange"
						case 2:
								return "red"
						default:
								return "orange"
				}
		}, [spell])
		const size = useMemo(() => {
				if(spell.hp == 2) return 100
				if(spell.hp == 1) return 60
				return 60
		}, [spell])

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
		return (
				<div
						style={{
								position: "absolute",
								left: `${complete}%`,
								zIndex: 10,
								background: color,
								height: `${size}px`,
								width: `${size}px`,
								borderRadius: `${size/2}px`,
								boxShadow: `0px 0px ${size/4}px ${size/4}px ${color}, 0px 0px ${size/4}px ${size/4}px ${color} inset`
						}}
						{...props}
				/>
		)
}

export default Spell
