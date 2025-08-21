'use client';
import axios from 'axios';
import styles from '@/styles/login.module.scss'
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
    const [passCode, setPassCode] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const request = { "username": passCode, "password": "success-password" };
            const response = await axios.post('https://json-placeholder.mock.beeceptor.com/login', request);
            const token = response.data.token;
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            router.push('/pages/dashboard');
        } catch (error) {
            console.error('登入失敗:', error);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.loginWrapper}>
                <img src="/icon/favicon.svg" alt="77Play Logo" className={styles.logo} />
                <h1 className={styles.title}>77Play 會員系統</h1>

                <form className={styles.loginForm} onSubmit={handleLogin}>
                    <input 
                        id="passCode"
                        className="form-control"
                        type="password"
                        placeholder="請輸入密鑰"
                        value={passCode}
                        onChange={(e) => setPassCode(e.target.value)}
                    />
                    <button type="submit">登入</button>
                </form>
            </div>
            {/* <div className='row'>
                <h1 className="mb-4 text-center">登入</h1>
                <form onSubmit={handleLogin}>
                    <div className="mb-3">
                        <input
                            id="passCode"
                            type="password"
                            className="form-control"
                            placeholder="請輸入密鑰"
                            value={passCode}
                            onChange={(e) => setPassCode(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-100">登入</button>
                </form>
            </div> */}
        </div>
    );
}