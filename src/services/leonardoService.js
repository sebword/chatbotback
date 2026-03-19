// services/leonardoService.js
import axios from "axios";
import dotenv from "dotenv";


dotenv.config();

const LEONARDO_API_KEY = process.env.LEONARDO_API_KEY;

const leonardoClient = axios.create({
  baseURL: "https://cloud.leonardo.ai/api/rest/v1",
  headers: {
    Authorization: `Bearer ${LEONARDO_API_KEY}`,
    "Content-Type": "application/json",
  },
});

export const generateLeonardoImage = async (prompt) => {
  try {
    // 1️⃣ Crear generación
    const generationResponse = await leonardoClient.post(
      "/generations",
      {
        prompt,
        modelId: "e316348f-7773-490e-adcd-46757c738eb7", // Leonardo Diffusion XL
        width: 512,
        height: 512,
        num_images: 1,
      }
    );

    const generationId =
      generationResponse.data.sdGenerationJob.generationId;

    // 2️⃣ Esperar a que termine
    let imageUrl = null;
    let attempts = 0;

    while (!imageUrl && attempts < 10) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const result = await leonardoClient.get(
        `/generations/${generationId}`
      );

      const status = result.data.generations_by_pk.status;

      if (status === "COMPLETE") {
        imageUrl =
          result.data.generations_by_pk.generated_images[0].url;
      }

      attempts++;
    }

    if (!imageUrl) {
      throw new Error("La imagen no se generó a tiempo.");
    }

    return imageUrl;

  } catch (error) {
    console.error("Error en Leonardo:", error.response?.data || error.message);
    throw error;
  }
};