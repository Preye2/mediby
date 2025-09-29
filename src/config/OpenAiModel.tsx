import OpenAI from "openai"


export const openai = new OpenAI({
	  baseURL: "https://api.groq.com/openai/v1",
	  apiKey: process.env.OPENAI_API_KEY,

})