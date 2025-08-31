'use client';

import axios from 'axios';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import styles from '@/styles/modules/login.module.scss';

import { env } from '../config/env';

export default function Login() {
    const [password, setPassword] = useState('');
    const router = useRouter();

    const handleLogin = async(e: React.FormEvent) => {
        e.preventDefault();
        try {
            const request = { "password": password };
            const response = await axios.post(`${env.apiBaseUrl}user/login`, request);
            const token = response.data.data.token;
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            router.push('/pages/dashboard');
        } catch (error) {
            alert((error as any).response.data.message);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.loginWrapper}>
                <Image
                    src="/icon/favicon.svg"
                    alt="77Play Logo"
                    width={32}
                    height={32}
                    className={styles.logo}
                    priority
                />
                <h1 className={styles.title}>77Play 會員系統</h1>

                <form className={styles.loginForm} onSubmit={handleLogin}>
                    <input
                        id="passCode"
                        className="form-control"
                        type="password"
                        placeholder="請輸入密鑰"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="submit">登入</button>
                </form>
            </div>
        </div>
    );
}
