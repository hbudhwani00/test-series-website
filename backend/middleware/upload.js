const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const path = require('path');

// Use local storage if S3 is not configured
const useS3 = process.env.S3_BUCKET_NAME && process.env.AWS_ACCESS_KEY_ID;

let upload;

if (useS3) {
  const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });

  upload = multer({
    storage: multerS3({
      s3,
      bucket: process.env.S3_BUCKET_NAME,
      key: (req, file, cb) => {
        const randomName = crypto.randomBytes(16).toString('hex');
        const ext = file.originalname.split('.').pop();
        cb(null, `uploads/${randomName}.${ext}`);
      },
    }),
  });
} else {
  // Fallback to local disk storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'backend/uploads/');
    },
    filename: (req, file, cb) => {
      const randomName = crypto.randomBytes(16).toString('hex');
      const ext = file.originalname.split('.').pop();
      cb(null, `${randomName}.${ext}`);
    }
  });

  upload = multer({ storage });
}

module.exports = upload;
