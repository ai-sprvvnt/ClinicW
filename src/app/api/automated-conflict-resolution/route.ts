import { NextResponse } from "next/server"
import { automatedConflictResolution } from "@/ai/flows/automated-conflict-resolution"

export async function POST(req: Request) {
  try {
    const input = await req.json()
    const result = await automatedConflictResolution(input)
    return NextResponse.json(result)
  } catch (error) {
    console.error("automated-conflict-resolution error:", error)
    return NextResponse.json(
      {
        hasConflict: true,
        suggestedSlots: [],
        reason: "Error interno al resolver conflicto.",
      },
      { status: 500 }
    )
  }
}
