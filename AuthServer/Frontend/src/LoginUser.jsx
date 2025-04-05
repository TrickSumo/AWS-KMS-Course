import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

const api = import.meta.env.VITE_API_URL || window.location.origin;

const LoginUser = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!username || !password) return alert('Fill all fields');

    const res = await fetch(`${api}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    
    alert('Login successful');
    console.log(data.token);
    sessionStorage.setItem('jwt', data?.token);
    navigate('/');
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Login</h2>
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
        <button className="auth-button" onClick={handleLogin}>Login</button>
        <span className="auth-switch" onClick={() => navigate('/signup')}>Don't have an account? Signup</span>
      </div>
    </div>
  );
};

export default LoginUser;
