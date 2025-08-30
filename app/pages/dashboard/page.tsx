'use client';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { env } from '../../config/env';
import styles from '@/styles/modules/dashboard.module.scss';

interface User {
    custId: string;
    custName: string;
    expiryDate: string;
}

export default function Dashboard() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const maskPhoneNumber = (phone: string) => {
        if (phone.length <= 3) return phone;
        const lastThree = phone.slice(-3);
        const maskedPart = '*'.repeat(phone.length - 3);
        return maskedPart + lastThree;
    };

    useEffect(() => {
        const fetchUsers = async() => {
            try {
                setLoading(true);
                setError(null);

                const token = localStorage.getItem('token');

                if (!token) {
                    alert('驗證失敗，請重新登入');
                    router.push('/login');
                    return;
                }

                const config = {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                };

                const response = await axios.get(`${env.apiBaseUrl}customer`, config);

                if (response.data.data && Array.isArray(response.data.data)) {
                    setUsers(response.data.data);
                }
                else {
                    setUsers([]);
                }
            } catch (error: any) {

                if (error.response?.status === 401) {
                    alert('驗證失效，請重新登入');
                    localStorage.removeItem('token');
                    router.push('/login');
                } else {
                    setError(error.message || 'Failed to fetch users');
                    setUsers([]);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [router]);

    const filteredUsers = (users || []).filter(user =>
        user.custName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className={`container ${styles.customerList}`}>
                <div className="text-center py-5">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">載入中...</span>
                    </div>
                    <p className="mt-3">載入中...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`container ${styles.customerList}`}>
                <div className="alert alert-danger" role="alert">
                    <h4 className="alert-heading">載入失敗</h4>
                    <p>{error}</p>
                    <button
                        className="btn btn-outline-danger"
                        onClick={() => window.location.reload()}
                    >
                        重新載入
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`container ${styles.customerList}`}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="page-title">客戶清單</h1>
                <button className="btn btn-success" onClick={() => router.push('/pages/customer/new')}>
                    <i className="bi bi-plus-circle me-2"></i>
                    新增客戶
                </button>
            </div>

            <div className="row mb-4">
                <div className="col-md-6">
                    <div className={`input-group ${styles.searchGroup}`}>
                        <span className="input-group-text">
                            <i className="bi bi-search"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="搜尋姓名或電話..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {filteredUsers.length === 0 ? (
                <div className="text-center py-5">
                    <div className="text-muted">
                        <i className="bi bi-people fs-1 d-block mb-3"></i>
                        <h5>沒有找到客戶</h5>
                        <p>目前沒有任何客戶資料</p>
                    </div>
                </div>
            ) : (
                <div className="table-responsive">
                    <table className={`table table-hover table-bordered ${styles.table}`}>
                        <thead className="table-success">
                            <tr>
                                <th>LINE ID</th>
                                <th>期限</th>
                                <th>編輯</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.custId}>
                                    <td>{user.custName}</td>
                                    <td>{user.expiryDate}</td>
                                    <td>
                                        <button
                                            className="btn btn-sm btn-primary"
                                            onClick={() => router.push(`/pages/customer/${user.custId}`)}
                                        >
                                            編輯
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
