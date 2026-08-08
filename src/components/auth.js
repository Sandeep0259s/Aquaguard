import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiDroplet } from "react-icons/fi";
import { auth, googleProvider } from "../config/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signOut } from "firebase/auth";
import theme from "../theme";

export const Auth = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();

    const clearMessages = () => {
        setError("");
        setSuccess("");
    };

    const handleAuth = async () => {
        clearMessages();
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                setSuccess("Successfully signed in!");
                navigate('/chat'); // Navigate to chat after sign in
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
                setSuccess("Account created successfully!");
                navigate(`/chat`); // Navigate to chat after sign up
            }
        } catch (e) {
            setError(e.message);
            console.error(e);
        }
    };

    const signInWithGoogle = async () => {
        clearMessages();
        try {
            await signInWithPopup(auth, googleProvider);
            setSuccess("Signed in with Google successfully!");
            navigate('/chat'); // Navigate to chat after Google sign in
        } catch (e) {
            setError(e.message);
            console.error(e);
        }
    };

    const signout = async () => {
        clearMessages();
        try {
            await signOut(auth);
            setSuccess("Signed out successfully!");
        } catch (e) {
            setError(e.message);
            console.error(e);
        }
    };

    // Inline CSS styles (shared ocean palette — matches Chat/Tips/Usage)
    const styles = {
        container: {
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: theme.fontFamily,
            background: `linear-gradient(135deg, ${theme.colors.bgTint} 0%, ${theme.colors.accentPale} 100%)`
        },
        brand: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            marginBottom: "1.5rem"
        },
        brandIcon: {
            color: theme.colors.primary
        },
        brandText: {
            fontSize: "1.5rem",
            fontWeight: "700",
            color: theme.colors.primary
        },
        authBox: {
            backgroundColor: theme.colors.white,
            padding: "2rem",
            borderRadius: theme.radius.lg,
            boxShadow: theme.shadow.panel,
            width: "100%",
            maxWidth: "28rem"
        },
        title: {
            fontSize: "1.875rem",
            fontWeight: "bold",
            textAlign: "center",
            color: theme.colors.textDark,
            marginBottom: "1.5rem"
        },
        errorMessage: {
            marginBottom: "1rem",
            padding: "0.75rem",
            backgroundColor: "#fee2e2",
            color: "#b91c1c",
            borderRadius: "0.375rem",
            fontSize: "0.875rem"
        },
        successMessage: {
            marginBottom: "1rem",
            padding: "0.75rem",
            backgroundColor: "#dcfce7",
            color: "#166534",
            borderRadius: "0.375rem",
            fontSize: "0.875rem"
        },
        formGroup: {
            display: "flex",
            flexDirection: "column",
            gap: "1rem"
        },
        label: {
            display: "block",
            fontSize: "0.875rem",
            fontWeight: "500",
            color: theme.colors.textMuted,
            marginBottom: "0.25rem"
        },
        input: {
            width: "100%",
            padding: "0.5rem 1rem",
            border: `1px solid ${theme.colors.border}`,
            borderRadius: "0.375rem",
            outline: "none"
        },
        primaryButton: {
            width: "100%",
            backgroundColor: theme.colors.primary,
            color: theme.colors.white,
            padding: "0.5rem 1rem",
            borderRadius: "0.375rem",
            border: "none",
            cursor: "pointer",
            fontWeight: "600",
            transition: "background-color 0.2s"
        },
        googleButton: {
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            backgroundColor: theme.colors.white,
            border: `1px solid ${theme.colors.border}`,
            color: theme.colors.textMuted,
            padding: "0.5rem 1rem",
            borderRadius: "0.375rem",
            cursor: "pointer",
            transition: "background-color 0.2s"
        },
        toggleText: {
            textAlign: "center",
            fontSize: "0.875rem",
            color: theme.colors.textMuted,
            marginTop: "1rem"
        },
        toggleButton: {
            color: theme.colors.primary,
            fontWeight: "500",
            border: "none",
            backgroundColor: "transparent",
            cursor: "pointer"
        },
        signOutButton: {
            width: "100%",
            marginTop: "1rem",
            fontSize: "0.875rem",
            color: theme.colors.textMuted,
            border: "none",
            backgroundColor: "transparent",
            cursor: "pointer"
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.authBox}>
                <div style={styles.brand}>
                    <FiDroplet size={28} style={styles.brandIcon} />
                    <span style={styles.brandText}>AquaGuard</span>
                </div>
                <h1 style={styles.title}>
                    {isLogin ? "Welcome Back" : "Create Account"}
                </h1>

                {error && (
                    <div style={styles.errorMessage}>
                        {error}
                    </div>
                )}
                
                {success && (
                    <div style={styles.successMessage}>
                        {success}
                    </div>
                )}
                
                <div style={styles.formGroup}>
                    <div>
                        <label htmlFor="email" style={styles.label}>
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={styles.input}
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="password" style={styles.label}>
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={styles.input}
                        />
                    </div>
                    
                    <button
                        onClick={handleAuth}
                        style={styles.primaryButton}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme.colors.primaryDark}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = theme.colors.primary}
                    >
                        {isLogin ? "Sign In" : "Sign Up"}
                    </button>
                    
                    <button
                        onClick={signInWithGoogle}
                        style={styles.googleButton}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = "white"}
                    >
                        <svg style={{ width: "1.25rem", height: "1.25rem" }} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        {isLogin ? "Sign in with Google" : "Sign up with Google"}
                    </button>
                    
                    {auth.currentUser ? (
                        <button
                            onClick={signout}
                            style={styles.signOutButton}
                            onMouseOver={(e) => e.currentTarget.style.color = theme.colors.textDark}
                            onMouseOut={(e) => e.currentTarget.style.color = theme.colors.textMuted}
                        >
                            Sign Out
                        </button>
                    ) : (
                        <p style={styles.toggleText}>
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                style={styles.toggleButton}
                                onMouseOver={(e) => e.currentTarget.style.color = theme.colors.primaryDark}
                                onMouseOut={(e) => e.currentTarget.style.color = theme.colors.primary}
                            >
                                {isLogin ? "Sign up" : "Sign in"}
                            </button>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};