import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express()
const port = process.env.PORT || 5000

app.listen(port, () =>{
    console.log(`server running on port: ${port}`);    
})

const ai = new GoogleGenAI({
    apiKey: process.env.GoogleGenAI
});

const main= async () => {
    const response = await ai.models.generateContent ({
  model: "gemini-3.6-flash",
  contents: "cm of haryana",
  
});

console.log(response.text)
}

main();