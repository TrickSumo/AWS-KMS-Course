import { useEffect, useState } from "react";
import { fetchPasss, createPass } from "./utils/apis";
import { useNavigate } from "react-router-dom";
import "./App.css";

const Home = () => {
  const [passes, setPasses] = useState([]);
  const [site, setSite] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchPasss().then(data => setPasses(data.Items || []));
  }, []);

  const handleAddPass = async () => {
    if (!site || !username || !password) {
      alert("Please fill all fields");
      return;
    }
    const newPass = { site, username, password };
    await createPass(newPass);
    setPasses([...passes, newPass]);
    setSite("");
    setUsername("");
    setPassword("");
  };

  return (
    <div className="container">
      <h1>Password Manager</h1>
      <div className="add-pass-form">
        <input className="styled-input" type="text" placeholder="Site" value={site} onChange={(e) => setSite(e.target.value)} />
        <input className="styled-input" type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input className="styled-input" type="text" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={handleAddPass}>Add</button>
      </div>
      <div className="pass-list">
        {passes.map(pass => (
          <div key={pass.passId} className="pass-card" onClick={() => navigate(`/details/${pass.passId}`)}>
            <h3>{pass.site}</h3>
            <p>Username: {pass.username}</p>
            <p>Password: ******</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;