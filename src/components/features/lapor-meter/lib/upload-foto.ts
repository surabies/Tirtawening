import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
})

interface UploadFotoParams {
  base64: string // base64 data URL
  periode: string // "202605"
  tipeFoto: 'stand' | 'segel' | 'rumah'
  nomorLangganan: string
}

interface UploadFotoResult {
  url: string
  publicId: string
}

export async function uploadFotoMeter({
  base64,
  periode,
  tipeFoto,
  nomorLangganan,
}: UploadFotoParams): Promise<UploadFotoResult> {
  const publicId = `${periode}_${tipeFoto}_${nomorLangganan}`

  const result = await cloudinary.uploader.upload(base64, {
    folder: `laporan-mandiri/${periode}`,
    public_id: publicId,

    overwrite: true,
    resource_type: 'image',

    transformation: [
      {
        quality: 'auto:good',
        fetch_format: 'auto',
        width: 1200,
        height: 1200,
        crop: 'limit',
      },
    ],
  })

  return {
    url: result.secure_url,
    publicId: result.public_id,
  }
}
