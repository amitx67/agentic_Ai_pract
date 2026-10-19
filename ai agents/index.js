import express from "express"
import dotenv from "dotenv"
import { ChatGoogle } from "@langchain/google";
import { TavilySearch } from "@langchain/tavily";
import {createAgent, tool} from "langchain";

dotenv.config()

const app = express()

const port = process.env.PORT || 5000

app.use(express.json())

const tool1= new TavilySearch({
    maxResults: 5,
    topic: "general",
})

const tool2 = tool()

const model= new ChatGoogle("gemini-3.8-flash");

app.post("/chat", async(req, res) => {
    const{prompt}= req.body;
    const agent = createAgent({
        model,
        tools: [tool]
    })
    
    const result = await agent.invoke({
        messages: [
            {
                role: "user",
                content: prompt,
            }]
    })

    
    return res.json(result.messages[result.messages.length-1].content)


})

app.listen(port, () => {
    console.log("server started at ", port)
})