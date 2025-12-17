import { ImageResponse } from 'next/og'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const runtime = 'edge'

export const size = {
    width: 32,
    height: 32,
}

export const contentType = 'image/png'

export default async function Icon() {
    const imagePath = join(process.cwd(), 'public', 'images', 'LogoPolycarbone.png')
    const imageData = await readFile(imagePath)
    const base64Image = `data:image/png;base64,${imageData.toString('base64')}`

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                }}
            >
                <img
                    src={base64Image}
                    alt="PolyCarbone Logo"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '10%',
                    }}
                />
            </div>
        ),
        {
            ...size,
        }
    )
}
