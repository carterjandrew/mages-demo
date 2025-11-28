import type React from "preact/compat";
import { useEffect, useRef, useState } from "preact/compat";

type BuildupProps = React.HTMLProps<HTMLButtonElement> & {
	buttonDown: boolean,
	lastTriggered: number,
	buildup: number,
	glowColor: string,
	glowRadiusFactor: number,
}

const Buildup: React.FC<BuildupProps> = ({lastTriggered, glowRadiusFactor, buttonDown, buildup, glowColor, children, ...props}) => {
	const [buProgress, setBUProgress] = useState(0)
	const [glowRadius, setGlowRadius] = useState(0)
	
	const requestRef = useRef<number>(null)


	function min(n1: number, n2: number): number {
		return n1 < n2 ? n1 : n2
	}

	function max(n1: number, n2: number): number {
		return n1 > n2 ? n1 : n2
	}

	function round(n: number, factor: number): number {
		return Math.floor(n * factor) / factor
	}

	function animate(time: number){
		if(!buttonDown){
			setBUProgress(0)
			setGlowRadius(0)
			return
		}
		const deltaTime = time - lastTriggered
		const progress = deltaTime / (buildup * 1000)
		const steps = progress % 1
		setBUProgress(min(steps, 1))
		const overflow = round(progress - 1, 10)
		setGlowRadius(max(overflow * glowRadiusFactor, 0))
		console.log("Overflow", overflow)
		requestRef.current = requestAnimationFrame(animate)
	}

	useEffect(() => {
		function cancel(){
			if(requestRef.current) cancelAnimationFrame(requestRef.current)
		}
		cancel()
		requestRef.current = requestAnimationFrame(animate)
		return cancel
	}, [lastTriggered, buttonDown])

	return (
			<button
					{...props}
					style={{
							border: 'solid',
							borderWidth: '2px',
							borderRadius: 0,
							borderColor: "white",
							position: "relative",
							padding: 0,
							width: "100%",
							boxShadow: `0px 0px ${glowRadius}px ${glowColor}`,
							textShadow: `0px 0px ${glowRadius}px ${glowColor}`,
					}}
			>
					<div
							style={{
									background: glowColor,
									opacity: "50%",
									height: "40px",
									width: `${buProgress * 100}%`
							}}
					/>
					<div
							style={{
									position: "absolute",
									top: 0,
									bottom: 0,
									left: 0,
									right: 0,
									zIndex: 10,
									display: "flex",
									justifyContent: "center",
									alignItems: "center",
							}}
					>
							{children}
					</div>
			</button>
	)
}

export default Buildup
