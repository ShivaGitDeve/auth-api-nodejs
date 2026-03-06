
import { useState } from "react"
import api from "../../api/axios";

const ChangePassword = () => {
    const [currentPassword, setcurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post("/auth/change-password", {
                currentPassword, newPassword
            })
            alert("Password Update Successfully")
            setcurrentPassword("")
            setNewPassword("")
        } catch (error) {
            alert(error.response?.data?.message || "Error updating password");
        }
    }

    return (
        <>
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-gray-900 to-black px-4">

                <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 transition-all duration-500 hover:scale-[1.02]">

                    <h2 className="text-2xl font-semibold text-white mb-6 text-center tracking-wide">
                        Change Password
                    </h2>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                        <input
                            type="password"
                            placeholder="Old Password"
                            value={currentPassword}
                            onChange={(e) => setcurrentPassword(e.target.value)}
                            className="bg-black/40 text-white placeholder-gray-400 px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                        />

                        <input
                            type="password"
                            placeholder="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="bg-black/40 text-white placeholder-gray-400 px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                        />

                        <button
                            type="submit"
                            className="mt-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-medium py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-indigo-500/40"
                        >
                            Update Password
                        </button>

                    </form>
                </div>

            </div>
        </>
    );
};

export default ChangePassword