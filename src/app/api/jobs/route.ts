import { NextResponse } from 'next/server';
import { fetchAllJobs } from '@/lib/jobFetcher';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const refresh = searchParams.get('refresh');

  try {
    const jobs = await fetchAllJobs();
    return NextResponse.json({
      jobs,
      fetchedAt: new Date().toISOString(),
      count: jobs.length,
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs', jobs: [], count: 0 },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
