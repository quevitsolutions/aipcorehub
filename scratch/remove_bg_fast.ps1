Add-Type -AssemblyName System.Drawing

$csharpSource = @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public class ImageProcessor {
    public static void RemoveBlackBackground(string inputPath, string outputPath) {
        using (Bitmap bmp = new Bitmap(inputPath)) {
            int width = bmp.Width;
            int height = bmp.Height;
            using (Bitmap newBmp = new Bitmap(width, height, PixelFormat.Format32bppArgb)) {
                BitmapData bmpData = bmp.LockBits(new Rectangle(0, 0, width, height), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
                BitmapData newBmpData = newBmp.LockBits(new Rectangle(0, 0, width, height), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
                
                int size = bmpData.Stride * height;
                byte[] pixels = new byte[size];
                byte[] newPixels = new byte[size];
                
                Marshal.Copy(bmpData.Scan0, pixels, 0, size);
                
                for (int i = 0; i < size; i += 4) {
                    byte b = pixels[i];
                    byte g = pixels[i + 1];
                    byte r = pixels[i + 2];
                    byte a = pixels[i + 3];
                    
                    byte maxVal = Math.Max(r, Math.Max(g, b));
                    
                    if (maxVal < 15) {
                        newPixels[i] = 0;
                        newPixels[i + 1] = 0;
                        newPixels[i + 2] = 0;
                        newPixels[i + 3] = 0;
                    } else if (maxVal < 45) {
                        double factor = (double)(maxVal - 15) / (45 - 15);
                        newPixels[i] = b;
                        newPixels[i + 1] = g;
                        newPixels[i + 2] = r;
                        newPixels[i + 3] = (byte)(factor * 255);
                    } else {
                        newPixels[i] = b;
                        newPixels[i + 1] = g;
                        newPixels[i + 2] = r;
                        newPixels[i + 3] = 255;
                    }
                }
                
                Marshal.Copy(newPixels, 0, newBmpData.Scan0, size);
                
                bmp.UnlockBits(bmpData);
                newBmp.UnlockBits(newBmpData);
                
                newBmp.Save(outputPath, ImageFormat.Png);
            }
        }
    }
}
"@

Add-Type -TypeDefinition $csharpSource -ReferencedAssemblies System.Drawing

$inputPath = "C:\Users\user\.gemini\antigravity\brain\8c01a5af-70f3-4c5f-b410-888ca5e047c9\natural_shiba_egg_1779502659307.png"
$outputPath = "E:\AIPCORE HUB\public\assets\egg_orange.png"

Write-Host "Processing $inputPath..."
[ImageProcessor]::RemoveBlackBackground($inputPath, $outputPath)
Write-Host "Saved transparent image to $outputPath successfully!"
