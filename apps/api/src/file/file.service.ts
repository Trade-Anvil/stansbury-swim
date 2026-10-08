import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { put } from '@vercel/blob'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import 'multer'
import { ConfigEnum } from '../shared/config.enum'

// Longest side kept for uploaded photos. The largest place one displays is about 600px wide, which leaves room for
// high-density screens.
const MAX_DIMENSION = 2400

@Injectable()
export class FileService {
  constructor(private readonly configService: ConfigService) {}

  async uploadFile(file: Express.Multer.File, userId: string): Promise<string> {
    // Read at upload time instead of in the constructor, so a missing token breaks uploads and not the whole API.
    const token = this.configService.get<string>(ConfigEnum.BlobReadWriteToken)
    if (!token) {
      throw new InternalServerErrorException('File storage is not configured')
    }

    // Uploads are public, and phone photos carry GPS coordinates in their EXIF data. Re-encoding applies the EXIF
    // orientation, then drops all metadata and caps the size.
    const image = await sharp(file.buffer)
      .rotate()
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer()

    // Every upload gets a new random path and is never overwritten, so it can be cached for a year.
    // https://vercel.com/docs/vercel-blob/using-blob-sdk
    const blob = await put(`${userId}/${uuidv4()}.jpg`, image, {
      access: 'public',
      contentType: 'image/jpeg',
      cacheControlMaxAge: 31536000,
      token,
    })
    return blob.url
  }
}
