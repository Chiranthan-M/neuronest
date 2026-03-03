import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center app-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-6"
      >
        <div className="text-8xl font-bold gradient-text">404</div>
        <p className="text-lg text-muted-foreground">Page not found</p>
        <Link to="/">
          <Button className="gradient-primary text-primary-foreground rounded-xl shadow-glass ripple-btn">
            <Home className="w-4 h-4 mr-2" />
            Return Home
          </Button>
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
