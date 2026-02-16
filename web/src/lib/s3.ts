import { S3Client } from "@aws-sdk/client-s3";

export function getS3() {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 env vars are missing");
  }

  return new S3Client({
    region: process.env.R2_REGION || "auto",
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}

export function bucketName() {
  const b = process.env.R2_BUCKET;
  if (!b) throw new Error("R2_BUCKET missing");
  return b;
}
