import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface ProtectedRouteProps {
    children: ReactNode;
    requiredRole?: "admin" | "contributor" | "user";
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
    const { user, role, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !user) {
            navigate("/login");
        }
    }, [user, loading, navigate]);

    if (loading) {
        return <LoadingSpinner fullScreen size="lg" />;
    }

    if (!user) {
        return null;
    }

    if (requiredRole && role !== requiredRole && role !== "admin") {
        // If user has a role but not the required one (and isn't an admin), redirect to home
        // Admin bypasses all role checks
        return null;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
