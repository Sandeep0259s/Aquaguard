import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiDroplet, FiTrendingUp, FiGlobe } from "react-icons/fi";
import { auth, googleProvider } from "../config/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from "firebase/auth";
import theme from "../theme";
import { useAuth } from "../context/AuthContext";

export const Auth = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();
    const { user, initializing } = useAuth();

    useEffect(() => {
        if (!initializing && user) navigate('/chat', { replace: true });
    }, [initializing, user, navigate]);

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

    const handleForgotPassword = async () => {
        clearMessages();
        if (!email) {
            setError("Enter your email above first, then click \"Forgot password?\".");
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            setSuccess(`Password reset email sent to ${email}. Check your inbox.`);
        } catch (e) {
            setError(e.message);
            console.error(e);
        }
    };

    // Inline CSS styles (shared ocean palette — matches Chat/Tips/Usage)
    const styles = {
        page: {
            minHeight: "100vh",
            display: "flex",
            fontFamily: theme.fontFamily,
            backgroundColor: theme.colors.bgTint,
        },
        hero: {
            flex: "1 1 50%",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "4rem",
            background: theme.gradient.ocean,
            color: theme.colors.white,
            overflow: "hidden",
        },
        heroGlow: {
            position: "absolute",
            top: "-120px",
            right: "-120px",
            width: "360px",
            height: "360px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
        },
        heroGlow2: {
            position: "absolute",
            bottom: "-140px",
            left: "-80px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
        },
        heroBrand: {
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            marginBottom: "2.5rem",
            position: "relative",
            zIndex: 1,
        },
        heroBrandText: {
            fontFamily: theme.fontHeading,
            fontSize: "1.5rem",
            fontWeight: "700",
        },
        heroTitle: {
            fontFamily: theme.fontHeading,
            fontSize: "2.6rem",
            fontWeight: "700",
            lineHeight: 1.15,
            marginBottom: "1.25rem",
            position: "relative",
            zIndex: 1,
            maxWidth: "26rem",
        },
        heroSubtitle: {
            fontSize: "1.05rem",
            color: "rgba(255,255,255,0.85)",
            marginBottom: "2.5rem",
            maxWidth: "26rem",
            position: "relative",
            zIndex: 1,
        },
        heroFeatures: {
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            position: "relative",
            zIndex: 1,
        },
        heroFeature: {
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            fontSize: "0.95rem",
        },
        heroFeatureIcon: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.15)",
            flexShrink: 0,
        },
        formSide: {
            flex: "1 1 50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
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
            fontFamily: theme.fontHeading,
            fontSize: "1.5rem",
            fontWeight: "700",
            color: theme.colors.primary
        },
        authBox: {
            backgroundColor: theme.colors.white,
            padding: "2.5rem",
            borderRadius: theme.radius.xl,
            boxShadow: theme.shadow.glass,
            width: "100%",
            maxWidth: "26rem"
        },
        title: {
            fontFamily: theme.fontHeading,
            fontSize: "1.875rem",
            fontWeight: "700",
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
        passwordLabelRow: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
        },
        forgotLink: {
            fontSize: "0.8rem",
            color: theme.colors.primary,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            padding: 0,
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
        }
    };

    const features = [
        { icon: <FiDroplet size={16} />, text: "AI chat assistant with saved conversation history" },
        { icon: <FiTrendingUp size={16} />, text: "Footprint quiz, leak calculator & global scarcity data" },
        { icon: <FiGlobe size={16} />, text: "Multilingual — ask in your own language" },
    ];

    return (
        <div style={styles.page}>
            <div style={styles.hero} className="auth-hero">
                <div style={styles.heroGlow} className="float" />
                <div style={styles.heroGlow2} />
                <div style={styles.heroBrand}>
                    <FiDroplet size={30} />
                    <span style={styles.heroBrandText}>AquaGuard</span>
                </div>
                <h1 style={styles.heroTitle}>Every drop counts. Start with yours.</h1>
                <p style={styles.heroSubtitle}>
                    Your AI-powered companion for smarter water conservation — chat for
                    advice, measure your footprint, and see the global picture.
                </p>
                <div style={styles.heroFeatures}>
                    {features.map((f, i) => (
                        <div key={i} style={styles.heroFeature}>
                            <span style={styles.heroFeatureIcon}>{f.icon}</span>
                            {f.text}
                        </div>
                    ))}
                </div>
            </div>

            <div style={styles.formSide}>
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
                        <div style={styles.passwordLabelRow}>
                            <label htmlFor="password" style={styles.label}>
                                Password
                            </label>
                            {isLogin && (
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    style={styles.forgotLink}
                                >
                                    Forgot password?
                                </button>
                            )}
                        </div>
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
                </div>
            </div>
            </div>
        </div>
    );
};