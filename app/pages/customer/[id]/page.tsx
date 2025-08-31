'use client';

import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import styles from '@/styles/modules/customer.module.scss';

import { env } from '../../../config/env';
import { ICustomer, ICustomerHistory, ICustomerFormData } from '../../../lib/models/customer';


export default function CustomerEdit() {
    const router = useRouter();
    const params = useParams();
    const customerId = params.id;

    const [customer, setCustomer] = useState<ICustomer | null>(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<ICustomerFormData>({
        custId: '',
        custName: '',
        createDate: '',
        balance: 0,
        balanceExpiryDate: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [balanceAction, setBalanceAction] = useState<'refill' | 'extend' | 'charge' | 'name'>('refill');
    const [balanceAmount, setBalanceAmount] = useState(0);

    useEffect(() => {
        const fetchCustomer = async() => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            try {
                setLoading(true);
                const response = await axios.get(`${env.apiBaseUrl}customer/${customerId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const customerData = response.data.data;
                setCustomer(customerData);
                const today = new Date().toISOString().split('T')[0];

                // Ensure dates are properly formatted
                const createDate = customerData.createDate ?
                    new Date(customerData.createDate).toISOString().split('T')[0] : today;
                const balanceExpiryDate = customerData.history?.[0]?.expiryDate ?
                    new Date(customerData.history[0].expiryDate).toISOString().split('T')[0] : today;

                const newFormData = {
                    custId: customerData.custId,
                    custName: customerData.custName,
                    createDate: createDate,
                    balance: customerData.history?.[0]?.currentBalance || 0,
                    balanceExpiryDate: balanceExpiryDate
                };

                console.log('Setting form data:', newFormData);
                setFormData(newFormData);
            } catch (error) {
                console.error('Failed to fetch customer:', error);
                // If token is invalid, redirect to login
                if (axios.isAxiosError(error) && error.response?.status === 401) {
                    localStorage.removeItem('token');
                    router.push('/login');
                }
            } finally {
                setLoading(false);
            }
        };

        if (customerId) {
            fetchCustomer();
        }
    }, [customerId, router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            // Prepare the data to send
            const dataToSend = { ...formData };

            // Apply balance operations if amount is provided
            if (balanceAmount > 0 || balanceAction === 'refill' || balanceAction === 'extend' || balanceAction === 'name') {
                const amountToUse = balanceAction === 'refill' ? 1500 : balanceAction === 'extend' ? 200 : balanceAction === 'name' ? 0 : balanceAmount;

                switch (balanceAction) {

                    case 'charge':
                        dataToSend.balance = formData.balance - amountToUse;
                        break;
                    case 'refill':
                        dataToSend.balance = formData.balance + amountToUse;
                        break;
                    case 'name':
                        // For name action, no balance change is made
                        break;
                    case 'extend':
                        // For extend, we'll add the amount as days to the expiry date
                        if (formData.balanceExpiryDate) {
                            const currentExpiry = new Date(formData.balanceExpiryDate);
                            currentExpiry.setDate(currentExpiry.getDate() + Math.floor(amountToUse));
                            dataToSend.balanceExpiryDate = currentExpiry.toISOString().split('T')[0];
                        }
                        break;
                }
            }

            await axios.put(`https://json-placeholder.mock.beeceptor.com/users/${customerId}`, dataToSend, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Update local state
            setCustomer(prev => prev ? { ...prev, ...dataToSend } : null);
            setFormData(dataToSend);
            setIsEditing(false);
            setBalanceAmount(0);
            setBalanceAction('refill');
            alert('客戶資料已更新！');
        } catch (error) {
            console.error('Failed to update customer:', error);
            alert('更新失敗，請重試');
        }
    };

    const handleCancel = () => {
        const today = new Date().toISOString().split('T')[0];
        if (customer) {
            setFormData({
                custId: customer.custId,
                custName: customer.custName,
                createDate: customer.createDate || today,
                balance: customer.history[0].currentBalance || 0,
                balanceExpiryDate: customer.history[0].expiryDate || today
            });
        }
        setIsEditing(false);
        setBalanceAmount(0);
        setBalanceAction('refill');
    };

    if (loading) {
        return (
            <div className="container mt-5">
                <div className="d-flex justify-content-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">載入中...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="container mt-5">
                <div className="alert alert-danger">
                    找不到客戶資料
                </div>
                <button
                    className="btn btn-secondary"
                    onClick={() => router.push('/pages/dashboard')}
                >
                    返回客戶清單
                </button>
            </div>
        );
    }

    // Debug: Log current form data
    console.log('Current formData:', formData);

    return (
        <div className="container mt-5">
            <div className="row">
                <div className="col-md-8 mx-auto">
                    <div className={`card ${styles.customerDetail}`}>
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h3 className="mb-0 page-title">客戶資料</h3>
                            <button
                                className="btn btn-secondary"
                                onClick={() => router.push('/pages/dashboard')}
                            >
                                <i className="bi bi-arrow-left me-2"></i>
                                返回清單
                            </button>
                        </div>
                        <div className="card-body">
                            <div className="row mb-3">
                                <label className="col-sm-3 col-form-label">客戶 LINE:</label>
                                <div className="col-sm-9">
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="custName"
                                        value={formData.custName}
                                        onChange={handleInputChange}
                                        disabled={!isEditing || (isEditing && balanceAction !== 'name')}
                                    />
                                </div>
                            </div>

                            <div className="row mb-3">
                                <label className="col-sm-3 col-form-label">加入日期:</label>
                                <div className="col-sm-9">
                                    <input
                                        type="date"
                                        className="form-control"
                                        name="createDate"
                                        value={formData.createDate}
                                        onChange={handleInputChange}
                                        disabled={true}
                                    />
                                </div>
                            </div>

                            <div className="row mb-3">
                                <label className="col-sm-3 col-form-label">當前餘額:</label>
                                <div className="col-sm-9">
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="balance"
                                        value={formData.balance}
                                        onChange={handleInputChange}
                                        disabled={true}
                                        step="0.01"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="row mb-3">
                                <label className="col-sm-3 col-form-label">餘額到期日:</label>
                                <div className="col-sm-9">
                                    <input
                                        type="date"
                                        className="form-control"
                                        name="balanceExpiryDate"
                                        value={formData.balanceExpiryDate}
                                        onChange={handleInputChange}
                                        disabled={true}
                                    />
                                </div>
                            </div>

                            {isEditing && (
                                <>
                                    <hr className="my-4" />
                                    <h5 className="mb-3">操作</h5>

                                    <div className="row mb-3">
                                        <label className="col-sm-3 col-form-label">操作類型:</label>
                                        <div className="col-sm-9">
                                            <div className="col-sm-9">
                                                <select
                                                    className="form-select"
                                                    value={balanceAction}
                                                    onChange={(e) => {
                                                        const value = e.target.value as 'refill' | 'extend' | 'charge' | 'name';
                                                        setBalanceAction(value);
                                                        if (value === 'name') setBalanceAmount(0);
                                                        else if (value === 'refill') setBalanceAmount(1500);
                                                        else if (value === 'extend') setBalanceAmount(200);
                                                        else if (value === 'charge') setBalanceAmount(200);
                                                    }}
                                                >
                                                    <option value="name">改客戶 LINE</option>
                                                    <option value="charge">消費</option>
                                                    <option value="refill">充值</option>
                                                    <option value="extend">延長到期日</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row mb-3">
                                        <label className="col-sm-3 col-form-label">金額:</label>
                                        <div className="col-sm-9">
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={balanceAction === 'refill' ? 1500 : balanceAction === 'extend' ? 200 : balanceAction === 'name' ? 0 : balanceAmount}
                                                onChange={(e) => {
                                                    const value = parseFloat(e.target.value) || 0;
                                                    // Round to nearest 100
                                                    const roundedValue = Math.round(value / 100) * 100;
                                                    setBalanceAmount(roundedValue);
                                                }}
                                                onKeyDown={(e) => {
                                                    // Allow only numbers, backspace, delete, arrow keys, and enter
                                                    if (!/[0-9]/.test(e.key) &&
                                                        !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Tab'].includes(e.key)) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                step="100"
                                                min="0"
                                                placeholder="請輸入金額 (100的倍數)"
                                                disabled={balanceAction !== 'charge'}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="d-flex justify-content-end gap-2">
                                {!isEditing ? (
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        <i className="bi bi-pencil me-2"></i>
                                        編輯
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            className="btn btn-success"
                                            onClick={handleSave}
                                        >
                                            <i className="bi bi-check me-2"></i>
                                            儲存
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={handleCancel}
                                        >
                                            <i className="bi bi-x me-2"></i>
                                            取消
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
