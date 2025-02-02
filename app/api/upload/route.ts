import { NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";

// Validate environment variables
const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;
const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY;

// Early validation of required environment variables
if (!bucketName || !projectId || !clientEmail || !privateKey) {
  throw new Error(`Missing required environment variables:
    ${!bucketName ? 'GOOGLE_CLOUD_BUCKET_NAME' : ''}
    ${!projectId ? 'GOOGLE_CLOUD_PROJECT_ID' : ''}
    ${!clientEmail ? 'GOOGLE_CLOUD_CLIENT_EMAIL' : ''}
    ${!privateKey ? 'GOOGLE_CLOUD_PRIVATE_KEY' : ''}
  `);
}

const storage = new Storage({
  projectId,
  credentials: {
    client_email: clientEmail,
    private_key: privateKey.replace(/\\n/g, "\n"),
  },
});

const bucket = storage.bucket(bucketName);

export async function POST(req: Request) {
  try {
    // Verify bucket exists
    const [exists] = await bucket.exists();
    if (!exists) {
      console.error(`Bucket ${bucketName} does not exist`);
      return NextResponse.json(
        { error: `Storage bucket ${bucketName} not found` },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

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

      const publicUrl = `https://storage.googleapis.com/${bucketName}/uploads/${filename}`;
      return NextResponse.json({ url: publicUrl });
    } catch (uploadError: any) {
      console.error("Google Cloud Storage error:", uploadError);
      return NextResponse.json(
        { 
          error: "Storage upload failed", 
          details: uploadError.message,
          code: uploadError.code 
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { 
        error: "Upload failed", 
        details: error.message,
        code: error.code 
      },
      { status: 500 }
    );
  }
}
