import type React from "preact/compat";
import { useEffect, useRef, useState } from "preact/compat";

type ButtonProps = React.HTMLProps<HTMLButtonElement> & {
	lastTriggered: number,
	cooldown: number
}

const Button: React.FC<ButtonProps> = ({lastTriggered, cooldown, children, ...props}) => {
		const [cooldownProgress, setCooldownProgress] = useState(0)
		const requestRef = useRef<number>(null)

		function min(n1: number, n2: number): number {
			return n1 < n2 ? n1 : n2
		}

		function animate(time: number){
			const deltaTime = time - lastTriggered
			const progress = deltaTime / (cooldown * 1000)
			setCooldownProgress(min(progress, 1))
			requestRef.current = requestAnimationFrame(animate)
		}

		useEffect(() => {
			function cancel(){
				if(requestRef.current) cancelAnimationFrame(requestRef.current)
			}
			cancel()
			requestRef.current = requestAnimationFrame(animate)
			return cancel
		}, [lastTriggered])

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
								width: "100%"
						}}
				>
						<div
								style={{
										background: "grey",
										opacity: "50%",
										height: "40px",
										width: `${cooldownProgress * 100}%`
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

export default Button
