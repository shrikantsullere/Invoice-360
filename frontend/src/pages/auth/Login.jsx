import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import './Login.css';
import fullLogo from '../../assets/Images/image.png';
import circleLogo from '../../assets/Images/image.png';
// Image removed for Kiaan Technology branding

const Login = () => {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await login(formData.email, formData.password);
            toast.success('Login Successful!');

            const userData = response.user;
            console.log("Logged in user data:", userData);

            if (userData.role === 'SUPERADMIN') {
                navigate('/superadmin/dashboard');
            } else if (userData.role === 'ADMIN' || userData.role === 'COMPANY') {
                navigate('/company/dashboard');
            } else if (userData.role === 'USER') {
                navigate('/user/dashboard');
            } else {
                navigate('/company/dashboard');
            }
        } catch (error) {
            console.error("Login error details:", error);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Cannot connect to server. Please check if your backend is running.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const fillCredentials = (email, password) => {
        setFormData({ email, password });
        toast.success('Credentials filled!');
    };

    return (
        <div className="login-container">
            <div className="login-wrapper">

                {/* LEFT SIDE – LOGIN */}
                <div className="login-card">
                    <div className="login-header">
                        <div className="logo-container" style={{ marginBottom: '1rem' }}>
                            <img src={fullLogo} alt="Kiaan Technology" style={{ height: '50px' }} />
                        </div>
                        <p className="login-subtext">
                            Welcome back! Please sign in to continue.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <div className="input-wrapper">
                                <Mail className="input-icon" size={18} />
                                <input
                                    type="email"
                                    name="email"
                                    className="form-input"
                                    placeholder="yours@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div className="input-wrapper">
                                <Lock className="input-icon" size={18} />
                                <input
                                    type="password"
                                    name="password"
                                    className="form-input"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-footer">
                            <label className="remember">
                                <input type="checkbox" />
                                Remember me
                            </label>
                            <a href="#" className="forgot-password">Forgot Password?</a>
                        </div>

                        <button type="submit" className="login-btn">
                            {loading ? 'Signing In...' : 'Sign In'}
                            {!loading && <ArrowRight size={18} />}
                        </button>
                    </form>

                    {/* Demo Credentials Section */}
                    <div className="credentials-section">
                        <div className="credentials-header">
                            <span className="credentials-badge">🔑 Demo Credentials</span>
                        </div>
                        <div className="credentials-grid">
                            <div
                                className="credential-card superadmin-card"
                                onClick={() => fillCredentials('superadmin@gmail.com', '123')}
                            >
                                <div className="credential-role">SUPER ADMIN</div>
                                <div className="credential-email">superadmin@gmail.com</div>
                                <div className="credential-password">Password: 123</div>
                            </div>
                            <div
                                className="credential-card company-card"
                                onClick={() => fillCredentials('company@gmail.com', '123')}
                            >
                                <div className="credential-role">COMPANY</div>
                                <div className="credential-email">company@gmail.com</div>
                                <div className="credential-password">Password: 123</div>
                            </div>
                            <div
                                className="credential-card user-card"
                                onClick={() => fillCredentials('user@gmail.com', '123')}
                            >
                                <div className="credential-role">USER</div>
                                <div className="credential-email">user@gmail.com</div>
                                <div className="credential-password">Password: 123</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE – BRANDING */}
                <div className="brand-card">
                    <img
                        src={fullLogo}
                        alt="Kiaan Technology"
                        className="brand-image"
                        style={{ objectFit: 'contain', padding: '20px' }}
                    />
                    <h2>Smart Accounting Solutions</h2>
                    <p>Track, manage, and grow your business with precision.</p>
                </div>

            </div>
        </div>
    );
};

export default Login;