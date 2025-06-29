import { NextRequest, NextResponse } from "next/server";
import { handleTextUpload } from "@/telegram-querymind/src/bot";
import pdfParse from "pdf-parse";
export const config = {
  api: {
    bodyParser: false, 
  },
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const text = formData.get("text");
    const file = formData.get("file");

    if (text && typeof text === "string") {
      await handleTextUpload(text);
      return NextResponse.json({ success: true, message: "Text uploaded and indexed." });
    }

    if (file && file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (file.type === "application/pdf") {
        const pdfData = await pdfParse(buffer);
        const extractedText = pdfData.text;

        await handleTextUpload(extractedText);
        return NextResponse.json({ success: true, message: "PDF uploaded and indexed." });
      } else {
        return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
      }
    }

    return NextResponse.json({ error: "No valid text or file provided" }, { status: 400 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
