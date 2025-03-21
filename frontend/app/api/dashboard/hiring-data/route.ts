import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Try to fetch from the backend API
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
    
    try {
      const response = await fetch(`${backendUrl}/api/dashboard/hiring-data`, {
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
      { month: "Jan", applications: 45, hires: 5 },
      { month: "Feb", applications: 52, hires: 7 },
      { month: "Mar", applications: 61, hires: 8 },
      { month: "Apr", applications: 67, hires: 6 },
      { month: "May", applications: 70, hires: 9 },
      { month: "Jun", applications: 58, hires: 7 },
    ]);
  } catch (error) {
    console.error('Error in hiring-data API route:', error);
    
    // Return fallback data on error
    return NextResponse.json([
      { month: "Jan", applications: 45, hires: 5 },
      { month: "Feb", applications: 52, hires: 7 },
      { month: "Mar", applications: 61, hires: 8 },
      { month: "Apr", applications: 67, hires: 6 },
      { month: "May", applications: 70, hires: 9 },
      { month: "Jun", applications: 58, hires: 7 },
    ]);
  }
} 