import { NextResponse } from 'next/server';

const RAG_SERVICE_URL = 'http://localhost:3001/api/upload';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Forward the file to the RAG service
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        const response = await fetch(RAG_SERVICE_URL, {
            method: 'POST',
            body: uploadFormData,
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        return NextResponse.json({ message: 'File uploaded successfully' });

    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        );
    }
} 