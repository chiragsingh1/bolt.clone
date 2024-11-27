require("dotenv").config();
import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import { BASE_PROMPT } from "./prompts";
import { TextBlock } from "@anthropic-ai/sdk/resources";
import { basePrompt as nodeBasePrompt } from "./defaults/node";
import { basePrompt as reactBasePrompt } from "./defaults/react";

const app = express();
app.use(express.json());

const anthropic = new Anthropic();

app.post("/template", async (req, res) => {
    const prompt = req.body.prompt;

    const response = await anthropic.messages.create({
        messages: [
            {
                role: "user",
                content: prompt,
            },
        ],
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 200,
        system: "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra.",
    });

    const answer = (response.content[0] as TextBlock).text; // react or node
    if (answer == "react") {
        res.json({
            prompts: [
                BASE_PROMPT,
                `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
            ],
            uiPrompts: [reactBasePrompt],
        });
        return;
    }

    if (answer === "node") {
        res.json({
            prompts: [
                `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
            ],
            uiPrompts: [nodeBasePrompt],
        });
        return;
    }

    res.status(403).json({
        message:
            "We currently only support React frontends and Node backends. Stay tuned for more!",
    });
    return;
});

async function main() {
    anthropic.messages
        .stream({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1024,
            messages: [{ role: "user", content: "What is 2 + 2" }],
            temperature: 0,
        })
        .on("text", (text) => {
            console.log(text);
        });
}

main();
