import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
console.log("API KEY:", process.env.GEMINI_API_KEY);
const API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
    );

    const data = await res.json();
    console.log("API KEY:", process.env.GEMINI_API_KEY);
    console.log("\n=== FULL RESPONSE ===\n");
    console.log(JSON.stringify(data, null, 2)); // 👈 IMPORTANT

    if (!data.models) {
      console.error("\n❌ No models found. Something is wrong above.");
      return;
    }

    console.log("\n=== AVAILABLE MODELS ===\n");

    data.models.forEach((model) => {
      console.log("Name:", model.name);
      console.log("Methods:", model.supportedGenerationMethods);
      console.log("-----------");
    });

  } catch (err) {
    console.error("Error:", err.message);
  }
}

listModels();