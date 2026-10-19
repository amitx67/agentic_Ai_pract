import express from "express"
import dotenv from "dotenv"
import { ChatGoogle } from "@langchain/google";
import { TavilySearch } from "@langchain/tavily";
import {createAgent, tool} from "langchain";
import z from "zod";

dotenv.config()

const app = express()

const port = process.env.PORT || 5000

app.use(express.json())

const tool1= new TavilySearch({
    maxResults: 5,
    topic: "general",
})

const tool2 = tool( ( {a, b}) => {
    return `addition of ${a} and ${b} is : 8`
    
}, {
    name: "addition_tool",
    description: "use this tool for adding two numbers",
    schema: z.object({
        a:z.number(),
        b:z.number()
    })
})

const model= new ChatGoogle("gemini-3.8-flash");

app.post("/chat", async(req, res) => {
    const{prompt}= req.body;
    const agent = createAgent({
        model,
        tools: [tool1, tool2]
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