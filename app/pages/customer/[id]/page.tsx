'use client';

import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import styles from '@/styles/modules/customer.module.scss';

import { env } from '../../../config/env';
import { ICustomer, ICustomerHistory, ICustomerFormData, ActionEnum } from '../../../lib/models/customer';


export default function CustomerEdit() {
    const router = useRouter();
    const params = useParams();
    const customerId = params.id as string;

    const [customer, setCustomer] = useState<ICustomer | null>(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<ICustomerFormData>({
        action: ActionEnum.CHARGE,
        custId: customerId,
        custName: '',
        amount: 0
    });
    const [isEditing, setIsEditing] = useState(false);
    const [action, setAction] = useState<ActionEnum>(ActionEnum.NAME);
    const [balanceAmount, setBalanceAmount] = useState(0);

    useEffect(() => {
        if (customerId) {
            fetchCustomer();
        }
    }, [customerId, router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        // only name is editable in upper block
        if (action === ActionEnum.NAME) {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const fetchCustomer = async() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/');
            return;
        }

        try {
            setLoading(true);
            const response = await axios.get(`${env.apiBaseUrl}customer/${customerId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const responseData = response.data.data;

            // Ensure dates are properly formatted
            const today = new Date().toISOString().split('T')[0];
            const createDate = responseData.createDate ? new Date(responseData.createDate).toISOString().split('T')[0] : today;
            const expiryDate = responseData.history[0].expiryDate ? new Date(responseData.history[0].expiryDate).toISOString().split('T')[0] : today;
            const customerData = {
                custId: customerId,
                custName: responseData.custName,
                createDate: createDate,
                balance: responseData.history[0].currentBalance,
                balanceExpiryDate: expiryDate,
                history: responseData.history
            };
            setCustomer(customerData);

            const newFormData = {
                action: action,
                custId: customerData.custId,
                custName: customerData.custName,
                amount: 0
            };

            setFormData(newFormData);
        } catch (error) {
            // If token is invalid, redirect to login
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                localStorage.removeItem('token');
                router.push('/');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/');
            return;
        }

        try {
            // Prepare the data to send
            const dataToSend = { ...formData };
            setAction(action);
            dataToSend.action = action;

            // Apply balance operations if amount is provided
            if (balanceAmount > 0 || action === 'refill' || action === 'extend' || action === 'name') {
                const amountToUse = action === 'name' ? 0 : balanceAmount;

                switch (action) {

                    case 'charge':
                    case 'refill':
                    case 'extend':
                        dataToSend.amount = amountToUse;
                        break;
                    case 'name':
                        // For name action, no balance change is made
                        dataToSend.custName = formData.custName;
                        dataToSend.amount = 0;
                        break;
                }
            }

            console.log('prior to send dataToSend', dataToSend);
            await axios.patch(`${env.apiBaseUrl}customer/update/${customerId}`, dataToSend, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            // Fetch updated customer data after successful update
            await fetchCustomer();
            setIsEditing(false);
            setBalanceAmount(0);
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
                action: ActionEnum.CHARGE,
                custId: customer.custId,
                custName: customer.custName,
                amount: customer.history[0].currentBalance || 0
            });
        }
        setIsEditing(false);
        setBalanceAmount(0);
        setAction(ActionEnum.CHARGE);
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
        <div className={`${styles.container}`}>
            <div className={`row mx-3 ${styles.customerDetail}`}>
                <div className="d-flex justify-content-between align-items-center mb-3 px-0">
                    <h3 className="page-title">客戶資料</h3>
                    <button
                        className="btn btn-secondary"
                        onClick={() => router.push('/pages/dashboard')}
                    >
                        <i className="bi bi-arrow-left me-2"></i>
                        返回清單
                    </button>
                </div>
                <div className="row mb-3">
                    <label className="col-form-label px-1">客戶 LINE：</label>
                    <input
                        type="text"
                        className="form-control"
                        name="custName"
                        value={formData.custName}
                        onChange={handleInputChange}
                        disabled={!isEditing || (isEditing && action !== 'name')}
                    />
                </div>

                <div className="row mb-3">
                    <label className="col-form-label px-1">加入日期：</label>
                    <input
                        type="date"
                        className="form-control"
                        name="createDate"
                        value={customer.createDate}
                        disabled={true}
                    />
                </div>

                <div className="row mb-3">
                    <label className="col-form-label px-1">當前餘額：</label>
                    <input
                        type="number"
                        className="form-control"
                        name="amount"
                        value={customer.balance}
                        disabled={true}
                    />
                </div>

                <div className="row mb-3">
                    <label className="col-form-label px-1">餘額到期日：</label>
                    <input
                        type="date"
                        className="form-control"
                        name="expiryDate"
                        value={customer.balanceExpiryDate}
                        disabled={true}
                    />
                </div>

                {isEditing && (
                    <>
                        <hr className="my-4" />
                        <h5 className="fw-bold mb-3 px-1">操作</h5>

                        <div className="row mb-3">
                            <label className="col-form-label px-1">操作類型：</label>
                            <select
                                className="form-select"
                                value={action}
                                onChange={(e) => {
                                    const selectedAction = e.target.value as ActionEnum;
                                    const defaultAmount = 0;
                                    setAction(selectedAction as ActionEnum);

                                    if (selectedAction === ActionEnum.REFILL) setBalanceAmount(1500);
                                    else if (selectedAction === ActionEnum.EXTEND) setBalanceAmount(200);
                                    else if (selectedAction === ActionEnum.CHARGE) setBalanceAmount(200);

                                    setFormData(prev => ({
                                        ...prev,
                                        action: selectedAction,
                                        amount: defaultAmount
                                    }));
                                }}
                            >
                                <option value="name">改客戶 LINE</option>
                                <option value="charge">消費</option>
                                <option value="refill">充值</option>
                                <option value="extend">延長到期日</option>
                            </select>
                        </div>

                        <div className="row mb-3">
                            <label className="col-form-label px-1">金額：</label>
                            <input
                                type="number"
                                className="form-control"
                                value={action === 'name' ? 0 : balanceAmount}
                                onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0;
                                    if (action === 'extend') {
                                        // For extend, allow any positive number (days)
                                        setBalanceAmount(Math.max(0, value));
                                    } else {
                                        // For other actions, round to nearest 100
                                        const roundedValue = Math.round(value / 100) * 100;
                                        setBalanceAmount(roundedValue);
                                    }
                                }}
                                onKeyDown={(e) => {
                                    // Allow only numbers, backspace, delete, arrow keys, and enter
                                    if (!/[0-9]/.test(e.key) &&
                                        !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Tab'].includes(e.key)) {
                                        e.preventDefault();
                                    }
                                }}
                                step={100}
                                min="100"
                                placeholder={'請輸入金額 (100的倍數)'}
                                disabled={action === 'name' || action === 'extend'}
                            />
                        </div>
                    </>
                )}

                <div className="d-flex justify-content-end mt-2 gap-2">
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
    );
}
