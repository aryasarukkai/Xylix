import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useLocation } from 'react-router-dom';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function Conversation() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  let query = useQuery();
  let conversationId = query.get("id");

  useEffect(() => {
    fetchConversation();
  }, [conversationId]);

  const fetchConversation = async () => {
    const token = Cookies.get('token');
    setIsSending(true);
    try {
      const response = await axios.get(
        `https://api.xylix.xyz/conversation?usertoken=${token}&conversationid=${conversationId}`
      );
      setMessages(prevMessages => [...prevMessages, { type: 'response', text: response.data }]);
    } catch (error) {
      console.error('Error fetching conversation:', error);
    } finally {
      setIsSending(false);
    }
  };

  const sendMessage = async () => {
    if (typeof newMessage === 'string' && newMessage.trim() !== '') {
      setIsSending(true);
      const token = Cookies.get('token');
      try {
        // Log user's message
        setMessages(prevMessages => [...prevMessages, { type: 'user', text: newMessage }]);
        const response = await axios.get(`https://api.xylix.xyz/conversation?usertoken=${token}&conversationid=${conversationId}&userPrompt=${newMessage}`);
        // Log server's response
        setMessages(prevMessages => [...prevMessages, { type: 'response', text: response.data }]);
      } catch (error) {
        console.error('Error sending message:', error);
      } finally {
        setNewMessage('');
        setIsSending(false);
      }
    } else {
      console.error('newMessage is not a string:', newMessage);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <div>
        <input value={newMessage} onChange={e => setNewMessage(e.target.value)} disabled={isSending} />
        <button onClick={sendMessage} disabled={isSending}>Send</button>
      </div>
      <div style={{ paddingTop: '20px' }}>
        <button onClick={() => window.location.href = '/Dashboard'} style={{ verticalAlign: 'bottom' }}>Return to Dashboard</button>
      </div>
      <div style={{ display: 'inline-block', border: '2px solid #ccc', borderRadius: '5px', maxHeight: '300px', overflowY: 'scroll', padding: '10px', width: '900px', background: 'white' }}>
        {messages.map((message, index) => (
          <p key={index} style={{ color: message.type === 'user' ? 'blue' : 'green', margin: '5px 0' }}>
            {message.type === 'user' ? 'You: ' : 'Server: '}
            {message.text}
          </p>
        ))}
      </div>
    </div>
  );
}

export default Conversation;