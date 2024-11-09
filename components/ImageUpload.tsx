"use client";

import { forwardRef, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { UploadCloud, Trash, Loader2 } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";
import { FormControl, FormItem, FormLabel, FormMessage } from "./ui/form";

interface ImageUploadProps {
  name: string;
  label?: string;
}

const ImageUpload = forwardRef<HTMLDivElement, ImageUploadProps>(
  ({ name, label }, ref) => {
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

    const handleFile = (file: File): Promise<string> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          console.log('Image converted to base64:', result.substring(0, 100) + '...');
          resolve(result);
        };
        reader.readAsDataURL(file);
      });
    };

    console.log(ref)
    return (
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <FormItem>
            {label && <FormLabel>{label}</FormLabel>}
            <FormControl>
              <div>
                <div className="mb-4">
                  {value && (
                    <div className="relative w-full h-64">
                      <Image
                        alt="Upload"
                        fill
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