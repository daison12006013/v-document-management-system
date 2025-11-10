import { readFile } from 'fs/promises';
import { join } from 'path';
import yaml from 'js-yaml';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Read the swagger.yaml file
    const filePath = join(process.cwd(), 'swagger.yaml');
    const fileContents = await readFile(filePath, 'utf8');

    // Parse YAML to JSON
    const spec = yaml.load(fileContents);

    return NextResponse.json(spec, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error: any) {
    console.error('Error loading Swagger spec:', error);
    return NextResponse.json(
      { error: 'Failed to load API documentation' },
      { status: 500 }
    );
  }
}

