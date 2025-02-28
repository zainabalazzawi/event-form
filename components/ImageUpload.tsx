"use client";

import { forwardRef, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { UploadCloud, Trash2, Loader2 } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";
import { FormControl, FormItem, FormMessage } from "./ui/form";
import axios from "axios";

interface ImageUploadProps {
  name: string;
}

export const ImageUpload = forwardRef<HTMLDivElement, ImageUploadProps>(
  ({ name }, ref) => {
    const { control } = useFormContext();
    const [uploadLoading, setUploadLoading] = useState(false);
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
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        return response.data.url;
      } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
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
                    if (file && file.type.startsWith("image/")) {
                      setUploadLoading(true);
                      const imageUrl = await handleFile(file);
                      onChange(imageUrl);
                      setUploadLoading(false);
                    }
                  }}
                  onClick={openFileSelector}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors hover:border-primary"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file && file.type.startsWith("image/")) {
                        setUploadLoading(true);
                        const imageUrl = await handleFile(file);
                        console.log("imageUrl",imageUrl)
                        onChange(imageUrl);
                        setUploadLoading(false);
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
                {value && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => onChange("")}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
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