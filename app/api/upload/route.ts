import { NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";

// Early validation of environment variables
if (!process.env.GOOGLE_CLOUD_PROJECT_ID || 
    !process.env.GOOGLE_CLOUD_BUCKET_NAME || 
    !process.env.GOOGLE_CLOUD_CLIENT_EMAIL || 
    !process.env.GOOGLE_CLOUD_PRIVATE_KEY) {
  console.error('Missing required environment variables:', {
    projectId: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
    bucketName: !!process.env.GOOGLE_CLOUD_BUCKET_NAME,
    clientEmail: !!process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    privateKey: !!process.env.GOOGLE_CLOUD_PRIVATE_KEY,
  });
  throw new Error('Missing required Google Cloud credentials');
}

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    type: 'service_account',
    project_id: process.env.GOOGLE_CLOUD_PROJECT_ID,
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
});

const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;
const bucket = storage.bucket(bucketName);

console.log('check bucket',bucket)
console.log('check GOOGLE_CLOUD_BUCKET_NAME',process.env.GOOGLE_CLOUD_BUCKET_NAME)
export async function POST(req: Request) {
  try {
    // Verify bucket exists
    const [exists] = await bucket.exists();
    if (!exists) {
      console.error(`Bucket ${bucketName} does not exist`);
      return NextResponse.json(
        { error: `Bucket ${bucketName} not found` },
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
    const filePath = `uploads/${filename}`;

    try {
      const blob = bucket.file(filePath);
      await blob.save(buffer, {
        contentType: file.type,
        metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
        predefinedAcl: "publicRead",
        resumable: false
      });

      // Make the file public
      await blob.makePublic();

      const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;
      return NextResponse.json({ url: publicUrl });
    } catch (uploadError: any) {
      console.error("Google Cloud Storage error details:", {
        message: uploadError.message,
        code: uploadError.code,
        errors: uploadError.errors,
        stack: uploadError.stack,
      });
      
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
    console.error("Error uploading file:", {
      message: error.message,
      stack: error.stack
    });
    
    return NextResponse.json(
      { 
        error: "Upload failed",
        details: error.message
      }, 
      { status: 500 }
    );
  }
}
