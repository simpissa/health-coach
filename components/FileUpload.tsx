'use client';

import { useState, useRef } from 'react';

export default function FileUpload() {
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const formRef = useRef<HTMLFormElement>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setUploading(true);
        setMessage('');

        try {
            const formData = new FormData(e.currentTarget);
            const response = await fetch('http://localhost:3001/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            setMessage('File uploaded successfully!');
            // Clear the form using the ref
            formRef.current?.reset();

        } catch (error) {
            setMessage('Failed to upload file.');
            console.error('Upload error:', error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-4">
            <form ref={formRef} onSubmit={handleSubmit}>
                <div className="flex flex-col gap-4">
                    <input
                        type="file"
                        name="file"
                        accept=".txt,.pdf,.doc,.docx"
                        required
                        className="border p-2"
                    />
                    <button
                        type="submit"
                        disabled={uploading}
                        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
                    >
                        {uploading ? 'Uploading...' : 'Upload Document'}
                    </button>
                </div>
            </form>
            {message && (
                <p className={`mt-4 ${message.includes('Failed') ? 'text-red-500' : 'text-green-500'}`}>
                    {message}
                </p>
            )}
        </div>
    );
} 