import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowRight, FiLock, FiMail, FiUser } from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../../api/axios";
import AuthLayout from "../../components/AuthLayout";
import { Button, Input, PasswordStrength } from "../../components/ui";

const SignupPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { name, email, password } = formData;
      await api.post("/auth/register", { name, email, password });
      toast.success("Account created! Check your inbox for a welcome mail.");
      navigate("/login");
    } catch (error) {
      const data = error.response?.data;
      toast.error(data?.error?.[0] || data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create account"
      subtitle="Join in seconds. It's free and secure."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-violet-300 transition hover:text-white">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Name"
          hint="2–10 characters"
          icon={FiUser}
          name="name"
          placeholder="Your name"
          value={formData.name}
          onChange={handleChange}
          minLength={2}
          maxLength={10}
          required
        />
        <Input
          label="Email"
          icon={FiMail}
          type="email"
          name="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          autoComplete="email"
          required
        />
        <div className="space-y-2.5">
          <Input
            label="Password"
            hint="min 7 characters"
            icon={FiLock}
            type="password"
            name="password"
            placeholder="Create a strong password"
            value={formData.password}
            onChange={handleChange}
            minLength={7}
            autoComplete="new-password"
            required
          />
          <PasswordStrength password={formData.password} />
        </div>
        <Input
          label="Confirm password"
          icon={FiLock}
          type="password"
          name="confirm"
          placeholder="Repeat password"
          value={formData.confirm}
          onChange={handleChange}
          autoComplete="new-password"
          required
        />

        <Button type="submit" loading={loading} loadingText="Creating account..." className="w-full">
          Create account <FiArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
        </Button>
      </form>
    </AuthLayout>
  );
};

export default SignupPage;
