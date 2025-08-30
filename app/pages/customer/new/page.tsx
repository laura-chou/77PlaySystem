'use client';
import { useState } from 'react';
import axios from 'axios';
import { env } from '../../../config/env';
import { useRouter } from 'next/navigation';
import styles from '@/styles/modules/customer.module.scss';

export default function CreateCustomer() {
    const router = useRouter();

    // Get today's date in YYYY-MM-DD format for the date input
    const today = new Date().toISOString().split('T')[0];

    const [newCustomer, setNewCustomer] = useState({
        custName: '',
        createDate: today,
        amount: 0
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        // Handle number input specifically for amount field
        if (name === 'amount') {
            const numValue = parseFloat(value) || 0;
            setNewCustomer(prev => ({
                ...prev,
                [name]: numValue
            }));
        } else {
            setNewCustomer(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            const dataToSend = { ...newCustomer };

            const response = await axios.post(`${env.apiBaseUrl}customer/create`, dataToSend, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            // Handle successful creation
            alert('客戶新增成功');
            router.push('/pages/dashboard');
        } catch (error) {
            console.error('Failed to create customer:', error);
        }
    };

    const handleCancel = () => {
        router.push('/pages/dashboard');
    };

    return (
        <div className={`container ${styles.customerForm}`}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="page-title">客戶資料</h1>
                <button className="btn btn-secondary" onClick={handleCancel}>
                    <i className="bi bi-arrow-left me-2"></i>
                    返回清單
                </button>
            </div>

            <div className="row justify-content-center">
                <div className="col-md-8 col-lg-6">
                    <form onSubmit={handleSubmit}>
                        <div className="border rounded p-4">
                            <div className="mb-3">
                                <label htmlFor="custName" className="form-label">客戶 LINE</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="custName"
                                    name="custName"
                                    value={newCustomer.custName}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="createDate" className="form-label">加入日期</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    id="createDate"
                                    name="createDate"
                                    value={newCustomer.createDate}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="amount" className="form-label">金額</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    id="amount"
                                    name="amount"
                                    value={newCustomer.amount}
                                    onChange={handleInputChange}
                                    min="100"
                                    step="100"
                                    required
                                />
                                <div className="form-text">最小金額: 100，步進: 100</div>
                            </div>
                        </div>

                        <div className="d-flex justify-content-end gap-2 mt-3">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleCancel}
                            >
                                取消
                            </button>
                            <button type="submit" className="btn btn-primary">
                                <i className="bi bi-check-circle me-2"></i>
                                儲存
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
