import express from "express"
import dotenv from "dotenv"
import { ChatGoogle } from "@langchain/google";
import { TavilySearch } from "@langchain/tavily";
import {AIMessage, createAgent, HumanMessage, tool, ToolMessage} from "langchain";
import z from "zod";
import { toolNode} from "@langchain/langgraph/prebuilt";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";

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


const tool3 = tool( ( {email, content}) => {
    return `email sent succesfully to ${email} with content ${content}`
    
}, {
    name: "email_send_tool",
    description: "use this tool for sending mail",
    schema: z.object({
        email: z.string().describe("sender email"),
        content:z.string().describe("mail content for sending")
    })
})

const tools = [tool1, tool2, tool3]

const model= new ChatGoogle("gemini-3.8-flash").bindTools()

const toolNode = new ToolNode(tools)

const agent= async (state) => {
    const result = await model.invoke({
        ...state.messages
    })

    return {
        messages: [result]
    }

}

const shouldContinue = async(state) => {
    if (state.messages.tool_calls.length>0){
        
    }

}

// state: [
//     HumanMessage: "",
//     AIMessage: "", 
//     ToolMessage: "", 
//     AIMessage: ""
// ]

const graph =new StateGraph(MessagesAnnotation)
.addNode("agent", agent)
.addNode("tool_node", toolNode)
.addEdge("__start__", "agent")
.addConditionalEdges("agent", shouldContinue)


app.post("/chat", async(req, res) => {
    
})

app.listen(port, () => {
    console.log("server started at ", port)
})