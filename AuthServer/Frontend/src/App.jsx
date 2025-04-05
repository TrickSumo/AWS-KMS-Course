import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const navigate = useNavigate();

  return (
    <>
      {sessionStorage.getItem('jwt') ? (
        <div>
          <p>JWT: {sessionStorage.getItem('jwt')}</p>
          <button onClick={() => { sessionStorage.removeItem('jwt'); setCount(count + 1) }}>Logout</button>
        </div>
      ) : (

        <div className='auth-container'>
          <button
            onClick={() => {
              navigate('/login');
            }}
          >
            Login
          </button>
          <button
            onClick={() => {
              navigate('/signup');
            }}
          >
            Create Account
          </button>
        </div>

      )}

    </>
  )
}

export default App
