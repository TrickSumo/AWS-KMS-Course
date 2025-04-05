
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import './index.css'
import App from './App.jsx'
import CreateUser from './CreateUser.jsx';
import LoginUser from './LoginUser.jsx';


createRoot(document.getElementById('root')).render(
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/signup" element={<CreateUser />} />
        <Route path="/login" element={<LoginUser />} />
      </Routes>
    </Router>
)
