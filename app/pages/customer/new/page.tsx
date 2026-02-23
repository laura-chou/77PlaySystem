'use client';

import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import styles from '@/styles/modules/customer.module.scss';

import { env } from '@/config/env';
import { INewCustomer } from '@/lib/models/customer';

export default function CreateCustomer() {
    const router = useRouter();

    // Get today's date in YYYY-MM-DD format for the date input
    const today = new Date().toISOString().split('T')[0];

    const [newCustomer, setNewCustomer] = useState<INewCustomer>({
        custName: '',
        createDate: today,
        amount: 1500
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

    const handleSubmit = async() => {
        if (!newCustomer.custName.trim()) {
            alert('請輸入客戶 LINE');
            return;
        }
        try {
            const dataToSend = { ...newCustomer };

            await axios.post(
                `${env.apiBaseUrl}customer/create`,
                dataToSend,
                { withCredentials: true }
            );

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
        <div className={`${styles.container}`}>
            <div className={`m-3 ${styles.customerDetail}`}>
                <div className="d-flex justify-content-between align-items-center mb-3 px-0">
                    <h3 className="page-title">新增客戶</h3>
                    <button
                        className="btn btn-secondary"
                        onClick={handleCancel}
                    >
                        <i className="bi bi-arrow-left me-2"></i>
                        返回清單
                    </button>
                </div>
                <div className="mb-2">
                    <label htmlFor="custName" className="col-form-label px-1">客戶 LINE：</label>
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

                <div className="mb-2">
                    <label htmlFor="amount" className="col-form-label px-1">金額：</label>
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
                </div>

                <div className="mb-4">
                    <label htmlFor="createDate" className="col-form-label px-1">加入日期：</label>
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

                <div className="d-flex justify-content-end">
                    <button className="btn btn-primary" onClick={handleSubmit}>
                        <i className="bi bi-check-circle me-2"></i>
                        儲存
                    </button>
                </div>
            </div>
        </div>
    );
}
