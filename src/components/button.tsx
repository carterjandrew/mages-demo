import type React from "preact/compat";

type ButtonProps = React.HTMLProps<HTMLButtonElement> & {
		recharged: number
}

const Button: React.FC<ButtonProps> = ({recharged, children, ...props}) => {
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
										background: "gray",
										opacity: "50%",
										height: "40px",
										width: `${recharged > 100 ? 100 : recharged}%`
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
