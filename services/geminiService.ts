import { GoogleGenAI } from "@google/genai";
import { GarmentFormData } from "../types.ts";

const SYSTEM_INSTRUCTION = `Objective: Act as a world-class e-commerce photographer, creative director, and digital stylist. Your task is to take the provided input image of a garment and generate a new, high-resolution, photorealistic image.

Mandates:
Integrate Garment: The generated model must be wearing the exact garment (color, texture, pattern) from the input image.
Photography Style: Use natural, professional studio lighting (softbox, gentle shadows). The depth of field should be shallow to keep the focus on the model and the clothing.
Model Quality: The model's skin, hair, and pose must be impeccable and highly realistic.
Background: Use a clean, solid, minimalist background (white, light gray, or soft beige) to eliminate distractions.
Focus: The garment must be wrinkle-free, perfectly fitted, and the central focus of the image.`;

// Gemini API supported MIME types
const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
];

/**
 * Prepares the file for the Gemini API.
 * If the file type is directly supported, reads it as base64.
 * If not (e.g. AVIF), converts it to JPEG via Canvas.
 */
const prepareImageForGemini = async (file: File): Promise<{ mimeType: string; data: string }> => {
  if (SUPPORTED_MIME_TYPES.includes(file.type)) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Data = result.split(',')[1];
        resolve({ mimeType: file.type, data: base64Data });
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  } else {
    // Attempt conversion to JPEG for unsupported types (like AVIF)
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        // Enable cross-origin to prevent tainted canvas if needed
        img.crossOrigin = "Anonymous";
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("Canvas context not available"));
            return;
          }
          // White background to handle transparency
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          
          // Convert to JPEG
          const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
          const base64Data = dataUrl.split(',')[1];
          resolve({ mimeType: 'image/jpeg', data: base64Data });
        };
        img.onerror = () => reject(new Error(`Failed to process image format: ${file.type}. Please upload a standard image format (JPEG, PNG).`));
        img.src = reader.result as string;
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }
};

export const generateModelImage = async (formData: GarmentFormData): Promise<string> => {
  if (!formData.imageFile) {
    throw new Error("No garment image provided");
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Prepare garment image
  const garmentImageData = await prepareImageForGemini(formData.imageFile);
  const parts: any[] = [];

  let prompt = "";

  if (formData.mode === 'custom-model') {
    if (!formData.modelImageFile) {
      throw new Error("No model image provided for custom model mode");
    }
    // Prepare model image
    const modelImageData = await prepareImageForGemini(formData.modelImageFile);

    prompt = `Task: **VIRTUAL TRY-ON / GARMENT TRANSFER**
Input 1 (Source): The first attached image contains the garment to be transferred: ${formData.garmentType}. NOTE: This image may show the garment alone (flat lay) OR worn by another person.
Input 2 (Target Person): The second attached image is the recipient model.
Instruction: Transfer the garment from Input 1 onto the person in Input 2.
- **Source Extraction**: Identify the ${formData.garmentType} in Input 1. If worn by a model, extract only the garment.
- **Target Integrity**: STRICTLY preserve Input 2's face, identity, hair, pose, body shape, and original background. Only the clothing should change.
- **Realistic Fit**: Warp and drape the garment to naturally fit the body and pose of the person in Input 2.
- **Lighting Match**: Adjust the garment's lighting and shadows to match the environment of Input 2 perfectly.
Output: A high-fidelity photorealistic image of the person in Input 2 wearing the garment from Input 1.`;
    
    parts.push({ text: prompt });
    parts.push({
      inlineData: {
        mimeType: garmentImageData.mimeType,
        data: garmentImageData.data
      }
    });
    parts.push({
      inlineData: {
        mimeType: modelImageData.mimeType,
        data: modelImageData.data
      }
    });

  } else if (formData.mode === 'flat-lay') {
    // Flat Lay Mode
    prompt = `Task: **PROFESSIONAL FLAT LAY PHOTOGRAPHY**
Input: The attached image contains the garment: ${formData.garmentType}. NOTE: This image may show the garment worn by a model or in a cluttered environment.
Instruction: Generate a high-end, professional e-commerce flat lay image of this specific garment.
- **Extraction**: Isolate the ${formData.garmentType} from the input image. Remove any human models, body parts, or background clutter.
- **Styling**: Arrange the garment neatly on a flat surface as if prepared for a luxury catalog. Smooth out wrinkles while maintaining natural fabric texture and drape. Ensure the full garment is visible and symmetrically or artfully arranged.
- **Lighting**: Use soft, even, top-down studio lighting to highlight fabric details, patterns, and true colors. Avoid harsh shadows.
- **Background**: Use a pristine, solid white or very soft light gray background.
Output: One photorealistic flat lay image suitable for a luxury online store.`;

    parts.push({ text: prompt });
    parts.push({
      inlineData: {
        mimeType: garmentImageData.mimeType,
        data: garmentImageData.data
      }
    });

  } else {
    // AI Generated Model Mode
    prompt = `Task: **GARMENT SWAP AND PHOTOGRAPHY.**
Input Garment: The attached image is of ${formData.garmentType}. Integrate this garment onto the model below.
Model and Styling Requirements: ${formData.modelSpec}.
Pose and Scene: Set in a professional studio. ${formData.pose}.
Output: Generate one high-fidelity, photorealistic, professional e-commerce image.`;

    parts.push({ text: prompt });
    parts.push({
      inlineData: {
        mimeType: garmentImageData.mimeType,
        data: garmentImageData.data
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: parts
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    // Parse response for image
    if (response.candidates && response.candidates.length > 0) {
      const content = response.candidates[0].content;
      if (content && content.parts) {
        for (const part of content.parts) {
          if (part.inlineData && part.inlineData.data) {
             return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
    }

    throw new Error("No image generated in the response");

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};