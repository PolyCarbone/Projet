import Image from "next/image"

interface LogoProps {
    className?: string
    width?: number
    height?: number
    radiusClass?: string
}

export function Logo({ className = "size-4", width = 16, height = 16, radiusClass = "rounded-sm" }: LogoProps) {
    return (
        <Image
            src="/images/LogoPolycarbone.png"
            alt="PolyCarbone Logo"
            width={width}
            height={height}
            className={`rounded-sm ${className}`}
        />
    )
}
