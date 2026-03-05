import { useEffect, useState } from "react"
import api from "../../api/axios"

const Profile = () => {
    console.log("PROFILE PAGE RENDER");
    const [user, setUser] = useState(null)
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get("/auth/me")
                console.log(res.data);
                setUser(res.data.user);
            } catch (error) {
                console.error(error.response);
            }
        }
        fetchUser();
    }, [])
    if (!user) return <div>loading..</div>
    return (
        <>
            <h2>Profile</h2>

            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
        </>
    )
}

export default Profile