
import express from "express";
import dotenv from "dotenv";
import { ChatGoogle } from "@langchain/google";
import { TavilySearch } from "@langchain/tavily";
import { HumanMessage, tool } from "langchain";
import { z } from "zod";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

// Search tool
const tool1 = new TavilySearch({
    maxResults: 5,
    topic: "general",
});

// Addition tool
const tool2 = tool(
    ({ a, b }) => {
        return `Addition of ${a} and ${b} is: ${a + b}`;
    },
    {
        name: "addition_tool",
        description: "Use this tool for adding two numbers",
        schema: z.object({
            a: z.number(),
            b: z.number(),
        }),
    }
);

// Email tool (demo only; does not send a real email)
const tool3 = tool(
    ({ email, content }) => {
        return `Email sending requested for ${email} with content: ${content}. Note: this is a demo and no email was actually sent.`;
    },
    {
        name: "email_send_tool",
        description: "Prepare an email message for a recipient",
        schema: z.object({
            email: z.string().email().describe("Recipient email"),
            content: z.string().describe("Email content"),
        }),
    }
);

const tools = [tool1, tool2, tool3];

// Google Gemini model with tools
const model = new ChatGoogle({
    model: "gemini-3.8-flash",
}).bindTools(tools);

// Tool execution node
const toolNode = new ToolNode(tools);

// Agent node
const agent = async (state) => {
    const result = await model.invoke(state.messages);

    return {
        messages: [result],
    };
};

// Decide whether to execute tools or finish
const shouldContinue = (state) => {
    const lastMessage = state.messages[state.messages.length - 1];

    if (lastMessage.tool_calls?.length > 0) {
        return "tool_node";
    }

    return "__end__";
};

// Build LangGraph
const graph = new StateGraph(MessagesAnnotation)
    .addNode("agent", agent)
    .addNode("tool_node", toolNode)
    .addEdge("__start__", "agent")
    .addConditionalEdges("agent", shouldContinue)
    .addEdge("tool_node", "agent")
    .compile();

// Chat API
app.post("/chat", async (req, res) => {
    try {
        const { prompt } = req.body ?? {};

        if (typeof prompt !== "string" || !prompt.trim()) {
            return res.status(400).json({
                error: "Please provide a valid prompt.",
            });
        }

        const result = await graph.invoke({
            messages: [new HumanMessage(prompt)],
        });

        const lastMessage =
            result.messages[result.messages.length - 1];

        return res.status(200).json({
            response: lastMessage.content,
        });
    } catch (error) {
        console.error("Chat API error:", error);

        return res.status(500).json({
            error: "Failed to process your request.",
        });
    }
});

// Handle invalid JSON and other Express errors
app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    console.error("Express error:", error);

    return res.status(error.status || 500).json({
        error:
            error.status === 400
                ? "Invalid JSON in request body."
                : "Internal server error.",
    });
});

app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});
