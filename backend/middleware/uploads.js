import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import crypto from 'crypto';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
});

const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.S3_BUCKET_NAME,
    acl: 'public-read', // allows the image to be viewed in browser
    key: function (req, file, cb) {
      const randomName = crypto.randomBytes(16).toString('hex');
      const extension = file.originalname.split('.').pop();
      cb(null, `uploads/${randomName}.${extension}`);
    }
  }),
});

export default upload;
