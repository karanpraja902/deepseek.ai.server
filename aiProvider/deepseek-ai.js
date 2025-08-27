// const { model } = require('mongoose');
// const OpenAI = require('openai');

// const openai = new OpenAI({
//     apiKey:process.env.OPENAI_API_KEY
// });


// const DEFAULT_SYSTEM_MESSAGE =
//   "You are DeepSeek, a helpful AI assistant. You provide accurate, informative, and friendly responses. Always be respectful, helpful, and concise in your responses. After your first message, also include a suitable chat title (in 3-8 words) in the format: [TITLE: Your generated title here]."

// async function generateStreamResponse(message,onChunk){
//     try {
//         if(!message.some((msg) => msg.role === 'system')){
//             message= [{role:"system", content:DEFAULT_SYSTEM_MESSAGE},...message]
//         }
//         const formattedMessage = message.map((msg) =>({
//             role:msg.role,
//             content:msg.content
//         }));

//         const stream = await openai.chat.completions.create({
//             model:"gpt-5",
//             messages:formattedMessage,
//             stream:true
//         });


//         let fullResponse = "";
//         for await (const chunk of stream){
//             const content = chunk.choices[0]?.delta?.content || "";
//             if(content){
//                 fullResponse += content;
//                 if(onChunk){
//                    onChunk(content)
//                 }
//             }
//         }
        
//         return fullResponse;
//     } catch (error) {
//         console.error("Error in deepseek ai provider",error)
//         throw new Error(error)
//     }
// }


// module.exports={generateStreamResponse}

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Google Gen AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const DEFAULT_USER_MESSAGE = {
  role: "user",
  content: "You are DeepSeek, a helpful AI assistant. You provide accurate, informative, and friendly responses. Always be respectful, helpful, and concise in your responses. After your first message, also include a suitable chat title (in 3-8 words) in the format: [TITLE: Your generated title here]."
};

async function generateStreamResponse(messages, onChunk) {
  try {
    // Ensure system message is included
    if (!messages.some((msg) => msg.role === 'system')) {
      messages = [DEFAULT_USER_MESSAGE, ...messages];
    }

    // Convert messages to Google's expected format
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'user' ? 'model' : msg.role,
      parts: [{ text: msg.content }]
    }));

    // Get the generative model (using Gemini Pro)
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Start a chat session
    const chat = model.startChat({
      history: formattedMessages.slice(0, -1), // all messages except the last one
    });

    // Send the latest message and stream the response
    const result = await chat.sendMessageStream(formattedMessages[formattedMessages.length - 1].parts[0].text);

    let fullResponse = "";
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        fullResponse += chunkText;
        if (onChunk) {
          onChunk(chunkText);
        }
      }
    }

    return fullResponse;
  } catch (error) {
    console.error("Error in Google Gen AI provider", error);
    throw new Error(error);
  }
}

module.exports = { generateStreamResponse };``