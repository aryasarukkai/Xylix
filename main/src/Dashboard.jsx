// Dashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Link } from 'react-router-dom';

function Dashboard() {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [conversationTypes, setConversationTypes] = useState({});

  useEffect(() => {
    fetchConversations();
    fetchUsername();
  }, []);

  useEffect(() => {
    if (conversations.length > 0) {
      fetchConversationTypes();
    }
  }, [conversations]);

  const fetchConversations = async () => {
    setIsLoading(true);
    const token = Cookies.get('token');
    const response = await axios.get(`https://api.xylix.xyz/pullAccountData?token=${token}`);
    const conversationArray = Object.keys(response.data).map(id => ({ id, timestamp: response.data[id] }));
    setConversations(conversationArray);
    setIsLoading(false);
  };

  const fetchUsername = async () => {
    const token = Cookies.get('token');
    const response = await axios.get(`https://api.xylix.xyz/lookupUsername?token=${token}`);
    setUsername(response.data);
  };

  const fetchConversationTypes = async () => {
    let types = {};
    const typeRequests = conversations.map(conversation =>
      axios.get(`https://api.xylix.xyz/getPromptID?conversationID=${conversation.id}`)
    );

    // Await all requests
    try {
      const responses = await Promise.all(typeRequests);

      // Process the responses
      responses.forEach((response, index) => {
        const promptID = response.data.toString().trim(); // Assuming that the prompt ID is directly returned as raw data

        if (promptID === "1") {
          types[conversations[index].id] = "Cognitive behavioral therapy";
        } else if (promptID === "2") {
          types[conversations[index].id] = "Interpersonal therapy";
        } else if (promptID === "3") {
          types[conversations[index].id] = "Mindfulness-based therapies";
        } else if (promptID === "4") {
          types[conversations[index].id] = "Psychotherapy";
        }
      });

      setConversationTypes(types);
    } catch (error) {
      console.error('An error occurred:', error);
      // Handle the error as needed
    }
  };



  const startNewConversation = async () => {
    const promptID = prompt("Please enter the prompt ID:");
    if (promptID) {
      const token = Cookies.get('token');
      await axios.get(`https://api.xylix.xyz/newConversation?token=${token}&promptID=${promptID}`);
      fetchConversations(); // Reload conversations after creating a new one
    }
  };

  return (
    <div>
      <h1>👋 Hey there, {username}! You're doing great, let's keep going!</h1>
      <button onClick={startNewConversation}>Start New Conversation</button>
      <button onClick={() => window.location.href = '/logout'}>Logout</button>
      <button onClick={() => window.open('https://aryasarukkai.xyz/?tripetto=8120403f8f82822cfcb5e88706df1629f79c47d3832b0f1fbed6dced229cf81a', '_blank')}>What is Prompt ID?</button>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        conversations.map(conversation => (
          <div key={conversation.id}>
            <Link className='conv' to={`/conversation?id=${conversation.id}`}>
              Conversation {conversation.id} ({conversationTypes[conversation.id] || "Unknown"})
            </Link>
          </div>
        ))
      )}
    </div>
  );
}

export default Dashboard;