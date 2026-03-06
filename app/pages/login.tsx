'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import styles from '@/styles/modules/login.module.scss';

import api, { setToken } from '@/lib/api';

export default function Login() {
    const [account, setAccount] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async(e: React.FormEvent) => {
        e.preventDefault();
        if (account.trim() === '') {
            alert('請輸入帳號');
            return;
        }
        if (password.trim() === '') {
            alert('請輸入密碼');
            return;
        }
        setLoading(true);
        try {
            const request = { "account": account, "password": password };
            const response = await api.post(
                `user/login`,
                request
            );

            if (response.status === 200 && response.data?.data?.token) {
                setToken(response.data.data.token);
                router.push('/pages/dashboard');
            } else {
                setLoading(false);
                alert('帳號或密碼錯誤');
            }
        } catch (error) {
            setLoading(false);
            alert('帳號或密碼錯誤');
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
                        className="form-control"
                        type="text"
                        placeholder="帳號"
                        value={account}
                        onChange={(e) => setAccount(e.target.value)}
                    />
                    <input
                        className="form-control"
                        type="password"
                        placeholder="密碼"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="submit" disabled={loading}>
                        {loading && (
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" ></span>
                        )}
                        {loading ? "登入中..." : "登入"}
                    </button>
                </form>
            </div>
        </div>
    );
}
