import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

const api = import.meta.env.VITE_API_URL || window.location.origin;

const  CreateUser = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {

    if (!username || !password) return alert('Fill all fields');

    await fetch(`${api}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    navigate('/login');
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Signup</h2>
        <input
          className="auth-input"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          className="auth-input"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="auth-button" onClick={handleSignup}>Create Account</button>
        <span className="auth-switch" onClick={() => navigate('/login')}>Already have an account? Login</span>
      </div>
    </div>
  );
};

export default CreateUser;