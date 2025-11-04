import { streamChatResponse } from "../services/openaiService.js";

export const handleChat = async (req, res) => {
  try {
    const { messages, generateImage = false } = req.body;

    // 🧩 1️⃣ Validación de entrada
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        type: "validation_error",
        message:
          "El campo 'messages' es obligatorio y debe ser un arreglo con al menos un mensaje.",
      });
    }

    // Verificar que todos los mensajes tengan el formato correcto
    const invalidMsg = messages.find(
      (msg) =>
        !msg.role ||
        !["user", "assistant", "system"].includes(msg.role) ||
        typeof msg.content !== "string"
    );

    if (invalidMsg) {
      return res.status(400).json({
        success: false,
        type: "validation_error",
        message:
          "Cada mensaje debe tener un 'role' válido ('user', 'assistant' o 'system') y un 'content' de tipo string.",
      });
    }

    // 🚀 2️⃣ Llamar al servicio de OpenAI (según tipo)
    const response = await streamChatResponse(messages, generateImage);

    return res.status(200).json({
      success: true,
      data: response,
    });

  } catch (error) {
    console.error("Error en handleChat:", error);

    // ⚙️ 3️⃣ Clasificación de errores
    let status = 500;
    let type = "server_error";
    let message = "Error interno en el servidor.";

    if (error?.code === "insufficient_quota") {
      status = 429;
      type = "quota_exceeded";
      message =
        "Has superado tu cuota de uso de la API de OpenAI. Revisa tu plan o clave API.";
    } else if (error?.status === 401 || error?.code === "invalid_api_key") {
      status = 401;
      type = "auth_error";
      message = "La clave API es inválida o no está configurada.";
    } else if (error?.status === 400) {
      status = 400;
      type = "bad_request";
      message = "La solicitud a OpenAI fue inválida.";
    } else if (error?.status === 404) {
      status = 404;
      type = "not_found";
      message = "No se encontró el recurso solicitado.";
    } else if (error?.status === 503) {
      status = 503;
      type = "service_unavailable";
      message =
        "El servicio de OpenAI no está disponible temporalmente. Intenta más tarde.";
    } else if (
      error?.code === "ETIMEDOUT" ||
      error?.code === "ENOTFOUND" ||
      error?.message?.includes("fetch failed")
    ) {
      status = 504;
      type = "network_error";
      message =
        "No se pudo conectar con OpenAI. Revisa tu conexión o intenta nuevamente.";
    }

    // ⚠️ 4️⃣ Evita enviar doble respuesta
    if (!res.headersSent) {
      return res.status(status).json({
        success: false,
        type,
        message,
        details: error?.message || null,
      });
    }
  }
};
