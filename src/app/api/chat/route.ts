import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set. Chat feature will not work.");
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export async function POST(request: NextRequest) {
  // Check API key first
  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set in environment variables");
    return NextResponse.json(
      { 
        error: "Gemini API key is not configured. Please add GEMINI_API_KEY to your .env.local file.",
        details: "See README.md for instructions on how to get a Gemini API key."
      },
      { status: 500 }
    );
  }

  if (!genAI) {
    return NextResponse.json(
      { error: "Failed to initialize Gemini AI client" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { message, context } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      );
    }

    // Get the generative model
    // Try gemini-2.5-flash first, fallback to gemini-pro if not available
    let model;
    let lastError: Error | null = null;
    
    const modelNames = ["gemini-2.5-flash", "gemini-pro"];
    
    for (const modelName of modelNames) {
      try {
        model = genAI.getGenerativeModel({ model: modelName });
        console.log(`Successfully initialized model: ${modelName}`);
        break;
      } catch (modelError) {
        console.warn(`Failed to initialize model ${modelName}:`, modelError);
        lastError = modelError instanceof Error ? modelError : new Error(String(modelError));
        continue;
      }
    }

    if (!model) {
      console.error("Failed to initialize any model. Last error:", lastError);
      return NextResponse.json(
        { 
          error: "Failed to initialize AI model",
          details: lastError?.message || "Could not initialize Gemini model. Please check your API key and model availability."
        },
        { status: 500 }
      );
    }

    // Build context-aware prompt
    let systemPrompt = `Bạn là một trợ lý AI chuyên tư vấn về du lịch và địa điểm tại Việt Nam. 
Bạn giúp người dùng tìm hiểu về các địa điểm, nhà hàng, điểm tham quan, và đưa ra lời khuyên về lịch trình du lịch.

Hãy trả lời bằng tiếng Việt, thân thiện và hữu ích.`;

    if (context) {
      systemPrompt += `\n\nThông tin về chuyến đi hiện tại của người dùng:\n`;
      
      if (context.tripName) {
        systemPrompt += `- Tên chuyến đi: ${context.tripName}\n`;
      }
      
      if (context.days && context.days.length > 0) {
        systemPrompt += `- Số ngày: ${context.days.length}\n`;
        systemPrompt += `- Các địa điểm đã thêm:\n`;
        context.days.forEach((day: { date: string; places: Array<{ name: string; category: string }> }) => {
          if (day.places && day.places.length > 0) {
            systemPrompt += `  Ngày ${day.date}: ${day.places.map((p: { name: string }) => p.name).join(", ")}\n`;
          }
        });
      }
      
      if (context.location) {
        systemPrompt += `- Vị trí hiện tại: ${context.location.lat}, ${context.location.lng}\n`;
      }
    }

    systemPrompt += `\nHãy trả lời câu hỏi của người dùng một cách chi tiết và hữu ích.`;

    const prompt = `${systemPrompt}\n\nCâu hỏi của người dùng: ${message}`;

    console.log("Sending request to Gemini API...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text || text.trim().length === 0) {
      console.warn("Received empty response from Gemini API");
      return NextResponse.json(
        { error: "Received empty response from AI" },
        { status: 500 }
      );
    }

    console.log("Successfully received response from Gemini API");
    return NextResponse.json({ message: text });
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorDetails = error instanceof Error ? error.stack : String(error);
    
    console.error("Error details:", errorDetails);
    
    // Check for specific error types
    if (errorMessage.includes("API_KEY") || errorMessage.includes("api key")) {
      return NextResponse.json(
        { error: "Invalid or missing Gemini API key. Please check your GEMINI_API_KEY in .env.local" },
        { status: 500 }
      );
    }
    
    if (errorMessage.includes("quota") || errorMessage.includes("limit")) {
      return NextResponse.json(
        { error: "API quota exceeded. Please check your Gemini API usage limits." },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Failed to get response from AI",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

