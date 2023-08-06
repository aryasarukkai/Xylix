// App.jsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import LoginPage from './LoginPage';
import Dashboard from './Dashboard';
import Conversation from './Conversation';
import Logout from './Logout';  

function App() {
  const [isLoading, setIsLoading] = useState(true);  // Add isLoading state

  useEffect(() => {
    const checkAPIStatus = async () => {
      try {
        const timeout = new Promise((resolve, reject) => {
          setTimeout(reject, 5000, 'Request timed out');
        });

        const request = axios.get('https://api.xylix.xyz/');

        const response = await Promise.race([timeout, request]);
        console.log(response.data);
        if (response.data !== 'wake up filthy') {
          window.location.href = '/down.html'; // redirect to /down.html
        }
      } catch (error) {
        console.error('Error when calling API', error);
        window.location.href = '/down.html'; // redirect to /down.html in case of error or timeout
      } finally {
        setIsLoading(false);  // Hide loading gif after API request
      }
    };

    checkAPIStatus();
  }, []);

  if (isLoading) {  // If isLoading is true, render loading gif
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <img src="https://cdn.xylix.xyz/assets/images/loading.gif" alt="Loading..." />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/conversation" element={<Conversation />} />
        <Route path="/logout" element={<Logout />} /> 
      </Routes>
    </Router>
  );
}

export default App;
