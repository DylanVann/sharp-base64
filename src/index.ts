const sharp = require('sharp')
const _ = require('lodash')

interface Base64Options {
    file: {
        id: string
        absolutePath: string
    }
    options?: {
        width: number
        height: number | undefined
        quality: number
        jpegProgressive: boolean
        pngCompressionLevel: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
        grayscale: boolean
        toFormat: 'png' | 'jpg'
    }
}

const defaultOptions = {
    width: 20,
    quality: 50,
    jpegProgressive: true,
    pngCompressionLevel: 9,
    grayscale: false,
    toFormat: 'png',
}

export async function notMemoizedbase64(rawOptions: Base64Options) {
    const file = rawOptions.file
    const options = {
        ...defaultOptions,
        ...rawOptions.options,
    }
    let pipeline
    pipeline = sharp(file.absolutePath).rotate()

    pipeline
        .resize(options.width, options.height)
        .png({
            compressionLevel: options.pngCompressionLevel,
            adaptiveFiltering: false,
            force: options.toFormat === 'png',
        })
        .jpeg({
            quality: options.quality,
            progressive: options.jpegProgressive,
            force: options.toFormat === 'jpg',
        })

    // grayscale
    if (options.grayscale) {
        pipeline = pipeline.grayscale()
    }

    const [buffer, info] = await (pipeline as any).toBufferAsync()

    return {
        src: `data:image/${info.format};base64,${buffer.toString('base64')}`,
        width: info.width,
        height: info.height,
        aspectRatio: info.width / info.height,
    }
}

export const memoizedBase64 = _.memoize(
    notMemoizedbase64,
    ({ file, options }: Base64Options) =>
        `${file.id}${JSON.stringify(options)}`,
)

export async function base64(options: Base64Options) {
    return await memoizedBase64(options)
}
