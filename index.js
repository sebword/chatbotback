import express from "express";
import cors from "cors";
import chatRoutes from "./src/router/chat.route.js"
import dotenv from "dotenv";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Rutas
app.use("/functions/v1/chat", chatRoutes);

app.get("/", (req, res) => {
  res.send("Servidor funcionando 🚀");
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
