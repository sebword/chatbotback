import OpenAI from "openai";
import dotenv from "dotenv";


dotenv.config();




const client = new OpenAI({
  apiKey: process.env.OPENAI_GROQ,
  baseURL: "https://api.groq.com/openai/v1"
});

/**
 * Envía mensajes al modelo de chat o genera una imagen (o ambos).
 * Si `generateImage` es true, devuelve tanto texto como imagen.
 */
export const streamChatResponse = async (messages, generateImage = false) => {
  try {
    // 💬 1️⃣ Obtener respuesta de texto desde Groq

    

    const cleanMessages = messages.map(({ role, content }) => ({
      role,
      content,
    }));
    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile", // Modelo Groq (mejor rendimiento)
      messages:cleanMessages,
      temperature: 0.8,
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() ||
      "No se recibió respuesta del modelo.";

    // 🖼️ 2️⃣ Si no se pidió imagen, devolver solo texto
    if (!generateImage) {
      return {
        type: "text",
        content: reply,
      };
    }

    // 🔍 3️⃣ Buscar el último mensaje del usuario
    const lastUserMessage = messages
      .slice()
      .reverse()
      .find((msg) => msg.role === "user");

    if (!lastUserMessage?.content) {
      throw new Error("No se encontró un mensaje del usuario para generar la imagen.");
    }

    // 🎨 4️⃣ Crear la URL de la imagen desde Pollinations (gratis)
    const prompt = encodeURIComponent(
      `Ilustración educativa del tema: ${lastUserMessage.content}`
    );
    const imageUrl = `https://image.pollinations.ai/prompt/${prompt}`;

    // 🚀 5️⃣ Devolver texto + imagen
    return {
      type: "text+image",
      content: reply,
      imageUrl,
    };
  } catch (error) {
    console.error("Error en streamChatResponse:", error);
    throw error;
  }
};