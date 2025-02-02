import { NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";

// Add environment variable validation
if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
  console.error('Missing GOOGLE_CLOUD_PROJECT_ID');
}
if (!process.env.GOOGLE_CLOUD_BUCKET_NAME) {
  console.error('Missing GOOGLE_CLOUD_BUCKET_NAME');
}
if (!process.env.GOOGLE_CLOUD_CLIENT_EMAIL) {
  console.error('Missing GOOGLE_CLOUD_CLIENT_EMAIL');
}
if (!process.env.GOOGLE_CLOUD_PRIVATE_KEY) {
  console.error('Missing GOOGLE_CLOUD_PRIVATE_KEY');
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

const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME || "");

console.log('check bucket',bucket)
console.log('check GOOGLE_CLOUD_BUCKET_NAME',process.env.GOOGLE_CLOUD_BUCKET_NAME)
export async function POST(req: Request) {
  console.log('Starting upload process...');
  console.log('Environment variables present:', {
    projectId: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
    bucketName: !!process.env.GOOGLE_CLOUD_BUCKET_NAME,
    clientEmail: !!process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    privateKey: !!process.env.GOOGLE_CLOUD_PRIVATE_KEY,
  });

  try {
    if (!process.env.GOOGLE_CLOUD_PROJECT_ID || 
        !process.env.GOOGLE_CLOUD_BUCKET_NAME || 
        !process.env.GOOGLE_CLOUD_CLIENT_EMAIL || 
        !process.env.GOOGLE_CLOUD_PRIVATE_KEY) {
      throw new Error('Missing required Google Cloud credentials');
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" }, 
        { status: 400 }
      );
    }

    console.log('File received:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    const buffer = Buffer.from(await file.arrayBuffer());
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${uniqueSuffix}-${file.name}`;

    try {
      console.log('Attempting to upload to bucket:', process.env.GOOGLE_CLOUD_BUCKET_NAME);
      
      const blob = bucket.file(`uploads/${filename}`);
      await blob.save(buffer, {
        contentType: file.type,
        metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
        predefinedAcl: "publicRead",
      });

      console.log('Upload successful');
      const publicUrl = `https://storage.googleapis.com/${process.env.GOOGLE_CLOUD_BUCKET_NAME}/uploads/${filename}`;
      return NextResponse.json({ url: publicUrl });
    } catch (uploadError: any) {
      console.error("Google Cloud Storage error details:", {
        message: uploadError.message,
        code: uploadError.code,
        stack: uploadError.stack,
        credentials: {
          projectId: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
          bucketName: !!process.env.GOOGLE_CLOUD_BUCKET_NAME,
          clientEmail: !!process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
          hasPrivateKey: !!process.env.GOOGLE_CLOUD_PRIVATE_KEY,
        }
      });
      
      return NextResponse.json(
        { error: "Storage upload failed", details: uploadError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Upload error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    
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
