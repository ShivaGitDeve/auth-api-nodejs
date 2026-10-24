import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { Background, Button } from "../components/ui";

const NotFound = () => (
  <div className="grid min-h-screen place-items-center px-4 text-center text-white">
    <Background />
    <div className="animate-fade-up">
      <h1 className="font-display text-[8rem] font-bold leading-none text-gradient sm:text-[12rem] animate-float">404</h1>
      <p className="mt-4 text-xl font-semibold">Page not found</p>
      <p className="mt-2 text-slate-400">The page you’re looking for doesn’t exist or was moved.</p>
      <Link to="/" className="mt-8 inline-block">
        <Button>
          <FiArrowLeft /> Back home
        </Button>
      </Link>
    </div>
  </div>
);

export default NotFound;
