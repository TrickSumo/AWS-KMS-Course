import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPass, updatePass, deletePass } from "./utils/apis";

const ItemDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [pass, setPass] = useState(null);
    const [editMode, setEditMode] = useState(false);

    useEffect(() => {
        getPass(id).then(data => setPass(data.Item));
    }, [id]);

    const handleUpdate = async () => {
        await updatePass(id, pass);
        setEditMode(false);
    };

    const handleDelete = async () => {
        await deletePass(id);
        navigate("/");
    };

    if (!pass) return <p>Loading...</p>;

    return (
        <div className="container">
            <h1>{editMode ? "Edit Password" : pass.site}</h1>
            {editMode ? (
                <>
                    <input className="styled-label" value={pass.site} disabled />
                    <input className="styled-label" value={pass.username} disabled />
                    <input className="styled-input" value={pass.password} onChange={(e) => setPass({ ...pass, password: e.target.value })} />
                </>
            ) : (
                <>
                    <p>Site: {pass.site}</p>
                    <p>Username: {pass.username}</p>
                    <p>Password: {pass.password}</p>
                </>
            )}
            <button onClick={editMode ? handleUpdate : () => setEditMode(true)}>{editMode ? "Save" : "Edit"}</button>
            <button onClick={handleDelete}>Delete</button>
        </div>
    );
};

export default ItemDetails;
