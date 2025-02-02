"use client";

import { forwardRef, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { UploadCloud, Trash, Loader2 } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";
import { FormControl, FormItem, FormMessage } from "./ui/form";
import axios from "axios";

interface ImageUploadProps {
  name: string;
}

const ImageUpload = forwardRef<HTMLDivElement, ImageUploadProps>(
  ({ name }, ref) => {
    const { control } = useFormContext();
    const [uploadLoading, setUploadLoading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const openFileSelector = () => {
      fileInputRef.current?.click();
    };

    const handleFile = async (file: File): Promise<string> => {
      try {
        setUploadError(null);
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        console.log('Upload response:', response.data);

        if (!response.data.url) {
          throw new Error('Upload failed - no URL returned');
        }
    
        return response.data.url;
      } catch (error: any) {
        console.error('Error uploading file:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        setUploadError(error.response?.data?.details || error.response?.data?.error || error.message);
        throw error;
      }
    };

    const handleFileUpload = async (file: File, onChange: (value: string) => void) => {
      if (!file || !file.type.startsWith("image/")) {
        setUploadError('Please select an image file');
        return;
      }

      try {
        setUploadLoading(true);
        const imageUrl = await handleFile(file);
        onChange(imageUrl);
      } catch (error) {
        // Error is already handled in handleFile
      } finally {
        setUploadLoading(false);
      }
    };

    return (
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <FormItem>
            <FormControl>
              <div>
                <div className="mb-4">
                  {value && (
                    <div className="relative">
                      <Image
                        alt="Upload"
                        width={100}
                        height={100}
                        style={{ objectFit: "cover" }}
                        src={value}
                        className="rounded"
                      />
                    </div>
                  )}
                </div>
                <div
                  ref={ref}
                  onDragOver={handleDragOver}
                  onDrop={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files[0];
                    await handleFileUpload(file, onChange);
                  }}
                  onClick={openFileSelector}
                  className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors hover:border-primary ${
                    uploadError ? 'border-red-500' : ''
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        await handleFileUpload(file, onChange);
                      }
                    }}
                    accept="image/*"
                    className="hidden"
                  />
                  {uploadLoading ? (
                    <Loader2 className="h-10 w-10 text-primary animate-spin mb-2" />
                  ) : (
                    <UploadCloud className="h-10 w-10 text-primary mb-2" />
                  )}
                  <p className="text-sm font-medium">
                    Drag and drop or click to upload
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG up to 10MB
                  </p>
                </div>
                {uploadError && (
                  <p className="text-sm text-red-500 mt-2">{uploadError}</p>
                )}
                {value && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => onChange("")}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Remove Image
                  </Button>
                )}
              </div>
            </FormControl>
            <FormMessage>{error?.message}</FormMessage>
          </FormItem>
        )}
      />
    );
  }
);

ImageUpload.displayName = "ImageUpload";

export { ImageUpload }; 