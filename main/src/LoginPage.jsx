// LoginPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import './App.css'

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
const token33 = Cookies.get('token');
  if (token33) {
      // If a valid token is found, redirect to the dashboard
      window.location.href = '/dashboard';
    }
  useEffect(() => {
    // Check if there's a valid token in the cookies when the component mounts
    const token = Cookies.get('token');
    if (token) {
      // If a valid token is found, redirect to the dashboard
      console.log("token found");
    }
  }, []);

  const handleLogin = async () => {
    const response = await axios.get(`https://api.xylix.xyz/verifyAccount?username=${username}&password=${password}`);

    console.log(response.data);
    if (response.data === 'Invalid username or password') {
      setError("Invalid username or password");
      console.log(error);
    } else {
      setError(null);
      // Store the token in a cookie
      Cookies.set('token', response.data);
      // Redirect to dashboard
      window.location.href = '/dashboard';
    }
  };

  const handleRegister = async () => {
  const response = await axios.get(`https://api.xylix.xyz/createAccount?username=${username}&password=${password}`);
  if (response.data === 'Invalid username or password') {
    setError(response.data);
    setTimeout(() => setError(null), 5000); // Clear the error message after 5 seconds
  } else {
    // Store the token in a cookie
    Cookies.set('token', response.data);
    // Redirect to notice.html
    window.location.href = 'notice.html';
  }
};

  return (
    <div>
      <h1>Login or Register for Xylix ⚡️</h1>
      {error && <div className="error">{error}</div>}
      <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" /><br></br><br></br>
      <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" /><br></br><br></br>
      <button class="button-2" role="button" className="login" onClick={handleLogin}>Login</button>
      <button class="button-2" role="button" className="register" onClick={handleRegister}>Register</button>
    </div>
  );
}

export default LoginPage;
