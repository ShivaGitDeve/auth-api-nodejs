import { Navigate, NavLink } from "react-router-dom";
import { useAuth } from "../../auth/Auth-context";

const HomePage = () => {
  const { user } = useAuth();

  // Logic me zero changes
  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <>
      {/* ✅ OUTER WRAPPER FIXED */}
      <div className="w-full flex justify-center">
        <div className="w-full max-w-[1600px] min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 flex flex-col font-sans relative overflow-hidden">

          {/* Background Glow Effects */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[120px]"></div>
            <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-cyan-500/20 blur-[120px]"></div>
          </div>

          {/* --- NAVBAR --- */}
          <nav className="w-full max-w-7xl mx-auto flex justify-between items-center py-6 px-6 md:px-12 z-10">
            <div className="text-3xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              AuthUI.
            </div>
            <div className="flex gap-4 items-center">
              <NavLink
                to="/login"
                className="text-white hover:text-cyan-300 font-medium px-4 py-2 transition-colors"
              >
                Login
              </NavLink>
              <NavLink
                to="/signup"
                className="text-white hover:text-cyan-300 font-medium px-4 py-2 transition-colors"
              >
                Register
              </NavLink>
            </div>
          </nav>

          {/* --- HERO SECTION --- */}
          <main className="flex-1 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center px-6 md:px-12 z-10 gap-12 lg:gap-20 w-full pb-12">

            {/* Left Side */}
            <div className="text-center lg:text-left items-center lg:items-start text-white max-w-xl w-full flex flex-col mt-8 lg:mt-0 mx-auto">
              <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
                Secure{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                  Authentication
                </span>{" "}
                System
              </h1>

              <p className="text-lg md:text-xl text-slate-300 mb-10 leading-relaxed font-light">
                Production-ready JWT authentication with refresh tokens, role-based
                access control and secure password recovery.
              </p>

              <div className="flex flex-wrap gap-6 items-center justify-center lg:justify-start">
                <NavLink
                  to="/login"
                  className="inline-flex items-center justify-center h-14 px-12 bg-white text-indigo-900 rounded-full font-semibold text-base leading-none whitespace-nowrap shadow-lg hover:scale-105 hover:shadow-2xl transition-all duration-300"
                >
                  Get Started
                </NavLink>

                <NavLink
                  to="/signup"
                  className="inline-flex items-center justify-center h-14 px-12 bg-transparent border border-white/40 text-white rounded-full font-semibold text-base leading-none whitespace-nowrap backdrop-blur-md hover:bg-white/10 hover:border-cyan-400 hover:text-cyan-300 transition-all duration-300"
                >
                  Create Account
                </NavLink>
              </div>
            </div>

            {/* Right Side Image */}
            <div className="w-full max-w-lg lg:max-w-xl relative mt-10 lg:mt-0 mx-auto">
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 to-purple-500 rounded-2xl blur-3xl opacity-30 animate-pulse"></div>

              <img
                src="https://images.unsplash.com/photo-1555949963-aa79dcee981c?q=80&w=2070&auto=format&fit=crop"
                alt="Authentication Dashboard"
                className="relative z-10 w-full h-auto rounded-2xl shadow-2xl border border-white/10 transform hover:-translate-y-2 transition-transform duration-500"
              />
            </div>
          </main>

          {/* --- FEATURES SECTION --- */}
          <section className="py-24 relative z-10">
            <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
              <h2 className="text-4xl lg:text-5xl font-extrabold mb-4 text-white">
                Powerful{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                  Authentication
                </span>{" "}
                Features
              </h2>
              <p className="text-1xl lg:text-1xl font-extrabold mb-4 text-white">
                Built with modern security standards and production-ready architecture.</p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default HomePage;