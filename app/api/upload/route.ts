import { NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";

// Validate required environment variables
const BUCKET_NAME = process.env.GOOGLE_CLOUD_BUCKET_NAME;
if (!BUCKET_NAME) {
  throw new Error("GOOGLE_CLOUD_BUCKET_NAME environment variable is required");
}

// Initialize storage with explicit credentials
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
});

// Initialize bucket with validated name
const bucket = storage.bucket(BUCKET_NAME);

// Verify bucket exists before handling any requests
async function verifyBucket() {
  try {
    const [exists] = await bucket.exists();
    if (!exists) {
      throw new Error(`Bucket ${BUCKET_NAME} does not exist`);
    }
    return true;
  } catch (error) {
    console.error("Error verifying bucket:", error);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    // Verify bucket exists before proceeding
    const bucketExists = await verifyBucket();
    if (!bucketExists) {
      return NextResponse.json(
        { error: "Storage configuration error - bucket not found" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    const buffer = Buffer.from(await file.arrayBuffer());
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${uniqueSuffix}-${file.name}`;

    try {
      const blob = bucket.file(`uploads/${filename}`);
      await blob.save(buffer, {
        contentType: file.type,
        metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
        predefinedAcl: "publicRead",
      });

      const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/uploads/${filename}`;
      return NextResponse.json({ url: publicUrl });
    } catch (uploadError) {
      console.error("Google Cloud Storage error:", uploadError);
      return NextResponse.json(
        { error: "Storage upload failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
