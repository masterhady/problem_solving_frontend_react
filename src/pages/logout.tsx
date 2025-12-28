import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const LogoutAction = () => {
    const navigate = useNavigate();
    useEffect(() => {
        localStorage.removeItem("currentuser");
        localStorage.removeItem("token");
        navigate("/auth");
    }, [navigate]);
    return null;
};

export default LogoutAction;
