"use client";

import { useState } from 'react';
import { Box, Container, TextField, Button, Paper, Typography } from '@mui/material';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function VLLMChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = { role: 'assistant', content: data.response };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to connect to the server'}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button
          variant="outlined"
          href="/"
          sx={{ mr: 2 }}
        >
          Home
        </Button>
        <Typography variant="h4">
          VLLM Chat
        </Typography>
      </Box>

      <Paper sx={{ height: '60vh', overflow: 'auto', p: 2, mb: 2 }}>
        {messages.map((message, index) => (
          <Box
            key={index}
            sx={{
              mb: 2,
              p: 1,
              bgcolor: message.role === 'user' ? 'grey.100' : 'primary.light',
              borderRadius: 1,
            }}
          >
            <Typography variant="body1">
              <strong>{message.role === 'user' ? 'You' : 'Assistant'}:</strong> {message.content}
            </Typography>
          </Box>
        ))}
      </Paper>

      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
          >
            Send
          </Button>
        </Box>
      </form>
    </Container>
  );
} 