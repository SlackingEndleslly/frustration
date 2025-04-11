
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <Layout>
      <div className="rage-card max-w-md w-full mx-auto text-center">
        <h1 className="text-6xl font-bold mb-4 text-rage-danger">404</h1>
        <p className="text-xl text-white mb-6">Buddy Not Found!</p>
        <Button 
          onClick={() => navigate("/")}
          className="rage-button"
        >
          Return to Home
        </Button>
      </div>
    </Layout>
  );
};

export default NotFound;
