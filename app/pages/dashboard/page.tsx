'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import styles from '@/styles/dashboard.module.scss';

interface User {
    id: number;
    name: string;
    phone: string;
}

export default function Dashboard() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const maskPhoneNumber = (phone: string) => {
        if (phone.length <= 3) return phone;
        const lastThree = phone.slice(-3);
        const maskedPart = '*'.repeat(phone.length - 3);
        return maskedPart + lastThree;
    };

    useEffect(() => {
        const fetchUsers = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }
            try {
                const request = {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                };
                const response = await axios.get('https://json-placeholder.mock.beeceptor.com/users', request);
                setUsers(response.data);
            } catch (error) {
                console.error('Failed to fetch users:', error);
                // Clear invalid token and redirect to login
                localStorage.removeItem('token');
                router.push('/login');
            }
        };
        fetchUsers();
    }, [router]);

    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.includes(searchTerm)
    );

    return (
        <div className={`container ${styles.customerList}`}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="page-title">客戶清單</h1>
                <button className="btn btn-success">
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

            <div className="table-responsive">
                <table className={`table table-hover table-bordered ${styles.table}`}>
                    <thead className="table-success">
                        <tr>
                            <th>電話</th>
                            <th>姓名</th>
                            <th>編輯</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user) => (
                            <tr key={user.id}>
                                <td>{maskPhoneNumber(user.phone)}</td>
                                <td>{user.name}</td>
                                <td>
                                    <button 
                                        className="btn btn-sm btn-primary"
                                        onClick={() => router.push(`/pages/customer/${user.id}`)}
                                    >
                                        編輯
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
} 