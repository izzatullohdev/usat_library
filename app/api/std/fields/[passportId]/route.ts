import { NextRequest, NextResponse } from "next/server"

const isDevelopment = process.env.NODE_ENV === "development"

export async function GET(
  request: NextRequest,
  { params }: { params: { passportId: string } }
) {
  try {
    const { passportId } = params

    // Validate passport ID (should be 14 digits)
    if (!passportId || passportId.length !== 14 || !/^\d{14}$/.test(passportId)) {
      return NextResponse.json(
        { error: "Invalid passport ID format. Must be 14 digits." },
        { status: 400 }
      )
    }

    // Get STD token from request headers (sent from client)
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization")
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      if (isDevelopment) {
        console.error("Missing or invalid authorization header")
      }
      return NextResponse.json(
        { error: "Missing or invalid authorization token" },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7).trim() // Remove "Bearer " prefix and trim
    
    if (!token) {
      if (isDevelopment) {
        console.error("Token is empty after extracting from header")
      }
      return NextResponse.json(
        { error: "Empty token" },
        { status: 401 }
      )
    }

    // Proxy request to STD API - use /students/by-pinfl/ endpoint
    const stdApiUrl = `http://std-back.usat-ai-lab.uz/api/v1/students/by-pinfl/${passportId}`
    
    try {
      const response = await fetch(stdApiUrl, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      })

      const data = await response.json().catch(() => ({}))
      const status = response.status

      // Log errors in development only
      if (isDevelopment && status >= 400) {
        console.error(`STD API error response:`, data)
      }

      // Forward the response from STD API
      return NextResponse.json(data, { status })
    } catch (fetchError: unknown) {
      if (isDevelopment) {
        console.error("STD API proxy error:", fetchError)
      }
      return NextResponse.json(
        { error: "Failed to connect to STD API" },
        { status: 502 }
      )
    }
  } catch (error: unknown) {
    if (isDevelopment) {
      console.error("API route error:", error)
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
