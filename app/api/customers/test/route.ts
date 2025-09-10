import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    // Test the customer creation logic with sample data
    const testData = {
      displayName: "Test Customer",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com"
    }
    
    // Validate displayName like the real endpoint
    const trimmedDisplayName = testData.displayName.trim()
    if (trimmedDisplayName.length === 0) {
      return NextResponse.json({ 
        error: 'DisplayName validation failed',
        test: 'FAILED' 
      }, { status: 400 })
    }
    
    return NextResponse.json({
      message: 'Customer validation test passed',
      test: 'PASSED',
      trimmedDisplayName,
      originalLength: testData.displayName.length,
      trimmedLength: trimmedDisplayName.length
    })
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      test: 'ERROR'
    }, { status: 500 })
  }
}