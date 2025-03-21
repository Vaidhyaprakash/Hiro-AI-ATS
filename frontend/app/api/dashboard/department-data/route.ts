import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Try to fetch from the backend API
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
    
    try {
      const response = await fetch(`${backendUrl}/api/dashboard/department-data`, {
        // Add a short timeout to fail fast if backend is not available
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch (fetchError) {
      console.log('Backend fetch failed, using fallback data');
    }
    
    // Fallback data if backend API fails
    return NextResponse.json([
      { department: "Engineering", openings: 4, applications: 120 },
      { department: "Marketing", openings: 2, applications: 85 },
      { department: "Sales", openings: 3, applications: 95 },
      { department: "HR", openings: 1, applications: 40 },
      { department: "Finance", openings: 1, applications: 35 },
    ]);
  } catch (error) {
    console.error('Error in department-data API route:', error);
    
    // Return fallback data on error
    return NextResponse.json([
      { department: "Engineering", openings: 4, applications: 120 },
      { department: "Marketing", openings: 2, applications: 85 },
      { department: "Sales", openings: 3, applications: 95 },
      { department: "HR", openings: 1, applications: 40 },
      { department: "Finance", openings: 1, applications: 35 },
    ]);
  }
} 